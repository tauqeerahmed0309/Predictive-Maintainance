
from pathlib import Path
import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_DIR / "data"

def load_data():
    files = {
        "telemetry": "telemetry.csv",
        "errors": "errors.csv",
        "failures": "failures.csv",
        "maintenance": "maintenance.csv",
        "machines": "machines.csv"
    }

    data = {}

    for key, filename in files.items():
        path = DATA_DIR / filename

        if not path.exists():
            raise FileNotFoundError(f"Dataset not found: {path}")

        data[key] = pd.read_csv(path)

    for key in ["telemetry", "errors", "failures", "maintenance"]:
        data[key]["datetime"] = pd.to_datetime(data[key]["datetime"])

    data["telemetry"] = data["telemetry"].sort_values(
        ["machineID", "datetime"]
    )

    print("All datasets loaded successfully.")

    for name, df in data.items():
        print(f"{name}: {df.shape}")

    return data
