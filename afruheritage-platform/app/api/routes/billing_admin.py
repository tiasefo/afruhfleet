from __future__ import annotations

from typing import Optional
from datetime import datetime, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_superuser
from app.db.session import get_db
from app.models.billing import Subscription, Plan, PlanCode, SubscriptionStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.user import User
from app.models.saas_subscription import SaaSPlan, SaaSAddon, TenantSubscription

router = APIRouter(prefix="/billing", tags=["Billing Admin"])


# ----- Schemas -----
class PlanCreate(BaseModel):
    code: str
    name: str
    monthly_price: float
    included_credits: int
    features_json: Optional[str] = None
    active: bool = True


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    monthly_price: Optional[float] = None
    included_credits: Optional[int] = None
    features_json: Optional[str] = None
    active: Optional[bool] = None


class PlanResponse(BaseModel):
    id: str
    code: str
    name: str
    monthly_price: float
    included_credits: int
    features_json: Optional[str]
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AddonCreate(BaseModel):
    code: str
    name: str
    monthly_price: float
    feature_code: str
    info_text: Optional[str] = None
    active: bool = True


class AddonUpdate(BaseModel):
    name: Optional[str] = None
    monthly_price: Optional[float] = None
    feature_code: Optional[str] = None
    info_text: Optional[str] = None
    active: Optional[bool] = None


class AddonResponse(BaseModel):
    id: str
    code: str
    name: str
    monthly_price: float
    feature_code: str
    info_text: Optional[str]
    active: bool

    class Config:
        from_attributes = True


class CreditRequest(BaseModel):
    tenant_id: str
    amount: int
    reason: str


class GiftCardCreate(BaseModel):
    code: str
    credits: int
    max_uses: int = 1
    expires_at: Optional[datetime] = None


class GiftCardResponse(BaseModel):
    id: str
    code: str
    credits: int
    remaining_uses: int
    max_uses: int
    expires_at: Optional[datetime]
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


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


