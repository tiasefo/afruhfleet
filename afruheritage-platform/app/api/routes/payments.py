from __future__ import annotations
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.structured_logging import get_logger
from app.db.session import get_db
from app.models.billing import Payment as BillingPayment
from app.models.billing import PaymentStatus as BillingPaymentStatus
from app.models.billing import Wallet
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.payment import (
    CreditPurchaseRequest,
    CreditPurchaseResponse,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentStatusResponse,
    PaymentStatistics,
    WebhookResponse,
)
from app.services.paystack_client import verify_webhook_signature
from app.services.platform_payment_service import get_platform_payment_service

logger = get_logger("afruheritage.payments_api")

router = APIRouter(prefix="/payments", tags=["Platform Payments"])


def _billing_to_legacy_status(status: BillingPaymentStatus) -> str:
    if status == BillingPaymentStatus.PAID:
        return PaymentStatus.COMPLETED.value
    if status == BillingPaymentStatus.REFUNDED:
        return PaymentStatus.REFUNDED.value
    if status == BillingPaymentStatus.OVERDUE:
        return PaymentStatus.FAILED.value
    return PaymentStatus.PENDING.value


def _billing_is_pending(status: BillingPaymentStatus) -> bool:
    return status in {BillingPaymentStatus.UNPAID, BillingPaymentStatus.PARTIALLY_PAID}


def _status_response_from_billing(
    billing_payment: BillingPayment,
    legacy_payment: PaymentRecord | None,
) -> PaymentStatusResponse:
    amount = float(billing_payment.amount_minor) / 100.0
    platform_fee = float(legacy_payment.platform_fee) if legacy_payment else round(amount * 0.015, 2)
    tenant_amount = float(legacy_payment.tenant_amount) if legacy_payment else round(amount - platform_fee, 2)
    paid_amount = float(legacy_payment.paid_amount) if legacy_payment else (amount if billing_payment.status == BillingPaymentStatus.PAID else 0.0)
    completed_at = legacy_payment.completed_at if legacy_payment else (billing_payment.updated_at if billing_payment.status == BillingPaymentStatus.PAID else None)
    failed_at = legacy_payment.failed_at if legacy_payment else (billing_payment.updated_at if billing_payment.status == BillingPaymentStatus.OVERDUE else None)
    failure_reason = legacy_payment.failure_reason if legacy_payment else ("Payment not completed" if billing_payment.status == BillingPaymentStatus.OVERDUE else None)

    return PaymentStatusResponse(
        payment_id=str(billing_payment.id),
        payment_reference=billing_payment.reference,
        status=_billing_to_legacy_status(billing_payment.status),
        amount=amount,
        platform_fee=platform_fee,
        tenant_amount=tenant_amount,
        paid_amount=paid_amount,
        created_at=billing_payment.created_at,
        completed_at=completed_at,
        failed_at=failed_at,
        failure_reason=failure_reason,
    )


