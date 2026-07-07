from __future__ import annotations
from sentinel_app.api.routes.kyc import router as kyc_router
from sentinel_app.api.routes.oauth import router as oauth_router

import logging
from contextlib import asynccontextmanager

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sentinel_app.api.routes.auth import router as auth_router
from sentinel_app.api.routes.tenants import router as tenants_router
from sentinel_app.api.routes.billing import router as billing_router
from sentinel_app.api.routes.runners_local import router as runners_router
from sentinel_app.api.routes.runtime import router as runtime_router
from sentinel_app.api.routes.domains import router as domains_router
from sentinel_app.api.routes.vendors import router as vendors_router
from sentinel_app.api.routes.analytics import router as analytics_router
from sentinel_app.api.routes.dashboard_local import router as dashboard_router
from sentinel_app.api.routes.tickets import router as tickets_router
from sentinel_app.api.routes.tracking import router as tracking_router
from sentinel_app.api.routes.control_center import router as control_center_router
from sentinel_app.api.routes.templates import router as templates_router
from sentinel_app.api.routes.shipments import router as shipments_router
from sentinel_app.api.routes.payments import router as payments_router
from sentinel_app.api.routes.fleetbase_ops import router as fleetbase_ops_router
from sentinel_app.api.routes.feature_flags import router as feature_flags_router
from sentinel_app.api.routes.diagnostics import router as diagnostics_router
from sentinel_app.core.config import admin_settings
from sentinel_app.db.session import Base, engine

import sentinel_app.models.admin_user  # noqa: F401
import sentinel_app.models.audit_log  # noqa: F401
import sentinel_app.models.feature_control  # noqa: F401

logger = logging.getLogger("sentinel")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Afruheritage Sentinel")
    Base.metadata.create_all(bind=engine)
    logger.info("Sentinel database tables ensured")
    yield
    logger.info("Shutting down Afruheritage Sentinel")


app = FastAPI(
    title=admin_settings.app_name,
    lifespan=lifespan,
    docs_url="/sentinel/docs" if admin_settings.app_env != "production" else None,
    redoc_url="/sentinel/redoc" if admin_settings.app_env != "production" else None,
)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"REQUEST {request.method} {request.url.path} from {request.client.host if request.client else 'unknown'}")
    response = await call_next(request)
    logger.info(f"RESPONSE {request.method} {request.url.path} -> {response.status_code}")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=admin_settings.cors_origins or [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/sentinel")
app.include_router(dashboard_router, prefix="/sentinel")
app.include_router(tenants_router, prefix="/sentinel")
app.include_router(billing_router, prefix="/sentinel")
app.include_router(runners_router, prefix="/sentinel")
app.include_router(runtime_router, prefix="/sentinel")
app.include_router(domains_router, prefix="/sentinel")
app.include_router(vendors_router, prefix="/sentinel")
app.include_router(kyc_router, prefix="/sentinel")
app.include_router(oauth_router, prefix="/sentinel")
app.include_router(analytics_router, prefix="/sentinel")
app.include_router(tickets_router, prefix="/sentinel")
app.include_router(tracking_router, prefix="/sentinel")
app.include_router(control_center_router, prefix="/sentinel")
app.include_router(templates_router, prefix="/sentinel")
app.include_router(shipments_router, prefix="/sentinel")
app.include_router(payments_router, prefix="/sentinel")
app.include_router(fleetbase_ops_router, prefix="/sentinel")
app.include_router(feature_flags_router, prefix="/sentinel")
app.include_router(diagnostics_router, prefix="/sentinel")

@app.get("/sentinel/health")
def health():
    return {"status": "ok", "service": "afruheritage-sentinel"}


# Serve static frontend files if built
# NOTE: API routes are registered above with prefix="/sentinel" (auth, tenants, billing, etc.)
# The static mount must NOT shadow those API routes. We mount _next assets separately,
# and use a catch-all only for non-API paths (dashboard, login, etc.).
static_dir = os.path.join(os.path.dirname(__file__), "..", "static", "sentinel-ui")
if os.path.isdir(static_dir):
    next_dir = os.path.join(static_dir, "_next")
    if os.path.isdir(next_dir):
        app.mount("/sentinel/_next", StaticFiles(directory=next_dir), name="next-assets")

    from fastapi import Request
    from fastapi.responses import FileResponse

    # API route prefixes under /sentinel — these must NOT be served as static files
    _API_PREFIXES = (
        "/sentinel/auth", "/sentinel/tenants", "/sentinel/billing",
        "/sentinel/runners", "/sentinel/runtime", "/sentinel/domains",
        "/sentinel/vendors", "/sentinel/kyc", "/sentinel/oauth",
        "/sentinel/analytics", "/sentinel/tickets", "/sentinel/tracking",
        "/sentinel/control-center", "/sentinel/templates", "/sentinel/dashboard-data",
        "/sentinel/health", "/sentinel/docs", "/sentinel/redoc",
        "/sentinel/openapi.json",
    )

    @app.get("/sentinel/{full_path:path}")
    async def serve_frontend(full_path: str, request: Request):
        """Serve static frontend files, but only for non-API paths."""
        req_path = f"/sentinel/{full_path}"
        # If the path starts with any API prefix, return 404 so FastAPI's API routes handle it
        for prefix in _API_PREFIXES:
            if req_path == prefix or req_path.startswith(prefix + "/"):
                raise HTTPException(status_code=404, detail="Not Found")
        # Serve the static file
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fallback to index.html for client-side routing
        index_path = os.path.join(static_dir, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Not Found")
