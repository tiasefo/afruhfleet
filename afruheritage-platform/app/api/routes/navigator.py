from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.tenant import Tenant

from app.api.deps import get_current_user
from app.services.fleetbase_proxy import proxy_fleetbase_api, resolve_fleetbase_token

router = APIRouter()

@router.get("/navigator/{tenant_id}/drivers")
def get_navigator_drivers(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch driver list for Navigator module for a tenant."""
    import uuid as _uuid
    try:
        _uuid.UUID(tenant_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    # Proxy real driver data from Fleetbase
    drivers = proxy_fleetbase_api(tenant.live_api_url, "drivers", token=resolve_fleetbase_token(tenant.live_api_token), auth_scheme=tenant.live_api_auth_scheme)
    return {"drivers": drivers, "tenant_id": tenant_id}

@router.get("/navigator/{tenant_id}/tracking")
def get_navigator_tracking(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch real-time tracking data for Navigator module for a tenant."""
    import uuid as _uuid
    try:
        _uuid.UUID(tenant_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    # Proxy real tracking data from Fleetbase
    tracking = proxy_fleetbase_api(tenant.live_api_url, "tracking", token=resolve_fleetbase_token(tenant.live_api_token), auth_scheme=tenant.live_api_auth_scheme)
    return {"tracking": tracking, "tenant_id": tenant_id}
