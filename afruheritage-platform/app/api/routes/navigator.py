from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.tenant import Tenant

from app.api.deps import get_current_user, require_active_subscription
from app.services.fleetbase_proxy import proxy_fleetbase_api, request_fleetbase_api, resolve_fleetbase_token

router = APIRouter()


class DriverCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=5, max_length=50)
    email: str | None = None
    vehicle_type: str | None = None
    vehicle_plate: str | None = None
    license_number: str | None = None


def _resolve_tenant(tenant_id: str, db: Session) -> Tenant:
    import uuid as _uuid
    try:
        _uuid.UUID(tenant_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.get("/navigator/{tenant_id}/drivers")
def get_navigator_drivers(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(require_active_subscription)):
    """Fetch driver list for Navigator module for a tenant."""
    tenant = _resolve_tenant(tenant_id, db)
    if not tenant.live_api_url:
        return {"drivers": [], "tenant_id": tenant_id, "message": "Fleetbase runtime not yet provisioned for this tenant."}
    drivers = proxy_fleetbase_api(
        tenant.live_api_url, "drivers",
        token=resolve_fleetbase_token(tenant.live_api_token),
        auth_scheme=tenant.live_api_auth_scheme,
        suppress_errors=True,
    )
    if drivers is None:
        return {"drivers": [], "tenant_id": tenant_id, "message": "Fleetbase API unavailable. Please try again later."}
    return {"drivers": drivers, "tenant_id": tenant_id}


@router.post("/navigator/{tenant_id}/drivers")
def create_navigator_driver(
    payload: DriverCreateRequest,
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_active_subscription),
):
    """Create a driver in the Navigator module for a tenant via Fleetbase."""
    tenant = _resolve_tenant(tenant_id, db)
    if not tenant.live_api_url:
        raise HTTPException(
            status_code=409,
            detail="Fleetbase runtime not yet provisioned for this tenant. Launch the tenant first.",
        )
    driver_data = {
        "name": payload.name,
        "phone": payload.phone,
    }
    if payload.email:
        driver_data["email"] = payload.email
    if payload.vehicle_type:
        driver_data["vehicle_type"] = payload.vehicle_type
    if payload.vehicle_plate:
        driver_data["vehicle_plate"] = payload.vehicle_plate
    if payload.license_number:
        driver_data["license_number"] = payload.license_number

    result = request_fleetbase_api(
        tenant.live_api_url, "POST", "drivers",
        token=resolve_fleetbase_token(tenant.live_api_token),
        auth_scheme=tenant.live_api_auth_scheme,
        json_body=driver_data,
    )
    return {"driver": result, "tenant_id": tenant_id}


@router.get("/navigator/{tenant_id}/tracking")
def get_navigator_tracking(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(require_active_subscription)):
    """Fetch real-time tracking data for Navigator module for a tenant."""
    tenant = _resolve_tenant(tenant_id, db)
    if not tenant.live_api_url:
        return {"tracking": [], "tenant_id": tenant_id, "message": "Fleetbase runtime not yet provisioned for this tenant."}
    tracking = proxy_fleetbase_api(
        tenant.live_api_url, "tracking",
        token=resolve_fleetbase_token(tenant.live_api_token),
        auth_scheme=tenant.live_api_auth_scheme,
        suppress_errors=True,
    )
    if tracking is None:
        return {"tracking": [], "tenant_id": tenant_id, "message": "Fleetbase API unavailable. Please try again later."}
    return {"tracking": tracking, "tenant_id": tenant_id}
