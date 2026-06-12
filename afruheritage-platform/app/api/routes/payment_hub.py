from __future__ import annotations

import json
import os
import uuid

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.payment_hub import PaymentTransaction
from app.models.saas_subscription import TenantSubscription

router = APIRouter(prefix="/payment-hub", tags=["Payment Hub"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY") or os.getenv("PAYSTACK_SECRET") or os.getenv("PAYSTACK_API_KEY")
PAYSTACK_BASE_URL = "https://api.paystack.co"



def activate_subscription_after_payment(db, tx, raw_data=None):
    from app.models.saas_subscription import SaaSPlan, TenantSubscription
    from app.models.commercial_orchestration import CommercialSignup
    import json as _json

    plan_code = tx.plan_code or "business"

    try:
        addons = _json.loads(tx.addons_json or "[]")
    except Exception:
        addons = []

    plan = db.query(SaaSPlan).filter(SaaSPlan.code == plan_code).first()
    included_credits = plan.included_credits if plan else 0

    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tx.tenant_id).first()

    if not sub:
        sub = TenantSubscription(
            tenant_id=tx.tenant_id,
            plan_code=plan_code,
            status="active",
            trial=False,
            selected_addons_json=_json.dumps(addons),
            credits_balance=included_credits,
        )
    else:
        sub.plan_code = plan_code
        sub.status = "active"
        sub.trial = False
        sub.selected_addons_json = _json.dumps(addons)
        sub.credits_balance += included_credits

    db.add(sub)

    signup = db.query(CommercialSignup).filter(CommercialSignup.id == tx.tenant_id).first()
    if signup:
        signup.payment_completed = True
        signup.tenant_id = tx.tenant_id
        signup.subscription_id = tx.reference
        signup.provisioning_status = "subscription_active_runtime_pending"
        db.add(signup)

        try:
            from app.models.tenant import Tenant, LaunchStatus, DomainType
            from app.services.fleetbase_runtime_service import (
                pick_runner,
                create_runtime_request,
                run_install,
            )

            tenant = db.query(Tenant).filter(Tenant.slug == tx.tenant_id).first()

            if not tenant:
                tenant = Tenant(
                    company_name=signup.email.split("@")[0],
                    slug=tx.tenant_id,
                    contact_email=signup.email,
                    plan_code=plan_code,
                    requested_domain=f"{tx.tenant_id}.afruheritage.com",
                    domain_type=DomainType.provider_subdomain,
                    launch_status=LaunchStatus.queued,
                )
                db.add(tenant)
                db.commit()
                db.refresh(tenant)

            runner = pick_runner(db)

            # Do not assign FleetbaseRunnerNode.id to Tenant.runner_id.
            # Tenant.runner_id references legacy runner_nodes.id, while runtime.runner_id
            # correctly references fleetbase_runner_nodes.id.
            tenant.launch_status = LaunchStatus.provisioning
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

            runtime = create_runtime_request(
                db,
                tenant_id=str(tenant.id),
                tenant_slug=tenant.slug,
                runner=runner,
                is_reference_install=False,
            )

            runtime = run_install(db, runtime, runner)

            if runtime.status.value == "active":
                tenant.launch_status = LaunchStatus.active
                signup.runtime_provisioned = True
                signup.provisioning_status = "runtime_active"
            else:
                tenant.launch_status = LaunchStatus.failed
                signup.provisioning_status = "runtime_failed"

            db.add(tenant)
            db.add(signup)
            db.commit()

        except Exception as provision_error:
            db.rollback()
            try:
                signup = db.query(CommercialSignup).filter(CommercialSignup.id == tx.tenant_id).first()
                if signup:
                    signup.payment_completed = True
                    signup.tenant_id = tx.tenant_id
                    signup.subscription_id = tx.reference
                    signup.provisioning_status = f"runtime_error:{str(provision_error)[:200]}"
                    db.add(signup)
                    db.commit()
            except Exception:
                db.rollback()

    return sub


class InitializePaymentRequest(BaseModel):
    tenant_id: str
    email: EmailStr
    amount: float
    currency: str = "GHS"
    purpose: str = "credit_topup"  # credit_topup | subscription
    provider: str = "paystack"
    callback_url: str | None = None
    plan_code: str | None = None
    addons: list[str] = []


@router.post("/initialize")
def initialize_payment(payload: InitializePaymentRequest):
    if payload.provider != "paystack":
        raise HTTPException(status_code=400, detail="only_paystack_provider_is_enabled_currently")

    if not PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="PAYSTACK_SECRET_KEY_missing_in_environment")

    db = SessionLocal()
    try:
        reference = f"afr_{uuid.uuid4().hex[:16]}"

        amount_minor_unit = int(round(payload.amount * 100))

        body = {
            "email": payload.email,
            "amount": amount_minor_unit,
            "currency": payload.currency,
            "reference": reference,
            "metadata": {
                "tenant_id": payload.tenant_id,
                "purpose": payload.purpose,
                "platform": "afruheritage",
                "plan_code": payload.plan_code,
                "addons": payload.addons,
            },
        }

        if payload.callback_url:
            body["callback_url"] = payload.callback_url

        response = requests.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=30,
        )

        try:
            data = response.json()
        except Exception:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "paystack_non_json_response",
                    "status_code": response.status_code,
                    "body": response.text[:500],
                },
            )

        if response.status_code >= 400 or not data.get("status"):
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "paystack_initialize_failed",
                    "status_code": response.status_code,
                    "response": data,
                },
            )

        checkout_url = data["data"]["authorization_url"]
        provider_reference = data["data"].get("reference", reference)

        tx = PaymentTransaction(
            tenant_id=payload.tenant_id,
            purpose=payload.purpose,
            provider="paystack",
            amount=payload.amount,
            currency=payload.currency,
            reference=reference,
            provider_reference=provider_reference,
            checkout_url=checkout_url,
            status="initialized",
            raw_response_json=json.dumps(data),
            plan_code=payload.plan_code,
            addons_json=json.dumps(payload.addons),
        )

        db.add(tx)
        db.commit()
        db.refresh(tx)

        return {
            "transaction_id": str(tx.id),
            "tenant_id": tx.tenant_id,
            "provider": tx.provider,
            "purpose": tx.purpose,
            "amount": tx.amount,
            "currency": tx.currency,
            "status": tx.status,
            "reference": tx.reference,
            "provider_reference": tx.provider_reference,
            "checkout_url": tx.checkout_url,
        }
    finally:
        db.close()


