from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


def _resolve_database_url(url: str) -> str:
    if not url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
        return url
    try:
        import psycopg2  # noqa: F401

        return url
    except ModuleNotFoundError:
        if url.startswith("postgresql+psycopg2://"):
            return url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
        return url.replace("postgresql://", "postgresql+psycopg://", 1)


engine = create_engine(_resolve_database_url(settings.database_url), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        db.rollback()  # Ensure clean transaction state (connection pool may have aborted tx)
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
