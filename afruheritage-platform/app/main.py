from app.api.routes.warehouse_notices import router as warehouse_notices_router
from app.api.routes.cargo_lifecycle import router as cargo_lifecycle_router
from app.api.routes.admin_billing_config import router as admin_billing_config_router
from app.api.routes.payment_hub import router as payment_hub_router
from app.api.routes.admin_credits import router as admin_credits_router
from app.api.routes.admin_subscriptions import router as admin_subscriptions_router
from app.api.routes.admin_marketplace import router as admin_marketplace_router
from app.api.routes.admin_dns import router as admin_dns_router
from app.api.routes.marketplace import router as marketplace_router
from app.api.routes.commercial_orchestration import router as commercial_orchestration_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.kyc import router as kyc_router
from app.api.routes.whatsapp_bot import router as whatsapp_bot_router
from app.api.routes.crm import router as crm_router
from app.api.routes.feature_flags import router as feature_flags_router, seed_default_flags
from app.api.routes.billing_admin import router as billing_admin_router
from app.api.routes.estimate import router as estimate_router
from app.api.routes.checkout import router as checkout_router
from app.api.routes.tenant_assets import router as tenant_assets_router
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from slowapi.errors import RateLimitExceeded

from app.core.i18n import init_i18n
from app.core.logging_config import setup_logging
from app.core.middleware import RequestIdMiddleware
from app.core.structured_logging import configure_structured_logging, StructuredLoggingMiddleware
from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler, RateLimitMiddleware

from app.api.routes import auth, auth_pages, runners, tenants, tenant_creation, tenant_requests
from app.api.routes.navigator import router as navigator_router
from app.api.routes.storefront import router as storefront_router
from app.api.routes.pallet import router as pallet_router
from app.api.routes.customer_portal import router as customer_portal_router
from app.api.routes.ai import router as ai_router
from app.api.routes.ai_widget import router as ai_widget_router
from app.api.routes.billing import router as billing_router
from app.api.routes.branding import router as branding_router
from app.api.routes.tenant_context import router as tenant_context_router
from app.api.routes.custom_domains import router as custom_domains_router
from app.api.routes.customer_cargo_portal import router as customer_cargo_portal_router
from app.api.routes.geo import router as geo_router
from app.api.routes.fleetbase_runtime import router as fleetbase_runtime_router
from app.api.routes.i18n import router as i18n_router
from app.api.routes.payments import router as payments_router
from app.api.routes.shipments import router as shipments_router
from app.api.routes.social_auth import router as social_auth_router
from app.api.routes.support_crm import router as support_crm_router
from app.api.routes.whatsapp import router as whatsapp_router
from app.api.routes.whatsapp_csv import router as whatsapp_csv_router
from app.api.routes.vendors import router as vendors_router
from app.api.routes.users import router as users_router
from app.api.routes.company_registration import router as company_registration_router
from app.api.routes.storefront_templates import router as storefront_templates_router
from app.api.routes import customs_guest


from app.core.config import settings
from app.db.runtime_migrations import run_runtime_migrations
from app.db.session import Base, engine

import app.models.tenant  # noqa: F401
import app.models.user  # noqa: F401
import app.models.runner  # noqa: F401
import app.models.audit  # noqa: F401
import app.models.billing  # noqa: F401
import app.models.commercial_orchestration  # noqa: F401
import app.models.marketplace  # noqa: F401
import app.models.marketplace_gps  # noqa: F401
import app.models.custom_domains  # noqa: F401
import app.models.fleetbase_runtime  # noqa: F401
import app.models.support_crm  # noqa: F401
import app.models.tenant_ai_settings  # noqa: F401
import app.models.shipment  # noqa: F401
import app.models.shipment_tracking  # noqa: F401
import app.models.tenant_branding  # noqa: F401
import app.models.vendor  # noqa: F401
import app.models.kyc  # noqa: F401
import app.models.tenant_request  # noqa: F401
import app.models.saas_subscription  # noqa: F401
import app.models.payment_hub  # noqa: F401
import app.models.storefront_template  # noqa: F401
import app.models.product  # noqa: F401
import app.models.crm  # noqa: F401
import app.models.feature_flags  # noqa: F401
import app.models.invoice  # noqa: F401
from app.api.routes import fleetbase_proxy
from app.api.routes import customs
from app.api.routes.fleetbase_tenant_proxy import router as fleetbase_tenant_proxy_router
from app.api.routes.products import router as products_router
from app.api.routes.admin_tenant_preview import router as admin_tenant_preview_router


