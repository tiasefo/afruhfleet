from __future__ import annotations

from typing import Optional
from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_tenant_admin, require_superuser
from app.db.session import get_db
from app.models.new_arrivals import NewArrival, NewArrivalStatus
from app.models.user import User

router = APIRouter(prefix="/new-arrivals", tags=["New Arrivals"])


# ----- Schemas -----
class NewArrivalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[int] = None
    currency: str = "GHS"
    stock_quantity: int = 0
    status: NewArrivalStatus = NewArrivalStatus.ACTIVE
    featured: bool = False
    display_order: int = 0
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    tenant_id: Optional[str] = None  # Required for superusers, auto-filled for tenant admins


class NewArrivalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[int] = None
    currency: Optional[str] = None
    stock_quantity: Optional[int] = None
    status: Optional[NewArrivalStatus] = None
    featured: Optional[bool] = None
    display_order: Optional[int] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None


class NewArrivalResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str]
    image_url: Optional[str]
    price: Optional[int]
    currency: str
    stock_quantity: int
    status: str
    featured: bool
    display_order: int
    available_from: Optional[datetime]
    available_until: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- Routes -----
@router.get("", response_model=list[NewArrivalResponse])
async def list_new_arrivals(
    active_only: bool = True,
    featured_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List new arrivals. Superusers see all, tenant admins see their tenant's, regular users see active/featured only."""
    if current_user.is_superuser:
        # Superusers see all new arrivals across all tenants
        query = select(NewArrival)
    elif current_user.tenant_id:
        # Tenant admins see only their tenant's new arrivals
        query = select(NewArrival).where(NewArrival.tenant_id == str(current_user.tenant_id))
    else:
        # Regular users see only active arrivals from their tenant
        if not current_user.tenant_id:
            return []
        query = select(NewArrival).where(
            NewArrival.tenant_id == str(current_user.tenant_id),
            NewArrival.status == NewArrivalStatus.ACTIVE
        )
    
    if active_only:
        query = query.where(NewArrival.status == NewArrivalStatus.ACTIVE)
    
    if featured_only:
        query = query.where(NewArrival.featured == True)
    
    query = query.order_by(NewArrival.display_order, NewArrival.created_at.desc())
    result = db.execute(query)
    arrivals = result.scalars().all()
    return arrivals


@router.post("", response_model=NewArrivalResponse)
async def create_new_arrival(
    arrival: NewArrivalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
):
    """Create a new arrival. Tenant admins create for their tenant, superusers can specify tenant_id."""
    if current_user.is_superuser:
        # Superusers can create arrivals for any tenant
        if not arrival.tenant_id:
            raise HTTPException(status_code=400, detail="tenant_id required for superusers")
        tenant_id = arrival.tenant_id
    elif current_user.tenant_id:
        # Tenant admins can only create arrivals for their own tenant
        tenant_id = str(current_user.tenant_id)
    else:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_arrival = NewArrival(
        tenant_id=tenant_id,
        name=arrival.name,
        description=arrival.description,
        image_url=arrival.image_url,
        price=arrival.price,
        currency=arrival.currency,
        stock_quantity=arrival.stock_quantity,
        status=arrival.status,
        featured=arrival.featured,
        display_order=arrival.display_order,
        available_from=arrival.available_from,
        available_until=arrival.available_until,
    )
    db.add(db_arrival)
    db.commit()
    db.refresh(db_arrival)
    return db_arrival


@router.get("/{arrival_id}", response_model=NewArrivalResponse)
async def get_new_arrival(
    arrival_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific new arrival. Superusers can access any, tenant admins only their tenant's."""
    query = select(NewArrival).where(NewArrival.id == uuid.UUID(arrival_id))
    
    if not current_user.is_superuser and current_user.tenant_id:
        # Tenant admins can only access their tenant's arrivals
        query = query.where(NewArrival.tenant_id == str(current_user.tenant_id))
    
    result = db.execute(query)
    arrival = result.scalar_one_or_none()
    if not arrival:
        raise HTTPException(status_code=404, detail="New arrival not found")
    return arrival


@router.patch("/{arrival_id}", response_model=NewArrivalResponse)
async def update_new_arrival(
    arrival_id: str,
    arrival_update: NewArrivalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
):
    """Update a new arrival. Superusers can update any, tenant admins only their tenant's."""
    query = select(NewArrival).where(NewArrival.id == uuid.UUID(arrival_id))
    
    if not current_user.is_superuser and current_user.tenant_id:
        # Tenant admins can only update their tenant's arrivals
        query = query.where(NewArrival.tenant_id == str(current_user.tenant_id))
    
    result = db.execute(query)
    arrival = result.scalar_one_or_none()
    if not arrival:
        raise HTTPException(status_code=404, detail="New arrival not found")
    
    if arrival_update.name is not None:
        arrival.name = arrival_update.name
    if arrival_update.description is not None:
        arrival.description = arrival_update.description
    if arrival_update.image_url is not None:
        arrival.image_url = arrival_update.image_url
    if arrival_update.price is not None:
        arrival.price = arrival_update.price
    if arrival_update.currency is not None:
        arrival.currency = arrival_update.currency
    if arrival_update.stock_quantity is not None:
        arrival.stock_quantity = arrival_update.stock_quantity
    if arrival_update.status is not None:
        arrival.status = arrival_update.status
    if arrival_update.featured is not None:
        arrival.featured = arrival_update.featured
    if arrival_update.display_order is not None:
        arrival.display_order = arrival_update.display_order
    if arrival_update.available_from is not None:
        arrival.available_from = arrival_update.available_from
    if arrival_update.available_until is not None:
        arrival.available_until = arrival_update.available_until
    
    arrival.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(arrival)
    return arrival


@router.delete("/{arrival_id}")
async def delete_new_arrival(
    arrival_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
):
    """Delete a new arrival. Superusers can delete any, tenant admins only their tenant's."""
    query = select(NewArrival).where(NewArrival.id == uuid.UUID(arrival_id))
    
    if not current_user.is_superuser and current_user.tenant_id:
        # Tenant admins can only delete their tenant's arrivals
        query = query.where(NewArrival.tenant_id == str(current_user.tenant_id))
    
    result = db.execute(query)
    arrival = result.scalar_one_or_none()
    if not arrival:
        raise HTTPException(status_code=404, detail="New arrival not found")
    
    db.delete(arrival)
    db.commit()
    return {"message": "New arrival deleted successfully"}
