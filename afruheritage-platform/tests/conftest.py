from __future__ import annotations

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("CELERY_BROKER_URL", "redis://localhost:6379/0")
os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("DEFAULT_SUBDOMAIN_BASE", "afruheritage.com")
os.environ.setdefault("RUNNER_DEFAULT_FLEETBASE_ROOT", "/tmp/test-runners")
os.environ.setdefault("RUNNER_DEFAULT_SSH_USER", "test")
os.environ.setdefault("RUNNER_DEFAULT_SSH_KEY_PATH", "/tmp/fake_key")

from app.db.session import Base, get_db
from app.main import app
from app.core.security import get_password_hash, create_access_token
from app.models.user import User

TEST_ENGINE = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture()
def db_session(setup_db):
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def superuser(db_session) -> User:
    user = User(
        email="admin@afruheritage.com",
        full_name="Test Admin",
        hashed_password=get_password_hash("TestPassword123!"),  # noqa: S106
        is_superuser=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_headers(superuser) -> dict[str, str]:
    token = create_access_token(data={"sub": str(superuser.id)})
    return {"Authorization": f"Bearer {token}"}
