from __future__ import annotations

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.shipment import Shipment, ShipmentStatus
from app.models.user import User, UserRole

router = APIRouter(prefix='/customer/shipments', tags=['Customer Shipments'])


# Simplified customer shipment schema
class CustomerShipmentCreate(BaseModel):
    tracking_number: str
    origin_address: str
    destination_address: str
    recipient_name: str
    recipient_phone: str
    recipient_email: Optional[str] = None
    weight_kg: Optional[float] = None
    description: Optional[str] = None
    goods_description: Optional[str] = None
    package_count: Optional[int] = 1
    notes: Optional[str] = None


class CustomerShipmentResponse(BaseModel):
    id: str
    tracking_number: str
    origin_address: str
    destination_address: str
    recipient_name: str
    recipient_phone: str
    status: str
    weight_kg: Optional[float]
    description: Optional[str]
    goods_description: Optional[str]
    package_count: Optional[int]
    created_at: str

    class Config:
        from_attributes = True


def check_customer_role(user: User) -> None:
    """Check if user has Customer role."""
    if user.role != UserRole.customer:
        raise HTTPException(status_code=403, detail='This endpoint is for customers only')


@router.post('', response_model=CustomerShipmentResponse)
def create_customer_shipment(
    shipment: CustomerShipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a shipment as a customer (simplified form, auto-assigns tenant)."""
    # Check user role
    check_customer_role(current_user)
    
    # Ensure user has a tenant
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail='User must belong to a tenant to create shipments')
    
    # Check if tracking number already exists for this tenant
    existing = db.scalar(
        select(Shipment).where(
            Shipment.tracking_number == shipment.tracking_number,
            Shipment.tenant_id == current_user.tenant_id,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail='Tracking number already exists for this tenant')
    
    # Create shipment with auto-populated fields
    new_shipment = Shipment(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        tracking_number=shipment.tracking_number,
        origin_address=shipment.origin_address,
        destination_address=shipment.destination_address,
        recipient_name=shipment.recipient_name,
        recipient_phone=shipment.recipient_phone,
        recipient_email=shipment.recipient_email,
        weight_kg=shipment.weight_kg,
        description=shipment.description,
        goods_description=shipment.goods_description,
        package_count=shipment.package_count,
        notes=shipment.notes,
        status=ShipmentStatus.draft,
        # Auto-set customer as shipper
        shipper_name=current_user.full_name,
        shipper_email=current_user.email,
        shipper_phone=getattr(current_user, 'phone', None),
    )
    
    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)
    
    return CustomerShipmentResponse(
        id=str(new_shipment.id),
        tracking_number=new_shipment.tracking_number,
        origin_address=new_shipment.origin_address,
        destination_address=new_shipment.destination_address,
        recipient_name=new_shipment.recipient_name,
        recipient_phone=new_shipment.recipient_phone,
        status=new_shipment.status.value,
        weight_kg=new_shipment.weight_kg,
        description=new_shipment.description,
        goods_description=new_shipment.goods_description,
        package_count=new_shipment.package_count,
        created_at=new_shipment.created_at.isoformat(),
    )


@router.get('', response_model=list[CustomerShipmentResponse])
def list_customer_shipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all shipments for the current customer (read-only, own shipments only)."""
    # Check user role
    check_customer_role(current_user)
    
    # Ensure user has a tenant
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail='User must belong to a tenant to view shipments')
    
    # Get shipments for this tenant (customer can only view, not filter by user for now)
    shipments = db.scalars(
        select(Shipment).where(
            Shipment.tenant_id == current_user.tenant_id,
        ).order_by(Shipment.created_at.desc())
    ).all()
    
    return [
        CustomerShipmentResponse(
            id=str(s.id),
            tracking_number=s.tracking_number,
            origin_address=s.origin_address,
            destination_address=s.destination_address,
            recipient_name=s.recipient_name,
            recipient_phone=s.recipient_phone,
            status=s.status.value,
            weight_kg=s.weight_kg,
            description=s.description,
            goods_description=s.goods_description,
            package_count=s.package_count,
            created_at=s.created_at.isoformat(),
        )
        for s in shipments
    ]


@router.get('/{tracking_number}', response_model=CustomerShipmentResponse)
def get_customer_shipment(
    tracking_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific shipment by tracking number (customer can only view own tenant's shipments)."""
    # Check user role
    check_customer_role(current_user)
    
    # Ensure user has a tenant
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail='User must belong to a tenant to view shipments')
    
    # Get shipment
    shipment = db.scalar(
        select(Shipment).where(
            Shipment.tracking_number == tracking_number,
            Shipment.tenant_id == current_user.tenant_id,
        )
    )
    
    if not shipment:
        raise HTTPException(status_code=404, detail='Shipment not found')
    
    return CustomerShipmentResponse(
        id=str(shipment.id),
        tracking_number=shipment.tracking_number,
        origin_address=shipment.origin_address,
        destination_address=shipment.destination_address,
        recipient_name=shipment.recipient_name,
        recipient_phone=shipment.recipient_phone,
        status=shipment.status.value,
        weight_kg=shipment.weight_kg,
        description=shipment.description,
        goods_description=shipment.goods_description,
        package_count=shipment.package_count,
        created_at=shipment.created_at.isoformat(),
    )
