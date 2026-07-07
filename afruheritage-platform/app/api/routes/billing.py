from __future__ import annotations
from app.core.config import settings
from datetime import datetime
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, require_superuser, require_tenant_admin
from app.db.session import get_db
from app.models.billing import Payment, PaymentStatus, Plan, Subscription, Wallet, WalletTransaction, WalletTransactionType
from app.models.user import User
from app.schemas.billing import BillingAdminAdjustCreditsRequest, BillingAdminAssignPlanRequest, BillingAdminSetReadOnlyRequest, CreditConsumeRequest, PaymentInitRequest, PaymentInitResponse, PaymentReinitRequest, PaymentVerifyResponse, PlanResponse, SubscriptionResponse, UsageCreditCostResponse, WalletResponse, WalletTransactionResponse
from app.services.billing_service import activate_or_upgrade_subscription, add_wallet_credits_once, admin_adjust_credits, cancel_subscription, ensure_wallet, get_plans, grant_subscription_allowance, mark_payment_verified, pause_subscription, resume_subscription, set_payment_initialized, set_subscription_read_only, write_audit_log, consume_wallet_credits, create_payment, create_trial_subscription, evaluate_subscription_state, seed_default_plans, admin_assign_plan as admin_assign_plan_service, get_plan_features, normalize_plan_code, get_feature_credit_costs
from app.services.paystack_client import initialize_transaction, verify_transaction
import app.services.flutterwave_client as _flw
from app.middleware.rate_limit import rate_limit
router = APIRouter(prefix='/billing', tags=['Billing'])


def _assert_tenant_access(current_user: User, tenant_id: str) -> None:
    if current_user.is_superuser:
        return
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(status_code=403, detail='Tenant access denied')

@router.get('/plans', response_model=list[PlanResponse])
def list_plans(tenant_id: str | None = None, db: Session=Depends(get_db)):
    seed_default_plans(db)
    plans = db.query(Plan).filter(Plan.active == True).all()
    return [
        PlanResponse(
            code=p.code.value,
            name=p.name,
            currency=p.currency,
            price_amount=float(p.price_amount),
            monthly_credit_allowance=p.monthly_credit_allowance,
            includes_custom_domain=p.includes_custom_domain,
            includes_priority_support=p.includes_priority_support,
            included_features=get_plan_features(p.code.value),
            max_drivers=p.max_drivers,
            max_vehicles=p.max_vehicles,
            max_shipments_per_month=p.max_shipments_per_month,
            max_products=p.max_products,
            max_group_members=p.max_group_members,
            dispatch_enabled=p.dispatch_enabled,
            route_planning_enabled=p.route_planning_enabled,
            service_rates_enabled=p.service_rates_enabled,
            pod_enabled=p.pod_enabled,
            route_optimization_enabled=p.route_optimization_enabled,
            vrp_enabled=p.vrp_enabled,
            webhooks_enabled=p.webhooks_enabled,
            notifications_enabled=p.notifications_enabled,
            extensions_enabled=p.extensions_enabled,
            maintenance_enabled=p.maintenance_enabled,
            fuel_tracking_enabled=p.fuel_tracking_enabled,
            csv_import_enabled=p.csv_import_enabled,
        )
        for p in plans
    ]

@router.post('/subscriptions/trial/{tenant_id}', response_model=SubscriptionResponse)
def start_trial(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_tenant_admin)):
    _assert_tenant_access(current_user, tenant_id)
    seed_default_plans(db)
    sub = create_trial_subscription(db, tenant_id)
    ensure_wallet(db, tenant_id, sub.currency)

    # Advance launch_status from draft to active.
    # Fleetbase org was already provisioned at signup — no need to re-provision.
    from app.models.tenant import Tenant, LaunchStatus
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant and tenant.launch_status == LaunchStatus.draft:
        tenant.launch_status = LaunchStatus.active
        db.commit()

    return SubscriptionResponse(tenant_id=str(sub.tenant_id), plan_code=sub.plan_code.value, status=sub.status.value, currency=sub.currency, started_at=sub.started_at.isoformat(), current_period_end=sub.current_period_end.isoformat(), trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None, read_only_reason=sub.read_only_reason)

