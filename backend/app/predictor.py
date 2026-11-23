
import numpy as np
import pandas as pd


def predict_all_machines(X, models, calibrator, config):
    feature_names = config["features"]
    components = config["components"]
    threshold = float(config["threshold"])

    if list(X.columns) != feature_names:
        raise ValueError("Input feature names or order do not match model configuration.")

    if "any" not in models:
        raise ValueError("Overall risk model 'any' is missing.")

    # Overall failure risk
    raw_risk = models["any"].predict(X[feature_names])

    # Calibrate overall risk
    calibrated_risk = calibrator.predict(raw_risk)
    calibrated_risk = np.clip(calibrated_risk, 0, 1)

    results = pd.DataFrame(index=X.index)

    results["risk"] = calibrated_risk
    results["alert"] = results["risk"] >= threshold

    # Component-level predictions
    for component in components:
        if component not in models:
            raise ValueError(f"Model missing for {component}")

        probabilities = models[component].predict(X[feature_names])
        results[f"p_{component}"] = np.clip(probabilities, 0, 1)

    results["risk_percent"] = (results["risk"] * 100).round(2)

    results["risk_level"] = pd.cut(
        results["risk"],
        bins=[-0.000001, 0.20, 0.50, 1.0],
        labels=["Low", "Medium", "High"],
        include_lowest=True
    ).astype(str)

    results.index.name = "machineID"

    return results.reset_index()
