import numpy as np, pandas as pd
from sklearn.metrics import roc_auc_score, average_precision_score
from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features

d = load_data(); models, cal, cfg = load_models()
print("data container:", type(d), list(d.keys()) if isinstance(d, dict) else "")

def truncate(d, T):
    """Keep only records with datetime <= T (what a live system would know at T)."""
    out = {}
    for k, v in d.items():                      # ADAPT if load_data() returns something other than a dict
        if isinstance(v, pd.DataFrame) and "datetime" in v.columns:
            v = v.copy(); v["datetime"] = pd.to_datetime(v["datetime"])
            v = v[v["datetime"] <= T]
        out[k] = v
    return out

def features_at(T):
    X = build_machine_features(truncate(d, T), cfg)
    if "machineID" not in X.columns: X = X.reset_index()
    return X

fail = d["failures"].copy(); fail["datetime"] = pd.to_datetime(fail["datetime"])   # ADAPT key name
test_fail = fail[fail.datetime >= "2015-11-01"]

rng = np.random.default_rng(42)
T_pos = list((test_fail.datetime - pd.Timedelta(hours=24)).drop_duplicates().sample(15, random_state=1))
T_rand = list(pd.Timestamp("2015-11-01 06:00") + pd.to_timedelta(rng.integers(0, 55*24, 15), unit="h"))

rows = []
for T in T_pos + T_rand:
    X = features_at(T)
    raw = models["any"].predict(X[cfg["features"]])
    win = fail[(fail.datetime > T) & (fail.datetime <= T + pd.Timedelta(hours=24))]
    y = X["machineID"].isin(win.machineID).astype(int).values
    rows.append(pd.DataFrame({"T": T, "machineID": X["machineID"].values, "raw": raw, "y": y}))
R = pd.concat(rows, ignore_index=True)

print("\nPositives:", R.y.sum(), "of", len(R))
print("ROC-AUC:", round(roc_auc_score(R.y, R.raw), 4), "| PR-AUC:", round(average_precision_score(R.y, R.raw), 4))
print("raw score, positives:\n", R[R.y == 1].raw.describe().round(4))
print("raw score, negatives:\n", R[R.y == 0].raw.describe().round(5))
print("Alerts at threshold: TP =", ((R.raw >= 0.19041) & (R.y == 1)).sum(), "FP =", ((R.raw >= 0.19041) & (R.y == 0)).sum())
R.to_csv("replay_results.csv", index=False)
print("\nDemo timestamps with real upcoming failures:", [str(t) for t in T_pos[:5]])