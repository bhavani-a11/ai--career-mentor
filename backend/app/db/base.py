from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.config import settings
import urllib.parse

# Fix Neon PostgreSQL SSL issues
def fix_database_url(url: str) -> str:
    if not url:
        return url
    # Ensure sslmode is set properly (sometimes need sslmode=require or sslmode=prefer)
    parsed = urllib.parse.urlparse(url)
    query_params = urllib.parse.parse_qs(parsed.query)
    query_params['sslmode'] = ['require']
    new_query = urllib.parse.urlencode(query_params, doseq=True)
    return urllib.parse.urlunparse(parsed._replace(query=new_query))

fixed_db_url = fix_database_url(settings.database_url)

# Create SQLAlchemy engine for Neon PostgreSQL
engine = create_engine(
    fixed_db_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={
        'sslmode': 'require',
        'connect_timeout': 10
    }
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
