
import numpy as np
import pandas as pd

from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features

data = load_data()
models, calibrator, config = load_models()

features = config["features"]

def check_prediction(label, X, machine_id=1):
    row = X[X.index == machine_id]

    if row.empty:
        print(f"{label}: Machine {machine_id} not found")
        return

    raw = models["any"].predict(row[features])
    calibrated = calibrator.predict(raw)

    print(f"\n========== {label} ==========")
    print("Machine:", machine_id)
    print("Raw risk:", raw[0])
    print("Calibrated risk:", calibrated[0])
    print("Alert threshold:", config["threshold"])
    print("Alert:", calibrated[0] >= config["threshold"])

    print("\nComponent probabilities:")

    for component in config["components"]:
        probability = models[component].predict(row[features])[0]
        print(f"{component}: {probability}")

    return row


print("\nLatest telemetry timestamp:")
print(data["telemetry"]["datetime"].max())

latest_X = build_machine_features(data, config)

historical_cutoff = pd.Timestamp("2015-03-05 06:00:00")

historical_X = build_machine_features(
    data,
    config,
    as_of=historical_cutoff
)

latest_row = check_prediction("LATEST SNAPSHOT", latest_X)
historical_row = check_prediction("HISTORICAL FAILURE CASE", historical_X)

print("\n========== FEATURE COMPARISON ==========")

if latest_row is not None and historical_row is not None:
    comparison = pd.DataFrame({
        "latest": latest_row.iloc[0],
        "historical": historical_row.iloc[0]
    })

    comparison["absolute_difference"] = (
        comparison["latest"] - comparison["historical"]
    ).abs()

    print(
        comparison.sort_values(
            "absolute_difference",
            ascending=False
        ).head(20).to_string()
    )

print("\n========== TEST COMPLETE ==========")
