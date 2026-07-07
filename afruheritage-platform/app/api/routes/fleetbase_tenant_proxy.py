"""
Tenant-scoped Fleetbase proxy.

Uses the per-tenant fleetbase_admin_token to authenticate with the shared
Fleetbase instance.  Admin session tokens auto-scope to the tenant's org —
no company_uuid query param or body injection is needed.

Write payloads must be nested under the resource name (e.g. {"driver": {...}}).
"""
from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_active_subscription
from app.core.config import settings
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.services.fleetbase_entitlements import check_fleetbase_access

logger = logging.getLogger("afruheritage.fleetbase_tenant_proxy")

router = APIRouter(prefix="/fleetbase-tenant", tags=["Fleetbase Tenant Proxy"])


def _fleetbase_headers(tenant: Tenant) -> dict[str, str]:
    token = tenant.fleetbase_admin_token or ""
    if not token or not isinstance(token, str):
        raise HTTPException(
            status_code=500,
            detail="Tenant Fleetbase admin token not provisioned. Re-provision the tenant org.",
        )
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _tenant_from_user(db: Session, user: User) -> Tenant | None:
    if not user.tenant_id:
        return None
    return db.get(Tenant, user.tenant_id)


def _tenant_org_id(db: Session, user: User) -> str | None:
    tenant = _tenant_from_user(db, user)
    if not tenant or not tenant.fleetbase_org_id:
        return None
    return str(tenant.fleetbase_org_id)


# Fleetbase /int/v1 resource names that require nested payloads on write.
# e.g. POST /int/v1/drivers expects {"driver": {...}}, not a flat object.
_NESTED_RESOURCES = {
    "drivers", "vehicles", "fleets", "orders", "vendors",
    "contacts", "places", "fuel-reports", "maintenance-reports",
    "service-rates", "route-plans", "payloads", "entities",
}


def _wrap_payload(path: str, body: dict | list | None) -> dict | list | None:
    """If the body is a flat dict and the resource expects a nested payload,
    wrap it under the singular resource name."""
    if body is None or not isinstance(body, dict):
        return body
    # If already nested with the resource key, pass through.
    resource = path.rstrip("/").split("/")[-1]
    if resource in body:
        return body
    # Determine the resource name from the path.
    parts = path.lstrip("/").split("/")
    # e.g. /int/v1/drivers -> resource = "drivers"
    if len(parts) >= 3 and parts[0] == "int" and parts[1] == "v1":
        resource = parts[2]
    if resource in _NESTED_RESOURCES:
        # Use singular form as the key (Fleetbase convention: drivers -> driver)
        singular = resource.rstrip("s") if resource.endswith("s") else resource
        # Don't double-wrap if already wrapped under singular key.
        if singular not in body:
            return {singular: body}
    return body


async def _proxy(
    method: str,
    path: str,
    tenant: Tenant,
    json_body: dict | list | None = None,
    params: dict | None = None,
) -> Any:
    base = (settings.fleetbase_internal_url or "http://10.0.0.115:8003").rstrip("/")
    url = f"{base}{path}"

    # Admin token auto-scopes to the tenant's org — no company_uuid needed.
    scoped_params = dict(params) if params else None

    # Wrap write payloads if needed (Fleetbase expects nested objects).
    scoped_body = json_body
    if method.upper() in ("POST", "PUT", "PATCH") and json_body is not None:
        scoped_body = _wrap_payload(path, json_body)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method.upper(),
                url,
                headers=_fleetbase_headers(tenant),
                json=scoped_body,
                params=scoped_params,
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
async def list_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return await _proxy("GET", "/int/v1/drivers", tenant)


