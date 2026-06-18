from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import api_router
from app.db.base import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.vector_db_dir.mkdir(parents=True, exist_ok=True)

    # Startup checks: fail fast on missing critical environment variables.
    # This makes Render logs clearer than mysterious runtime errors later.
    missing = []
    if not settings.secret_key:
        missing.append("SECRET_KEY")
    if not settings.github_token:
        missing.append("GITHUB_TOKEN")
    if missing:
        raise RuntimeError(
            "Missing required environment variables: " + ", ".join(missing)
        )

    # Database is required for authentication endpoints.
    # We only warn here to keep basic endpoints (like /api/health) working.
    if not settings.database_url:
        print("Warning: DATABASE_URL is not set. Auth and DB-backed features will fail.")

    # Create database tables
    if settings.database_url:
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            print(f"Warning: Could not create database tables: {e}")
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": f"{settings.app_name} API",
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/api/health",
        "chat": "/api/chat",
        "upload_pdf": "/api/upload/pdf",
        "rag_index": "vector_db/faiss_index (after PDF upload)",
    }