# ----- Plan Management -----
@router.get("/plans", response_model=list[PlanResponse])
def list_plans(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all SaaS plans (admin only)."""
    plans = db.scalars(
        select(SaaSPlan).order_by(SaaSPlan.created_at.desc())
    ).all()
    return plans


@router.post("/plans", response_model=PlanResponse)
def create_plan(
    data: PlanCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Create a new SaaS plan (admin only)."""
    existing = db.scalar(select(SaaSPlan).where(SaaSPlan.code == data.code))
    if existing:
        raise HTTPException(status_code=400, detail="Plan code already exists")
    
    plan = SaaSPlan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/plans/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: str,
    data: PlanUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update a SaaS plan (admin only)."""
    plan = db.scalar(select(SaaSPlan).where(SaaSPlan.id == uuid.UUID(plan_id)))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}")
def delete_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Delete a SaaS plan (admin only)."""
    plan = db.scalar(select(SaaSPlan).where(SaaSPlan.id == uuid.UUID(plan_id)))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted successfully"}


# ----- Addon Management -----
@router.get("/addons", response_model=list[AddonResponse])
def list_addons(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all SaaS addons (admin only)."""
    addons = db.scalars(
        select(SaaSAddon).order_by(SaaSAddon.code)
    ).all()
    return addons


@router.post("/addons", response_model=AddonResponse)
def create_addon(
    data: AddonCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Create a new SaaS addon (admin only)."""
    existing = db.scalar(select(SaaSAddon).where(SaaSAddon.code == data.code))
    if existing:
        raise HTTPException(status_code=400, detail="Addon code already exists")
    
    addon = SaaSAddon(**data.model_dump())
    db.add(addon)
    db.commit()
    db.refresh(addon)
    return addon


@router.patch("/addons/{addon_id}", response_model=AddonResponse)
def update_addon(
    addon_id: str,
    data: AddonUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update a SaaS addon (admin only)."""
    addon = db.scalar(select(SaaSAddon).where(SaaSAddon.id == uuid.UUID(addon_id)))
    if not addon:
        raise HTTPException(status_code=404, detail="Addon not found")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(addon, field, value)
    
    db.add(addon)
    db.commit()
    db.refresh(addon)
    return addon


@router.delete("/addons/{addon_id}")
def delete_addon(
    addon_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Delete a SaaS addon (admin only)."""
    addon = db.scalar(select(SaaSAddon).where(SaaSAddon.id == uuid.UUID(addon_id)))
    if not addon:
        raise HTTPException(status_code=404, detail="Addon not found")
    
    db.delete(addon)
    db.commit()
    return {"message": "Addon deleted successfully"}


# ----- Credit Management -----
@router.post("/credits/grant")
def grant_credits(
    data: CreditRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Grant credits to a tenant (admin only)."""
    sub = db.scalar(
        select(TenantSubscription).where(TenantSubscription.tenant_id == data.tenant_id)
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Tenant subscription not found")
    
    sub.credits_balance += data.amount
    db.add(sub)
    db.commit()
    db.refresh(sub)
    
    return {
        "tenant_id": data.tenant_id,
        "credits_granted": data.amount,
        "reason": data.reason,
        "new_balance": sub.credits_balance,
    }


@router.post("/credits/revoke")
def revoke_credits(
    data: CreditRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Revoke credits from a tenant (admin only)."""
    sub = db.scalar(
        select(TenantSubscription).where(TenantSubscription.tenant_id == data.tenant_id)
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Tenant subscription not found")
    
    if sub.credits_balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient credits to revoke")
    
    sub.credits_balance -= data.amount
    db.add(sub)
    db.commit()
    db.refresh(sub)
    
    return {
        "tenant_id": data.tenant_id,
        "credits_revoked": data.amount,
        "reason": data.reason,
        "new_balance": sub.credits_balance,
    }


# ----- Gift Card Management -----
@router.post("/gift-cards", response_model=GiftCardResponse)
def create_gift_card(
    data: GiftCardCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Create a gift card (admin only)."""
    from app.models.saas_subscription import GiftCard
    
    existing = db.scalar(select(GiftCard).where(GiftCard.code == data.code))
    if existing:
        raise HTTPException(status_code=400, detail="Gift card code already exists")
    
    gift_card = GiftCard(
        code=data.code,
        credits=data.credits,
        max_uses=data.max_uses,
        remaining_uses=data.max_uses,
        expires_at=data.expires_at,
        active=True,
    )
    db.add(gift_card)
    db.commit()
    db.refresh(gift_card)
    return gift_card


@router.get("/gift-cards", response_model=list[GiftCardResponse])
def list_gift_cards(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all gift cards (admin only)."""
    from app.models.saas_subscription import GiftCard
    
    gift_cards = db.scalars(
        select(GiftCard).order_by(GiftCard.created_at.desc())
    ).all()
    return gift_cards


@router.post("/gift-cards/{code}/redeem/{tenant_id}")
def redeem_gift_card(
    code: str,
    tenant_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Redeem a gift card for a tenant (admin only)."""
    from app.models.saas_subscription import GiftCard
    
    gift_card = db.scalar(select(GiftCard).where(GiftCard.code == code))
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")
    
    if not gift_card.active:
        raise HTTPException(status_code=400, detail="Gift card is inactive")
    
    if gift_card.remaining_uses <= 0:
        raise HTTPException(status_code=400, detail="Gift card has no remaining uses")
    
    if gift_card.expires_at and gift_card.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Gift card has expired")
    
    sub = db.scalar(
        select(TenantSubscription).where(TenantSubscription.tenant_id == tenant_id)
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Tenant subscription not found")
    
    sub.credits_balance += gift_card.credits
    gift_card.remaining_uses -= 1
    
    db.add(sub)
    db.add(gift_card)
    db.commit()
    db.refresh(sub)
    
    return {
        "tenant_id": tenant_id,
        "credits_added": gift_card.credits,
        "new_balance": sub.credits_balance,
        "gift_card_remaining_uses": gift_card.remaining_uses,
    }


@router.delete("/gift-cards/{code}")
def delete_gift_card(
    code: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Delete a gift card (admin only)."""
    from app.models.saas_subscription import GiftCard
    
    gift_card = db.scalar(select(GiftCard).where(GiftCard.code == code))
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")
    
    db.delete(gift_card)
    db.commit()
    return {"message": "Gift card deleted successfully"}


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
