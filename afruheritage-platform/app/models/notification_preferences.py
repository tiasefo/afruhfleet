from __future__ import annotations
from app.core.config import settings

from enum import Enum

from sqlalchemy import Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class NotificationType(str, Enum):
    TENANT_APPROVED = "tenant_approved"
    TENANT_LAUNCHED = "tenant_launched"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    WALLET_LOW_BALANCE = "wallet_low_balance"
    SHIPMENT_STATUS_UPDATE = "shipment_status_update"
    SHIPMENT_DELIVERED = "shipment_delivered"
    TICKET_CREATED = "ticket_created"
    TICKET_REPLY = "ticket_reply"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"


class NotificationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    tenant_id: Mapped[str] = mapped_column(primary_key=True)
    notification_type: Mapped[NotificationType] = mapped_column(primary_key=True)
    channel: Mapped[NotificationChannel] = mapped_column(primary_key=True)
    enabled: Mapped[bool] = mapped_column(default=True)
    
    # Default preferences for new tenants
    DEFAULT_EMAIL_PREFERENCES = {
        NotificationType.TENANT_APPROVED: True,
        NotificationType.TENANT_LAUNCHED: True,
        NotificationType.PAYMENT_SUCCESS: True,
        NotificationType.PAYMENT_FAILED: True,
        NotificationType.WALLET_LOW_BALANCE: True,
        NotificationType.SHIPMENT_STATUS_UPDATE: True,
        NotificationType.SHIPMENT_DELIVERED: True,
        NotificationType.TICKET_CREATED: True,
        NotificationType.TICKET_REPLY: True,
        NotificationType.PASSWORD_RESET: True,
        NotificationType.EMAIL_VERIFICATION: True,
    }
    
    DEFAULT_SMS_PREFERENCES = {
        NotificationType.TENANT_APPROVED: False,
        NotificationType.TENANT_LAUNCHED: False,
        NotificationType.PAYMENT_SUCCESS: False,
        NotificationType.PAYMENT_FAILED: True,
        NotificationType.WALLET_LOW_BALANCE: True,
        NotificationType.SHIPMENT_STATUS_UPDATE: False,
        NotificationType.SHIPMENT_DELIVERED: True,
        NotificationType.TICKET_CREATED: False,
        NotificationType.TICKET_REPLY: False,
        NotificationType.PASSWORD_RESET: True,
        NotificationType.EMAIL_VERIFICATION: False,
    }
