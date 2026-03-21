#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
APP_DIR="$ROOT_DIR/app"
BACKUP_DIR="$ROOT_DIR/.scaffold_backups/04_custom_domains_$(date +%Y%m%d_%H%M%S)"

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

echo "==> Writing custom domain models"
cat > "$APP_DIR/models/custom_domains.py" <<'PY'
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class DomainType(str, PyEnum):
    PLATFORM_SUBDOMAIN = "platform_subdomain"
    CUSTOMER_SUBDOMAIN = "customer_subdomain"
    APEX = "apex"


class DomainStatus(str, PyEnum):
    REQUESTED = "requested"
    PENDING_VERIFICATION = "pending_verification"
    PENDING_SSL = "pending_ssl"
    ACTIVE = "active"
    FAILED = "failed"
    DISABLED = "disabled"
    REMOVED = "removed"


class VerificationMethod(str, PyEnum):
    TXT = "txt"
    CNAME = "cname"
    HTTP = "http"
    NONE = "none"


class DomainProvider(str, PyEnum):
    CLOUDFLARE = "cloudflare"
    INTERNAL = "internal"


class CustomDomain(Base):
    __tablename__ = "custom_domains"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    hostname: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    domain_type: Mapped[DomainType] = mapped_column(Enum(DomainType), nullable=False)
    status: Mapped[DomainStatus] = mapped_column(Enum(DomainStatus), nullable=False, default=DomainStatus.REQUESTED)
    provider: Mapped[DomainProvider] = mapped_column(Enum(DomainProvider), nullable=False, default=DomainProvider.CLOUDFLARE)

    verification_method: Mapped[VerificationMethod] = mapped_column(Enum(VerificationMethod), nullable=False, default=VerificationMethod.NONE)
    verification_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_value: Mapped[str | None] = mapped_column(Text, nullable=True)

    ssl_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    routing_target: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cloudflare_hostname_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    fallback_hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fallback_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CustomDomainEvent(Base):
    __tablename__ = "custom_domain_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("custom_domains.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class TenantDomainSettings(Base):
    __tablename__ = "tenant_domain_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)

    platform_subdomain: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    active_primary_hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    fallback_hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    fallback_always_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
PY

echo "==> Writing custom domain schemas"
cat > "$APP_DIR/schemas/custom_domains.py" <<'PY'
from __future__ import annotations

from pydantic import BaseModel, Field


class DomainRequestCreate(BaseModel):
    tenant_id: str
    hostname: str = Field(..., min_length=3, max_length=255)
    domain_type: str = Field(..., pattern="^(customer_subdomain|apex|platform_subdomain)$")
    created_by: str | None = None


class DomainResponse(BaseModel):
    id: str
    tenant_id: str
    hostname: str
    domain_type: str
    status: str
    provider: str
    verification_method: str
    verification_name: str | None = None
    verification_value: str | None = None
    ssl_status: str | None = None
    fallback_hostname: str | None = None
    fallback_active: bool
    last_error: str | None = None


class DomainEventResponse(BaseModel):
    id: str
    domain_id: str
    event_type: str
    message: str
    payload_json: str | None = None


class DomainActivateRequest(BaseModel):
    tenant_id: str
    hostname: str


class DomainFailRequest(BaseModel):
    reason: str


class TenantDomainSettingsResponse(BaseModel):
    tenant_id: str
    platform_subdomain: str
    active_primary_hostname: str
    fallback_hostname: str
    fallback_always_active: bool
PY

echo "==> Writing Cloudflare client"
cat > "$APP_DIR/services/cloudflare_domains.py" <<'PY'
from __future__ import annotations

import os

import httpx


class CloudflareDomainClient:
    def __init__(self) -> None:
        self.api_token = os.getenv("CLOUDFLARE_API_TOKEN", "")
        self.zone_id = os.getenv("CLOUDFLARE_ZONE_ID", "")
        self.base_url = "https://api.cloudflare.com/client/v4"

    def enabled(self) -> bool:
        return bool(self.api_token and self.zone_id)

    def _headers(self) -> dict[str, str]:
        if not self.enabled():
            raise RuntimeError("Cloudflare domain config is not complete")
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    def create_custom_hostname(self, hostname: str, fallback_origin: str) -> dict:
        payload = {
            "hostname": hostname,
            "ssl": {"method": "txt", "type": "dv"},
            "custom_origin_server": fallback_origin,
        }
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                f"{self.base_url}/zones/{self.zone_id}/custom_hostnames",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    def get_custom_hostname(self, hostname_id: str) -> dict:
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(
                f"{self.base_url}/zones/{self.zone_id}/custom_hostnames/{hostname_id}",
                headers=self._headers(),
            )
            resp.raise_for_status()
            return resp.json()
PY

