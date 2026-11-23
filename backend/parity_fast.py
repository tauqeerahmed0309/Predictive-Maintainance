import numpy as np, pandas as pd
from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features   # your original, slow version
from app.features_fast import FeatureStore

data = load_data(); models, cal, cfg = load_models()
store = FeatureStore(data, cfg)
for T in ["2015-11-30 06:00", "2015-12-02 06:00", "2015-12-25 06:00", "2016-01-01 06:00"]:
    a = build_machine_features(data, cfg, as_of=T)
    b = store.matrix(T)
    assert list(a.columns) == list(b.columns) and list(a.index) == list(b.index)
    both_nan = a.isna() & b.isna()
    diff = ((a - b).abs() / (a.abs() + 1e-3)).where(~both_nan, 0).fillna(np.inf)
    print(T, "max rel diff:", float(diff.to_numpy().max()),
          "| raw pred max abs diff:", float(np.abs(models["any"].predict(a) - models["any"].predict(b)).max()))