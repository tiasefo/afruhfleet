from __future__ import annotations

from typing import Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_serializer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_active_subscription
from app.db.session import get_db
from app.models.crm import CrmCustomer, CrmActivity, CustomerStage, ActivityType
from app.models.user import User

router = APIRouter(prefix="/crm", tags=["CRM"])


def _tenant_customer(db: Session, customer_id: str, user: User) -> CrmCustomer:
    """Fetch a CRM customer scoped to the caller's tenant (404 if foreign).

    A platform superuser without a tenant context may address any record —
    the admin console CRM tab is their ops surface. Tenant users only ever
    reach rows carrying their own tenant_id; tenant-less legacy rows are
    invisible to tenants.
    """
    q = select(CrmCustomer).where(CrmCustomer.id == customer_id)
    if not (user.is_superuser and not user.tenant_id):
        q = q.where(CrmCustomer.tenant_id == user.tenant_id)
    customer = db.scalar(q)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


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
    id: UUID
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

    @field_serializer('id')
    def serialize_id(self, v: UUID) -> str:
        return str(v)


class ActivityResponse(BaseModel):
    id: UUID
    customer_id: UUID
    activity_type: str
    summary: str
    details: Optional[str]
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

    @field_serializer('id', 'customer_id')
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)


# ----- Customer Endpoints -----
@router.get("/customers", response_model=list[CustomerResponse])
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """List CRM customers for the caller's tenant (all, for tenant-less superuser)."""
    q = select(CrmCustomer).where(CrmCustomer.is_active.is_(True))
    if not (current_user.is_superuser and not current_user.tenant_id):
        q = q.where(CrmCustomer.tenant_id == current_user.tenant_id)
    customers = db.scalars(q.order_by(CrmCustomer.created_at.desc())).all()
    return customers


@router.post("/customers", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Create a new CRM customer for the caller's tenant."""
    customer = CrmCustomer(**data.model_dump(), tenant_id=current_user.tenant_id)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Get a specific CRM customer in the caller's tenant."""
    return _tenant_customer(db, customer_id, current_user)


@router.patch("/customers/{customer_id}/stage", response_model=CustomerResponse)
def update_customer_stage(
    customer_id: str,
    stage: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Update customer stage."""
    customer = _tenant_customer(db, customer_id, current_user)
    
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
    current_user: User = Depends(require_active_subscription),
):
    """Update customer owner."""
    customer = _tenant_customer(db, customer_id, current_user)
    
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
    current_user: User = Depends(require_active_subscription),
):
    """Convert a lead to prospect."""
    customer = _tenant_customer(db, customer_id, current_user)
    
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
    current_user: User = Depends(require_active_subscription),
):
    """Delete a CRM customer in the caller's tenant."""
    customer = _tenant_customer(db, customer_id, current_user)
    
    db.delete(customer)
    db.commit()
    return {"status": "success", "message": "Customer deleted"}


# ----- Activity Endpoints -----
@router.get("/customers/{customer_id}/activities", response_model=list[ActivityResponse])
def list_customer_activities(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """List activities for a customer in the caller's tenant."""
    _tenant_customer(db, customer_id, current_user)
    
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
    """Create an activity for a customer in the caller's tenant."""
    _tenant_customer(db, customer_id, current_user)
    
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
