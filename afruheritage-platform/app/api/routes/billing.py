from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser
from app.db.session import get_db
from app.models.billing import Payment, Plan, Subscription, Wallet, WalletTransactionType
from app.models.user import User
from app.schemas.billing import (
    BillingAdminAdjustCreditsRequest,
    BillingAdminAssignPlanRequest,
    BillingAdminSetReadOnlyRequest,
    CreditConsumeRequest,
    PaymentInitRequest,
    PaymentInitResponse,
    PaymentVerifyResponse,
    PlanResponse,
    SubscriptionResponse,
    WalletResponse,
)
from app.services.billing_service import (
    activate_or_upgrade_subscription,
    admin_adjust_credits,
    consume_credits,
    ensure_subscription,
    ensure_wallet,
    get_or_create_subscription,
    get_plans,
    get_wallet,
    initialize_payment,
    mark_payment_verified,
    set_payment_initialized,
    set_subscription_read_only,
    write_audit_log,
)
from app.services.paystack_client import initialize_transaction, verify_transaction
from app.middleware.rate_limit import rate_limit

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/plans", response_model=list[PlanResponse])
def list_plans(db: Session = Depends(get_db)):
    seed_default_plans(db)
    plans = db.query(Plan).filter(Plan.active == True).all()  # noqa: E712
    return [
        PlanResponse(
            code=p.code.value,
            name=p.name,
            currency=p.currency,
            price_amount=float(p.price_amount),
            monthly_credit_allowance=p.monthly_credit_allowance,
            includes_custom_domain=p.includes_custom_domain,
            includes_priority_support=p.includes_priority_support,
        )
        for p in plans
    ]


