from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, runners, tenants
from app.api.routes.ai import router as ai_router
from app.api.routes.ai_widget import router as ai_widget_router
from app.api.routes.billing import router as billing_router
from app.api.routes.support_crm import router as support_crm_router
from app.core.config import settings
from app.db.session import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(runners.router, prefix=settings.api_v1_prefix)
app.include_router(tenants.router, prefix=settings.api_v1_prefix)

app.include_router(ai_router, prefix="/api/v1")
app.include_router(ai_widget_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")
app.include_router(support_crm_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
