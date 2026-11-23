
import numpy as np
import pandas as pd

SENSORS = ["volt", "rotate", "pressure", "vibration"]
ERR_TYPES = ["error1", "error2", "error3", "error4", "error5"]
WINDOWS = [3, 6, 12, 24, 48, 168]
COMPONENTS = ["comp1", "comp2", "comp3", "comp4"]


def build_machine_features(data, model_config, as_of=None):
    telemetry = data["telemetry"]
    errors = data["errors"]
    maintenance = data["maintenance"]
    machines = data["machines"]

    if as_of is not None:
        as_of = pd.Timestamp(as_of)
        telemetry = telemetry[telemetry["datetime"] <= as_of]
        errors = errors[errors["datetime"] <= as_of]
        maintenance = maintenance[maintenance["datetime"] <= as_of]

    feature_names = model_config["features"]
    machine_rows = []

    for _, machine in machines.iterrows():
        machine_id = machine["machineID"]

        g = telemetry[
            telemetry["machineID"] == machine_id
        ].sort_values("datetime").copy()

        if g.empty:
            continue

        g = g.set_index("datetime")
        idx = g.index
        out = pd.DataFrame(index=idx)

        for sensor in SENSORS:
            s = g[sensor]

            out[sensor] = s

            for window in WINDOWS:
                out[f"{sensor}_mean_{window}"] = (
                    s.rolling(window, min_periods=window).mean()
                )
                out[f"{sensor}_std_{window}"] = (
                    s.rolling(window, min_periods=window).std()
                )

            out[f"{sensor}_max_24"] = (
                s.rolling(24, min_periods=24).max()
            )
            out[f"{sensor}_min_24"] = (
                s.rolling(24, min_periods=24).min()
            )

            out[f"{sensor}_diff_3"] = s.diff(3)
            out[f"{sensor}_diff_24"] = s.diff(24)

            mean_3 = s.rolling(3, min_periods=3).mean()
            mean_24 = s.rolling(24, min_periods=24).mean()
            mean_168 = s.rolling(168, min_periods=168).mean()
            std_24 = s.rolling(24, min_periods=24).std()
            std_168 = s.rolling(168, min_periods=168).std()

            out[f"{sensor}_z24_vs168"] = (
                mean_24 - mean_168
            ) / (std_168 + 1e-6)

            out[f"{sensor}_z3_vs168"] = (
                mean_3 - mean_168
            ) / (std_168 + 1e-6)

            out[f"{sensor}_std_ratio_24_168"] = (
                std_24 / (std_168 + 1e-6)
            )

        machine_errors = errors[
            errors["machineID"] == machine_id
        ]

        if not machine_errors.empty:
            err = machine_errors.assign(n=1).pivot_table(
                index="datetime",
                columns="errorID",
                values="n",
                aggfunc="sum",
                fill_value=0
            )

            err = err.reindex(columns=ERR_TYPES, fill_value=0)
            err = err.reindex(idx, fill_value=0)
        else:
            err = pd.DataFrame(
                0,
                index=idx,
                columns=ERR_TYPES
            )

        positions = np.arange(len(idx))

        for error_type in ERR_TYPES:
            counts = err[error_type]

            for window in [24, 72, 168]:
                out[f"{error_type}_cnt_{window}"] = (
                    counts.rolling(window, min_periods=1).sum()
                )

            last_position = pd.Series(
                np.where(counts.to_numpy() > 0, positions, np.nan),
                index=idx
            ).ffill()

            out[f"{error_type}_hrs_since"] = (
                positions - last_position
            )

        out["err_total_24"] = sum(
            out[f"{e}_cnt_24"] for e in ERR_TYPES
        )

        out["err_total_168"] = sum(
            out[f"{e}_cnt_168"] for e in ERR_TYPES
        )

        machine_maintenance = maintenance[
            maintenance["machineID"] == machine_id
        ]

        t_ns = idx.to_numpy(dtype="datetime64[ns]").astype("int64")

        for component in COMPONENTS:
            events = machine_maintenance.loc[
                machine_maintenance["comp"] == component,
                "datetime"
            ].sort_values().to_numpy(dtype="datetime64[ns]")

            if len(events) == 0:
                out[f"{component}_hrs_since_maint"] = np.nan
                out[f"{component}_n_replacements"] = 0
            else:
                event_ns = events.astype("int64")
                k = np.searchsorted(event_ns, t_ns, side="right")

                last_event = np.full(len(idx), np.nan)
                valid = k > 0
                last_event[valid] = event_ns[k[valid] - 1]

                out[f"{component}_hrs_since_maint"] = (
                    (t_ns - last_event) / 3.6e12
                )

                out[f"{component}_n_replacements"] = k

        model_value = str(machine["model"]).replace("model", "")
        out["model"] = int(model_value)
        out["age"] = machine["age"]

        latest = out.iloc[-1]

        missing = [
            feature for feature in feature_names
            if feature not in latest.index
        ]

        if missing:
            raise ValueError(
                f"Machine {machine_id}: missing features: {missing}"
            )

        machine_features = latest[feature_names].to_frame().T
        machine_features.index = [machine_id]
        machine_rows.append(machine_features)

    if not machine_rows:
        raise ValueError("No machine features could be generated.")

    X = pd.concat(machine_rows)
    X.index.name = "machineID"

    X = X.astype(np.float32)

    if list(X.columns) != feature_names:
        raise ValueError("Feature order does not match model configuration.")

    return X
