
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.core.config import settings

# Helper for consistent Base
Base = declarative_base()

# Sync Engine for Alembic and limited sync operations
# Note: For main app we might use async engine, but for simple MVP sync is fine for now
# or we use Supabase client mostly.
# However, Alembic needs a real SQL connection.
# Connection string must be sync: postgresql://... (not postgresql+asyncpg://)

engine = create_engine(settings.DATABASE_URL.replace("+asyncpg", ""))

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
