from __future__ import annotations
from app.core.config import settings

from pydantic import BaseModel, Field


class PlanResponse(BaseModel):
    code: str
    name: str
    currency: str
    price_amount: float
    monthly_credit_allowance: int
    includes_custom_domain: bool
    includes_priority_support: bool
    included_features: list[str] = []
    # Feature limits
    max_drivers: int
    max_vehicles: int
    max_shipments_per_month: int
    max_products: int
    max_group_members: int
    # Feature flags
    dispatch_enabled: bool
    route_planning_enabled: bool
    service_rates_enabled: bool
    pod_enabled: bool
    route_optimization_enabled: bool
    vrp_enabled: bool
    webhooks_enabled: bool
    notifications_enabled: bool
    extensions_enabled: bool
    maintenance_enabled: bool
    fuel_tracking_enabled: bool
    csv_import_enabled: bool


class UsageCreditCostResponse(BaseModel):
    feature_key: str
    credits: int


class SubscriptionResponse(BaseModel):
    tenant_id: str
    plan_code: str
    status: str
    currency: str
    started_at: str
    current_period_end: str
    trial_ends_at: str | None = None
    read_only_reason: str | None = None


class WalletResponse(BaseModel):
    tenant_id: str
    currency: str
    balance_credits: int


class WalletTransactionResponse(BaseModel):
    id: str
    transaction_type: str
    credits_delta: int
    balance_after: int
    reference: str | None = None
    memo: str | None = None
    created_at: str


class PaymentInitRequest(BaseModel):
    tenant_id: str
    email: str
    currency: str = Field(..., min_length=3, max_length=10)
    amount_major: float = Field(..., ge=0)
    purpose: str = Field(..., pattern="^(subscription|credit_topup)$")
    plan_code: str | None = None
    credits_to_buy: int | None = None
    callback_url: str | None = None
    payment_provider: str = "paystack"  # paystack | flutterwave


class PaymentInitResponse(BaseModel):
    reference: str
    authorization_url: str | None = None
    access_code: str | None = None
    status: str


class PaymentReinitRequest(BaseModel):
    email: str
    callback_url: str | None = None


class PaymentVerifyResponse(BaseModel):
    reference: str
    status: str
    provider_status: str | None = None
    message: str


class CreditConsumeRequest(BaseModel):
    tenant_id: str
    usage_type: str = Field(..., pattern="^(ai_usage|document_processing)$")
    credits: int = Field(..., gt=0)
    memo: str | None = None


class BillingAdminSetReadOnlyRequest(BaseModel):
    tenant_id: str
    reason: str
    read_only: bool = True


class BillingAdminAdjustCreditsRequest(BaseModel):
    tenant_id: str
    credits_delta: int
    memo: str | None = None


class BillingAdminAssignPlanRequest(BaseModel):
    tenant_id: str
    plan_code: str
    currency: str = "GHS"
