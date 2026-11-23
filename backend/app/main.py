
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import PROJECT_DIR
from app.data_loader import load_data
from app.model_loader import load_models
from app.features_fast import FeatureStore, COMPONENTS

# Replace with the exact TEST_START printed by your Colab notebook
TEST_START = pd.Timestamp("2015-11-24")

HISTORY = PROJECT_DIR / "data" / "risk_history.csv"
S = {}


@asynccontextmanager
async def lifespan(app):
    data = load_data()
    models, cal, cfg = load_models()

    data["failures"]["datetime"] = pd.to_datetime(
        data["failures"]["datetime"]
    )

    S.update(
        data=data,
        models=models,
        cal=cal,
        cfg=cfg,
        store=FeatureStore(data, cfg),
        cache={}
    )

    S["failures"] = data["failures"]
    S["history"] = None

    if HISTORY.exists():
        h = pd.read_csv(HISTORY, parse_dates=["datetime"])
        S["history"] = h.sort_values(["machineID", "datetime"])

    yield
    S.clear()


app = FastAPI(
    title="Predictive Maintenance API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"]
)


def risk_level(raw, alert):
    return np.where(
        alert,
        "High",
        np.where(raw >= 0.02, "Medium", "Low")
    )


def score(as_of=None):
    store = S["store"]
    models = S["models"]
    cal = S["cal"]
    cfg = S["cfg"]

    T = (
        store.last_time
        if as_of is None
        else pd.Timestamp(as_of).value
    )

    if T in S["cache"]:
        return S["cache"][T]

    X = store.matrix(
        None if as_of is None else pd.Timestamp(as_of)
    )

    feats = cfg["features"]

    raw = models["any"].predict(X[feats])
    risk = np.clip(cal.predict(raw), 0, 1)
    alert = risk >= cfg["threshold"]

    df = pd.DataFrame({
        "machineID": X.index,
        "raw_risk": raw,
        "risk": risk,
        "alert": alert
    })

    for c in COMPONENTS:
        df[f"p_{c}"] = models[c].predict(X[feats])

    df["risk_percent"] = (df["risk"] * 100).round(2)
    df["risk_level"] = risk_level(raw, alert)

    df = df.merge(
        S["data"]["machines"],
        on="machineID",
        how="left"
    )

    S["cache"][T] = df
    return df


def records(df):
    return df.replace({np.nan: None}).to_dict("records")


@app.get("/")
def root():
    return {
        "name": "Predictive Maintenance API",
        "horizon_hours": S["cfg"]["horizon_h"]
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": True,
        "history_loaded": S["history"] is not None
    }


@app.get("/api/v1/predictions")
def predictions(
    as_of: str | None = Query(
        None,
        description="ISO time, e.g. 2015-12-02T06:00:00"
    )
):
    try:
        df = score(as_of)
    except Exception as e:
        raise HTTPException(
            400,
            f"Cannot score as_of={as_of}: {e}"
        )

    t = (
        S["store"].last_time
        if as_of is None
        else pd.Timestamp(as_of).value
    )

    return {
        "as_of": str(pd.Timestamp(t)),
        "alerts": int(df.alert.sum()),
        "threshold": S["cfg"]["threshold"],
        "predictions": records(df)
    }


@app.get("/api/v1/machines")
def machines(as_of: str | None = None):
    return {"machines": records(score(as_of))}


@app.get("/api/v1/predictions/{machine_id}")
def one(machine_id: int, as_of: str | None = None):
    df = score(as_of)
    row = df[df.machineID == machine_id]

    if row.empty:
        raise HTTPException(404, "Unknown machine")

    return records(row)[0]


@app.get("/api/v1/machines/{machine_id}/timeline")
def timeline(
    machine_id: int,
    start: str | None = None,
    end: str | None = None
):
    h = S["history"]

    if h is None:
        raise HTTPException(
            404,
            "risk_history.csv.gz not found in /data"
        )

    g = h[h.machineID == machine_id].copy()

    if start:
        g = g[g.datetime >= pd.Timestamp(start)]

    if end:
        g = g[g.datetime <= pd.Timestamp(end)]

    f = S["failures"]
    f = f[f.machineID == machine_id]

    if len(g):
        f = f[
            (f.datetime >= g.datetime.min()) &
            (f.datetime <= g.datetime.max())
        ]

    g = g[["datetime", "raw_risk", "risk", "alert"]].copy()
    g["datetime"] = g["datetime"].dt.strftime(
        "%Y-%m-%dT%H:%M:%S"
    )

    return {
        "points": g.to_dict("records"),
        "failures": [
            {
                "datetime": r.datetime.strftime(
                    "%Y-%m-%dT%H:%M:%S"
                ),
                "component": r.failure
            }
            for r in f.itertuples()
        ]
    }


@app.get("/api/v1/demo-times")
def demo_times():
    f = S["failures"]
    f = f[f.datetime >= TEST_START]

    times = (
        f["datetime"] - pd.Timedelta(hours=24)
    ).drop_duplicates().sort_values()

    return {
        "times": [
            x.strftime("%Y-%m-%dT%H:%M:%S")
            for x in times.head(40)
        ]
    }
