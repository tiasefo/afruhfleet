from __future__ import annotations
from app.core.config import settings

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
from app.services.dns_verification import (
    build_dns_instructions,
    generate_verification_token,
    verify_domain_dns,
)


HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[A-Za-z]{2,63}$"
)


def _resolve_domain_type_for_storage(domain_type: str) -> DomainType:
    """Bridge new API labels to legacy enum labels when required by existing DB enums."""
    normalized = domain_type.strip().lower()
    if normalized == DomainType.PLATFORM_SUBDOMAIN.value:
        return DomainType.PROVIDER_SUBDOMAIN
    if normalized in (DomainType.CUSTOMER_SUBDOMAIN.value, DomainType.APEX.value):
        return DomainType.CUSTOMER_DOMAIN
    return DomainType(normalized)


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
        domain_type=_resolve_domain_type_for_storage(DomainType.PLATFORM_SUBDOMAIN.value),
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
        domain_type=_resolve_domain_type_for_storage(domain_type),
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
        # Manual DNS mode — generate a verification token for the tenant to add as a TXT record
        token = generate_verification_token()
        domain.status = DomainStatus.PENDING_VERIFICATION
        domain.verification_method = VerificationMethod.TXT
        domain.verification_name = f"_afruheritage-verify.{normalized}"
        domain.verification_value = token
        domain.last_error = None
        db.add(domain)
        db.commit()
        db.refresh(domain)
        log_event(db, domain.id, "manual_dns_pending", f"Manual DNS verification pending for {normalized}. Tenant must add TXT record.")

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


def get_dns_instructions(db: Session, domain_id: str) -> dict | None:
    """Get the DNS records a tenant needs to add for their custom domain.

    Works in both Cloudflare and manual modes. In Cloudflare mode, returns the
    records Cloudflare generated. In manual mode, returns the TXT verification
    record plus CNAME/A routing records.
    """
    domain = db.query(CustomDomain).filter(CustomDomain.id == domain_id).first()
    if not domain:
        return None

    settings_row = db.query(TenantDomainSettings).filter(
        TenantDomainSettings.tenant_id == domain.tenant_id
    ).first()
    platform_fallback = settings_row.platform_subdomain if settings_row else "afruheritage.com"

    client = CloudflareDomainClient()
    provider_mode = "cloudflare" if client.enabled() else "manual"

    token = domain.verification_value or generate_verification_token()
    if not domain.verification_value:
        domain.verification_value = token
        domain.verification_name = f"_afruheritage-verify.{domain.hostname}"
        db.commit()

    instructions = build_dns_instructions(
        hostname=domain.hostname,
        verification_token=token,
        platform_fallback=platform_fallback,
        provider_mode=provider_mode,
    )

    return {
        "hostname": instructions.hostname,
        "verification_token": instructions.verification_token,
        "records": [
            {
                "record_type": r.record_type,
                "name": r.name,
                "value": r.value,
                "priority": r.priority,
                "ttl": r.ttl,
                "purpose": r.purpose,
            }
            for r in instructions.records
        ],
        "instructions_text": instructions.instructions_text,
        "provider_mode": instructions.provider_mode,
    }


def verify_and_activate_domain(db: Session, domain_id: str) -> dict:
    """Verify a domain's DNS records and auto-activate if all checks pass.

    In Cloudflare mode, polls Cloudflare for status.
    In manual mode, does direct DNS lookups via dnspython.
    """
    domain = db.query(CustomDomain).filter(CustomDomain.id == domain_id).first()
    if not domain:
        return {"error": "Domain not found"}

    if domain.status == DomainStatus.ACTIVE:
        return {"status": "active", "message": "Domain is already active"}

    settings_row = db.query(TenantDomainSettings).filter(
        TenantDomainSettings.tenant_id == domain.tenant_id
    ).first()
    platform_fallback = settings_row.platform_subdomain if settings_row else "afruheritage.com"

    client = CloudflareDomainClient()

    if client.enabled() and domain.cloudflare_hostname_id:
        # Cloudflare mode — poll Cloudflare API
        from app.services.cloudflare_domains import get_custom_hostname_status
        cf_status = get_custom_hostname_status(domain.cloudflare_hostname_id)
        if cf_status:
            ssl_status = cf_status.get("ssl", {}).get("status", "")
            cf_hostname_status = cf_status.get("status", "")
            domain.ssl_status = ssl_status

            if cf_hostname_status == "active" and ssl_status == "active":
                domain.status = DomainStatus.ACTIVE
                domain.last_error = None
                _update_tenant_custom_domain(db, domain)
                log_event(db, domain.id, "domain_active", "Domain verified and SSL active (Cloudflare)")
                db.commit()
                return {"status": "active", "message": "Domain verified and activated via Cloudflare"}

            return {
                "status": domain.status.value,
                "ssl_status": ssl_status,
                "cf_status": cf_hostname_status,
                "message": f"Cloudflare status: {cf_hostname_status}, SSL: {ssl_status}",
            }
        else:
            return {"status": domain.status.value, "message": "Could not fetch Cloudflare status"}

    # Manual mode — do DNS lookups
    if not domain.verification_value:
        return {"status": domain.status.value, "error": "No verification token set"}

    result = verify_domain_dns(
        hostname=domain.hostname,
        verification_token=domain.verification_value,
        platform_fallback=platform_fallback,
    )

    if result["all_verified"]:
        domain.status = DomainStatus.ACTIVE
        domain.ssl_status = "active"
        domain.last_error = None
        _update_tenant_custom_domain(db, domain)
        log_event(db, domain.id, "domain_active", "Domain verified via DNS lookup (manual mode)")
        db.commit()
        return {
            "status": "active",
            "message": "Domain verified and activated!",
            "verification": result,
        }

    return {
        "status": domain.status.value,
        "message": "DNS records not yet propagated. Please wait and try again.",
        "verification": result,
    }


def _update_tenant_custom_domain(db: Session, domain: CustomDomain) -> None:
    """Update the Tenant model's custom_domain field when a domain becomes active."""
    from app.models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == domain.tenant_id).first()
    if tenant:
        tenant.custom_domain = domain.hostname
        tenant.custom_domain_verified = True
        db.add(tenant)

    # Also update TenantDomainSettings
    settings = db.query(TenantDomainSettings).filter(
        TenantDomainSettings.tenant_id == domain.tenant_id
    ).first()
    if settings:
        settings.active_primary_hostname = domain.hostname
        db.add(settings)


def log_event(db: Session, domain_id, event_type: str, message: str, payload: dict | None = None) -> None:
    row = CustomDomainEvent(
        domain_id=domain_id,
        event_type=event_type,
        message=message,
        payload_json=json.dumps(payload) if payload else None,
    )
    db.add(row)
    db.commit()