@router.get("/verify/{reference}")
def verify_payment(reference: str):
    if not PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="PAYSTACK_SECRET_KEY_missing_in_environment")

    db = SessionLocal()
    try:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.reference == reference).first()

        # Fallback: check the billing Payment table (used by /billing/payments/init flow)
        if not tx:
            from app.models.billing import Payment as BillingPayment
            bp = db.query(BillingPayment).filter(BillingPayment.reference == reference).first()
            if bp:
                # Verify with Paystack and return in a compatible format
                try:
                    response = requests.get(
                        f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                        headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                        timeout=30,
                    )
                    ps_data = response.json().get("data", {})
                    ps_status = ps_data.get("status", "")
                except Exception:
                    ps_status = ""
                return {
                    "reference": bp.reference,
                    "provider_reference": None,
                    "status": ps_status if ps_status else bp.status.value,
                    "tenant_id": str(bp.tenant_id),
                    "purpose": bp.purpose,
                    "amount": bp.amount_minor / 100 if bp.amount_minor else 0,
                    "currency": bp.currency,
                    "paystack_status": ps_status,
                }
            raise HTTPException(status_code=404, detail="transaction_not_found")

        response = requests.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
            timeout=30,
        )

        data = response.json()

        paystack_status = data.get("data", {}).get("status")

        if data.get("status") and paystack_status == "success":
            tx.status = "success"

            if tx.purpose == "credit_topup":
                sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tx.tenant_id).first()
                if sub:
                    sub.credits_balance += int(tx.amount)
                    db.add(sub)

            if tx.purpose == "subscription":
                activate_subscription_after_payment(db, tx)

            if tx.purpose == "subscription":
                activate_subscription_after_payment(db, tx)

        elif paystack_status:
            tx.status = paystack_status
        else:
            tx.status = "verify_failed"

        tx.raw_response_json = json.dumps(data)
        db.add(tx)
        db.commit()
        db.refresh(tx)

        return {
            "reference": tx.reference,
            "provider_reference": tx.provider_reference,
            "status": tx.status,
            "tenant_id": tx.tenant_id,
            "purpose": tx.purpose,
            "amount": tx.amount,
            "currency": tx.currency,
            "paystack_status": paystack_status,
        }
    finally:
        db.close()