@router.get('/subscriptions/{tenant_id}', response_model=SubscriptionResponse | None)
def get_subscription(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    _assert_tenant_access(current_user, tenant_id)
    sub = evaluate_subscription_state(db, tenant_id)
    if not sub:
        return None
    return SubscriptionResponse(tenant_id=str(sub.tenant_id), plan_code=sub.plan_code.value, status=sub.status.value, currency=sub.currency, started_at=sub.started_at.isoformat(), current_period_end=sub.current_period_end.isoformat(), trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None, read_only_reason=sub.read_only_reason)

@router.post('/subscriptions/{tenant_id}/cancel', response_model=SubscriptionResponse | None)
def post_cancel_subscription(tenant_id: str, reason: str = Body("Customer requested cancellation"), db: Session=Depends(get_db), current_user: User=Depends(require_tenant_admin)):
    _assert_tenant_access(current_user, tenant_id)
    sub = cancel_subscription(db, tenant_id, reason)
    if not sub:
        raise HTTPException(status_code=404, detail='Subscription not found')
    return SubscriptionResponse(tenant_id=str(sub.tenant_id), plan_code=sub.plan_code.value, status=sub.status.value, currency=sub.currency, started_at=sub.started_at.isoformat(), current_period_end=sub.current_period_end.isoformat(), trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None, read_only_reason=sub.read_only_reason)

@router.post('/subscriptions/{tenant_id}/pause', response_model=SubscriptionResponse | None)
def post_pause_subscription(tenant_id: str, reason: str = Body("Customer requested pause"), db: Session=Depends(get_db), current_user: User=Depends(require_tenant_admin)):
    _assert_tenant_access(current_user, tenant_id)
    sub = pause_subscription(db, tenant_id, reason)
    if not sub:
        raise HTTPException(status_code=404, detail='Subscription not found')
    return SubscriptionResponse(tenant_id=str(sub.tenant_id), plan_code=sub.plan_code.value, status=sub.status.value, currency=sub.currency, started_at=sub.started_at.isoformat(), current_period_end=sub.current_period_end.isoformat(), trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None, read_only_reason=sub.read_only_reason)

@router.post('/subscriptions/{tenant_id}/resume', response_model=SubscriptionResponse | None)
def post_resume_subscription(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_tenant_admin)):
    _assert_tenant_access(current_user, tenant_id)
    sub = resume_subscription(db, tenant_id)
    if not sub:
        raise HTTPException(status_code=404, detail='Subscription not found')
    return SubscriptionResponse(tenant_id=str(sub.tenant_id), plan_code=sub.plan_code.value, status=sub.status.value, currency=sub.currency, started_at=sub.started_at.isoformat(), current_period_end=sub.current_period_end.isoformat(), trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None, read_only_reason=sub.read_only_reason)

@router.get('/wallets/{tenant_id}', response_model=WalletResponse)
def get_wallet(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    _assert_tenant_access(current_user, tenant_id)
    wallet = ensure_wallet(db, tenant_id)
    return WalletResponse(tenant_id=str(wallet.tenant_id), currency=wallet.currency, balance_credits=wallet.balance_credits)


@router.get('/wallets/{tenant_id}/transactions', response_model=list[WalletTransactionResponse])
def list_wallet_transactions(
    tenant_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_tenant_access(current_user, tenant_id)
    rows = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.tenant_id == tenant_id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        WalletTransactionResponse(
            id=str(row.id),
            transaction_type=row.transaction_type.value,
            credits_delta=row.credits_delta,
            balance_after=row.balance_after,
            reference=row.reference,
            memo=row.memo,
            created_at=row.created_at.isoformat(),
        )
        for row in rows
    ]


@router.get('/usage-costs', response_model=list[UsageCreditCostResponse])
def get_usage_costs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    costs = get_feature_credit_costs()
    return [UsageCreditCostResponse(feature_key=k, credits=v) for k, v in sorted(costs.items())]

@router.post('/payments/init', response_model=PaymentInitResponse)
def init_payment(tenant_id: str | None = None, request: PaymentInitRequest=Body(...), db: Session=Depends(get_db), current_user: User=Depends(require_tenant_admin)):
    amount_minor = int(round(request.amount_major * 100))
    effective_tenant_id = request.tenant_id or str(current_user.tenant_id)
    if not effective_tenant_id:
        raise HTTPException(status_code=400, detail='tenant_id is required')
    payment = create_payment(db=db, tenant_id=effective_tenant_id, purpose=request.purpose, currency=request.currency, amount_minor=amount_minor)

    # Free trial with amount=0 — skip payment gateway entirely
    if request.plan_code == 'free_trial' and amount_minor == 0:
        payment = mark_payment_verified(db, payment, provider_payload={'status': 'success', 'data': {'status': 'success', 'reference': payment.reference, 'metadata': {'plan_code': 'free_trial', 'tenant_id': str(effective_tenant_id), 'purpose': request.purpose}}})
        # Auto-trigger subscription + provisioning
        # Use a fresh session to avoid transaction state issues from previous commits
        from app.services.auto_provisioning import handle_subscription_payment_success
        db.rollback()  # Ensure clean transaction before provisioning
        result = handle_subscription_payment_success(db, tenant_id=str(effective_tenant_id), plan_code='free_trial', currency=request.currency)
        if not result.get('launched'):
            import logging
            logging.getLogger('afruheritage.billing').warning('Auto-provisioning result: %s', result)
        return PaymentInitResponse(reference=payment.reference, authorization_url='', access_code='', status=payment.status.value)

    try:
        provider = (request.payment_provider or "paystack").lower()
        if provider == "flutterwave":
            payload = _flw.initialize_transaction(
                email=request.email,
                amount_major=request.amount_major,
                reference=payment.reference,
                currency=request.currency,
                callback_url=request.callback_url,
                metadata={'tenant_id': str(effective_tenant_id), 'purpose': request.purpose, 'plan_code': request.plan_code, 'credits_to_buy': request.credits_to_buy},
            )
        else:
            payload = initialize_transaction(email=request.email, amount_minor=amount_minor, reference=payment.reference, currency=request.currency, callback_url=request.callback_url, metadata={'tenant_id': str(effective_tenant_id), 'purpose': request.purpose, 'plan_code': request.plan_code, 'credits_to_buy': request.credits_to_buy})
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Payment gateway error: {exc}') from exc
    data = payload.get('data', {})
    payment = set_payment_initialized(db, payment, authorization_url=data.get('authorization_url'), access_code=data.get('access_code'), provider_payload=payload)
    return PaymentInitResponse(reference=payment.reference, authorization_url=payment.provider_authorization_url, access_code=payment.provider_access_code, status=payment.status.value)

@router.post('/payments/verify/{reference}', response_model=PaymentVerifyResponse)
def verify_payment(tenant_id: str | None = None, reference: str = '', db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.reference == reference).first()
    if not payment:
        raise HTTPException(status_code=404, detail='Payment not found')
    if not current_user.is_superuser and str(payment.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=403, detail='Tenant access denied')
    try:
        payload = verify_transaction(reference)
    except Exception:
        # Paystack can't find it yet — return current DB status so callback page
        # shows "pending" rather than a hard error
        return PaymentVerifyResponse(
            reference=payment.reference,
            status=payment.status.value,
            provider_status='pending',
            message='Payment not yet confirmed by payment provider. If you completed payment, please wait a moment and refresh.',
        )
    data = payload.get('data', {})
    status = data.get('status')
    if status == 'success':
        if payment.status != PaymentStatus.VERIFIED:
            payment = mark_payment_verified(db, payment, payload)
        metadata = data.get('metadata') or {}
        purpose = metadata.get('purpose') or payment.purpose
        tenant_id = metadata.get('tenant_id') or payment.tenant_id
        if purpose == 'subscription':
            plan_code = normalize_plan_code(metadata.get('plan_code') or 'professional').value
            activate_or_upgrade_subscription(db, tenant_id=tenant_id, plan_code=plan_code, currency=payment.currency)
            grant_subscription_allowance(db, tenant_id=tenant_id, plan_code=plan_code, currency=payment.currency, reference=reference)
            # Auto-approve and auto-launch tenant after successful subscription payment
            try:
                from app.services.auto_provisioning import handle_subscription_payment_success
                handle_subscription_payment_success(db, tenant_id=tenant_id, plan_code=plan_code, currency=payment.currency)
            except Exception as exc:
                import logging
                logging.getLogger('afruheritage.billing').warning('Auto-provisioning after payment failed: %s', exc)
        elif purpose == 'credit_topup':
            credits = int(metadata.get('credits_to_buy') or 0)
            if credits > 0:
                add_wallet_credits_once(db, tenant_id=tenant_id, credits=credits, tx_type=WalletTransactionType.CREDIT_PURCHASE, reference=reference, memo='Paystack credit purchase', currency=payment.currency)
        return PaymentVerifyResponse(reference=reference, status='verified', provider_status=status, message='Payment verified successfully')
    return PaymentVerifyResponse(reference=reference, status='failed', provider_status=status, message='Payment not successful')


@router.post('/payments/reinit/{reference}', response_model=PaymentInitResponse)
def reinit_payment(tenant_id: str | None = None, reference: str = '', request: PaymentReinitRequest=Body(...), db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.reference == reference).first()
    if not payment:
        raise HTTPException(status_code=404, detail='Payment not found')
    if not current_user.is_superuser and str(payment.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=403, detail='Tenant access denied')
    try:
        payload = initialize_transaction(
            email=request.email,
            amount_minor=payment.amount_minor,
            reference=payment.reference,
            currency=payment.currency,
            callback_url=request.callback_url,
            metadata={'tenant_id': str(payment.tenant_id), 'purpose': payment.purpose},
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Payment gateway error: {exc}') from exc
    data = payload.get('data', {})
    payment = set_payment_initialized(db, payment, authorization_url=data.get('authorization_url'), access_code=data.get('access_code'), provider_payload=payload)
    return PaymentInitResponse(reference=payment.reference, authorization_url=payment.provider_authorization_url, access_code=payment.provider_access_code, status=payment.status.value)

@router.post('/credits/consume', response_model=WalletResponse)
def consume_credits(tenant_id: str | None = None, request: CreditConsumeRequest = Body(...), db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    try:
        effective_tenant_id = current_user.tenant_id if not current_user.is_superuser else request.tenant_id
        wallet = consume_wallet_credits(db, tenant_id=effective_tenant_id, usage_type=request.usage_type, credits=request.credits, memo=request.memo)
    except ValueError as exc:
        raise HTTPException(status_code=402, detail=str(exc)) from exc
    return WalletResponse(tenant_id=str(wallet.tenant_id), currency=wallet.currency, balance_credits=wallet.balance_credits)

@router.post('/admin/read-only', response_model=SubscriptionResponse | None)
def admin_set_read_only(tenant_id: str, request: BillingAdminSetReadOnlyRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    sub = set_subscription_read_only(db, tenant_id=request.tenant_id, reason=request.reason, read_only=request.read_only)
    if not sub:
        return None
    return SubscriptionResponse(tenant_id=str(sub.tenant_id), plan_code=sub.plan_code.value, status=sub.status.value, currency=sub.currency, started_at=sub.started_at.isoformat(), current_period_end=sub.current_period_end.isoformat(), trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None, read_only_reason=sub.read_only_reason)

@router.post('/admin/credits/adjust', response_model=WalletResponse)
def admin_credits_adjust(tenant_id: str, request: BillingAdminAdjustCreditsRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    wallet = admin_adjust_credits(db, tenant_id=request.tenant_id, credits_delta=request.credits_delta, memo=request.memo)
    return WalletResponse(tenant_id=str(wallet.tenant_id), currency=wallet.currency, balance_credits=wallet.balance_credits)

@router.post('/admin/subscriptions/assign', response_model=SubscriptionResponse)
def admin_assign_plan(tenant_id: str, request: BillingAdminAssignPlanRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    sub = admin_assign_plan_service(db, tenant_id=request.tenant_id, plan_code=request.plan_code, currency=request.currency)
    return SubscriptionResponse(tenant_id=str(sub.tenant_id), plan_code=sub.plan_code.value, status=sub.status.value, currency=sub.currency, started_at=sub.started_at.isoformat(), current_period_end=sub.current_period_end.isoformat(), trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None, read_only_reason=sub.read_only_reason)
