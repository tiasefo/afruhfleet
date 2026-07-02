from __future__ import annotations

from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_superuser
from app.db.session import get_db
from app.models.billing import Subscription, Plan, PlanCode, SubscriptionStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["Billing Admin"])


# ----- Schemas -----
class SubscriptionUpdatePlan(BaseModel):
    plan_id: str


class SubscriptionResponse(BaseModel):
    id: str
    tenant_id: str
    plan_code: str
    status: str
    currency: str
    started_at: datetime
    current_period_end: datetime
    trial_ends_at: Optional[datetime]
    canceled_at: Optional[datetime]
    read_only_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: str
    tenant_id: str
    invoice_number: str
    customer_name: str
    amount: float
    currency: str
    status: str
    due_date: datetime
    issued_date: datetime
    paid_date: Optional[datetime]
    description: Optional[str]
    invoice_logo_url: Optional[str]
    invoice_footer_text: Optional[str]
    invoice_from_name: Optional[str]
    invoice_from_address: Optional[str]
    invoice_from_email: Optional[str]
    invoice_from_phone: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceBrandingUpdate(BaseModel):
    invoice_logo_url: Optional[str] = None
    invoice_footer_text: Optional[str] = None
    invoice_from_name: Optional[str] = None
    invoice_from_address: Optional[str] = None
    invoice_from_email: Optional[str] = None
    invoice_from_phone: Optional[str] = None


class ManualPaymentRequest(BaseModel):
    method: str = "manual"
    amount: Optional[float] = None
    reference: Optional[str] = None


# ----- Subscription Endpoints -----
@router.get("/subscriptions", response_model=list[SubscriptionResponse])
def list_subscriptions(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all subscriptions (admin only)."""
    subscriptions = db.scalars(
        select(Subscription).order_by(Subscription.created_at.desc())
    ).all()
    return subscriptions


@router.patch("/subscriptions/{subscription_id}/plan", response_model=SubscriptionResponse)
def change_subscription_plan(
    subscription_id: str,
    data: SubscriptionUpdatePlan,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Change subscription plan (admin only)."""
    subscription = db.scalar(select(Subscription).where(Subscription.id == subscription_id))
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    plan = db.scalar(select(Plan).where(Plan.id == data.plan_id))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    subscription.plan_code = plan.code
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.post("/subscriptions/{subscription_id}/pause", response_model=SubscriptionResponse)
def pause_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Pause subscription (admin only)."""
    subscription = db.scalar(select(Subscription).where(Subscription.id == subscription_id))
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscription.status = SubscriptionStatus.SUSPENDED.value
    subscription.read_only_reason = "Paused by admin"
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.post("/subscriptions/{subscription_id}/resume", response_model=SubscriptionResponse)
def resume_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Resume subscription (admin only)."""
    subscription = db.scalar(select(Subscription).where(Subscription.id == subscription_id))
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscription.status = SubscriptionStatus.ACTIVE.value
    subscription.read_only_reason = None
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.post("/subscriptions/{subscription_id}/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    subscription_id: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Cancel subscription (admin only)."""
    subscription = db.scalar(select(Subscription).where(Subscription.id == subscription_id))
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscription.status = SubscriptionStatus.CANCELED.value
    subscription.canceled_at = datetime.utcnow()
    subscription.read_only_reason = reason or "Canceled by admin"
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


# ----- Invoice Endpoints -----
@router.get("/invoices", response_model=list[InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all invoices (admin only)."""
    invoices = db.scalars(
        select(Invoice).order_by(Invoice.issued_date.desc())
    ).all()
    return invoices


@router.post("/invoices/{invoice_id}/void", response_model=InvoiceResponse)
def void_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Void an invoice (admin only)."""
    invoice = db.scalar(select(Invoice).where(Invoice.id == invoice_id))
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.PAID.value:
        raise HTTPException(status_code=400, detail="Cannot void a paid invoice")
    
    invoice.status = InvoiceStatus.VOID.value
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/invoices/{invoice_id}/payments", response_model=InvoiceResponse)
def mark_invoice_paid(
    invoice_id: str,
    data: ManualPaymentRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Manually mark invoice as paid (admin only)."""
    invoice = db.scalar(select(Invoice).where(Invoice.id == invoice_id))
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.PAID.value:
        raise HTTPException(status_code=400, detail="Invoice already paid")
    
    if invoice.status == InvoiceStatus.VOID.value:
        raise HTTPException(status_code=400, detail="Cannot pay a voided invoice")
    
    invoice.status = InvoiceStatus.PAID.value
    invoice.paid_date = datetime.utcnow()
    if data.amount:
        invoice.amount = data.amount
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.patch("/invoices/{invoice_id}/branding", response_model=InvoiceResponse)
def update_invoice_branding(
    invoice_id: str,
    data: InvoiceBrandingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update invoice branding (admin only)."""
    invoice = db.scalar(select(Invoice).where(Invoice.id == invoice_id))
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Update branding fields if provided
    if data.invoice_logo_url is not None:
        invoice.invoice_logo_url = data.invoice_logo_url
    if data.invoice_footer_text is not None:
        invoice.invoice_footer_text = data.invoice_footer_text
    if data.invoice_from_name is not None:
        invoice.invoice_from_name = data.invoice_from_name
    if data.invoice_from_address is not None:
        invoice.invoice_from_address = data.invoice_from_address
    if data.invoice_from_email is not None:
        invoice.invoice_from_email = data.invoice_from_email
    if data.invoice_from_phone is not None:
        invoice.invoice_from_phone = data.invoice_from_phone
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice
