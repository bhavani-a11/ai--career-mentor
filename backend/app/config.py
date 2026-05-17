from pathlib import Path
from typing import Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI Career Mentor"
    api_version: str = "0.1.0"
    debug: bool = True

    # Comma-separated in .env: http://localhost:5173,http://127.0.0.1:5173
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "career_mentor"

    openai_api_key: str = ""

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    uploads_dir: Path = BACKEND_ROOT / "uploads"
    vector_db_dir: Path = BACKEND_ROOT / "vector_db"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Union[str, list[str]]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("uploads_dir", "vector_db_dir", mode="before")
    @classmethod
    def resolve_paths(cls, value: Union[str, Path]) -> Path:
        path = Path(value)
        return path if path.is_absolute() else BACKEND_ROOT / path


settings = Settings()
