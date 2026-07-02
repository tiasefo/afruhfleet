from __future__ import annotations
from admin_app.api.routes.kyc import router as kyc_router
from admin_app.api.routes.oauth import router as oauth_router

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from admin_app.api.routes.auth import router as auth_router
from admin_app.api.routes.tenants import router as tenants_router
from admin_app.api.routes.billing import router as billing_router
from admin_app.api.routes.runners_local import router as runners_router
from admin_app.api.routes.runtime import router as runtime_router
from admin_app.api.routes.domains import router as domains_router
from admin_app.api.routes.vendors import router as vendors_router
from admin_app.api.routes.analytics import router as analytics_router
from admin_app.api.routes.dashboard_local import router as dashboard_router
from admin_app.api.routes.tickets import router as tickets_router
from admin_app.api.routes.tracking import router as tracking_router
from admin_app.api.routes.templates import router as templates_router
from admin_app.core.config import admin_settings
from admin_app.db.session import Base, engine

import admin_app.models.admin_user  # noqa: F401
import admin_app.models.audit_log  # noqa: F401

logger = logging.getLogger("admin_console")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Afruheritage Admin Console")
    Base.metadata.create_all(bind=engine)
    logger.info("Admin database tables ensured")
    yield
    logger.info("Shutting down Afruheritage Admin Console")


app = FastAPI(
    title=admin_settings.app_name,
    lifespan=lifespan,
    docs_url="/admin/docs" if admin_settings.app_env != "production" else None,
    redoc_url="/admin/redoc" if admin_settings.app_env != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=admin_settings.cors_origins or [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/admin")
app.include_router(dashboard_router, prefix="/admin")
app.include_router(tenants_router, prefix="/admin")
app.include_router(billing_router, prefix="/admin")
app.include_router(runners_router, prefix="/admin")
app.include_router(runtime_router, prefix="/admin")
app.include_router(domains_router, prefix="/admin")
app.include_router(vendors_router, prefix="/admin")
app.include_router(kyc_router, prefix="/admin")
app.include_router(oauth_router, prefix="/admin")
app.include_router(analytics_router, prefix="/admin")
app.include_router(tickets_router, prefix="/admin")
app.include_router(tracking_router, prefix="/admin")
app.include_router(templates_router, prefix="/admin")


@app.get("/admin/health")
def health():
    return {"status": "ok", "service": "afruheritage-admin-console"}
