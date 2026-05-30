from __future__ import annotations
from app.core.config import settings

from pydantic import BaseModel, Field


class CRMAccountCreateRequest(BaseModel):
    tenant_id: str
    account_type: str = "customer"
    company_name: str
    email: str | None = None
    phone: str | None = None
    country: str | None = None
    city: str | None = None
    billing_address: str | None = None
    notes: str | None = None


class CRMContactCreateRequest(BaseModel):
    tenant_id: str
    account_id: str
    first_name: str
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    role_title: str | None = None
    is_primary: bool = False
    notes: str | None = None


class OpportunityCreateRequest(BaseModel):
    tenant_id: str
    account_id: str | None = None
    title: str
    stage: str = "new"
    currency: str = "GHS"
    estimated_value: float | None = None
    notes: str | None = None


class QuoteCreateRequest(BaseModel):
    tenant_id: str
    account_id: str | None = None
    opportunity_id: str | None = None
    quote_number: str
    currency: str = "GHS"
    total_amount: float = 0
    notes: str | None = None


class PublicTicketCreateRequest(BaseModel):
    tenant_id: str
    public_submitter_name: str
    public_submitter_email: str | None = None
    subject: str
    description: str
    category: str | None = None
    priority: str = "medium"
    shipment_reference: str | None = None
    tracking_reference: str | None = None
    account_id: str | None = None
    contact_id: str | None = None


class TicketReplyRequest(BaseModel):
    body: str = Field(..., min_length=1)
    author_type: str = "public"
    author_name: str | None = None
    visible_to_public: bool = True


class CRMAccountResponse(BaseModel):
    id: str
    tenant_id: str
    account_type: str
    company_name: str
    email: str | None = None
    phone: str | None = None


class CRMContactResponse(BaseModel):
    id: str
    tenant_id: str
    account_id: str
    first_name: str
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None


class OpportunityResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    stage: str
    currency: str
    estimated_value: float | None = None


class QuoteResponse(BaseModel):
    id: str
    tenant_id: str
    quote_number: str
    status: str
    currency: str
    total_amount: float


class SupportTicketResponse(BaseModel):
    id: str
    tenant_id: str
    public_token: str
    subject: str
    description: str
    category: str | None = None
    priority: str
    status: str
    shipment_reference: str | None = None
    tracking_reference: str | None = None
    glpi_ticket_id: str | None = None


class SupportTicketMessageResponse(BaseModel):
    id: str
    ticket_id: str
    author_type: str
    author_name: str | None = None
    body: str
    visible_to_public: bool
