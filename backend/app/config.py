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
        env_prefix="",  # No prefix, so env vars match field names
    )

    app_name: str = "AI Career Mentor"
    api_version: str = "0.1.0"
    debug: bool = True

    # Comma-separated CORS origins (supports both CORS_ORIGINS and cors_origins_str)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176"
    cors_origins_str: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176"

    # Database: PostgreSQL (Neon)
    database_url: str = ""
    secret_key: str = ""

    github_token: str = ""
    github_model: str = "openai/gpt-4o-mini"

    # JWT Authentication configuration
    @property
    def jwt_secret_key(self) -> str:
        return self.secret_key
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
    def parsed_cors_origins(self) -> list[str]:
        # Use cors_origins if set, else cors_origins_str
        origins_str = self.cors_origins if self.cors_origins and self.cors_origins != "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174" else self.cors_origins_str
        return [origin.strip() for origin in origins_str.split(",") if origin.strip()]

    @field_validator("uploads_dir", "vector_db_dir", mode="before")
    @classmethod
    def resolve_paths(cls, value: Union[str, Path]) -> Path:
        path = Path(value)
        return path if path.is_absolute() else BACKEND_ROOT / path


settings = Settings()
