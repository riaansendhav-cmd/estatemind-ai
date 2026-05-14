import json
from pathlib import Path

import joblib
import pandas as pd

from app.core.config import get_settings

settings = get_settings()
BACKEND_ROOT = Path(__file__).resolve().parents[2]


class PricePredictor:
    def __init__(self):
        self.model = None
        self.metrics = {}
        self.feature_columns = []
        self.feature_defaults = {}
        self.priors = {}
        self._load()

    def _load(self):
        model_path = self._resolve_path(settings.model_path)
        metrics_path = self._resolve_path(settings.metrics_path)
        if model_path.exists():
            self.model = joblib.load(model_path)
        if metrics_path.exists():
            self.metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
            self.feature_columns = self.metrics.get("feature_columns", [])
            self.feature_defaults = self.metrics.get("feature_defaults", {})
            self.priors = self.metrics.get("priors", {})

    def _resolve_path(self, value: str) -> Path:
        path = Path(value)
        return path if path.is_absolute() else BACKEND_ROOT / path

    @property
    def ready(self) -> bool:
        return self.model is not None

    def predict(self, payload: dict) -> dict:
        if not self.ready or not self._model_is_reliable():
            return self._fallback_prediction(payload)

        frame = pd.DataFrame([self._prepare_features(payload)])
        predicted_price = float(self.model.predict(frame)[0])
        baseline_error = float(self.metrics.get("mean_absolute_percentage_error", 0.16))
        confidence = max(62, min(96, round((1 - baseline_error) * 100)))
        spread = max(predicted_price * baseline_error, 350000)

        return {
            "predicted_price": round(predicted_price),
            "confidence": confidence,
            "range_low": round(predicted_price - spread),
            "range_high": round(predicted_price + spread),
            "model_name": self.metrics.get("best_model", "Random Forest"),
            "chart": [
                {"label": "Low", "value": round(predicted_price - spread)},
                {"label": "Prediction", "value": round(predicted_price)},
                {"label": "High", "value": round(predicted_price + spread)},
            ],
        }

    def _model_is_reliable(self) -> bool:
        gate = self.metrics.get("quality_gate", {})
        max_mape = float(gate.get("max_mean_absolute_percentage_error", 0.45))
        min_r2 = float(gate.get("min_r2", 0.1))
        return (
            self.metrics.get("mean_absolute_percentage_error") is not None
            and self.metrics.get("r2") is not None
            and float(self.metrics["mean_absolute_percentage_error"]) <= max_mape
            and float(self.metrics["r2"]) >= min_r2
        )

    def _prepare_features(self, payload: dict) -> dict:
        prepared = {**self.feature_defaults, **payload}
        if "property_type" not in prepared or not prepared.get("property_type"):
            prepared["property_type"] = "Apartment"
        if "listing_status" not in prepared or not prepared.get("listing_status"):
            prepared["listing_status"] = "Ready to Move"
        if "owner_type" not in prepared or not prepared.get("owner_type"):
            prepared["owner_type"] = "Owner"
        if "transport_access" not in prepared or not prepared.get("transport_access"):
            prepared["transport_access"] = "Medium"
        if "locality" not in prepared or not prepared.get("locality"):
            prepared["locality"] = prepared.get("location", "")
        if "state" not in prepared or not prepared.get("state"):
            prepared["state"] = ""

        if self.feature_columns:
            prepared = {column: prepared.get(column, self.feature_defaults.get(column)) for column in self.feature_columns}

        return prepared

    def _fallback_prediction(self, payload: dict) -> dict:
        priors = self.priors or {}
        location_factor = float(
            priors.get("location_price_per_sqft", {}).get(
                payload.get("location"),
                priors.get("global_price_per_sqft", 9000),
            )
        )
        type_factor = float(priors.get("property_type_factor", {}).get(payload.get("property_type", "Apartment"), 1.0))
        furnish_factor = float(priors.get("furnishing_factor", {}).get(payload.get("furnishing", "Semi-Furnished"), 1.0))
        base = payload["area"] * location_factor * furnish_factor * type_factor
        room_bonus = (payload["bedrooms"] * 300000) + (payload["bathrooms"] * 220000)
        parking_bonus = payload["parking"] * 180000
        predicted = base + room_bonus + parking_bonus
        spread = predicted * 0.18
        return {
            "predicted_price": round(predicted),
            "confidence": 68 if self.priors else 74,
            "range_low": round(predicted - spread),
            "range_high": round(predicted + spread),
            "model_name": "Dataset-calibrated fallback" if self.priors else "Rule-based fallback",
            "offline": not self.ready,
            "chart": [
                {"label": "Low", "value": round(predicted - spread)},
                {"label": "Prediction", "value": round(predicted)},
                {"label": "High", "value": round(predicted + spread)},
            ],
        }


predictor = PricePredictor()