setup_logging(level="INFO")
configure_structured_logging()
logger = logging.getLogger("afruheritage")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Afruheritage Control Plane")
    Base.metadata.create_all(bind=engine)
    run_runtime_migrations(engine)
    logger.info("Database tables ensured")
    
    # Seed default feature flags
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        seed_default_flags(db)
        logger.info("Default feature flags seeded")
    finally:
        db.close()
    
    init_i18n()
    logger.info("i18n locales loaded")
    yield
    logger.info("Shutting down Afruheritage Control Plane")


STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.app_env != "production" else None,
    redoc_url="/api/redoc" if settings.app_env != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(RequestIdMiddleware)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(social_auth_router, prefix=settings.api_v1_prefix)
app.include_router(auth_pages.router)

app.include_router(tenant_requests.router, prefix=settings.api_v1_prefix)
app.include_router(tenant_creation.router, prefix=settings.api_v1_prefix)
app.include_router(tenants.router, prefix=settings.api_v1_prefix)

app.include_router(payments_router, prefix=settings.api_v1_prefix)
app.include_router(billing_router, prefix=settings.api_v1_prefix)
app.include_router(commercial_orchestration_router, prefix=settings.api_v1_prefix)

app.include_router(whatsapp_router, prefix=settings.api_v1_prefix)
app.include_router(whatsapp_csv_router, prefix=settings.api_v1_prefix)

app.include_router(runners.router, prefix=settings.api_v1_prefix)
app.include_router(fleetbase_runtime_router, prefix=settings.api_v1_prefix)
app.include_router(fleetbase_proxy.router, prefix=settings.api_v1_prefix)
app.include_router(fleetbase_tenant_proxy_router, prefix=settings.api_v1_prefix)
app.include_router(products_router, prefix=settings.api_v1_prefix)

app.include_router(ai_router, prefix=settings.api_v1_prefix)
app.include_router(ai_widget_router, prefix=settings.api_v1_prefix)

app.include_router(support_crm_router, prefix=settings.api_v1_prefix)
app.include_router(custom_domains_router, prefix=settings.api_v1_prefix)
app.include_router(customer_cargo_portal_router, prefix=settings.api_v1_prefix)
app.include_router(shipments_router, prefix=settings.api_v1_prefix)
app.include_router(i18n_router, prefix=settings.api_v1_prefix)

app.include_router(navigator_router, prefix=settings.api_v1_prefix)
app.include_router(storefront_router, prefix=settings.api_v1_prefix)
app.include_router(pallet_router, prefix=settings.api_v1_prefix)
app.include_router(customer_portal_router, prefix=settings.api_v1_prefix)
app.include_router(branding_router, prefix=settings.api_v1_prefix)
app.include_router(tenant_context_router, prefix=settings.api_v1_prefix)
app.include_router(geo_router, prefix=settings.api_v1_prefix)
app.include_router(customs.router, prefix=settings.api_v1_prefix)

app.include_router(vendors_router, prefix=settings.api_v1_prefix)
app.include_router(users_router, prefix=settings.api_v1_prefix)
app.include_router(company_registration_router, prefix=settings.api_v1_prefix)
app.include_router(storefront_templates_router, prefix=settings.api_v1_prefix)
app.include_router(analytics_router, prefix=settings.api_v1_prefix)
app.include_router(kyc_router, prefix=settings.api_v1_prefix)
app.include_router(customs_guest.router, prefix=settings.api_v1_prefix)

@app.get("/health")
def health():
    return {"status": "ok", "service": "afruheritage-control-plane"}

app.include_router(marketplace_router, prefix=settings.api_v1_prefix)

app.include_router(admin_marketplace_router, prefix=settings.api_v1_prefix)

app.include_router(admin_subscriptions_router, prefix=settings.api_v1_prefix)

app.include_router(admin_credits_router, prefix=settings.api_v1_prefix)
app.include_router(admin_dns_router, prefix=settings.api_v1_prefix)
app.include_router(admin_tenant_preview_router, prefix=settings.api_v1_prefix)

app.include_router(payment_hub_router, prefix=settings.api_v1_prefix)

app.include_router(admin_billing_config_router, prefix=settings.api_v1_prefix)

app.include_router(cargo_lifecycle_router, prefix=settings.api_v1_prefix)

app.include_router(warehouse_notices_router, prefix=settings.api_v1_prefix)

app.include_router(crm_router, prefix=settings.api_v1_prefix)
app.include_router(feature_flags_router, prefix=settings.api_v1_prefix)
app.include_router(billing_admin_router, prefix=settings.api_v1_prefix)
app.include_router(estimate_router, prefix=settings.api_v1_prefix)
app.include_router(checkout_router, prefix=settings.api_v1_prefix)
app.include_router(tenant_assets_router, prefix=settings.api_v1_prefix)
