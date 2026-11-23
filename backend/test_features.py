
from app.data_loader import load_data
from app.model_loader import load_models
from app.feature_engineering import build_machine_features

print("Loading datasets...")
data = load_data()

print("\nLoading model configuration...")
models, calibrator, config = load_models()

print("\nBuilding machine features...")
X = build_machine_features(data, config)

print("\nFeature engineering successful!")
print("Machine count:", X.shape[0])
print("Feature count:", X.shape[1])
print("Expected features:", len(config["features"]))
print("\nFirst five rows:")
print(X.head())

print("\nMissing values:", X.isna().sum().sum())
print("\nFeature columns match:", list(X.columns) == config["features"])
print("\nFeatures containing missing values:")
missing = X.isna().sum()
print(missing[missing > 0])

print("\nTotal missing values:", X.isna().sum().sum())