from __future__ import annotations

import inspect
import os

import httpx
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient


if "app" not in inspect.signature(httpx.Client.__init__).parameters:
    _original_httpx_client_init = httpx.Client.__init__

    def _compat_httpx_client_init(self, *args, app=None, **kwargs):
        return _original_httpx_client_init(self, *args, **kwargs)

    httpx.Client.__init__ = _compat_httpx_client_init

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only")
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ.setdefault("CELERY_BROKER_URL", "redis://localhost:6379/0")
os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("DEFAULT_SUBDOMAIN_BASE", "afruheritage.com")

# Whitelabeled Fleet Engine test defaults
os.environ.setdefault("RUNNER_DEFAULT_FLEET_ENGINE_ROOT", "/tmp/test-runners")
os.environ.setdefault("RUNNER_DEFAULT_SSH_PORT", "22")
os.environ.setdefault("RUNNER_DEFAULT_SSH_USER", "test")
os.environ.setdefault("RUNNER_DEFAULT_SSH_KEY_PATH", "/tmp/fake_key")

# Optional: Mapbox / Google Maps / S3 / SMTP defaults for tests
os.environ.setdefault("MAPBOX_ACCESS_TOKEN", "")
os.environ.setdefault("GOOGLE_MAPS_API_KEY", "")
os.environ.setdefault("S3_BUCKET", "")
os.environ.setdefault("S3_REGION", "us-east-1")
os.environ.setdefault("S3_ENDPOINT_URL", "")
os.environ.setdefault("LOCAL_STORAGE_DIR", "/tmp/storage")

os.environ.setdefault("SMTP_HOST", "")
os.environ.setdefault("SMTP_PORT", "587")
os.environ.setdefault("SMTP_USERNAME", "")
os.environ.setdefault("SMTP_PASSWORD", "")
os.environ.setdefault("SMTP_USE_TLS", "true")
os.environ.setdefault("SMTP_FROM_EMAIL", "noreply@afruheritage.com")
os.environ.setdefault("SMTP_FROM_NAME", "Afruheritage")


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
    token = create_access_token(subject=str(superuser.id))
    return {"Authorization": f"Bearer {token}"}
