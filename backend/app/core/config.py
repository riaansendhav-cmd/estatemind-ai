from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EstateMind AI"
    environment: str = "development"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "estatemind"
    frontend_origin: str = "http://localhost:5173"
    model_path: str = "models/price_model.joblib"
    metrics_path: str = "models/metrics.json"
    auth_secret: str = "change-this-local-development-secret"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