@router.get("/transactions/{tenant_id}")
def list_transactions(tenant_id: str):
    db = SessionLocal()
    try:
        rows = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.tenant_id == tenant_id)
            .order_by(PaymentTransaction.created_at.desc())
            .limit(100)
            .all()
        )

        return {
            "tenant_id": tenant_id,
            "transactions": [
                {
                    "transaction_id": str(x.id),
                    "purpose": x.purpose,
                    "provider": x.provider,
                    "amount": x.amount,
                    "currency": x.currency,
                    "status": x.status,
                    "reference": x.reference,
                    "provider_reference": x.provider_reference,
                    "checkout_url": x.checkout_url,
                    "created_at": x.created_at.isoformat(),
                }
                for x in rows
            ],
        }
    finally:
        db.close()

import hmac
import hashlib
from fastapi import Request

PAYSTACK_WEBHOOK_SECRET = os.getenv("PAYSTACK_WEBHOOK_SECRET") or PAYSTACK_SECRET_KEY


@router.post("/webhook/paystack")
async def paystack_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature")

    if not PAYSTACK_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="PAYSTACK_WEBHOOK_SECRET_missing")

    expected_signature = hmac.new(
        PAYSTACK_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()

    if not signature or not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=401, detail="invalid_paystack_signature")

    event = await request.json()
    event_type = event.get("event")
    data = event.get("data", {})
    reference = data.get("reference")
    status = data.get("status")

    if not reference:
        return {"status": "ignored", "reason": "missing_reference"}

    db = SessionLocal()
    try:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.reference == reference).first()
        if not tx:
            return {"status": "ignored", "reason": "transaction_not_found", "reference": reference}

        tx.raw_response_json = json.dumps(event)

        if event_type == "charge.success" and status == "success":
            if tx.status == "success":
                return {
                    "status": "already_processed",
                    "event": event_type,
                    "reference": reference,
                    "transaction_status": tx.status,
                }

            tx.status = "success"

            if tx.purpose == "credit_topup":
                sub = (
                    db.query(TenantSubscription)
                    .filter(TenantSubscription.tenant_id == tx.tenant_id)
                    .first()
                )
                if sub:
                    sub.credits_balance += int(tx.amount)
                    db.add(sub)

            if tx.purpose == "subscription":
                activate_subscription_after_payment(db, tx)

            if tx.purpose == "subscription":
                activate_subscription_after_payment(db, tx)

        elif status:
            tx.status = status

        db.add(tx)
        db.commit()

        return {
            "status": "processed",
            "event": event_type,
            "reference": reference,
            "transaction_status": tx.status,
        }
    finally:
        db.close()


@router.get("/receipt/{reference}")
def payment_receipt(reference: str):
    db = SessionLocal()
    try:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.reference == reference).first()
        if tx:
            return {
                "receipt": {
                    "reference": tx.reference,
                    "provider_reference": tx.provider_reference,
                    "tenant_id": tx.tenant_id,
                    "provider": tx.provider,
                    "purpose": tx.purpose,
                    "amount": tx.amount,
                    "currency": tx.currency,
                    "status": tx.status,
                    "checkout_url": tx.checkout_url,
                    "created_at": tx.created_at.isoformat(),
                    "paid": tx.status == "success",
                },
                "message": "Payment receipt generated successfully" if tx.status == "success" else "Payment is not completed yet",
            }

        # Fallback: billing/payments/init flow stores records in the billing Payment table
        from app.models.billing import Payment as BillingPayment
        bp = db.query(BillingPayment).filter(BillingPayment.reference == reference).first()
        if bp:
            paid = bp.status.value in ("paid", "verified", "completed")
            return {
                "receipt": {
                    "reference": bp.reference,
                    "provider_reference": None,
                    "tenant_id": str(bp.tenant_id),
                    "provider": "paystack",
                    "purpose": bp.purpose,
                    "amount": float(bp.amount_minor) / 100 if bp.amount_minor else 0,
                    "currency": bp.currency,
                    "status": bp.status.value,
                    "checkout_url": None,
                    "created_at": bp.created_at.isoformat(),
                    "paid": paid,
                },
                "message": "Payment receipt generated successfully" if paid else "Payment received and being processed",
            }

        raise HTTPException(status_code=404, detail="transaction_not_found")
    finally:
        db.close()
