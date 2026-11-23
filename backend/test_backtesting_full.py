
from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features
from app.predictor import predict_all_machines

import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings("ignore", category=pd.errors.PerformanceWarning)

HORIZON_HOURS = 24
MAX_TEST_TIMESTAMPS = 30

print("========== FULL HISTORICAL BACKTEST ==========")

data = load_data()
models, calibrator, config = load_models()

failures = data["failures"].copy()
failures["datetime"] = pd.to_datetime(failures["datetime"])

telemetry_start = data["telemetry"]["datetime"].min()
minimum_test_time = telemetry_start + pd.Timedelta(hours=168)

failures["prediction_time"] = (
    failures["datetime"] - pd.Timedelta(hours=HORIZON_HOURS)
)

unique_times = sorted(
    failures.loc[
        failures["prediction_time"] >= minimum_test_time,
        "prediction_time"
    ].unique()
)

sample_count = min(MAX_TEST_TIMESTAMPS, len(unique_times))

positions = np.linspace(
    0, len(unique_times) - 1, sample_count, dtype=int
)

selected_times = [
    pd.Timestamp(unique_times[i]) for i in positions
]

print("\nSelected timestamps:", len(selected_times))

all_results = []

for number, cutoff in enumerate(selected_times, start=1):

    print(f"\nTesting {number}/{len(selected_times)}: {cutoff}")

    X = build_machine_features(data, config, as_of=cutoff)

    predictions = predict_all_machines(
        X, models, calibrator, config
    )

    future_end = cutoff + pd.Timedelta(hours=HORIZON_HOURS)

    future_failures = failures[
        (failures["datetime"] > cutoff)
        & (failures["datetime"] <= future_end)
    ]

    failed_machines = set(future_failures["machineID"].unique())

    predictions["actual_failure"] = (
        predictions["machineID"].isin(failed_machines)
    )

    predictions["prediction_time"] = cutoff

    all_results.append(predictions)

if not all_results:
    raise ValueError("No predictions were generated.")

report = pd.concat(all_results, ignore_index=True)

y_true = report["actual_failure"].astype(bool)
y_pred = report["alert"].astype(bool)

tp = int((y_true & y_pred).sum())
fp = int((~y_true & y_pred).sum())
fn = int((y_true & ~y_pred).sum())
tn = int((~y_true & ~y_pred).sum())

precision = tp / (tp + fp) if tp + fp else 0
recall = tp / (tp + fn) if tp + fn else 0
specificity = tn / (tn + fp) if tn + fp else 0
f1 = (
    2 * precision * recall / (precision + recall)
    if precision + recall else 0
)

print("\n========== CONFUSION MATRIX ==========")
print("True Positives:", tp)
print("False Positives:", fp)
print("False Negatives:", fn)
print("True Negatives:", tn)

print("\n========== PERFORMANCE METRICS ==========")
print("Precision:", round(precision * 100, 2), "%")
print("Recall:", round(recall * 100, 2), "%")
print("Specificity:", round(specificity * 100, 2), "%")
print("F1 Score:", round(f1, 4))
print("False Positive Rate:", round((1 - specificity) * 100, 2), "%")

print("\n========== DATASET SUMMARY ==========")
print("Total predictions:", len(report))
print("Actual positive machine-time cases:", int(y_true.sum()))
print("Predicted alerts:", int(y_pred.sum()))

print("\n========== FALSE POSITIVE EXAMPLES ==========")
false_positives = report[~y_true & y_pred]

if false_positives.empty:
    print("No false positives.")
else:
    print(
        false_positives[
            ["machineID", "prediction_time", "risk", "risk_level"]
        ].head(20).to_string(index=False)
    )

print("\n========== FALSE NEGATIVE EXAMPLES ==========")
false_negatives = report[y_true & ~y_pred]

if false_negatives.empty:
    print("No false negatives.")
else:
    print(
        false_negatives[
            ["machineID", "prediction_time", "risk", "risk_level"]
        ].to_string(index=False)
    )

report.to_csv("full_backtest_results.csv", index=False)

print("\nResults saved to backend/full_backtest_results.csv")
print("\nFULL BACKTEST COMPLETE!")
