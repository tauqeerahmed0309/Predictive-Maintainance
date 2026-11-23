
from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features
import pandas as pd
import numpy as np

print("Loading data...")
data = load_data()

print("\nLoading model...")
models, calibrator, config = load_models()

print("\nBuilding latest features...")
X = build_machine_features(data, config)

print("\n========== LOCAL FEATURE DISTRIBUTION ==========")

for col in config["features"]:
    print(
        f"{col:30s}",
        "min:", round(float(X[col].min()), 6),
        "max:", round(float(X[col].max()), 6),
        "mean:", round(float(X[col].mean()), 6),
        "unique:", X[col].nunique()
    )

print("\n========== RAW MODEL PREDICTIONS ==========")

raw = models["any"].predict(X[config["features"]])

print(pd.Series(raw).describe())

print("\n========== MODEL FEATURE IMPORTANCE ==========")

importance = pd.DataFrame({
    "feature": config["features"],
    "importance": models["any"].feature_importance(importance_type="gain")
})

print(
    importance.sort_values("importance", ascending=False)
    .head(25)
    .to_string(index=False)
)

print("\nDiagnostic complete.")
