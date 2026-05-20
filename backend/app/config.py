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
    cors_origins_str: str = "http://localhost:5173,http://127.0.0.1:5173"

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "career_mentor"

    github_token: str = ""
    github_model: str = "openai/gpt-4o-mini"

    # JWT Authentication configuration
    jwt_secret_key: str = "your_super_secret_key_here_please_change_in_production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # Hugging Face embeddings (downloaded on first use)
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    chunk_size: int = 500
    chunk_overlap: int = 50
    rag_top_k: int = 4

    uploads_dir: Path = BACKEND_ROOT / "uploads"
    vector_db_dir: Path = BACKEND_ROOT / "vector_db"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]

    @field_validator("uploads_dir", "vector_db_dir", mode="before")
    @classmethod
    def resolve_paths(cls, value: Union[str, Path]) -> Path:
        path = Path(value)
        return path if path.is_absolute() else BACKEND_ROOT / path


settings = Settings()
