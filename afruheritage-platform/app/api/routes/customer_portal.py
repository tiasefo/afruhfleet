from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.tenant import Tenant

from app.api.deps import get_current_user
from app.services.fleetbase_proxy import proxy_fleetbase_api

router = APIRouter()

@router.get("/customer-portal/{tenant_id}/shipments")
def get_customer_portal_shipments(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch shipment list for Customer Portal module for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    shipments = proxy_fleetbase_api(tenant.live_api_url, "shipments")
    return {"shipments": shipments, "tenant_id": tenant_id}

@router.get("/customer-portal/{tenant_id}/tracking")
def get_customer_portal_tracking(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch tracking data for Customer Portal module for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    tracking = proxy_fleetbase_api(tenant.live_api_url, "tracking")
    return {"tracking": tracking, "tenant_id": tenant_id}
