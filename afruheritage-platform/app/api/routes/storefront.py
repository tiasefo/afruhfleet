from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.tenant import Tenant

from app.api.deps import get_current_user
from app.services.fleetbase_proxy import proxy_fleetbase_api, resolve_fleetbase_token

router = APIRouter()

@router.get("/storefront/{tenant_id}/orders")
def get_storefront_orders(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch order list for Storefront module for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    orders = proxy_fleetbase_api(tenant.live_api_url, "orders", token=resolve_fleetbase_token(tenant.live_api_token), auth_scheme=tenant.live_api_auth_scheme)
    return {"orders": orders, "tenant_id": tenant_id}

@router.get("/storefront/{tenant_id}/customers")
def get_storefront_customers(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch customer list for Storefront module for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    customers = proxy_fleetbase_api(tenant.live_api_url, "customers", token=resolve_fleetbase_token(tenant.live_api_token), auth_scheme=tenant.live_api_auth_scheme)
    return {"customers": customers, "tenant_id": tenant_id}
