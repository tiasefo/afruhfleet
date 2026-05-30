from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.tenant import Tenant

from app.api.deps import get_current_user
from app.services.fleetbase_proxy import proxy_fleetbase_api, resolve_fleetbase_token

router = APIRouter()

@router.get("/pallet/{tenant_id}/inventory")
def get_pallet_inventory(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch inventory list for Pallet module for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    inventory = proxy_fleetbase_api(tenant.live_api_url, "inventory", token=resolve_fleetbase_token(tenant.live_api_token), auth_scheme=tenant.live_api_auth_scheme)
    return {"inventory": inventory, "tenant_id": tenant_id}

@router.get("/pallet/{tenant_id}/warehouses")
def get_pallet_warehouses(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch warehouse list for Pallet module for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    warehouses = proxy_fleetbase_api(tenant.live_api_url, "warehouses", token=resolve_fleetbase_token(tenant.live_api_token), auth_scheme=tenant.live_api_auth_scheme)
    return {"warehouses": warehouses, "tenant_id": tenant_id}
