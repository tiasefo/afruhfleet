from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.structured_logging import get_logger
from app.models.billing import Payment as BillingPayment
from app.models.billing import PaymentStatus as BillingPaymentStatus
from app.models.payment import PaymentMethod, PaymentRecord, PaymentStatus
from app.models.tenant import Tenant
from app.services.notification_service import notification_service
from app.services.paypal_client import capture_order, create_order, get_order
from app.services.paystack_client import initialize_transaction, verify_transaction

logger = get_logger("afruheritage.platform_payments")


class PlatformPaymentService:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self._tenant_uuid: uuid.UUID | None = None
        if tenant_id:
            try:
                self._tenant_uuid = uuid.UUID(str(tenant_id))
            except ValueError:
                self._tenant_uuid = None
        self.platform_fee_rate = 0.015

    def _new_reference(self) -> str:
        return f"PM_{self.tenant_id[:8]}_{uuid.uuid4().hex[:10].upper()}"

    def _fee_breakdown(self, amount: float) -> tuple[float, float]:
        platform_fee = round(amount * self.platform_fee_rate, 2)
        tenant_amount = round(amount - platform_fee, 2)
        return platform_fee, tenant_amount

    def _resolve_payment_purpose(self, metadata: dict[str, Any] | None) -> str:
        purpose = (metadata or {}).get("purpose")
        if purpose in {"subscription", "credit_topup"}:
            return purpose
        if (metadata or {}).get("type") == "credit_purchase":
            return "credit_topup"
        return "credit_topup"

    def _map_billing_status(self, status: PaymentStatus) -> BillingPaymentStatus:
        if status == PaymentStatus.COMPLETED:
            return BillingPaymentStatus.PAID
        if status == PaymentStatus.REFUNDED:
            return BillingPaymentStatus.REFUNDED
        if status in {PaymentStatus.FAILED, PaymentStatus.CANCELLED}:
            return BillingPaymentStatus.OVERDUE
        return BillingPaymentStatus.UNPAID

    def sync_billing_payment_from_record(self, db: Session, payment: PaymentRecord, provider_payload: dict[str, Any] | None = None) -> None:
        metadata = payment.additional_data if isinstance(payment.additional_data, dict) else {}
        self._upsert_billing_payment(
            db,
            reference=payment.payment_reference,
            purpose=self._resolve_payment_purpose(metadata),
            currency=metadata.get("currency", "GHS"),
            amount_minor=int(round(float(payment.amount) * 100)),
            status=self._map_billing_status(payment.status),
            provider=(payment.payment_method or "paystack").lower(),
            authorization_url=payment.authorization_url,
            access_code=None,
            provider_payload=provider_payload,
        )

    def _upsert_billing_payment(
        self,
        db: Session,
        *,
        reference: str,
        purpose: str,
        currency: str,
        amount_minor: int,
        status: BillingPaymentStatus,
        provider: str,
        authorization_url: str | None = None,
        access_code: str | None = None,
        provider_payload: dict[str, Any] | None = None,
    ) -> None:
        if not self._tenant_uuid:
            return

        row = (
            db.query(BillingPayment)
            .filter(BillingPayment.reference == reference)
            .first()
        )
        if not row:
            row = BillingPayment(
                tenant_id=self._tenant_uuid,
                reference=reference,
                purpose=purpose,
                currency=currency,
                amount_minor=amount_minor,
                status=status,
                provider=provider,
                provider_authorization_url=authorization_url,
                provider_access_code=access_code,
                provider_payload=json.dumps(provider_payload or {}),
            )
            db.add(row)
        else:
            row.status = status
            row.provider = provider
            row.provider_authorization_url = authorization_url or row.provider_authorization_url
            row.provider_access_code = access_code or row.provider_access_code
            if provider_payload is not None:
                row.provider_payload = json.dumps(provider_payload)
            db.add(row)
        db.commit()

    async def initiate_payment(
        self,
        db: Session,
        amount: float,
        payment_method: str,
        customer_info: dict[str, Any],
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not self._tenant_uuid:
            raise RuntimeError("Invalid tenant_id for payment initiation")

        method = payment_method.lower().strip()
        platform_fee, tenant_amount = self._fee_breakdown(amount)
        payment_reference = self._new_reference()
        purpose = self._resolve_payment_purpose(metadata)

        if method == "mobile_money":
            callback_url = settings.payment_webhook_url or f"{settings.base_url.rstrip('/')}/api/v1/payments/webhook/paystack"
            paystack = initialize_transaction(
                email=customer_info["email"],
                amount_minor=int(amount * 100),
                reference=payment_reference,
                currency=(metadata or {}).get("currency", "GHS"),
                callback_url=callback_url,
                metadata={
                    "tenant_id": self.tenant_id,
                    "platform_fee": platform_fee,
                    "tenant_amount": tenant_amount,
                    **(metadata or {}),
                },
            )

            data = paystack.get("data") or {}
            authorization_url = data.get("authorization_url")
            gateway_ref = data.get("reference") or payment_reference
            if not authorization_url:
                raise RuntimeError("Paystack did not return authorization_url")

            payment = PaymentRecord(
                tenant_id=self._tenant_uuid,
                amount=amount,
                platform_fee=platform_fee,
                tenant_amount=tenant_amount,
                paid_amount=0,
                payment_method=PaymentMethod.MOBILE_MONEY,
                payment_reference=payment_reference,
                paystack_reference=gateway_ref,
                status=PaymentStatus.PENDING,
                customer_email=customer_info.get("email"),
                customer_phone=customer_info.get("phone"),
                customer_name=customer_info.get("name"),
                authorization_url=authorization_url,
                callback_url=callback_url,
                description=description,
                additional_data={"gateway": "paystack", **(metadata or {})},
            )
            db.add(payment)
            db.commit()
            db.refresh(payment)

            self._upsert_billing_payment(
                db,
                reference=payment_reference,
                purpose=purpose,
                currency=(metadata or {}).get("currency", "GHS"),
                amount_minor=int(round(amount * 100)),
                status=BillingPaymentStatus.UNPAID,
                provider="paystack",
                authorization_url=authorization_url,
                access_code=data.get("access_code"),
                provider_payload=paystack,
            )

            return {
                "payment_id": str(payment.id),
                "payment_reference": payment_reference,
                "authorization_url": authorization_url,
                "amount": float(amount),
                "platform_fee": float(platform_fee),
                "tenant_amount": float(tenant_amount),
                "payment_method": payment_method,
                "status": payment.status.value,
                "expires_at": None,
            }

        if method == "paypal":
            return_url = (metadata or {}).get("return_url") or f"{settings.base_url.rstrip('/')}/payment/success"
            cancel_url = (metadata or {}).get("cancel_url") or f"{settings.base_url.rstrip('/')}/payment/cancel"
            order = create_order(
                amount=amount,
                currency=(metadata or {}).get("currency", "USD"),
                reference=payment_reference,
                return_url=return_url,
                cancel_url=cancel_url,
                metadata=metadata,
            )
            order_id = order.get("id")
            approve_url = next((l.get("href") for l in (order.get("links") or []) if l.get("rel") == "approve"), None)
            if not order_id or not approve_url:
                raise RuntimeError("PayPal create order response missing id or approve link")

            payment = PaymentRecord(
                tenant_id=self._tenant_uuid,
                amount=amount,
                platform_fee=platform_fee,
                tenant_amount=tenant_amount,
                paid_amount=0,
                payment_method=PaymentMethod.CREDIT_CARD,
                payment_reference=payment_reference,
                status=PaymentStatus.PENDING,
                customer_email=customer_info.get("email"),
                customer_phone=customer_info.get("phone"),
                customer_name=customer_info.get("name"),
                authorization_url=approve_url,
                callback_url=settings.payment_webhook_url or None,
                description=description,
                additional_data={
                    "gateway": "paypal",
                    "paypal_order_id": order_id,
                    **(metadata or {}),
                },
            )
            db.add(payment)
            db.commit()
            db.refresh(payment)

            self._upsert_billing_payment(
                db,
                reference=payment_reference,
                purpose=purpose,
                currency=(metadata or {}).get("currency", "USD"),
                amount_minor=int(round(amount * 100)),
                status=BillingPaymentStatus.UNPAID,
                provider="paypal",
                authorization_url=approve_url,
                access_code=None,
                provider_payload=order,
            )

            return {
                "payment_id": str(payment.id),
                "payment_reference": payment_reference,
                "authorization_url": approve_url,
                "amount": float(amount),
                "platform_fee": float(platform_fee),
                "tenant_amount": float(tenant_amount),
                "payment_method": payment_method,
                "status": payment.status.value,
                "expires_at": None,
            }

        raise RuntimeError(f"Unsupported payment method: {payment_method}")

    async def verify_payment(self, payment: PaymentRecord) -> dict[str, Any]:
        gateway = (payment.additional_data or {}).get("gateway", "paystack")

        if gateway == "paypal":
            order_id = (payment.additional_data or {}).get("paypal_order_id")
            if not order_id:
                return {"verified": False, "status": "missing_order_id", "reference": payment.payment_reference}

            order = get_order(order_id)
            status = order.get("status", "UNKNOWN")
            if status == "APPROVED":
                capture = capture_order(order_id)
                status = capture.get("status", status)
                if status == "COMPLETED":
                    return {
                        "verified": True,
                        "status": "success",
                        "amount": float(payment.amount),
                        "reference": payment.payment_reference,
                    }

            return {
                "verified": status == "COMPLETED",
                "status": status.lower(),
                "reference": payment.payment_reference,
            }

        result = verify_transaction(payment.paystack_reference or payment.payment_reference)
        data = result.get("data") or {}
        is_success = bool(result.get("status") and data.get("status") == "success")
        return {
            "verified": is_success,
            "status": data.get("status", "unknown"),
            "amount": float(data.get("amount", 0)) / 100 if data.get("amount") is not None else float(payment.amount),
            "reference": data.get("reference", payment.payment_reference),
        }

    async def handle_paystack_webhook(self, webhook_data: dict[str, Any], db: Session) -> dict[str, Any]:
        event = webhook_data.get("event", "")
        data = webhook_data.get("data") or {}
        reference = data.get("reference")
        if not reference:
            return {"status": "ignored", "reason": "missing_reference"}

        payment = db.query(PaymentRecord).filter(PaymentRecord.paystack_reference == reference).first()
        if not payment:
            return {"status": "ignored", "reason": "payment_not_found", "reference": reference}

        if event == "charge.success":
            amount = float(data.get("amount", 0)) / 100
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.utcnow()
            payment.paid_amount = amount
            db.commit()
            self._upsert_billing_payment(
                db,
                reference=payment.payment_reference,
                purpose=self._resolve_payment_purpose(payment.additional_data if isinstance(payment.additional_data, dict) else None),
                currency=(payment.additional_data or {}).get("currency", "GHS") if isinstance(payment.additional_data, dict) else "GHS",
                amount_minor=int(round(float(payment.amount) * 100)),
                status=BillingPaymentStatus.PAID,
                provider="paystack",
                authorization_url=payment.authorization_url,
                access_code=None,
                provider_payload=webhook_data,
            )
            await self._send_payment_notifications(db, payment)

            # Auto-provision tenant after successful subscription payment
            metadata = payment.additional_data if isinstance(payment.additional_data, dict) else {}
            purpose = self._resolve_payment_purpose(metadata)
            if purpose == "subscription" and self._tenant_uuid:
                try:
                    from app.services.auto_provisioning import handle_subscription_payment_success
                    plan_code = metadata.get("plan_code", "professional")
                    currency = metadata.get("currency", "GHS")
                    provision_result = handle_subscription_payment_success(
                        db, tenant_id=str(self._tenant_uuid), plan_code=plan_code, currency=currency
                    )
                    logger.info("auto_provisioning_triggered", extra={
                        "tenant_id": str(self._tenant_uuid),
                        "result": provision_result,
                    })
                except Exception as exc:
                    logger.error("auto_provisioning_failed", extra={
                        "tenant_id": str(self._tenant_uuid),
                        "error": str(exc),
                    })

            return {"status": "processed", "payment_id": str(payment.id), "amount": amount, "platform_fee": float(payment.platform_fee)}

        if event == "charge.failed":
            payment.status = PaymentStatus.FAILED
            payment.failed_at = datetime.utcnow()
            payment.failure_reason = data.get("gateway_response") or data.get("message") or "Payment failed"
            db.commit()
            self._upsert_billing_payment(
                db,
                reference=payment.payment_reference,
                purpose=self._resolve_payment_purpose(payment.additional_data if isinstance(payment.additional_data, dict) else None),
                currency=(payment.additional_data or {}).get("currency", "GHS") if isinstance(payment.additional_data, dict) else "GHS",
                amount_minor=int(round(float(payment.amount) * 100)),
                status=BillingPaymentStatus.OVERDUE,
                provider="paystack",
                authorization_url=payment.authorization_url,
                access_code=None,
                provider_payload=webhook_data,
            )
            return {"status": "failed", "payment_id": str(payment.id), "reason": payment.failure_reason}

        return {"status": "ignored", "event": event}

    async def handle_paypal_webhook(self, webhook_data: dict[str, Any], db: Session) -> dict[str, Any]:
        event = webhook_data.get("event_type", "")
        resource = webhook_data.get("resource") or {}
        order_id = resource.get("id")
        if not order_id:
            return {"status": "ignored", "reason": "missing_order_id"}

        candidates = db.query(PaymentRecord).filter(PaymentRecord.status == PaymentStatus.PENDING).all()
        payment = next(
            (
                p for p in candidates
                if isinstance(p.additional_data, dict) and p.additional_data.get("paypal_order_id") == order_id
            ),
            None,
        )
        if not payment:
            return {"status": "ignored", "reason": "payment_not_found", "order_id": order_id}

        if event in {"CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED"}:
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.utcnow()
            payment.paid_amount = float(payment.amount)
            db.commit()
            self._upsert_billing_payment(
                db,
                reference=payment.payment_reference,
                purpose=self._resolve_payment_purpose(payment.additional_data if isinstance(payment.additional_data, dict) else None),
                currency=(payment.additional_data or {}).get("currency", "USD") if isinstance(payment.additional_data, dict) else "USD",
                amount_minor=int(round(float(payment.amount) * 100)),
                status=BillingPaymentStatus.PAID,
                provider="paypal",
                authorization_url=payment.authorization_url,
                access_code=None,
                provider_payload=webhook_data,
            )
            await self._send_payment_notifications(db, payment)
            return {"status": "processed", "payment_id": str(payment.id), "amount": float(payment.amount), "platform_fee": float(payment.platform_fee)}

        if event in {"PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.DECLINED"}:
            payment.status = PaymentStatus.FAILED
            payment.failed_at = datetime.utcnow()
            payment.failure_reason = resource.get("status_details", {}).get("reason") or "PayPal capture denied"
            db.commit()
            self._upsert_billing_payment(
                db,
                reference=payment.payment_reference,
                purpose=self._resolve_payment_purpose(payment.additional_data if isinstance(payment.additional_data, dict) else None),
                currency=(payment.additional_data or {}).get("currency", "USD") if isinstance(payment.additional_data, dict) else "USD",
                amount_minor=int(round(float(payment.amount) * 100)),
                status=BillingPaymentStatus.OVERDUE,
                provider="paypal",
                authorization_url=payment.authorization_url,
                access_code=None,
                provider_payload=webhook_data,
            )
            return {"status": "failed", "payment_id": str(payment.id), "reason": payment.failure_reason}

        return {"status": "ignored", "event": event}

    async def _send_payment_notifications(self, db: Session, payment: PaymentRecord) -> None:
        tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
        if not tenant:
            return
        try:
            notification_service.send_payment_success_email(
                to=tenant.contact_email,
                amount=float(payment.amount),
                currency="GHS",
                plan_name="Platform Payment",
                company_name=tenant.company_name,
            )
        except Exception as exc:
            logger.error("payment_notification_failed", extra={"payment_id": str(payment.id), "error": str(exc)})

    def get_payment_statistics(self, db: Session, start_date: datetime | None = None, end_date: datetime | None = None) -> dict[str, Any]:
        if not self._tenant_uuid:
            return {
                "total_payments": 0,
                "completed_payments": 0,
                "total_revenue": 0.0,
                "total_platform_fees": 0.0,
                "total_tenant_earnings": 0.0,
                "success_rate": 0,
            }

        query = db.query(PaymentRecord).filter(PaymentRecord.tenant_id == self._tenant_uuid)
        if start_date:
            query = query.filter(PaymentRecord.created_at >= start_date)
        if end_date:
            query = query.filter(PaymentRecord.created_at <= end_date)

        payments = query.all()
        completed = [p for p in payments if p.status == PaymentStatus.COMPLETED]
        total_revenue = sum(float(p.amount) for p in completed)
        total_platform_fees = sum(float(p.platform_fee) for p in completed)
        total_tenant_earnings = sum(float(p.tenant_amount) for p in completed)

        return {
            "total_payments": len(payments),
            "completed_payments": len(completed),
            "total_revenue": total_revenue,
            "total_platform_fees": total_platform_fees,
            "total_tenant_earnings": total_tenant_earnings,
            "success_rate": (len(completed) / len(payments) * 100) if payments else 0,
        }


def get_platform_payment_service(tenant_id: str) -> PlatformPaymentService:
    return PlatformPaymentService(tenant_id)
