
import json
import joblib
import lightgbm as lgb

from app.config import MODEL_FILES, CALIBRATOR_PATH, CONFIG_PATH


def load_models():
    models = {}

    for name, path in MODEL_FILES.items():
        if not path.exists():
            raise FileNotFoundError(f"Missing model: {path}")

        models[name] = lgb.Booster(model_file=str(path))

    calibrator = joblib.load(CALIBRATOR_PATH)

    with open(CONFIG_PATH, "r") as f:
        config = json.load(f)

    return models, calibrator, config
