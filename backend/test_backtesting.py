
from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features
from app.predictor import predict_all_machines

import pandas as pd
import numpy as np

HORIZON_HOURS = 24
MAX_TEST_TIMESTAMPS = 30

print("========== HISTORICAL BACKTEST ==========")

print("\nLoading datasets...")
data = load_data()

print("\nLoading models...")
models, calibrator, config = load_models()

failures = data["failures"].copy()
failures["datetime"] = pd.to_datetime(failures["datetime"])

failures["prediction_time"] = (
    failures["datetime"] -
    pd.Timedelta(hours=HORIZON_HOURS)
)

telemetry_start = data["telemetry"]["datetime"].min()

minimum_test_time = (
    telemetry_start + pd.Timedelta(hours=168)
)

unique_times = sorted(
    failures.loc[
        failures["prediction_time"] >= minimum_test_time,
        "prediction_time"
    ].unique()
)

if not unique_times:
    raise ValueError(
        "No failure events have sufficient historical telemetry."
    )

sample_count = min(MAX_TEST_TIMESTAMPS, len(unique_times))
selected_positions = np.linspace(
    0,
    len(unique_times) - 1,
    sample_count,
    dtype=int
)

selected_times = [
    pd.Timestamp(unique_times[i])
    for i in selected_positions
]

test_failures = failures[
    failures["prediction_time"].isin(selected_times)
].copy()

print("\nTotal failure records:", len(failures))
print("Unique prediction timestamps:", len(unique_times))
print("Selected timestamps:", len(selected_times))
print("Failure events selected:", len(test_failures))

event_results = []
total_alerts = 0
total_machine_predictions = 0

for number, cutoff in enumerate(selected_times, start=1):

    print(
        f"\nTesting timestamp {number}/{len(selected_times)}: "
        f"{cutoff}"
    )

    X = build_machine_features(
        data,
        config,
        as_of=cutoff
    )

    results = predict_all_machines(
        X,
        models,
        calibrator,
        config
    )

    raw_predictions = models["any"].predict(
        X[config["features"]]
    )

    raw_by_machine = pd.Series(
        raw_predictions,
        index=X.index
    )

    results = results.set_index("machineID")

    total_alerts += int(results["alert"].sum())
    total_machine_predictions += len(results)

    events_at_time = test_failures[
        test_failures["prediction_time"] == cutoff
    ]

    for _, event in events_at_time.iterrows():

        machine_id = event["machineID"]
        component = event["failure"]

        if machine_id not in results.index:
            continue

        prediction = results.loc[machine_id]

        event_results.append({
            "machineID": machine_id,
            "component": component,
            "failure_time": event["datetime"],
            "prediction_time": cutoff,
            "raw_risk": float(raw_by_machine.loc[machine_id]),
            "calibrated_risk": float(prediction["risk"]),
            "alert": bool(prediction["alert"]),
            "component_probability": float(
                prediction[f"p_{component}"]
            )
        })

if not event_results:
    raise ValueError(
        "No failure events could be matched to predictions."
    )

report = pd.DataFrame(event_results)

detected = int(report["alert"].sum())
missed = len(report) - detected
event_recall = detected / len(report) * 100

print("\n========== BACKTEST RESULTS ==========")

print("Failure events evaluated:", len(report))
print("Events detected:", detected)
print("Events missed:", missed)
print("Event detection rate:", round(event_recall, 2), "%")

print("\n========== PREDICTION STATISTICS ==========")

print("Total machine predictions:", total_machine_predictions)
print("Total machine alerts:", total_alerts)

print(
    "Alert rate:",
    round(
        total_alerts / total_machine_predictions * 100,
        4
    ),
    "%"
)

print("\n========== COMPONENT BREAKDOWN ==========")

print(
    report.groupby("component").agg(
        events=("component", "count"),
        detected=("alert", "sum"),
        average_raw_risk=("raw_risk", "mean"),
        average_calibrated_risk=("calibrated_risk", "mean"),
        average_component_probability=(
            "component_probability", "mean"
        )
    ).to_string()
)

print("\n========== MISSED FAILURE EVENTS ==========")

missed_events = report[~report["alert"]]

if missed_events.empty:
    print("No missed events in this sample.")
else:
    print(missed_events.to_string(index=False))

print("\n========== HIGHEST RISK FAILURE EVENTS ==========")

print(
    report.sort_values(
        "calibrated_risk",
        ascending=False
    ).head(10).to_string(index=False)
)

report.to_csv(
    "historical_backtest_results.csv",
    index=False
)

print("\nResults saved to:")
print("backend/historical_backtest_results.csv")

print("\nBACKTEST COMPLETE!")