@router.post("/subscriptions/trial/{tenant_id}", response_model=SubscriptionResponse)
def start_trial(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    seed_default_plans(db)
    sub = create_trial_subscription(db, tenant_id)
    ensure_wallet(db, tenant_id, sub.currency)
    return SubscriptionResponse(
        tenant_id=sub.tenant_id,
        plan_code=sub.plan_code.value,
        status=sub.status.value,
        currency=sub.currency,
        started_at=sub.started_at.isoformat(),
        current_period_end=sub.current_period_end.isoformat(),
        trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
        read_only_reason=sub.read_only_reason,
    )


@router.get("/subscriptions/{tenant_id}", response_model=SubscriptionResponse | None)
def get_subscription(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = evaluate_subscription_state(db, tenant_id)
    if not sub:
        return None
    return SubscriptionResponse(
        tenant_id=sub.tenant_id,
        plan_code=sub.plan_code.value,
        status=sub.status.value,
        currency=sub.currency,
        started_at=sub.started_at.isoformat(),
        current_period_end=sub.current_period_end.isoformat(),
        trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
        read_only_reason=sub.read_only_reason,
    )


@router.get("/wallets/{tenant_id}", response_model=WalletResponse)
def get_wallet(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wallet = ensure_wallet(db, tenant_id)
    return WalletResponse(
        tenant_id=wallet.tenant_id,
        currency=wallet.currency,
        balance_credits=wallet.balance_credits,
    )


@router.post("/payments/init", response_model=PaymentInitResponse)
@rate_limit(category="auth", rule="billing")
def init_payment(
    request: PaymentInitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    amount_minor = int(round(request.amount_major * 100))
    payment = create_payment(
        db=db,
        tenant_id=request.tenant_id,
        purpose=request.purpose,
        currency=request.currency,
        amount_minor=amount_minor,
    )

    try:
        payload = initialize_transaction(
            email=request.email,
            amount_minor=amount_minor,
            reference=payment.reference,
            currency=request.currency,
            callback_url=request.callback_url,
            metadata={
                "tenant_id": request.tenant_id,
                "purpose": request.purpose,
                "plan_code": request.plan_code,
                "credits_to_buy": request.credits_to_buy,
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {exc}") from exc

    data = payload.get("data", {})
    payment = set_payment_initialized(
        db,
        payment,
        authorization_url=data.get("authorization_url"),
        access_code=data.get("access_code"),
        provider_payload=payload,
    )

    return PaymentInitResponse(
        reference=payment.reference,
        authorization_url=payment.provider_authorization_url,
        access_code=payment.provider_access_code,
        status=payment.status.value,
    )


@router.post("/payments/verify/{reference}", response_model=PaymentVerifyResponse)
def verify_payment(
    reference: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = verify_transaction(reference)
    data = payload.get("data", {})
    status = data.get("status")

    payment = db.query(Payment).filter(Payment.reference == reference).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if status == "success":
        payment = mark_payment_verified(db, payment, payload)

        metadata = data.get("metadata") or {}
        purpose = metadata.get("purpose") or payment.purpose
        tenant_id = metadata.get("tenant_id") or payment.tenant_id

        if purpose == "subscription":
            plan_code = metadata.get("plan_code") or "professional"
            activate_or_upgrade_subscription(db, tenant_id=tenant_id, plan_code=plan_code, currency=payment.currency)

        elif purpose == "credit_topup":
            credits = int(metadata.get("credits_to_buy") or 0)
            if credits > 0:
                add_wallet_credits(
                    db,
                    tenant_id=tenant_id,
                    credits=credits,
                    tx_type=WalletTransactionType.CREDIT_PURCHASE,
                    reference=reference,
                    memo="Paystack credit purchase",
                )

        return PaymentVerifyResponse(
            reference=reference,
            status="verified",
            provider_status=status,
            message="Payment verified successfully",
        )

    return PaymentVerifyResponse(
        reference=reference,
        status="failed",
        provider_status=status,
        message="Payment not successful",
    )


@router.post("/credits/consume", response_model=WalletResponse)
def consume_credits(
    request: CreditConsumeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        wallet = consume_wallet_credits(
            db,
            tenant_id=request.tenant_id,
            usage_type=request.usage_type,
            credits=request.credits,
            memo=request.memo,
        )
    except ValueError as exc:
        raise HTTPException(status_code=402, detail=str(exc)) from exc
    return WalletResponse(
        tenant_id=wallet.tenant_id,
        currency=wallet.currency,
        balance_credits=wallet.balance_credits,
    )


@router.post("/admin/read-only", response_model=SubscriptionResponse | None)
def admin_set_read_only(
    request: BillingAdminSetReadOnlyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    sub = set_subscription_read_only(db, tenant_id=request.tenant_id, reason=request.reason)
    if not sub:
        return None
    return SubscriptionResponse(
        tenant_id=sub.tenant_id,
        plan_code=sub.plan_code.value,
        status=sub.status.value,
        currency=sub.currency,
        started_at=sub.started_at.isoformat(),
        current_period_end=sub.current_period_end.isoformat(),
        trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
        read_only_reason=sub.read_only_reason,
    )


@router.post("/admin/credits/adjust", response_model=WalletResponse)
def admin_credits_adjust(
    request: BillingAdminAdjustCreditsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    wallet = admin_adjust_credits(
        db,
        tenant_id=request.tenant_id,
        credits_delta=request.credits_delta,
        memo=request.memo,
    )
    return WalletResponse(
        tenant_id=wallet.tenant_id,
        currency=wallet.currency,
        balance_credits=wallet.balance_credits,
    )


@router.post("/admin/subscriptions/assign", response_model=SubscriptionResponse)
def admin_assign_plan(
    request: BillingAdminAssignPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    sub = activate_or_upgrade_subscription(
        db,
        tenant_id=request.tenant_id,
        plan_code=request.plan_code,
        currency=request.currency,
    )
    return SubscriptionResponse(
        tenant_id=sub.tenant_id,
        plan_code=sub.plan_code.value,
        status=sub.status.value,
        currency=sub.currency,
        started_at=sub.started_at.isoformat(),
        current_period_end=sub.current_period_end.isoformat(),
        trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
        read_only_reason=sub.read_only_reason,
    )
