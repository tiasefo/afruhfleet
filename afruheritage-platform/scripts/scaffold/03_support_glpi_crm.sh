#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
APP_DIR="$ROOT_DIR/app"
BACKUP_DIR="$ROOT_DIR/.scaffold_backups/03_support_glpi_crm_$(date +%Y%m%d_%H%M%S)"

require_file() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "ERROR: Expected path not found: $path"
    exit 1
  fi
}

backup_if_exists() {
  local path="$1"
  if [[ -e "$path" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "${path#$ROOT_DIR/}")"
    cp -a "$path" "$BACKUP_DIR/${path#$ROOT_DIR/}"
  fi
}

echo "==> Validating repo root"
require_file "$ROOT_DIR/requirements.txt"
require_file "$APP_DIR"
require_file "$APP_DIR/main.py"

mkdir -p "$BACKUP_DIR"
mkdir -p \
  "$APP_DIR/models" \
  "$APP_DIR/schemas" \
  "$APP_DIR/api/routes" \
  "$APP_DIR/services" \
  "$ROOT_DIR/docs"

echo "==> Backing up files that may change"
backup_if_exists "$APP_DIR/main.py"
backup_if_exists "$ROOT_DIR/requirements.txt"

echo "==> Writing CRM and support models"
cat > "$APP_DIR/models/support_crm.py" <<'PY'
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CRMAccountType(str, PyEnum):
    SHIPPER = "shipper"
    CONSIGNEE = "consignee"
    SUPPLIER = "supplier"
    PARTNER = "partner"
    CUSTOMER = "customer"
    OTHER = "other"


class OpportunityStage(str, PyEnum):
    NEW = "new"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class QuoteStatus(str, PyEnum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class SupportTicketStatus(str, PyEnum):
    OPEN = "open"
    PENDING = "pending"
    WAITING_CUSTOMER = "waiting_customer"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SupportTicketPriority(str, PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CRMAccount(Base):
    __tablename__ = "crm_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    account_type: Mapped[CRMAccountType] = mapped_column(Enum(CRMAccountType), nullable=False, default=CRMAccountType.CUSTOMER)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    billing_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CRMContact(Base):
    __tablename__ = "crm_contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("crm_accounts.id"), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    role_title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Opportunity(Base):
    __tablename__ = "crm_opportunities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("crm_accounts.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    stage: Mapped[OpportunityStage] = mapped_column(Enum(OpportunityStage), nullable=False, default=OpportunityStage.NEW)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    estimated_value: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    expected_close_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Quote(Base):
    __tablename__ = "crm_quotes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("crm_accounts.id"), nullable=True, index=True)
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("crm_opportunities.id"), nullable=True, index=True)
    quote_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[QuoteStatus] = mapped_column(Enum(QuoteStatus), nullable=False, default=QuoteStatus.DRAFT)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    total_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("crm_accounts.id"), nullable=True, index=True)
    contact_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("crm_contacts.id"), nullable=True, index=True)
    public_token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority: Mapped[SupportTicketPriority] = mapped_column(Enum(SupportTicketPriority), nullable=False, default=SupportTicketPriority.MEDIUM)
    status: Mapped[SupportTicketStatus] = mapped_column(Enum(SupportTicketStatus), nullable=False, default=SupportTicketStatus.OPEN)
    shipment_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tracking_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    glpi_ticket_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    glpi_entity_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    public_submitter_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    public_submitter_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SupportTicketMessage(Base):
    __tablename__ = "support_ticket_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("support_tickets.id"), nullable=False, index=True)
    author_type: Mapped[str] = mapped_column(String(50), nullable=False)  # public|tenant_user|system|glpi_sync
    author_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    visible_to_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class SupportSyncLog(Base):
    __tablename__ = "support_sync_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    ticket_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    direction: Mapped[str] = mapped_column(String(50), nullable=False)  # outbound|inbound
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="glpi")
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
PY

echo "==> Writing CRM/support schemas"
cat > "$APP_DIR/schemas/support_crm.py" <<'PY'
from __future__ import annotations

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
PY

echo "==> Writing GLPI client"
cat > "$APP_DIR/services/glpi_client.py" <<'PY'
from __future__ import annotations

import os

import httpx


class GLPIClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("GLPI_BASE_URL", "").rstrip("/")
        self.app_token = os.getenv("GLPI_APP_TOKEN", "")
        self.user_token = os.getenv("GLPI_USER_TOKEN", "")
        self.entity_mode = os.getenv("GLPI_TENANT_SEPARATION_MODE", "shared_entities")

    def enabled(self) -> bool:
        return bool(self.base_url and self.app_token and self.user_token)

    def _headers(self, session_token: str | None = None) -> dict[str, str]:
        headers = {
            "App-Token": self.app_token,
            "Authorization": f"user_token {self.user_token}",
            "Content-Type": "application/json",
        }
        if session_token:
            headers["Session-Token"] = session_token
        return headers

    def init_session(self) -> str:
        if not self.enabled():
            raise RuntimeError("GLPI is not configured")
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(f"{self.base_url}/initSession", headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
            return data["session_token"]

    def kill_session(self, session_token: str) -> None:
        with httpx.Client(timeout=60.0) as client:
            client.get(f"{self.base_url}/killSession", headers=self._headers(session_token))

    def create_ticket(self, *, title: str, content: str, entity_id: str | None = None) -> dict:
        session_token = self.init_session()
        try:
            payload = {
                "input": {
                    "name": title,
                    "content": content,
                }
            }
            if entity_id:
                payload["input"]["entities_id"] = entity_id

            with httpx.Client(timeout=60.0) as client:
                resp = client.post(
                    f"{self.base_url}/Ticket",
                    headers=self._headers(session_token),
                    json=payload,
                )
                resp.raise_for_status()
                return resp.json()
        finally:
            self.kill_session(session_token)
PY

echo "==> Writing support/CRM service"
cat > "$APP_DIR/services/support_crm_service.py" <<'PY'
from __future__ import annotations

import json
import secrets
from sqlalchemy.orm import Session

from app.models.support_crm import (
    CRMAccount,
    CRMAccountType,
    CRMContact,
    Opportunity,
    OpportunityStage,
    Quote,
    QuoteStatus,
    SupportSyncLog,
    SupportTicket,
    SupportTicketMessage,
    SupportTicketPriority,
)
from app.services.glpi_client import GLPIClient


def create_crm_account(db: Session, **kwargs) -> CRMAccount:
    obj = CRMAccount(
        tenant_id=kwargs["tenant_id"],
        account_type=CRMAccountType(kwargs.get("account_type", "customer")),
        company_name=kwargs["company_name"],
        email=kwargs.get("email"),
        phone=kwargs.get("phone"),
        country=kwargs.get("country"),
        city=kwargs.get("city"),
        billing_address=kwargs.get("billing_address"),
        notes=kwargs.get("notes"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_crm_contact(db: Session, **kwargs) -> CRMContact:
    obj = CRMContact(
        tenant_id=kwargs["tenant_id"],
        account_id=kwargs["account_id"],
        first_name=kwargs["first_name"],
        last_name=kwargs.get("last_name"),
        email=kwargs.get("email"),
        phone=kwargs.get("phone"),
        role_title=kwargs.get("role_title"),
        is_primary=kwargs.get("is_primary", False),
        notes=kwargs.get("notes"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_opportunity(db: Session, **kwargs) -> Opportunity:
    obj = Opportunity(
        tenant_id=kwargs["tenant_id"],
        account_id=kwargs.get("account_id"),
        title=kwargs["title"],
        stage=OpportunityStage(kwargs.get("stage", "new")),
        currency=kwargs.get("currency", "GHS"),
        estimated_value=kwargs.get("estimated_value"),
        notes=kwargs.get("notes"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_quote(db: Session, **kwargs) -> Quote:
    obj = Quote(
        tenant_id=kwargs["tenant_id"],
        account_id=kwargs.get("account_id"),
        opportunity_id=kwargs.get("opportunity_id"),
        quote_number=kwargs["quote_number"],
        status=QuoteStatus.DRAFT,
        currency=kwargs.get("currency", "GHS"),
        total_amount=kwargs.get("total_amount", 0),
        notes=kwargs.get("notes"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_public_ticket(db: Session, **kwargs) -> SupportTicket:
    obj = SupportTicket(
        tenant_id=kwargs["tenant_id"],
        account_id=kwargs.get("account_id"),
        contact_id=kwargs.get("contact_id"),
        public_token=secrets.token_urlsafe(24),
        subject=kwargs["subject"],
        description=kwargs["description"],
        category=kwargs.get("category"),
        priority=SupportTicketPriority(kwargs.get("priority", "medium")),
        shipment_reference=kwargs.get("shipment_reference"),
        tracking_reference=kwargs.get("tracking_reference"),
        public_submitter_name=kwargs.get("public_submitter_name"),
        public_submitter_email=kwargs.get("public_submitter_email"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)

    msg = SupportTicketMessage(
        ticket_id=obj.id,
        author_type="public",
        author_name=obj.public_submitter_name,
        body=obj.description,
        visible_to_public=True,
    )
    db.add(msg)
    db.commit()

    return obj


def add_ticket_message(db: Session, ticket_id: str, body: str, author_type: str = "public", author_name: str | None = None, visible_to_public: bool = True) -> SupportTicketMessage:
    msg = SupportTicketMessage(
        ticket_id=ticket_id,
        author_type=author_type,
        author_name=author_name,
        body=body,
        visible_to_public=visible_to_public,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def sync_ticket_to_glpi(db: Session, ticket: SupportTicket, entity_id: str | None = None) -> SupportTicket:
    client = GLPIClient()
    if not client.enabled():
        log = SupportSyncLog(
            tenant_id=ticket.tenant_id,
            ticket_id=ticket.id,
            direction="outbound",
            provider="glpi",
            status="skipped",
            payload_json=json.dumps({"reason": "GLPI not configured"}),
        )
        db.add(log)
        db.commit()
        return ticket

    content = (
        f"Tenant ticket ID: {ticket.id}\n"
        f"Public submitter: {ticket.public_submitter_name or 'Unknown'}\n"
        f"Email: {ticket.public_submitter_email or 'N/A'}\n"
        f"Category: {ticket.category or 'N/A'}\n"
        f"Priority: {ticket.priority.value}\n"
        f"Shipment ref: {ticket.shipment_reference or 'N/A'}\n"
        f"Tracking ref: {ticket.tracking_reference or 'N/A'}\n\n"
        f"{ticket.description}"
    )

    try:
        result = client.create_ticket(
            title=ticket.subject,
            content=content,
            entity_id=entity_id,
        )
        ticket.glpi_ticket_id = str(result.get("id") or result.get("ID") or "")
        ticket.glpi_entity_id = entity_id
        db.add(ticket)

        log = SupportSyncLog(
            tenant_id=ticket.tenant_id,
            ticket_id=ticket.id,
            direction="outbound",
            provider="glpi",
            status="success",
            payload_json=json.dumps(result),
        )
        db.add(log)
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception as exc:
        log = SupportSyncLog(
            tenant_id=ticket.tenant_id,
            ticket_id=ticket.id,
            direction="outbound",
            provider="glpi",
            status="failed",
            error_message=str(exc),
        )
        db.add(log)
        db.commit()
        return ticket
PY

echo "==> Writing CRM/support routes"
cat > "$APP_DIR/api/routes/support_crm.py" <<'PY'
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.support_crm import CRMAccount, CRMContact, Opportunity, Quote, SupportTicket, SupportTicketMessage
from app.schemas.support_crm import (
    CRMAccountCreateRequest,
    CRMAccountResponse,
    CRMContactCreateRequest,
    CRMContactResponse,
    OpportunityCreateRequest,
    OpportunityResponse,
    PublicTicketCreateRequest,
    QuoteCreateRequest,
    QuoteResponse,
    SupportTicketMessageResponse,
    SupportTicketResponse,
    TicketReplyRequest,
)
from app.services.support_crm_service import (
    add_ticket_message,
    create_crm_account,
    create_crm_contact,
    create_opportunity,
    create_public_ticket,
    create_quote,
    sync_ticket_to_glpi,
)

router = APIRouter(prefix="/support-crm", tags=["Support & CRM"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _db() -> Session:
    return SessionLocal()


@router.post("/accounts", response_model=CRMAccountResponse)
def create_account(request: CRMAccountCreateRequest):
    db = _db()
    try:
        obj = create_crm_account(db, **request.model_dump())
        return CRMAccountResponse(
            id=str(obj.id),
            tenant_id=str(obj.tenant_id),
            account_type=obj.account_type.value,
            company_name=obj.company_name,
            email=obj.email,
            phone=obj.phone,
        )
    finally:
        db.close()


@router.post("/contacts", response_model=CRMContactResponse)
def create_contact(request: CRMContactCreateRequest):
    db = _db()
    try:
        obj = create_crm_contact(db, **request.model_dump())
        return CRMContactResponse(
            id=str(obj.id),
            tenant_id=str(obj.tenant_id),
            account_id=str(obj.account_id),
            first_name=obj.first_name,
            last_name=obj.last_name,
            email=obj.email,
            phone=obj.phone,
        )
    finally:
        db.close()


@router.post("/opportunities", response_model=OpportunityResponse)
def create_opportunity_route(request: OpportunityCreateRequest):
    db = _db()
    try:
        obj = create_opportunity(db, **request.model_dump())
        return OpportunityResponse(
            id=str(obj.id),
            tenant_id=str(obj.tenant_id),
            title=obj.title,
            stage=obj.stage.value,
            currency=obj.currency,
            estimated_value=float(obj.estimated_value) if obj.estimated_value is not None else None,
        )
    finally:
        db.close()


@router.post("/quotes", response_model=QuoteResponse)
def create_quote_route(request: QuoteCreateRequest):
    db = _db()
    try:
        obj = create_quote(db, **request.model_dump())
        return QuoteResponse(
            id=str(obj.id),
            tenant_id=str(obj.tenant_id),
            quote_number=obj.quote_number,
            status=obj.status.value,
            currency=obj.currency,
            total_amount=float(obj.total_amount),
        )
    finally:
        db.close()


@router.post("/public/tickets", response_model=SupportTicketResponse)
def create_public_ticket_route(request: PublicTicketCreateRequest):
    db = _db()
    try:
        obj = create_public_ticket(db, **request.model_dump())
        obj = sync_ticket_to_glpi(db, obj, entity_id=None)
        return SupportTicketResponse(
            id=str(obj.id),
            tenant_id=str(obj.tenant_id),
            public_token=obj.public_token,
            subject=obj.subject,
            description=obj.description,
            category=obj.category,
            priority=obj.priority.value,
            status=obj.status.value,
            shipment_reference=obj.shipment_reference,
            tracking_reference=obj.tracking_reference,
            glpi_ticket_id=obj.glpi_ticket_id,
        )
    finally:
        db.close()


@router.get("/public/tickets/{public_token}", response_model=SupportTicketResponse)
def get_public_ticket(public_token: str):
    db = _db()
    try:
        obj = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return SupportTicketResponse(
            id=str(obj.id),
            tenant_id=str(obj.tenant_id),
            public_token=obj.public_token,
            subject=obj.subject,
            description=obj.description,
            category=obj.category,
            priority=obj.priority.value,
            status=obj.status.value,
            shipment_reference=obj.shipment_reference,
            tracking_reference=obj.tracking_reference,
            glpi_ticket_id=obj.glpi_ticket_id,
        )
    finally:
        db.close()


@router.get("/public/tickets/{public_token}/messages", response_model=list[SupportTicketMessageResponse])
def get_public_ticket_messages(public_token: str):
    db = _db()
    try:
        ticket = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        rows = (
            db.query(SupportTicketMessage)
            .filter(SupportTicketMessage.ticket_id == ticket.id, SupportTicketMessage.visible_to_public == True)  # noqa: E712
            .order_by(SupportTicketMessage.created_at.asc())
            .all()
        )
        return [
            SupportTicketMessageResponse(
                id=str(x.id),
                ticket_id=str(x.ticket_id),
                author_type=x.author_type,
                author_name=x.author_name,
                body=x.body,
                visible_to_public=x.visible_to_public,
            )
            for x in rows
        ]
    finally:
        db.close()


@router.post("/public/tickets/{public_token}/reply", response_model=SupportTicketMessageResponse)
def reply_public_ticket(public_token: str, request: TicketReplyRequest):
    db = _db()
    try:
        ticket = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        msg = add_ticket_message(
            db=db,
            ticket_id=str(ticket.id),
            body=request.body,
            author_type=request.author_type,
            author_name=request.author_name,
            visible_to_public=request.visible_to_public,
        )
        return SupportTicketMessageResponse(
            id=str(msg.id),
            ticket_id=str(msg.ticket_id),
            author_type=msg.author_type,
            author_name=msg.author_name,
            body=msg.body,
            visible_to_public=msg.visible_to_public,
        )
    finally:
        db.close()
PY

echo "==> Writing documentation"
cat > "$ROOT_DIR/docs/SUPPORT_GLPI_CRM_INTEGRATION.md" <<'MD'
# Support + GLPI + CRM Integration Guide

## Locked decisions
- one shared GLPI with tenant separation
- CRM includes quotes and opportunities from day one
- public ticket intake allowed without login
- GLPI remains the main staff console

## What this scaffold adds
- tenant-scoped CRM accounts
- tenant-scoped CRM contacts
- opportunities
- quotes
- public support tickets
- public ticket replies/messages
- GLPI sync client and sync log
- API routes for core support/CRM operations

## Routes
- `POST /api/v1/support-crm/accounts`
- `POST /api/v1/support-crm/contacts`
- `POST /api/v1/support-crm/opportunities`
- `POST /api/v1/support-crm/quotes`
- `POST /api/v1/support-crm/public/tickets`
- `GET /api/v1/support-crm/public/tickets/{public_token}`
- `GET /api/v1/support-crm/public/tickets/{public_token}/messages`
- `POST /api/v1/support-crm/public/tickets/{public_token}/reply`

## GLPI notes
- shared GLPI instance
- tenant separation should be implemented through entity mapping and sync rules
- staff continues to work in GLPI
- Afruheritage stores ticket metadata, public access token, sync logs, and customer-facing thread

## Required env vars
- `GLPI_BASE_URL`
- `GLPI_APP_TOKEN`
- `GLPI_USER_TOKEN`
- `GLPI_TENANT_SEPARATION_MODE=shared_entities`

## Manual follow-up
- add Alembic migrations
- map tenant_id -> GLPI entity id
- add internal sync jobs for GLPI comment/status backfill
- connect tickets to shipment/tracking entities when those modules are scaffolded
- add tenant/customer portal UI for CRM and public ticket pages
MD

echo "==> Patching requirements.txt"
python3 - <<'PY'
from pathlib import Path

path = Path("requirements.txt")
text = path.read_text(encoding="utf-8")
required = ["httpx"]
lines = text.splitlines()

for pkg in required:
    if not any(line.strip().lower() == pkg for line in lines):
        lines.append(pkg)

path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
print("requirements.txt updated")
PY

echo "==> Patching app/main.py"
python3 - <<'PY'
from pathlib import Path

path = Path("app/main.py")
text = path.read_text(encoding="utf-8")

imports_to_add = [
    "from app.api.routes.support_crm import router as support_crm_router",
]

for imp in imports_to_add:
    if imp not in text:
        text = imp + "\n" + text

route_line = 'app.include_router(support_crm_router, prefix="/api/v1")'
if route_line not in text:
    insertion_point = text.rfind("app.include_router(")
    if insertion_point != -1:
        line_end = text.find("\n", insertion_point)
        text = text[:line_end + 1] + route_line + "\n" + text[line_end + 1:]
    else:
        text += "\n" + route_line + "\n"

path.write_text(text, encoding="utf-8")
print("app/main.py updated")
PY

echo
echo "Scaffold complete."
echo
echo "Saved backups under:"
echo "  $BACKUP_DIR"
echo
echo "Next steps:"
echo "  1) Rebuild containers:"
echo "       sudo docker compose down"
echo "       sudo docker compose up -d --build"
echo "  2) Test account creation:"
echo "       curl -X POST http://localhost:8000/api/v1/support-crm/accounts -H 'Content-Type: application/json' -d '{\"tenant_id\":\"<TENANT_ID>\",\"company_name\":\"Acme Imports\"}'"
echo "  3) Test public ticket creation:"
echo "       curl -X POST http://localhost:8000/api/v1/support-crm/public/tickets -H 'Content-Type: application/json' -d '{\"tenant_id\":\"<TENANT_ID>\",\"public_submitter_name\":\"John Doe\",\"subject\":\"Shipment issue\",\"description\":\"Container delayed\"}'"
echo
echo "Manual follow-up still needed:"
echo "  - add Alembic migrations"
echo "  - map tenant -> GLPI entity"
echo "  - build internal GLPI sync jobs"
echo "  - build CRM and public ticket UI"