@router.post("/initiate", response_model=PaymentInitiateResponse)
async def initiate_payment(
    payment_request: PaymentInitiateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Initiate payment through platform gateway"""
    try:
        # Get platform payment service for tenant
        payment_service = get_platform_payment_service(str(current_user.tenant_id))
        
        # Prepare customer info
        customer_info = {
            "email": payment_request.customer_email,
            "phone": payment_request.customer_phone,
            "name": payment_request.customer_name,
            "provider": payment_request.mobile_provider
        }
        
        # Initiate payment
        result = await payment_service.initiate_payment(
            db=db,
            amount=payment_request.amount,
            payment_method=payment_request.payment_method,
            customer_info=customer_info,
            description=payment_request.description,
            metadata=payment_request.metadata
        )
        
        logger.info("Payment initiated", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "payment_reference": result["payment_reference"],
            "amount": result["amount"],
            "payment_method": payment_request.payment_method
        })
        
        return PaymentInitiateResponse(**result)
        
    except Exception as e:
        logger.error("Failed to initiate payment", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "amount": payment_request.amount,
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate payment: {str(e)}"
        )


@router.get("/status/{payment_reference}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_reference: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get payment status"""
    try:
        # Canonical source: billing ledger
        billing_payment = db.query(BillingPayment).filter(
            BillingPayment.reference == payment_reference,
            BillingPayment.tenant_id == current_user.tenant_id,
        ).first()

        # Compatibility source: legacy platform payment record
        legacy_payment = db.query(PaymentRecord).filter(
            PaymentRecord.payment_reference == payment_reference,
            PaymentRecord.tenant_id == current_user.tenant_id,
        ).first()

        if billing_payment:
            # If canonical says unpaid and legacy is pending, run provider verification then re-sync.
            if legacy_payment and _billing_is_pending(billing_payment.status) and legacy_payment.status == PaymentStatus.PENDING:
                payment_service = get_platform_payment_service(str(current_user.tenant_id))
                verification = await payment_service.verify_payment(legacy_payment)

                if verification["verified"]:
                    legacy_payment.status = PaymentStatus.COMPLETED
                    legacy_payment.completed_at = datetime.utcnow()
                    legacy_payment.paid_amount = verification["amount"]
                    db.commit()
                    payment_service.sync_billing_payment_from_record(
                        db,
                        legacy_payment,
                        provider_payload={"verification": verification},
                    )
                    db.refresh(billing_payment)

            return _status_response_from_billing(billing_payment, legacy_payment)

        if not legacy_payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        # Legacy fallback path
        if legacy_payment.status == PaymentStatus.PENDING:
            payment_service = get_platform_payment_service(str(current_user.tenant_id))
            verification = await payment_service.verify_payment(legacy_payment)

            if verification["verified"]:
                legacy_payment.status = PaymentStatus.COMPLETED
                legacy_payment.completed_at = datetime.utcnow()
                legacy_payment.paid_amount = verification["amount"]
                db.commit()
                payment_service.sync_billing_payment_from_record(
                    db,
                    legacy_payment,
                    provider_payload={"verification": verification},
                )

        return PaymentStatusResponse(
            payment_id=str(legacy_payment.id),
            payment_reference=legacy_payment.payment_reference,
            status=legacy_payment.status.value,
            amount=float(legacy_payment.amount),
            platform_fee=float(legacy_payment.platform_fee),
            tenant_amount=float(legacy_payment.tenant_amount),
            paid_amount=float(legacy_payment.paid_amount),
            created_at=legacy_payment.created_at,
            completed_at=legacy_payment.completed_at,
            failed_at=legacy_payment.failed_at,
            failure_reason=legacy_payment.failure_reason,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get payment status", extra={
            "user_id": str(current_user.id),
            "payment_reference": payment_reference,
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get payment status: {str(e)}"
        )


@router.post("/webhook/paystack")
async def paystack_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle Paystack webhook notifications"""
    try:
        raw_body = await request.body()
        signature = request.headers.get("x-paystack-signature")
        if not verify_webhook_signature(raw_body, signature):
            logger.warning("Invalid Paystack webhook signature")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        webhook_data = await request.json()
        
        # Extract tenant_id from metadata
        event_data = webhook_data.get("data", {})
        metadata = event_data.get("metadata", {})
        tenant_id = metadata.get("tenant_id")
        
        if not tenant_id:
            logger.warning("Webhook missing tenant_id", extra={
                "event": webhook_data.get("event"),
                "reference": event_data.get("reference")
            })
            return {"status": "error", "message": "Missing tenant_id"}
        
        # Process webhook
        payment_service = get_platform_payment_service(tenant_id)
        result = await payment_service.handle_paystack_webhook(webhook_data, db)
        
        logger.info("Webhook processed", extra={
            "event": webhook_data.get("event"),
            "reference": event_data.get("reference"),
            "result": result
        })
        
        return WebhookResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Webhook processing failed", extra={
            "error": str(e)
        })
        return WebhookResponse(
            status="error",
            reason=str(e)
        )


@router.post("/webhook/paypal")
async def paypal_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle PayPal webhook notifications"""
    try:
        webhook_data = await request.json()

        resource = webhook_data.get("resource") or {}
        custom_id = None
        if isinstance(resource, dict):
            custom_id = resource.get("custom_id")
            if not custom_id:
                supp = resource.get("supplementary_data") or {}
                related = supp.get("related_ids") or {}
                custom_id = related.get("order_id")

        if custom_id and isinstance(custom_id, str) and custom_id.startswith("PM_"):
            tenant_hint = custom_id.split("_")[1] if len(custom_id.split("_")) > 1 else None
            payment_service = get_platform_payment_service(tenant_hint or "")
        else:
            payment_service = get_platform_payment_service("")

        result = await payment_service.handle_paypal_webhook(webhook_data, db)
        logger.info("PayPal webhook processed", extra={"event": webhook_data.get("event_type"), "result": result})
        return WebhookResponse(**result)
    except Exception as e:
        logger.error("PayPal webhook processing failed", extra={"error": str(e)})
        return WebhookResponse(status="error", reason=str(e))


@router.get("/statistics", response_model=PaymentStatistics)
async def get_payment_statistics(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get payment statistics for tenant"""
    try:
        billing_payments = db.query(BillingPayment).filter(
            BillingPayment.tenant_id == current_user.tenant_id,
        )
        if start_date:
            billing_payments = billing_payments.filter(BillingPayment.created_at >= start_date)
        if end_date:
            billing_payments = billing_payments.filter(BillingPayment.created_at <= end_date)

        rows = billing_payments.all()
        if rows:
            completed = [p for p in rows if p.status == BillingPaymentStatus.PAID]
            total_revenue = sum(float(p.amount_minor) / 100.0 for p in completed)
            total_platform_fees = sum(round((float(p.amount_minor) / 100.0) * 0.015, 2) for p in completed)
            total_tenant_earnings = round(total_revenue - total_platform_fees, 2)
            success_rate = (len(completed) / len(rows) * 100) if rows else 0
            return PaymentStatistics(
                total_payments=len(rows),
                completed_payments=len(completed),
                total_revenue=round(total_revenue, 2),
                total_platform_fees=round(total_platform_fees, 2),
                total_tenant_earnings=total_tenant_earnings,
                success_rate=success_rate,
            )

        # Fallback to legacy stats when canonical rows are absent.
        payment_service = get_platform_payment_service(str(current_user.tenant_id))
        stats = payment_service.get_payment_statistics(db, start_date, end_date)

        return PaymentStatistics(**stats)
        
    except Exception as e:
        logger.error("Failed to get payment statistics", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get payment statistics: {str(e)}"
        )


@router.post("/credits/purchase", response_model=CreditPurchaseResponse)
async def purchase_credits(
    purchase_request: CreditPurchaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Purchase virtual credits"""
    try:
        payment_service = get_platform_payment_service(str(current_user.tenant_id))
        credits_to_buy = int(round(purchase_request.amount))
        
        customer_info = {
            "email": purchase_request.customer_email,
            "phone": purchase_request.customer_phone,
            "provider": purchase_request.mobile_provider
        }
        
        # Initiate payment for credits
        payment_result = await payment_service.initiate_payment(
            db=db,
            amount=purchase_request.amount,
            payment_method=purchase_request.payment_method,
            customer_info=customer_info,
            description="Virtual Credit Purchase",
            metadata={
                "purpose": "credit_topup",
                "type": "credit_purchase",
                "credits_to_buy": credits_to_buy,
                "currency": "GHS",
                "user_id": str(current_user.id),
            },
        )
        purchase_id = payment_result["payment_reference"]
        
        logger.info("Credit purchase initiated", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "amount": purchase_request.amount,
            "purchase_id": purchase_id
        })
        
        return CreditPurchaseResponse(
            purchase_id=purchase_id,
            amount_paid=purchase_request.amount,
            credits_to_receive=float(credits_to_buy),
            payment_url=payment_result["authorization_url"],
            status="pending",
        )
        
    except Exception as e:
        logger.error("Failed to purchase credits", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "amount": purchase_request.amount,
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to purchase credits: {str(e)}"
        )


@router.get("/methods")
async def get_payment_methods(
    current_user: User = Depends(get_current_user),
):
    """Get available payment methods"""
    try:
        # Return available payment methods based on tenant location/currency
        methods = [
            {
                "method": "mobile_money",
                "name": "Mobile Money",
                "providers": ["mtn", "airteltigo", "vodafone"],
                "currency": "GHS",
                "available": True
            },
            {
                "method": "paypal",
                "name": "PayPal",
                "providers": ["paypal"],
                "currency": "USD",
                "available": True
            }
        ]
        
        alipay_ready = bool(settings.alipay_app_id) and bool(settings.alipay_private_key)
        wechat_ready = bool(settings.wechat_app_id) and bool(settings.wechat_mch_id) and bool(settings.wechat_api_key)

        methods.extend([
            {
                "method": "alipay",
                "name": "AliPay",
                "providers": ["alipay"],
                "currency": "CNY",
                "available": alipay_ready
            },
            {
                "method": "wechat_pay",
                "name": "WeChat Pay",
                "providers": ["wechat"],
                "currency": "CNY",
                "available": wechat_ready
            }
        ])
        
        return {"methods": methods}
        
    except Exception as e:
        logger.error("Failed to get payment methods", extra={
            "user_id": str(current_user.id),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get payment methods: {str(e)}"
        )


@router.get("/balance")
async def get_account_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get tenant account balance"""
    try:
        wallet = db.query(Wallet).filter(Wallet.tenant_id == current_user.tenant_id).first()
        if wallet is not None:
            return {
                "tenant_id": str(current_user.tenant_id),
                "balance": float(wallet.balance_credits),
                "currency": wallet.currency,
                "last_updated": wallet.updated_at,
            }

        # Legacy fallback for pre-migration tenants without billing wallet.
        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
        balance = getattr(tenant, "wallet_balance", 0.0) if tenant else 0.0

        return {
            "tenant_id": str(current_user.tenant_id),
            "balance": float(balance),
            "currency": "GHS",
            "last_updated": datetime.utcnow(),
        }
        
    except Exception as e:
        logger.error("Failed to get account balance", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get account balance: {str(e)}"
        )
