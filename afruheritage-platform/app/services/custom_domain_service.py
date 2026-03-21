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
