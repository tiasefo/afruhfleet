from __future__ import annotations

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.shipment import Shipment

router = APIRouter(prefix="/checkout", tags=["Checkout"])


class CheckoutRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str | None = None
    pickup_label: str
    pickup_latitude: float
    pickup_longitude: float
    dropoff_label: str
    dropoff_latitude: float
    dropoff_longitude: float
    weight_kg: float | None = None
    length_cm: float | None = None
    width_cm: float | None = None
    height_cm: float | None = None
    package_count: int | None = None
    package_value: float | None = None
    fragile: bool = False
    refrigerated: bool = False
    special_handling_notes: str | None = None
    estimated_price: float
    currency: str = "GHS"


class CheckoutResponse(BaseModel):
    shipment_id: str
    tracking_number: str
    status: str
    estimated_price: float
    currency: str
    created_at: datetime


@router.post("", response_model=CheckoutResponse)
def create_checkout_shipment(
    request: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a shipment from checkout flow."""
    
    # Generate tracking number
    tracking_number = f"AFR-{datetime.now().year}-{str(uuid.uuid4().hex[:6]).upper()}"
    
    # Create shipment
    shipment = Shipment(
        tracking_number=tracking_number,
        customer_name=request.customer_name,
        customer_email=request.customer_email,
        customer_phone=request.customer_phone,
        pickup_label=request.pickup_label,
        pickup_latitude=request.pickup_latitude,
        pickup_longitude=request.pickup_longitude,
        dropoff_label=request.dropoff_label,
        dropoff_latitude=request.dropoff_latitude,
        dropoff_longitude=request.dropoff_longitude,
        weight_kg=request.weight_kg,
        length_cm=request.length_cm,
        width_cm=request.width_cm,
        height_cm=request.height_cm,
        package_count=request.package_count,
        package_value=request.package_value,
        fragile=request.fragile,
        refrigerated=request.refrigerated,
        special_handling_notes=request.special_handling_notes,
        estimated_price=request.estimated_price,
        currency=request.currency,
        status="pending",
        tenant_id=str(current_user.tenant_id) if current_user.tenant_id else None,
        created_by_user_id=current_user.id,
    )
    
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    
    return CheckoutResponse(
        shipment_id=str(shipment.id),
        tracking_number=shipment.tracking_number,
        status=shipment.status,
        estimated_price=float(shipment.estimated_price),
        currency=shipment.currency,
        created_at=shipment.created_at,
    )