@router.post("/drivers")
async def create_driver(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    return await _proxy("POST", "/int/v1/drivers", tenant, json_body=body)


# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------
@router.get("/vehicles")
async def list_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return await _proxy("GET", "/int/v1/vehicles", tenant)


@router.post("/vehicles")
async def create_vehicle(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    return await _proxy("POST", "/int/v1/vehicles", tenant, json_body=body)


# ---------------------------------------------------------------------------
# Orders (Shipments)
# ---------------------------------------------------------------------------
@router.get("/orders")
async def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return await _proxy("GET", "/int/v1/orders", tenant)


@router.post("/orders")
async def create_order(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    return await _proxy("POST", "/int/v1/orders", tenant, json_body=body)


# ---------------------------------------------------------------------------
# Tracking
# ---------------------------------------------------------------------------
@router.get("/tracking")
async def list_tracking(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return await _proxy("GET", "/int/v1/tracking-statuses", tenant)


@router.get("/tracking-statuses")
async def list_tracking_statuses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return await _proxy("GET", "/int/v1/tracking-statuses", tenant)


# ---------------------------------------------------------------------------
# Live driver positions (GPS tracking)
# ---------------------------------------------------------------------------
@router.get("/positions")
async def list_positions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return await _proxy("GET", "/int/v1/positions", tenant)


@router.get("/drivers/{driver_id}/position")
async def get_driver_position(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return await _proxy("GET", f"/int/v1/positions?driver_uuid={driver_id}", tenant)


# ---------------------------------------------------------------------------
# Fleets
# ---------------------------------------------------------------------------
@router.get("/fleets")
async def list_fleets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    return await _proxy("GET", "/int/v1/fleets", tenant)


# ---------------------------------------------------------------------------
# Unified live tracking: drivers + positions + tracking statuses in one call
# ---------------------------------------------------------------------------
@router.get("/live-tracking")
async def get_live_tracking(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Return a unified snapshot of all live tracking data for the tenant's org:
    drivers, their current positions, and tracking statuses."""
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")

    drivers_resp = await _proxy("GET", "/int/v1/drivers", tenant)
    positions_resp = await _proxy("GET", "/int/v1/positions", tenant)
    statuses_resp = await _proxy("GET", "/int/v1/tracking-statuses", tenant)

    drivers = drivers_resp.get("drivers", []) if isinstance(drivers_resp, dict) else []
    positions = positions_resp.get("positions", []) if isinstance(positions_resp, dict) else []
    statuses = statuses_resp.get("tracking_statuses", []) if isinstance(statuses_resp, dict) else []

    pos_by_driver = {}
    for pos in positions:
        duid = pos.get("driver_uuid") or pos.get("driver")
        if duid:
            pos_by_driver[str(duid)] = pos

    enriched_drivers = []
    for drv in drivers:
        duid = drv.get("uuid")
        pos = pos_by_driver.get(str(duid)) if duid else None
        enriched_drivers.append({
            **drv,
            "current_position": pos,
        })

    return {
        "drivers": enriched_drivers,
        "positions": positions,
        "tracking_statuses": statuses,
        "meta": {
            "drivers_count": len(drivers),
            "positions_count": len(positions),
            "tracking_statuses_count": len(statuses),
        },
    }


# ---------------------------------------------------------------------------
# Order-specific tracking: get a single order's tracking info + driver position
# ---------------------------------------------------------------------------
@router.get("/orders/{order_id}/track")
async def track_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Get order details + live driver position if the order has an assigned driver."""
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")

    order_resp = await _proxy("GET", f"/int/v1/orders/{order_id}", tenant)
    order = order_resp.get("order", order_resp) if isinstance(order_resp, dict) else {}

    driver_uuid = order.get("driver_uuid") or order.get("driver_assigned_uuid")
    driver_position = None
    if driver_uuid:
        pos_resp = await _proxy("GET", f"/int/v1/positions?driver_uuid={driver_uuid}", tenant)
        positions = pos_resp.get("positions", []) if isinstance(pos_resp, dict) else []
        driver_position = positions[0] if positions else None

    tracking_statuses = []
    try:
        ts_resp = await _proxy("GET", f"/int/v1/tracking-statuses?tracking_number={order.get('tracking_number','')}", tenant)
        tracking_statuses = ts_resp.get("tracking_statuses", []) if isinstance(ts_resp, dict) else []
    except Exception:
        pass

    return {
        "order": order,
        "driver_position": driver_position,
        "tracking_statuses": tracking_statuses,
    }


# ---------------------------------------------------------------------------
# Catch-all proxy for any Fleetbase endpoint
# ---------------------------------------------------------------------------
@router.api_route("/proxy/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_any(
    path: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant = _tenant_from_user(db, current_user)
    if not tenant or not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")
    # Plan-gate paid Fleetbase features (P1.4). Core features pass through.
    check_fleetbase_access(db, tenant, path)
    body = None
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            body = await request.json()
        except Exception:
            pass
    params = dict(request.query_params) or None
    fleetbase_path = f"/int/v1/{path}"
    return await _proxy(request.method, fleetbase_path, tenant, json_body=body, params=params)
