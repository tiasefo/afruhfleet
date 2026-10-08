from __future__ import annotations

import os
import requests

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.redis_client import cache_get, cache_set, cache_delete
from app.api.deps import get_current_user, get_db, require_active_subscription, require_tenant_admin
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter(prefix="/fleetbase-proxy", tags=["Fleetbase Proxy"])

# Short-TTL cache for Fleetbase list reads. The runtime can be slow under load;
# caching per org keeps the UI responsive without pinning API workers. A
# longer-lived "stale" copy is kept so a runtime outage degrades to slightly
# old data instead of an error state.
_LIST_CACHE_TTL = 45
_LIST_STALE_TTL = 600
_FLEETBASE_TIMEOUT = 20


def _list_cache_key(path: str, org_id: str) -> str:
    return f"flist:{org_id}:{path.lstrip('/')}"


def _list_stale_key(path: str, org_id: str) -> str:
    return f"flist-stale:{org_id}:{path.lstrip('/')}"


def _cached_get(path: str, tenant: Tenant):
    """Org-scoped cached list read; falls through to a live fetch on miss,
    and to the last-known-good copy when the runtime is unreachable."""
    org_id = tenant.fleetbase_org_id
    key = _list_cache_key(path, org_id)
    cached = cache_get(key)
    if cached is not None:
        return cached
    try:
        data = _get(path, tenant)
    except HTTPException:
        stale = cache_get(_list_stale_key(path, org_id))
        if stale is not None:
            return stale
        raise
    cache_set(key, data, _LIST_CACHE_TTL)
    cache_set(_list_stale_key(path, org_id), data, _LIST_STALE_TTL)
    return data


def _invalidate_list(path: str, tenant: Tenant):
    cache_delete(_list_cache_key(path, tenant.fleetbase_org_id))
    cache_delete(_list_stale_key(path, tenant.fleetbase_org_id))

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
            timeout=_FLEETBASE_TIMEOUT,
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


def _post(path: str, payload: dict, tenant: Tenant | None = None):
    """Make POST request to Fleetbase API using the tenant's admin token."""
    import logging
    logger = logging.getLogger("afruheritage.fleetbase_proxy")

    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")

    org_id = tenant.fleetbase_org_id
    params = None
    if not (tenant.fleetbase_admin_token and isinstance(tenant.fleetbase_admin_token, str)):
        params = {"company_uuid": org_id}

    try:
        r = requests.post(
            f"{FLEETBASE_API_URL}{path}",
            headers={**_get_headers(tenant), "Content-Type": "application/json"},
            params=params,
            json=payload,
            # Keep creates generous: a timed-out POST may still commit in
            # Fleetbase, and a retry would duplicate the record.
            timeout=30,
        )
    except requests.RequestException as exc:
        logger.error(f"Fleetbase POST {path} failed: {exc}")
        raise HTTPException(status_code=502, detail=str(exc))

    if r.status_code >= 400:
        logger.error(f"Fleetbase POST {path} returned {r.status_code}: {r.text[:500]}")
        detail = "Fleetbase request failed"
        try:
            body = r.json()
            errs = body.get("errors") or body.get("message")
            if errs:
                detail = errs if isinstance(errs, str) else "; ".join(map(str, errs))
        except Exception:
            pass
        raise HTTPException(status_code=r.status_code, detail=detail)

    return r.json()


def _get_tenant_from_user(
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
) -> Tenant | None:
    """Get tenant from current user for org-scoping.

    The DB session is closed immediately after the lookup so the pooled
    connection is not held while the (potentially slow) Fleetbase call runs.
    """
    if not current_user.tenant_id:
        return None
    tenant = db.get(Tenant, current_user.tenant_id)
    if tenant is not None:
        # Load the scalar columns we need while the session is open, then
        # detach so downstream code never lazily hits the DB mid-request.
        _ = (tenant.fleetbase_org_id, tenant.fleetbase_admin_token, tenant.live_console_url)
        db.expunge(tenant)
    db.close()
    return tenant


@router.get("/drivers")
def drivers(tenant: Tenant | None = Depends(_get_tenant_from_user)):
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return _cached_get("/int/v1/drivers", tenant)


class DriverCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=50)
    email: str = Field(min_length=3, max_length=255)
    city: str | None = None
    country: str | None = Field(default=None, max_length=2)
    status: str | None = Field(default="active")
    vehicle: str | None = None  # Fleetbase vehicle public_id


@router.post("/drivers")
def create_driver(
    payload: DriverCreate,
    tenant: Tenant | None = Depends(_get_tenant_from_user),
    admin: User = Depends(require_tenant_admin),
):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    result = _post("/int/v1/drivers", {"driver": data}, tenant)
    _invalidate_list("/int/v1/drivers", tenant)
    return result


@router.get("/vehicles")
def vehicles(tenant: Tenant | None = Depends(_get_tenant_from_user)):
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return _cached_get("/int/v1/vehicles", tenant)


class VehicleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    plate_number: str = Field(min_length=1, max_length=50)
    make: str | None = None
    model: str | None = None
    year: str | None = Field(default=None, max_length=10)
    status: str | None = Field(default="operational")
    driver: str | None = None  # Fleetbase driver public_id


@router.post("/vehicles")
def create_vehicle(
    payload: VehicleCreate,
    tenant: Tenant | None = Depends(_get_tenant_from_user),
    admin: User = Depends(require_tenant_admin),
):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    # Fleetbase schema drift: vehicles.online is NOT NULL without a default —
    # must be sent explicitly or the insert fails.
    data.setdefault("online", False)
    result = _post("/int/v1/vehicles", {"vehicle": data}, tenant)
    _invalidate_list("/int/v1/vehicles", tenant)
    return result


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
