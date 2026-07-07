from __future__ import annotations

from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser, require_active_subscription
from app.db.session import get_db
from app.models.crm import CrmCustomer, CrmActivity, CustomerStage, ActivityType
from app.models.user import User

router = APIRouter(prefix="/crm", tags=["CRM"])


# ----- Schemas -----
class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    stage: Optional[str] = CustomerStage.LEAD.value
    owner: Optional[str] = None
    value: Optional[float] = None
    currency: str = "GHS"
    source: Optional[str] = None
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    stage: Optional[str] = None
    owner: Optional[str] = None
    value: Optional[float] = None
    currency: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ActivityCreate(BaseModel):
    activity_type: str
    summary: str
    details: Optional[str] = None


class CustomerResponse(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    stage: str
    owner: Optional[str]
    value: Optional[float]
    currency: str
    source: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivityResponse(BaseModel):
    id: str
    customer_id: str
    activity_type: str
    summary: str
    details: Optional[str]
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ----- Customer Endpoints -----
@router.get("/customers", response_model=list[CustomerResponse])
def list_customers(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all CRM customers (admin only)."""
    customers = db.scalars(
        select(CrmCustomer).where(CrmCustomer.is_active.is_(True)).order_by(CrmCustomer.created_at.desc())
    ).all()
    return customers


@router.post("/customers", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Create a new CRM customer (admin only)."""
    customer = CrmCustomer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Get a specific CRM customer (admin only)."""
    customer = db.scalar(select(CrmCustomer).where(CrmCustomer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/customers/{customer_id}/stage", response_model=CustomerResponse)
def update_customer_stage(
    customer_id: str,
    stage: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update customer stage (admin only)."""
    customer = db.scalar(select(CrmCustomer).where(CrmCustomer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if stage not in [s.value for s in CustomerStage]:
        raise HTTPException(status_code=400, detail="Invalid stage")
    
    customer.stage = stage
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.patch("/customers/{customer_id}/owner", response_model=CustomerResponse)
def update_customer_owner(
    customer_id: str,
    owner: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update customer owner (admin only)."""
    customer = db.scalar(select(CrmCustomer).where(CrmCustomer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.owner = owner
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.post("/customers/{customer_id}/convert", response_model=CustomerResponse)
def convert_customer(
    customer_id: str,
    stage: str = CustomerStage.PROSPECT.value,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Convert a lead to prospect (admin only)."""
    customer = db.scalar(select(CrmCustomer).where(CrmCustomer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if stage not in [s.value for s in CustomerStage]:
        raise HTTPException(status_code=400, detail="Invalid stage")
    
    customer.stage = stage
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Delete a CRM customer (admin only)."""
    customer = db.scalar(select(CrmCustomer).where(CrmCustomer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    return {"status": "success", "message": "Customer deleted"}


# ----- Activity Endpoints -----
@router.get("/customers/{customer_id}/activities", response_model=list[ActivityResponse])
def list_customer_activities(
    customer_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List activities for a customer (admin only)."""
    customer = db.scalar(select(CrmCustomer).where(CrmCustomer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    activities = db.scalars(
        select(CrmActivity).where(CrmActivity.customer_id == customer_id).order_by(CrmActivity.created_at.desc())
    ).all()
    return activities


@router.post("/customers/{customer_id}/activities", response_model=ActivityResponse)
def create_activity(
    customer_id: str,
    data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Create an activity for a customer (admin only)."""
    customer = db.scalar(select(CrmCustomer).where(CrmCustomer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if data.activity_type not in [t.value for t in ActivityType]:
        raise HTTPException(status_code=400, detail="Invalid activity type")
    
    activity = CrmActivity(
        customer_id=customer_id,
        activity_type=data.activity_type,
        summary=data.summary,
        details=data.details,
        created_by=str(current_user.id) if current_user else None,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
