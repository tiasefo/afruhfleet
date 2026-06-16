"""
Tenant-scoped Fleetbase proxy.

Uses the global FLEETBASE_API_TOKEN to auth with the shared Fleetbase instance,
then scopes every request to the tenant's org via company_uuid.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User

logger = logging.getLogger("afruheritage.fleetbase_tenant_proxy")

router = APIRouter(prefix="/fleetbase-tenant", tags=["Fleetbase Tenant Proxy"])


def _fleetbase_headers() -> dict[str, str]:
    token = settings.fleetbase_api_token or ""
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _tenant_org_id(db: Session, user: User) -> str | None:
    if not user.tenant_id:
        return None
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant or not tenant.fleetbase_org_id:
        return None
    return str(tenant.fleetbase_org_id)


def _proxy(
    method: str,
    path: str,
    org_id: str,
    json_body: dict | list | None = None,
    params: dict | None = None,
) -> Any:
    base = (settings.fleetbase_internal_url or "http://10.0.0.115:8003").rstrip("/")
    url = f"{base}{path}"

    # Scope by tenant org
    scoped_params = dict(params) if params else {}
    scoped_params["company_uuid"] = org_id

    # Scope POST body to tenant org
    scoped_body = json_body
    if isinstance(json_body, dict):
        scoped_body = dict(json_body)
        scoped_body["company_uuid"] = org_id

    try:
        resp = httpx.request(
            method.upper(),
            url,
            headers=_fleetbase_headers(),
            json=scoped_body,
            params=scoped_params,
            timeout=30,
        )
    except httpx.RequestError as exc:
        logger.error("Fleetbase unreachable: %s", exc)
        raise HTTPException(status_code=502, detail=f"Fleetbase unreachable: {exc}")

    if resp.status_code >= 400:
        detail = resp.text[:500] if resp.text else f"Fleetbase returned {resp.status_code}"
        logger.warning("Fleetbase proxy error %s %s -> %s", method, path, resp.status_code)
        raise HTTPException(status_code=resp.status_code, detail=detail)

    if not resp.content:
        return {}
    try:
        return resp.json()
    except Exception:
        return {"raw": resp.text}


# ---------------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------------
@router.get("/drivers")
def list_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return _proxy("GET", "/int/v1/drivers", org_id)


@router.post("/drivers")
def create_driver(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    body = {}
    try:
        body = request.json()
    except Exception:
        pass
    return _proxy("POST", "/int/v1/drivers", org_id, json_body=body)


# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------
@router.get("/vehicles")
def list_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return _proxy("GET", "/int/v1/vehicles", org_id)


@router.post("/vehicles")
def create_vehicle(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    body = {}
    try:
        body = request.json()
    except Exception:
        pass
    return _proxy("POST", "/int/v1/vehicles", org_id, json_body=body)


# ---------------------------------------------------------------------------
# Orders (Shipments)
# ---------------------------------------------------------------------------
@router.get("/orders")
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return _proxy("GET", "/int/v1/orders", org_id)


@router.post("/orders")
def create_order(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    body = {}
    try:
        body = request.json()
    except Exception:
        pass
    return _proxy("POST", "/int/v1/orders", org_id, json_body=body)


# ---------------------------------------------------------------------------
# Tracking
# ---------------------------------------------------------------------------
@router.get("/tracking")
def list_tracking(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return _proxy("GET", "/int/v1/tracking", org_id)


# ---------------------------------------------------------------------------
# Fleets
# ---------------------------------------------------------------------------
@router.get("/fleets")
def list_fleets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return _proxy("GET", "/int/v1/fleets", org_id)


# ---------------------------------------------------------------------------
# Catch-all proxy for any Fleetbase endpoint
# ---------------------------------------------------------------------------
@router.api_route("/proxy/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def proxy_any(
    path: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _tenant_org_id(db, current_user)
    if not org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    body = None
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            body = request.json()
        except Exception:
            pass
    params = dict(request.query_params) or None
    fleetbase_path = f"/int/v1/{path}"
    return _proxy(request.method, fleetbase_path, org_id, json_body=body, params=params)