echo "==> Writing custom domain service"
cat > "$APP_DIR/services/custom_domain_service.py" <<'PY'
from __future__ import annotations

import json
import re
from sqlalchemy.orm import Session

from app.models.custom_domains import (
    CustomDomain,
    CustomDomainEvent,
    DomainProvider,
    DomainStatus,
    DomainType,
    TenantDomainSettings,
    VerificationMethod,
)
from app.services.cloudflare_domains import CloudflareDomainClient


HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[A-Za-z]{2,63}$"
)


def validate_hostname(hostname: str) -> str:
    normalized = hostname.strip().lower()
    if not HOSTNAME_RE.match(normalized):
        raise ValueError("Invalid hostname format")
    return normalized


def ensure_tenant_domain_settings(db: Session, tenant_id: str, tenant_slug: str) -> TenantDomainSettings:
    settings = db.query(TenantDomainSettings).filter(TenantDomainSettings.tenant_id == tenant_id).first()
    if settings:
        return settings

    platform_subdomain = f"{tenant_slug}.afruheritage.com"
    settings = TenantDomainSettings(
        tenant_id=tenant_id,
        platform_subdomain=platform_subdomain,
        active_primary_hostname=platform_subdomain,
        fallback_hostname=platform_subdomain,
        fallback_always_active=True,
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def create_platform_domain_if_missing(db: Session, tenant_id: str, tenant_slug: str) -> CustomDomain:
    platform_hostname = f"{tenant_slug}.afruheritage.com"
    existing = db.query(CustomDomain).filter(CustomDomain.hostname == platform_hostname).first()
    if existing:
        return existing

    domain = CustomDomain(
        tenant_id=tenant_id,
        hostname=platform_hostname,
        domain_type=DomainType.PLATFORM_SUBDOMAIN,
        status=DomainStatus.ACTIVE,
        provider=DomainProvider.INTERNAL,
        verification_method=VerificationMethod.NONE,
        ssl_status="active",
        fallback_hostname=platform_hostname,
        fallback_active=True,
        routing_target=platform_hostname,
        created_by="system",
    )
    db.add(domain)
    db.commit()
    db.refresh(domain)

    log_event(db, domain.id, "platform_domain_created", f"Platform fallback domain {platform_hostname} created")
    return domain


def request_custom_domain(db: Session, *, tenant_id: str, hostname: str, domain_type: str, tenant_slug: str, created_by: str | None = None) -> CustomDomain:
    normalized = validate_hostname(hostname)

    existing = db.query(CustomDomain).filter(CustomDomain.hostname == normalized).first()
    if existing:
        raise ValueError("Hostname already exists")

    settings = ensure_tenant_domain_settings(db, tenant_id, tenant_slug)
    create_platform_domain_if_missing(db, tenant_id, tenant_slug)

    domain = CustomDomain(
        tenant_id=tenant_id,
        hostname=normalized,
        domain_type=DomainType(domain_type),
        status=DomainStatus.REQUESTED,
        provider=DomainProvider.CLOUDFLARE,
        verification_method=VerificationMethod.TXT,
        fallback_hostname=settings.fallback_hostname,
        fallback_active=True,
        routing_target=settings.platform_subdomain,
        created_by=created_by,
    )
    db.add(domain)
    db.commit()
    db.refresh(domain)

    log_event(db, domain.id, "domain_requested", f"Custom domain {normalized} requested", {"domain_type": domain_type})

    client = CloudflareDomainClient()
    if client.enabled():
        try:
            result = client.create_custom_hostname(normalized, settings.platform_subdomain)
            data = result.get("result", {})
            ownership = data.get("ownership_verification") or {}
            ssl = data.get("ssl") or {}

            domain.cloudflare_hostname_id = data.get("id")
            domain.status = DomainStatus.PENDING_VERIFICATION
            domain.verification_method = VerificationMethod.TXT
            domain.verification_name = ownership.get("name")
            domain.verification_value = ownership.get("value")
            domain.ssl_status = ssl.get("status")
            db.add(domain)
            db.commit()
            db.refresh(domain)

            log_event(db, domain.id, "cloudflare_hostname_created", "Cloudflare custom hostname created", result)
        except Exception as exc:
            domain.status = DomainStatus.FAILED
            domain.last_error = str(exc)
            db.add(domain)
            db.commit()
            db.refresh(domain)
            log_event(db, domain.id, "cloudflare_hostname_failed", f"Cloudflare custom hostname creation failed: {exc}")
    else:
        domain.status = DomainStatus.PENDING_VERIFICATION
        domain.last_error = "Cloudflare not configured"
        db.add(domain)
        db.commit()
        db.refresh(domain)
        log_event(db, domain.id, "domain_pending_manual_setup", "Cloudflare not configured; manual setup required")

    return domain


def activate_domain(db: Session, tenant_id: str, hostname: str) -> CustomDomain | None:
    domain = (
        db.query(CustomDomain)
        .filter(CustomDomain.tenant_id == tenant_id, CustomDomain.hostname == hostname)
        .first()
    )
    if not domain:
        return None

    domain.status = DomainStatus.ACTIVE
    domain.ssl_status = "active"
    db.add(domain)

    settings = db.query(TenantDomainSettings).filter(TenantDomainSettings.tenant_id == tenant_id).first()
    if settings:
        settings.active_primary_hostname = domain.hostname
        db.add(settings)

    db.commit()
    db.refresh(domain)
    log_event(db, domain.id, "domain_activated", f"Domain {hostname} activated")
    return domain


def mark_domain_failed(db: Session, domain_id: str, reason: str) -> CustomDomain | None:
    domain = db.query(CustomDomain).filter(CustomDomain.id == domain_id).first()
    if not domain:
        return None
    domain.status = DomainStatus.FAILED
    domain.last_error = reason
    db.add(domain)
    db.commit()
    db.refresh(domain)
    log_event(db, domain.id, "domain_failed", reason)
    return domain


def list_tenant_domains(db: Session, tenant_id: str) -> list[CustomDomain]:
    return db.query(CustomDomain).filter(CustomDomain.tenant_id == tenant_id).order_by(CustomDomain.created_at.asc()).all()


def log_event(db: Session, domain_id, event_type: str, message: str, payload: dict | None = None) -> None:
    row = CustomDomainEvent(
        domain_id=domain_id,
        event_type=event_type,
        message=message,
        payload_json=json.dumps(payload) if payload else None,
    )
    db.add(row)
    db.commit()
PY

echo "==> Writing custom domain routes"
cat > "$APP_DIR/api/routes/custom_domains.py" <<'PY'
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.custom_domains import CustomDomain, CustomDomainEvent, TenantDomainSettings
from app.schemas.custom_domains import (
    DomainActivateRequest,
    DomainEventResponse,
    DomainFailRequest,
    DomainRequestCreate,
    DomainResponse,
    TenantDomainSettingsResponse,
)
from app.services.custom_domain_service import (
    activate_domain,
    ensure_tenant_domain_settings,
    list_tenant_domains,
    mark_domain_failed,
    request_custom_domain,
)

router = APIRouter(prefix="/domains", tags=["Custom Domains"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _db() -> Session:
    return SessionLocal()


@router.post("/request", response_model=DomainResponse)
def request_domain(request: DomainRequestCreate):
    db = _db()
    try:
        tenant_slug = request.tenant_id[:12].replace("-", "")
        domain = request_custom_domain(
            db=db,
            tenant_id=request.tenant_id,
            hostname=request.hostname,
            domain_type=request.domain_type,
            tenant_slug=tenant_slug,
            created_by=request.created_by,
        )
        return DomainResponse(
            id=str(domain.id),
            tenant_id=str(domain.tenant_id),
            hostname=domain.hostname,
            domain_type=domain.domain_type.value,
            status=domain.status.value,
            provider=domain.provider.value,
            verification_method=domain.verification_method.value,
            verification_name=domain.verification_name,
            verification_value=domain.verification_value,
            ssl_status=domain.ssl_status,
            fallback_hostname=domain.fallback_hostname,
            fallback_active=domain.fallback_active,
            last_error=domain.last_error,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.get("/tenant/{tenant_id}", response_model=list[DomainResponse])
def get_tenant_domains(tenant_id: str):
    db = _db()
    try:
        rows = list_tenant_domains(db, tenant_id)
        return [
            DomainResponse(
                id=str(x.id),
                tenant_id=str(x.tenant_id),
                hostname=x.hostname,
                domain_type=x.domain_type.value,
                status=x.status.value,
                provider=x.provider.value,
                verification_method=x.verification_method.value,
                verification_name=x.verification_name,
                verification_value=x.verification_value,
                ssl_status=x.ssl_status,
                fallback_hostname=x.fallback_hostname,
                fallback_active=x.fallback_active,
                last_error=x.last_error,
            )
            for x in rows
        ]
    finally:
        db.close()


@router.post("/activate", response_model=DomainResponse | None)
def activate_domain_route(request: DomainActivateRequest):
    db = _db()
    try:
        domain = activate_domain(db, tenant_id=request.tenant_id, hostname=request.hostname)
        if not domain:
            return None
        return DomainResponse(
            id=str(domain.id),
            tenant_id=str(domain.tenant_id),
            hostname=domain.hostname,
            domain_type=domain.domain_type.value,
            status=domain.status.value,
            provider=domain.provider.value,
            verification_method=domain.verification_method.value,
            verification_name=domain.verification_name,
            verification_value=domain.verification_value,
            ssl_status=domain.ssl_status,
            fallback_hostname=domain.fallback_hostname,
            fallback_active=domain.fallback_active,
            last_error=domain.last_error,
        )
    finally:
        db.close()


@router.post("/{domain_id}/fail", response_model=DomainResponse | None)
def fail_domain(domain_id: str, request: DomainFailRequest):
    db = _db()
    try:
        domain = mark_domain_failed(db, domain_id=domain_id, reason=request.reason)
        if not domain:
            return None
        return DomainResponse(
            id=str(domain.id),
            tenant_id=str(domain.tenant_id),
            hostname=domain.hostname,
            domain_type=domain.domain_type.value,
            status=domain.status.value,
            provider=domain.provider.value,
            verification_method=domain.verification_method.value,
            verification_name=domain.verification_name,
            verification_value=domain.verification_value,
            ssl_status=domain.ssl_status,
            fallback_hostname=domain.fallback_hostname,
            fallback_active=domain.fallback_active,
            last_error=domain.last_error,
        )
    finally:
        db.close()


@router.get("/{domain_id}/events", response_model=list[DomainEventResponse])
def get_domain_events(domain_id: str):
    db = _db()
    try:
        rows = (
            db.query(CustomDomainEvent)
            .filter(CustomDomainEvent.domain_id == domain_id)
            .order_by(CustomDomainEvent.created_at.asc())
            .all()
        )
        return [
            DomainEventResponse(
                id=str(x.id),
                domain_id=str(x.domain_id),
                event_type=x.event_type,
                message=x.message,
                payload_json=x.payload_json,
            )
            for x in rows
        ]
    finally:
        db.close()


@router.get("/settings/{tenant_id}", response_model=TenantDomainSettingsResponse | None)
def get_tenant_domain_settings(tenant_id: str):
    db = _db()
    try:
        row = db.query(TenantDomainSettings).filter(TenantDomainSettings.tenant_id == tenant_id).first()
        if not row:
            return None
        return TenantDomainSettingsResponse(
            tenant_id=str(row.tenant_id),
            platform_subdomain=row.platform_subdomain,
            active_primary_hostname=row.active_primary_hostname,
            fallback_hostname=row.fallback_hostname,
            fallback_always_active=row.fallback_always_active,
        )
    finally:
        db.close()
PY

echo "==> Writing domain docs"
cat > "$ROOT_DIR/docs/CUSTOM_DOMAIN_INTEGRATION.md" <<'MD'
# Custom Domain Integration Guide

## Locked decisions
- apex domains supported from day one
- fallback Afruheritage domain remains active
- custom domains available for all tiers
- Cloudflare is the first implementation provider

## What this scaffold adds
- domain request model
- domain events
- tenant domain settings
- Cloudflare custom-hostname client
- request/activate/fail/list endpoints
- fallback hostname preservation

## Routes
- `POST /api/v1/domains/request`
- `GET /api/v1/domains/tenant/{tenant_id}`
- `POST /api/v1/domains/activate`
- `POST /api/v1/domains/{domain_id}/fail`
- `GET /api/v1/domains/{domain_id}/events`
- `GET /api/v1/domains/settings/{tenant_id}`

## Notes
- all tenants still keep their Afruheritage fallback hostname
- active primary hostname can switch to the customer domain
- Cloudflare custom hostname creation is attempted when configured
- manual activation endpoint exists for first-implementation operations

## Required env vars
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`

## Manual follow-up
- add Alembic migrations
- map tenant slug properly instead of using placeholder fallback in route
- integrate domain setup into tenant provisioning workflow
- add webhook/status poller for Cloudflare hostname validation/SSL
- update Nginx/edge routing to honor active_primary_hostname
MD

echo "==> Patching app/main.py"
python3 - <<'PY'
from pathlib import Path

path = Path("app/main.py")
text = path.read_text(encoding="utf-8")

imports_to_add = [
    "from app.api.routes.custom_domains import router as custom_domains_router",
]

for imp in imports_to_add:
    if imp not in text:
        text = imp + "\n" + text

route_line = 'app.include_router(custom_domains_router, prefix="/api/v1")'
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
echo "  2) Test domain request:"
echo "       curl -X POST http://localhost:8000/api/v1/domains/request -H 'Content-Type: application/json' -d '{\"tenant_id\":\"<TENANT_ID>\",\"hostname\":\"app.customer.com\",\"domain_type\":\"customer_subdomain\"}'"
echo "  3) Test settings:"
echo "       curl http://localhost:8000/api/v1/domains/settings/<TENANT_ID>"
echo
echo "Manual follow-up still needed:"
echo "  - add Alembic migrations"
echo "  - tie real tenant slug into provisioning"
echo "  - add Cloudflare status sync job"
echo "  - update edge routing to honor active primary hostnames"
