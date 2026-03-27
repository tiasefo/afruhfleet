from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.structured_logging import get_logger
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.user import User
from app.models.tenant import Tenant

logger = get_logger("afruheritage.platform_payments")


class PlatformPaymentService:
    """Platform payment processing service with 1.5% fee"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.platform_fee_rate = 0.015  # 1.5% platform fee
        # No SDK client needed; use paystack_client.py functions
    
    async def initiate_payment(
        self,
        amount: float,
        payment_method: str,
        customer_info: dict[str, Any],
        description: str | None = None,
        metadata: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Initiate payment through platform gateway"""
        
        try:
            # Calculate fees
            platform_fee = amount * self.platform_fee_rate
            tenant_amount = amount - platform_fee
            
            # Generate unique reference
            payment_reference = f"PM_{self.tenant_id[:8]}_{uuid.uuid4().hex[:8].upper()}"
            
            # Create payment record
            payment = PaymentRecord(
                tenant_id=self.tenant_id,
                amount=amount,
                platform_fee=platform_fee,
                tenant_amount=tenant_amount,
                payment_method=payment_method,
                payment_reference=payment_reference,
                status=PaymentStatus.PENDING,
                customer_email=customer_info.get("email"),
                customer_phone=customer_info.get("phone"),
                description=description,
                additional_data=metadata or {}
            )
            
            # Initialize Paystack transaction
            if payment_method == "mobile_money":
                from app.services.paystack_client import initialize_transaction
                paystack_data = {
                    "email": customer_info["email"],
                    "amount_minor": int(amount * 100),  # Convert to pesewas
                    "reference": payment_reference,
                    "currency": "GHS",
                    "callback_url": f"{settings.base_url}/api/v1/payments/webhook/paystack",
                    "metadata": {
                        "tenant_id": self.tenant_id,
                        "platform_fee": float(platform_fee),
                        "tenant_amount": float(tenant_amount),
                        "customization": "platform_payment",
                        **(metadata or {})
                    }
                }
                result = initialize_transaction(**paystack_data)
                if result["status"]:
                    payment.authorization_url = result["data"]["authorization_url"]
                    payment.paystack_reference = result["data"]["reference"]
                    logger.info("Payment initialized successfully", extra={
                        "payment_reference": payment_reference,
                        "amount": amount,
                        "platform_fee": platform_fee,
                        "tenant_amount": tenant_amount
                    })
                    return {
                        "payment_id": str(payment.id),
                        "payment_reference": payment_reference,
                        "authorization_url": result["data"]["authorization_url"],
                        "amount": float(amount),
                        "platform_fee": float(platform_fee),
                        "tenant_amount": float(tenant_amount),
                        "payment_method": payment_method,
                        "status": "pending",
                        "expires_at": result["data"].get("expires_at")
                    }
                else:
                    logger.error("Paystack initialization failed", extra={
                        "payment_reference": payment_reference,
                        "error": result.get("message", "Unknown error")
                    })
                    raise Exception(f"Payment initialization failed: {result.get('message', 'Unknown error')}")
            else:
                logger.error("Paystack is not available. Cannot initiate payment.")
                raise RuntimeError("Paystack is not available. Payment cannot be processed.")
        
        except Exception as e:
            logger.error("Failed to initiate payment", extra={
                "tenant_id": self.tenant_id,
                "amount": amount,
                "payment_method": payment_method,
                "error": str(e)
            })
            raise
    
    async def verify_payment(self, payment_reference: str) -> dict[str, Any]:
        """Verify payment status with Paystack"""
        try:
            from app.services.paystack_client import verify_transaction
            result = verify_transaction(payment_reference)
            if result["status"] and result["data"]["status"] == "success":
                return {
                    "verified": True,
                    "status": "success",
                    "amount": result["data"]["amount"] / 100,  # Convert from pesewas
                    "paid_at": result["data"]["paid_at"],
                    "reference": result["data"]["reference"]
                }
            else:
                return {
                    "verified": False,
                    "status": result["data"]["status"] if result["data"] else "unknown",
                    "reference": payment_reference
                }
        except Exception as e:
            logger.error("Payment verification failed", extra={
                "payment_reference": payment_reference,
                "error": str(e)
            })
            return {
                "verified": False,
                "status": "verification_failed",
                "reference": payment_reference,
                "error": str(e)
            }
    
    async def handle_paystack_webhook(self, webhook_data: dict[str, Any], db: Session) -> dict[str, Any]:
        """Handle Paystack webhook for payment completion"""
        try:
            event = webhook_data.get("event", "")
            data = webhook_data.get("data", {})
            
            if event == "charge.success":
                reference = data.get("reference", "")
                amount = data.get("amount", 0) / 100  # Convert from pesewas
                
                # Find payment record
                payment = db.query(PaymentRecord).filter(
                    PaymentRecord.paystack_reference == reference
                ).first()
                
                if payment:
                    # Update payment status
                    payment.status = PaymentStatus.COMPLETED
                    payment.completed_at = datetime.utcnow()
                    payment.paid_amount = amount
                    
                    # Credit tenant account (minus platform fee)
                    await self._credit_tenant_account(db, payment.tenant_amount)
                    
                    # Send notifications
                    await self._send_payment_notifications(db, payment)
                    
                    logger.info("Payment completed successfully", extra={
                        "payment_reference": reference,
                        "amount": amount,
                        "platform_fee": float(payment.platform_fee),
                        "tenant_amount": float(payment.tenant_amount)
                    })
                    
                    return {
                        "status": "processed",
                        "payment_id": str(payment.id),
                        "amount": amount,
                        "platform_fee": float(payment.platform_fee)
                    }
            
            elif event == "charge.failed":
                reference = data.get("reference", "")
                
                # Update payment status
                payment = db.query(PaymentRecord).filter(
                    PaymentRecord.paystack_reference == reference
                ).first()
                
                if payment:
                    payment.status = PaymentStatus.FAILED
                    payment.failed_at = datetime.utcnow()
                    payment.failure_reason = data.get("message", "Payment failed")
                    
                    logger.warning("Payment failed", extra={
                        "payment_reference": reference,
                        "reason": payment.failure_reason
                    })
                    
                    return {
                        "status": "failed",
                        "payment_id": str(payment.id),
                        "reason": payment.failure_reason
                    }
            
            return {"status": "ignored", "event": event}
        
        except Exception as e:
            logger.error("Webhook processing failed", extra={
                "event": webhook_data.get("event"),
                "error": str(e)
            })
            raise
    
    async def _credit_tenant_account(self, db: Session, amount: float):
        """Credit tenant account with payment amount (minus platform fee)"""
        try:
            tenant = db.query(Tenant).filter(Tenant.id == self.tenant_id).first()
            if tenant:
                # Update tenant wallet balance
                if hasattr(tenant, 'wallet_balance'):
                    tenant.wallet_balance += amount
                else:
                    # Create wallet balance if it doesn't exist
                    tenant.wallet_balance = amount
                
                db.commit()
                
                logger.info("Tenant account credited", extra={
                    "tenant_id": self.tenant_id,
                    "amount": amount
                })
        
        except Exception as e:
            logger.error("Failed to credit tenant account", extra={
                "tenant_id": self.tenant_id,
                "amount": amount,
                "error": str(e)
            })
    
    async def _send_payment_notifications(self, db: Session, payment: PaymentRecord):
        """Send payment notifications"""
        try:
            # Get tenant info
            tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
            
            if tenant:
                # Send notification to tenant
                from app.services.notification_service import notification_service
                
                notification_service.send_payment_success_email(
                    to=tenant.contact_email,
                    amount=payment.amount,
                    currency="GHS",
                    plan_name="Platform Payment",
                    company_name=tenant.company_name
                )
                
                logger.info("Payment notifications sent", extra={
                    "payment_id": str(payment.id),
                    "tenant_email": tenant.contact_email
                })
        
        except Exception as e:
            logger.error("Failed to send payment notifications", extra={
                "payment_id": str(payment.id),
                "error": str(e)
            })
    
    def get_payment_statistics(self, db: Session, start_date: datetime | None = None, end_date: datetime | None = None) -> dict[str, Any]:
        """Get payment statistics for tenant"""
        try:
            query = db.query(PaymentRecord).filter(PaymentRecord.tenant_id == self.tenant_id)
            
            if start_date:
                query = query.filter(PaymentRecord.created_at >= start_date)
            if end_date:
                query = query.filter(PaymentRecord.created_at <= end_date)
            
            payments = query.all()
            
            total_revenue = sum(p.amount for p in payments if p.status == PaymentStatus.COMPLETED)
            total_platform_fees = sum(p.platform_fee for p in payments if p.status == PaymentStatus.COMPLETED)
            total_tenant_earnings = sum(p.tenant_amount for p in payments if p.status == PaymentStatus.COMPLETED)
            
            return {
                "total_payments": len(payments),
                "completed_payments": len([p for p in payments if p.status == PaymentStatus.COMPLETED]),
                "total_revenue": float(total_revenue),
                "total_platform_fees": float(total_platform_fees),
                "total_tenant_earnings": float(total_tenant_earnings),
                "success_rate": len([p for p in payments if p.status == PaymentStatus.COMPLETED]) / len(payments) * 100 if payments else 0
            }
        
        except Exception as e:
            logger.error("Failed to get payment statistics", extra={
                "tenant_id": self.tenant_id,
                "error": str(e)
            })
            return {}


# Global payment service factory
def get_platform_payment_service(tenant_id: str) -> PlatformPaymentService:
    """Get platform payment service for tenant"""
    return PlatformPaymentService(tenant_id)
