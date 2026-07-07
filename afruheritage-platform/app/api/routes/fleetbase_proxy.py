from __future__ import annotations

import os
import requests

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.api.deps import get_current_user, get_db, require_active_subscription
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter(prefix="/fleetbase-proxy", tags=["Fleetbase Proxy"])

FLEETBASE_API_URL = os.getenv(
    "FLEETBASE_INTERNAL_URL",
    "http://10.0.0.115:8003"
).rstrip("/")

FLEETBASE_API_TOKEN = os.getenv("FLEETBASE_API_TOKEN", "")


def _get_headers(tenant: Tenant | None = None):
    """Build headers for Fleetbase API requests using the tenant's admin token."""
    # Prefer the per-tenant admin session token (auto-scopes to the tenant's org).
    token = ""
    if tenant and tenant.fleetbase_admin_token and isinstance(tenant.fleetbase_admin_token, str):
        token = tenant.fleetbase_admin_token
    elif FLEETBASE_API_TOKEN:
        token = FLEETBASE_API_TOKEN
    else:
        raise HTTPException(
            status_code=500,
            detail="No Fleetbase credential available — tenant admin token not provisioned and no master token set."
        )

    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


def _get(path: str, tenant: Tenant | None = None):
    """Make GET request to Fleetbase API using the tenant's admin token."""
    import logging
    logger = logging.getLogger("afruheritage.fleetbase_proxy")

    # Deny any request we cannot scope to a tenant org.
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(
            status_code=404,
            detail="Tenant Fleetbase not provisioned",
        )

    try:
        org_id = tenant.fleetbase_org_id
        logger.info(f"Fetching from Fleetbase: {FLEETBASE_API_URL}{path} (org: {org_id})")

        # Admin token auto-scopes to the tenant's org.
        # When falling back to the master token, use company_uuid for scoping.
        params = None
        if not (tenant.fleetbase_admin_token and isinstance(tenant.fleetbase_admin_token, str)):
            params = {"company_uuid": org_id}

        r = requests.get(
            f"{FLEETBASE_API_URL}{path}",
            headers=_get_headers(tenant),
            params=params,
            timeout=30,
        )

        if r.status_code >= 400:
            logger.error(f"Fleetbase returned {r.status_code}: {r.text}")
            raise HTTPException(
                status_code=r.status_code,
                detail=r.text,
            )

        return r.json()

    except requests.RequestException as exc:
        import logging
        logger = logging.getLogger("afruheritage.fleetbase_proxy")
        logger.error(f"Fleetbase request failed: {exc}")
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )


def _get_tenant_from_user(
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
) -> Tenant | None:
    """Get tenant from current user for org-scoping."""
    if not current_user.tenant_id:
        return None
    return db.get(Tenant, current_user.tenant_id)


@router.get("/drivers")
def drivers(tenant: Tenant | None = Depends(_get_tenant_from_user)):
    return _get("/int/v1/drivers", tenant)


@router.get("/vehicles")
def vehicles(tenant: Tenant | None = Depends(_get_tenant_from_user)):
    return _get("/int/v1/vehicles", tenant)


@router.get("/fleets")
def fleets(tenant: Tenant | None = Depends(_get_tenant_from_user)):
    return _get("/int/v1/fleets", tenant)


@router.get("/orders")
def orders(tenant: Tenant | None = Depends(_get_tenant_from_user)):
    return _get("/int/v1/orders", tenant)


@router.get("/console-url")
def console_url(tenant: Tenant | None = Depends(_get_tenant_from_user)):
    """Return Fleetbase console URL, tenant-specific if available."""
    if tenant and tenant.live_console_url:
        return {"url": tenant.live_console_url}
    return {"url": "https://fleet.afruheritage.com"}
