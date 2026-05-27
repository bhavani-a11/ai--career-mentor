
from app.db.base import Base, engine
from app.db.models import User

print("Creating tables in Neon PostgreSQL database...")

# Create all tables defined in SQLAlchemy models
Base.metadata.create_all(bind=engine)

print("Tables created successfully!")
