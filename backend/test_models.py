
import time
from pathlib import Path
import lightgbm as lgb

model_dir = Path(__file__).resolve().parents[1] / "models"

files = [
    "lgbm_y_comp1.txt",
    "lgbm_y_comp2.txt",
    "lgbm_y_comp3.txt",
    "lgbm_y_comp4.txt",
    "lgbm_y_any.txt"
]

for filename in files:
    path = model_dir / filename

    print(f"\nLoading {filename}...", flush=True)

    start = time.time()

    model = lgb.Booster(model_file=str(path))

    elapsed = time.time() - start

    print(f"Loaded successfully | Trees: {model.num_trees()} | Time: {elapsed:.2f}s", flush=True)

print("\nAll five models loaded successfully!")
