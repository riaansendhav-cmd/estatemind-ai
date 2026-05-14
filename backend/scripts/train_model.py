import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "housing.csv"
SAMPLE_PATH = ROOT / "data" / "housing_sample.csv"
MODEL_PATH = ROOT / "models" / "price_model.joblib"
METRICS_PATH = ROOT / "models" / "metrics.json"
MAX_TRAINING_ROWS = 60000

RENAME_MAP = {
    "city": "location",
    "City": "location",
    "State": "state",
    "Locality": "locality",
    "Property_Type": "property_type",
    "bhk": "bedrooms",
    "BHK": "bedrooms",
    "bath": "bathrooms",
    "Bathrooms": "bathrooms",
    "Furnished_Status": "furnishing",
    "furnishingstatus": "furnishing",
    "Parking_Space": "parking",
    "parking_spaces": "parking",
    "Size_in_SqFt": "area",
    "Price_in_Lakhs": "price_lakhs",
    "Price": "price",
    "Availability_Status": "listing_status",
    "Owner_Type": "owner_type",
    "Public_Transport_Accessibility": "transport_access",
    "Nearby_Schools": "nearby_schools",
    "Nearby_Hospitals": "nearby_hospitals",
    "Age_of_Property": "age_of_property",
    "Year_Built": "year_built",
    "Security": "security",
    "Floor_No": "floor",
    "Total_Floors": "total_floors",
}


