
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = PROJECT_DIR / "models"

MODEL_FILES = {
    "comp1": MODEL_DIR / "lgbm_y_comp1.txt",
    "comp2": MODEL_DIR / "lgbm_y_comp2.txt",
    "comp3": MODEL_DIR / "lgbm_y_comp3.txt",
    "comp4": MODEL_DIR / "lgbm_y_comp4.txt",
    "any": MODEL_DIR / "lgbm_y_any.txt"
}

CALIBRATOR_PATH = MODEL_DIR / "isotonic_calibrator.pkl"
CONFIG_PATH = MODEL_DIR / "model_config.json"

ALERT_THRESHOLD = 0.3333
