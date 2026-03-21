from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import auth, health, runners, tenants
from app.core.config import settings
from app.db.session import Base, engine
from app.models import *  # noqa: F401,F403
from app.api.routes.ai import router as ai_router
from fastapi.staticfiles import StaticFiles
from app.api.routes.ai_widget import router as ai_widget_router
from app.api.routes.ai import router as ai_router

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(runners.router, prefix=settings.api_v1_prefix)
app.include_router(tenants.router, prefix=settings.api_v1_prefix)
app.include_router(ai_router)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(ai_widget_router, prefix="/api/v1")
