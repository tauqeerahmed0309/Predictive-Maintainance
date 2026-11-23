
from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features
from app.predictor import predict_all_machines
import pandas as pd
import numpy as np

FAILURE_TIME = "2015-03-06 06:00:00"
MACHINE_ID = 1
FAILED_COMPONENT = "comp1"
PREDICTION_HOURS_BEFORE = 24

failure_time = pd.Timestamp(FAILURE_TIME)
prediction_time = failure_time - pd.Timedelta(
    hours=PREDICTION_HOURS_BEFORE
)

print("========== HISTORICAL FAILURE TEST ==========")
print("Machine ID:", MACHINE_ID)
print("Failed component:", FAILED_COMPONENT)
print("Failure time:", failure_time)
print("Prediction cutoff:", prediction_time)

print("\nLoading datasets...")
data = load_data()

print("\nLoading models...")
models, calibrator, config = load_models()

print("\nChecking historical telemetry...")
machine_telemetry = data["telemetry"]

available_telemetry = machine_telemetry[
    (machine_telemetry["machineID"] == MACHINE_ID)
    & (machine_telemetry["datetime"] <= prediction_time)
]

if available_telemetry.empty:
    raise ValueError("No telemetry available before prediction time.")

actual_last_reading = available_telemetry["datetime"].max()

print("Last available telemetry:", actual_last_reading)

if actual_last_reading < prediction_time:
    print("WARNING: No telemetry exists exactly at the prediction cutoff.")

print("\nGenerating historical features...")
X = build_machine_features(
    data,
    config,
    as_of=prediction_time
)

if MACHINE_ID not in X.index:
    raise ValueError("Target machine not found in historical features.")

print("Historical feature shape:", X.shape)
print("Feature count:", len(X.columns))
print("Column order matches:", list(X.columns) == config["features"])

target_features = X.loc[[MACHINE_ID]]

print("\n========== TARGET MACHINE FEATURES ==========")
print("Machine ID:", MACHINE_ID)
print("Missing feature values:", int(target_features.isna().sum().sum()))
print(target_features.T.to_string())

print("\nGenerating historical predictions...")
results = predict_all_machines(
    X,
    models,
    calibrator,
    config
)

raw_predictions = models["any"].predict(
    X[config["features"]]
)

calibrated_predictions = np.clip(
    calibrator.predict(raw_predictions),
    0,
    1
)

machine_position = X.index.get_loc(MACHINE_ID)

raw_risk = float(raw_predictions[machine_position])
calibrated_risk = float(calibrated_predictions[machine_position])

machine_result = results[
    results["machineID"] == MACHINE_ID
]

if machine_result.empty:
    raise ValueError("Prediction not found for target machine.")

print("\n========== HISTORICAL PREDICTION RESULT ==========")
print("Machine ID:", MACHINE_ID)
print("Prediction cutoff:", prediction_time)
print("Failure time:", failure_time)
print("Failed component:", FAILED_COMPONENT)
print("Raw overall risk:", raw_risk)
print("Calibrated overall risk:", calibrated_risk)
print("Risk percentage:", round(calibrated_risk * 100, 2), "%")
print("Alert threshold:", config["threshold"])
print("Alert triggered:", calibrated_risk >= config["threshold"])

for component in ["comp1", "comp2", "comp3", "comp4"]:
    column = f"p_{component}"

    if column in machine_result.columns:
        print(
            f"{component} raw probability:",
            float(machine_result.iloc[0][column])
        )

print("\n========== FEATURE VALIDATION ==========")
print("Total features:", len(config["features"]))
print("Missing values:", int(target_features.isna().sum().sum()))
print("Infinite values:", int(np.isinf(target_features.select_dtypes(include=[np.number])).sum().sum()))

print("\n========== TEST COMPLETE ==========")
