from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import auth, health, runners, tenants
from app.core.config import settings
from app.db.session import Base, engine
from app.models import *  # noqa: F401,F403


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(runners.router, prefix=settings.api_v1_prefix)
app.include_router(tenants.router, prefix=settings.api_v1_prefix)
