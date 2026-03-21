from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PaymentInitiateRequest(BaseModel):
    """Request model for initiating payment"""
    amount: float = Field(gt=0, description="Payment amount in GHS")
    payment_method: str = Field(description="Payment method (mobile_money, etc.)")
    customer_email: str = Field(description="Customer email address")
    customer_phone: str = Field(description="Customer phone number")
    customer_name: str | None = Field(None, description="Customer name")
    mobile_provider: str = Field(default="mtn", description="Mobile money provider (mtn, airteltigo, vodafone)")
    description: str | None = Field(None, description="Payment description")
    metadata: dict[str, Any] | None = Field(None, description="Additional metadata")


class PaymentInitiateResponse(BaseModel):
    """Response model for payment initiation"""
    payment_id: str
    payment_reference: str
    authorization_url: str
    amount: float
    platform_fee: float
    tenant_amount: float
    payment_method: str
    status: str
    expires_at: datetime | None = None
    mock: bool | None = None


class PaymentStatusResponse(BaseModel):
    """Response model for payment status"""
    payment_id: str
    payment_reference: str
    status: str
    amount: float
    platform_fee: float
    tenant_amount: float
    paid_amount: float
    created_at: datetime
    completed_at: datetime | None = None
    failed_at: datetime | None = None
    failure_reason: str | None = None


class CreditPurchaseRequest(BaseModel):
    """Request model for purchasing virtual credits"""
    amount: float = Field(gt=0, description="Amount to pay in GHS")
    payment_method: str = Field(description="Payment method")
    customer_email: str = Field(description="Customer email")
    customer_phone: str = Field(description="Customer phone")
    mobile_provider: str = Field(default="mtn", description="Mobile money provider")


class CreditPurchaseResponse(BaseModel):
    """Response model for credit purchase"""
    purchase_id: str
    amount_paid: float
    credits_to_receive: float
    payment_url: str
    status: str


class VirtualCreditBalance(BaseModel):
    """Virtual credit balance response"""
    user_id: str
    balance: float
    currency: str
    total_purchased: float
    total_spent: float
    created_at: datetime
    updated_at: datetime


class CreditTransferRequest(BaseModel):
    """Request model for transferring credits"""
    to_user_email: str = Field(description="Recipient email")
    amount: float = Field(gt=0, description="Amount to transfer")
    message: str | None = Field(None, description="Transfer message")


class CreditTransferResponse(BaseModel):
    """Response model for credit transfer"""
    transfer_id: str
    from_user_id: str
    to_user_id: str
    amount: float
    status: str
    created_at: datetime
    message: str | None = None


class VirtualCardRequest(BaseModel):
    """Request model for creating virtual card"""
    credit_amount: float = Field(gt=0, description="Amount to load on card")
    card_name: str | None = Field(None, description="Card nickname")


class VirtualCardResponse(BaseModel):
    """Response model for virtual card"""
    card_id: str
    card_number: str
    card_name: str | None
    balance: float
    status: str
    expires_at: datetime
    created_at: datetime


class PaymentStatistics(BaseModel):
    """Payment statistics response"""
    total_payments: int
    completed_payments: int
    total_revenue: float
    total_platform_fees: float
    total_tenant_earnings: float
    success_rate: float


class WebhookResponse(BaseModel):
    """Webhook processing response"""
    status: str
    payment_id: str | None = None
    amount: float | None = None
    platform_fee: float | None = None
    reason: str | None = None
