from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from admin_app.core.config import admin_settings

engine = create_engine(admin_settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
