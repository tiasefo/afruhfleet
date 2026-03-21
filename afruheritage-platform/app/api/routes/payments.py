from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.structured_logging import get_logger
from app.db.session import get_db
from app.models.payment import PaymentRecord, PaymentStatus
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
from app.services.platform_payment_service import get_platform_payment_service

logger = get_logger("afruheritage.payments_api")

router = APIRouter(prefix="/payments", tags=["Platform Payments"])


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
        # Find payment record
        payment = db.query(PaymentRecord).filter(
            PaymentRecord.payment_reference == payment_reference,
            PaymentRecord.tenant_id == current_user.tenant_id
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Verify with Paystack if still pending
        if payment.status == PaymentStatus.PENDING:
            payment_service = get_platform_payment_service(str(current_user.tenant_id))
            verification = await payment_service.verify_payment(payment_reference)
            
            if verification["verified"]:
                payment.status = PaymentStatus.COMPLETED
                payment.completed_at = datetime.utcnow()
                payment.paid_amount = verification["amount"]
                db.commit()
        
        return PaymentStatusResponse(
            payment_id=str(payment.id),
            payment_reference=payment.payment_reference,
            status=payment.status.value,
            amount=float(payment.amount),
            platform_fee=float(payment.platform_fee),
            tenant_amount=float(payment.tenant_amount),
            paid_amount=float(payment.paid_amount),
            created_at=payment.created_at,
            completed_at=payment.completed_at,
            failed_at=payment.failed_at,
            failure_reason=payment.failure_reason
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
        # Get webhook data
        import json
        webhook_data = await request.json()
        
        # Verify webhook signature (optional but recommended)
        # TODO: Implement signature verification
        
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
        
    except Exception as e:
        logger.error("Webhook processing failed", extra={
            "error": str(e)
        })
        return WebhookResponse(
            status="error",
            reason=str(e)
        )


@router.get("/statistics", response_model=PaymentStatistics)
async def get_payment_statistics(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get payment statistics for tenant"""
    try:
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
        # For now, this is a placeholder - we'll implement the full virtual credit system next
        payment_service = get_platform_payment_service(str(current_user.tenant_id))
        
        customer_info = {
            "email": purchase_request.customer_email,
            "phone": purchase_request.customer_phone,
            "provider": purchase_request.mobile_provider
        }
        
        # Initiate payment for credits
        payment_result = await payment_service.initiate_payment(
            amount=purchase_request.amount,
            payment_method=purchase_request.payment_method,
            customer_info=customer_info,
            description="Virtual Credit Purchase",
            metadata={"type": "credit_purchase", "user_id": str(current_user.id)}
        )
        
        # Create credit purchase record (placeholder)
        purchase_id = f"CP_{current_user.id.hex[:8]}_{uuid.uuid4().hex[:8].upper()}"
        
        logger.info("Credit purchase initiated", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "amount": purchase_request.amount,
            "purchase_id": purchase_id
        })
        
        return CreditPurchaseResponse(
            purchase_id=purchase_id,
            amount_paid=purchase_request.amount,
            credits_to_receive=purchase_request.amount,  # 1:1 ratio
            payment_url=payment_result["authorization_url"],
            status="pending"
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
            }
        ]
        
        # Add China payment methods if tenant supports China
        # TODO: Check tenant configuration for China support
        if True:  # Placeholder - check tenant config
            methods.extend([
                {
                    "method": "alipay",
                    "name": "AliPay",
                    "providers": ["alipay"],
                    "currency": "CNY",
                    "available": False  # Will be available in Phase 2
                },
                {
                    "method": "wechat_pay",
                    "name": "WeChat Pay",
                    "providers": ["wechat"],
                    "currency": "CNY",
                    "available": False  # Will be available in Phase 2
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
        # Get tenant wallet balance
        from app.models.tenant import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
        
        balance = getattr(tenant, 'wallet_balance', 0.0)
        
        return {
            "tenant_id": str(current_user.tenant_id),
            "balance": float(balance),
            "currency": "GHS",
            "last_updated": datetime.utcnow()
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