def load_dataset() -> pd.DataFrame:
    path = DATA_PATH if DATA_PATH.exists() else SAMPLE_PATH
    data = pd.read_csv(path)
    data = data.rename(columns={key: value for key, value in RENAME_MAP.items() if key in data.columns})

    if "price_lakhs" in data.columns and "price" not in data.columns:
        data["price"] = pd.to_numeric(data["price_lakhs"], errors="coerce") * 100000

    for column in ["bedrooms", "area", "price", "year_built", "age_of_property", "nearby_schools", "nearby_hospitals", "floor", "total_floors"]:
        if column in data.columns:
            data[column] = pd.to_numeric(data[column], errors="coerce")

    if "bathrooms" not in data.columns and "bedrooms" in data.columns:
        bedrooms = pd.to_numeric(data["bedrooms"], errors="coerce").fillna(1)
        data["bathrooms"] = bedrooms.clip(lower=1, upper=6)
    else:
        data["bathrooms"] = pd.to_numeric(data["bathrooms"], errors="coerce")

    if "parking" in data.columns:
        parking_series = data["parking"].replace({"Yes": 1, "No": 0, "yes": 1, "no": 0, True: 1, False: 0})
        data["parking"] = pd.to_numeric(parking_series.infer_objects(copy=False), errors="coerce")

    if "security" in data.columns:
        security_series = data["security"].replace({"Yes": 1, "No": 0, "yes": 1, "no": 0, True: 1, False: 0})
        data["security"] = pd.to_numeric(security_series.infer_objects(copy=False), errors="coerce")

    for column in ["location", "locality", "property_type", "furnishing", "listing_status", "owner_type", "transport_access", "state"]:
        if column in data.columns:
            data[column] = data[column].astype(str).str.replace("_", " ").str.strip()

    required = ["price", "location", "area", "bedrooms", "bathrooms", "furnishing", "parking"]
    missing = [column for column in required if column not in data.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    filtered = data.dropna(subset=["price", "location", "area", "bedrooms", "bathrooms"]).copy()
    filtered = filtered[(filtered["price"] > 0) & (filtered["area"] > 0) & (filtered["bedrooms"] > 0)]
    return filtered


def select_feature_columns(data: pd.DataFrame) -> tuple[list[str], list[str]]:
    numeric_candidates = [
        "area",
        "bedrooms",
        "bathrooms",
        "parking",
        "age_of_property",
        "year_built",
        "nearby_schools",
        "nearby_hospitals",
        "floor",
        "total_floors",
        "security",
    ]
    categorical_candidates = ["location", "property_type", "furnishing", "listing_status", "owner_type", "transport_access"]

    numeric = [column for column in numeric_candidates if column in data.columns]
    categorical = [column for column in categorical_candidates if column in data.columns]
    return numeric, categorical


def build_pipeline(model, numeric: list[str], categorical: list[str]):
    transformers = []
    if numeric:
        transformers.append(
            (
                "numeric",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                numeric,
            )
        )
    if categorical:
        transformers.append(
            (
                "categorical",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical,
            )
        )

    preprocessor = ColumnTransformer(transformers=transformers)
    regressor = Pipeline([("preprocessor", preprocessor), ("model", model)])
    return TransformedTargetRegressor(regressor=regressor, func=np.log1p, inverse_func=np.expm1)


def build_defaults(data: pd.DataFrame, numeric: list[str], categorical: list[str]) -> dict:
    defaults = {}
    for column in numeric:
        defaults[column] = float(data[column].median()) if data[column].notna().any() else 0
    for column in categorical:
        defaults[column] = str(data[column].mode(dropna=True).iloc[0]) if data[column].notna().any() else ""
    return defaults


def build_priors(data: pd.DataFrame) -> dict:
    price_per_sqft = data["price"] / data["area"]
    global_median = float(price_per_sqft.median())
    location_medians = (
        pd.DataFrame({"location": data["location"], "price_per_sqft": price_per_sqft})
        .groupby("location")["price_per_sqft"]
        .median()
        .round(2)
        .to_dict()
    )
    property_type_factor = (
        pd.DataFrame({"property_type": data.get("property_type", "Apartment"), "price_per_sqft": price_per_sqft})
        .groupby("property_type")["price_per_sqft"]
        .median()
        .div(global_median)
        .round(3)
        .to_dict()
    )
    furnishing_factor = (
        pd.DataFrame({"furnishing": data.get("furnishing", "Semi-Furnished"), "price_per_sqft": price_per_sqft})
        .groupby("furnishing")["price_per_sqft"]
        .median()
        .div(global_median)
        .round(3)
        .to_dict()
    )
    return {
        "global_price_per_sqft": global_median,
        "location_price_per_sqft": location_medians,
        "property_type_factor": property_type_factor,
        "furnishing_factor": furnishing_factor,
    }


def train():
    data = load_dataset()
    if len(data) > MAX_TRAINING_ROWS:
        data = data.sample(n=MAX_TRAINING_ROWS, random_state=42).reset_index(drop=True)

    numeric, categorical = select_feature_columns(data)
    feature_columns = [*numeric, *categorical]

    x = data[feature_columns].copy()
    y = data["price"].copy()
    test_size = 0.2 if len(data) >= 1000 else 0.25
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=test_size, random_state=42)

    candidates = {
        "Ridge Regression": build_pipeline(Ridge(alpha=1.5), numeric, categorical),
        "Random Forest": build_pipeline(
            RandomForestRegressor(
                n_estimators=120,
                random_state=42,
                min_samples_leaf=3,
                max_features="sqrt",
                n_jobs=-1,
            ),
            numeric,
            categorical,
        ),
        "Extra Trees": build_pipeline(
            ExtraTreesRegressor(
                n_estimators=140,
                random_state=42,
                min_samples_leaf=2,
                max_features="sqrt",
                n_jobs=-1,
            ),
            numeric,
            categorical,
        ),
    }

    scores = {}
    for name, pipeline in candidates.items():
        pipeline.fit(x_train, y_train)
        predictions = pipeline.predict(x_test)
        scores[name] = {
            "pipeline": pipeline,
            "mean_absolute_error": float(mean_absolute_error(y_test, predictions)),
            "mean_absolute_percentage_error": float(mean_absolute_percentage_error(y_test, predictions)),
            "r2": float(r2_score(y_test, predictions)) if len(y_test) > 1 else 0,
        }

    best_model = min(scores, key=lambda name: scores[name]["mean_absolute_percentage_error"])
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(scores[best_model]["pipeline"], MODEL_PATH)

    metrics = {key: value for key, value in scores[best_model].items() if key != "pipeline"}
    metrics["best_model"] = best_model
    metrics["rows"] = len(data)
    metrics["numeric_features"] = numeric
    metrics["categorical_features"] = categorical
    metrics["feature_columns"] = feature_columns
    metrics["feature_defaults"] = build_defaults(data, numeric, categorical)
    metrics["priors"] = build_priors(data)
    metrics["quality_gate"] = {
        "max_mean_absolute_percentage_error": 0.45,
        "min_r2": 0.1,
    }
    metrics["training_dataset"] = str(path_to_relative(DATA_PATH if DATA_PATH.exists() else SAMPLE_PATH))
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))


def path_to_relative(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    train()
