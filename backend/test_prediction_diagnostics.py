
import numpy as np
import pandas as pd

from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features

print("\n========== PREDICTION DIAGNOSTICS ==========\n")

data = load_data()

models, calibrator, config = load_models()

X = build_machine_features(data, config)

features = config["features"]

print("\n1. FEATURE MATRIX")
print("Shape:", X.shape)
print("Expected features:", len(features))
print("Actual features:", len(X.columns))
print("Unique feature values per machine (first 15):")

print(X[features].nunique().head(15))

print("\nFeatures with zero variance:")
zero_variance = X[features].nunique()
print(zero_variance[zero_variance <= 1])

print("\n2. OVERALL MODEL RAW PREDICTIONS")

raw = models["any"].predict(X[features])

print("Minimum:", np.min(raw))
print("Maximum:", np.max(raw))
print("Mean:", np.mean(raw))
print("Standard deviation:", np.std(raw))

print("\nPercentiles:")
print(np.percentile(raw, [0, 25, 50, 75, 90, 95, 99, 100]))

print("\n3. CALIBRATED PREDICTIONS")

calibrated = calibrator.predict(raw)

print("Minimum:", np.min(calibrated))
print("Maximum:", np.max(calibrated))
print("Mean:", np.mean(calibrated))
print("Unique calibrated values:", np.unique(calibrated))

print("\nCalibrator thresholds:")

if hasattr(calibrator, "X_thresholds_"):
    print("X thresholds:", calibrator.X_thresholds_)
    print("Y thresholds:", calibrator.y_thresholds_)
else:
    print("Calibrator does not expose isotonic thresholds.")

print("\n4. COMPONENT MODEL PREDICTIONS")

for component in config["components"]:
    probabilities = models[component].predict(X[features])

    print(f"\n{component}")
    print("Min:", np.min(probabilities))
    print("Max:", np.max(probabilities))
    print("Mean:", np.mean(probabilities))
    print("Std:", np.std(probabilities))
    print("Unique values:", len(np.unique(probabilities)))

print("\n5. MODEL FEATURE IMPORTANCE")

importance = models["any"].feature_importance(
    importance_type="gain"
)

importance_df = pd.DataFrame({
    "feature": features,
    "importance": importance
}).sort_values("importance", ascending=False)

print(importance_df.head(20).to_string(index=False))

print("\n6. MACHINE-WISE RAW PREDICTIONS")

result = pd.DataFrame({
    "machineID": X.index,
    "raw_risk": raw,
    "calibrated_risk": calibrated
})

print(result.head(20).to_string(index=False))

print("\n========== DIAGNOSTICS COMPLETE ==========\n")
