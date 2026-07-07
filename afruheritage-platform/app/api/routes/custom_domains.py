from __future__ import annotations
from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, require_superuser, require_feature
from app.db.session import get_db
from app.models.custom_domains import CustomDomain, CustomDomainEvent, DomainStatus, TenantDomainSettings
from app.models.user import User
from app.schemas.custom_domains import (
    DNSInstructionsResponse,
    DNSVerificationResult,
    DomainActivateRequest,
    DomainEventResponse,
    DomainFailRequest,
    DomainRequestCreate,
    DomainRequestSimple,
    DomainResponse,
    TenantDomainSettingsResponse,
)
from app.services.custom_domain_service import (
    activate_domain,
    ensure_tenant_domain_settings,
    get_dns_instructions,
    list_tenant_domains,
    log_event,
    mark_domain_failed,
    request_custom_domain,
    verify_and_activate_domain,
)
from app.services.cloudflare_domains import get_custom_hostname_status
router = APIRouter(prefix='/domains', tags=['Custom Domains'])


def _domain_to_response(domain: CustomDomain, include_dns: bool = False) -> DomainResponse:
    dns_instructions = None
    if include_dns and domain.verification_value:
        dns_instructions = DNSInstructionsResponse(
            hostname=domain.hostname,
            verification_token=domain.verification_value,
            records=[],
            instructions_text="",
            provider_mode="cloudflare" if domain.cloudflare_hostname_id else "manual",
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
        dns_instructions=dns_instructions,
    )


@router.get('/resolve', response_model=dict)
def resolve_hostname(hostname: str = Query(..., description="Full hostname to resolve"), db: Session = Depends(get_db)):
    """Public endpoint — resolves any hostname (subdomain OR custom domain) to a tenant_id.
    Called by Next.js middleware on every request from unknown hostnames."""
    hostname = hostname.strip().lower()

    # 1. Check custom domain table for an active match
    domain = db.query(CustomDomain).filter(
        CustomDomain.hostname == hostname,
        CustomDomain.status == DomainStatus.ACTIVE,
    ).first()
    if domain:
        return {'tenant_id': str(domain.tenant_id), 'hostname': hostname, 'source': 'custom_domain'}

    # 2. Also allow pending-verification domains so companies can test before SSL is live
    domain = db.query(CustomDomain).filter(
        CustomDomain.hostname == hostname,
    ).first()
    if domain:
        return {'tenant_id': str(domain.tenant_id), 'hostname': hostname, 'source': 'custom_domain', 'status': domain.status.value}

    # 3. Try subdomain → tenant slug lookup via TenantDomainSettings
    settings_row = db.query(TenantDomainSettings).filter(
        TenantDomainSettings.platform_subdomain == hostname,
    ).first()
    if settings_row:
        return {'tenant_id': str(settings_row.tenant_id), 'hostname': hostname, 'source': 'platform_subdomain'}

    raise HTTPException(status_code=404, detail='Hostname not associated with any tenant.')


# ─── Tenant self-service endpoints (auto-resolve tenant from auth user) ───

@router.post('/request-simple', response_model=DomainResponse)
def request_domain_simple(
    request: DomainRequestSimple,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature('custom_domain')),
):
    """Simplified domain request — auto-resolves tenant from the authenticated user.
    No need to pass tenant_id. Determines domain_type automatically."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User is not associated with a tenant")

    effective_tenant_id = str(current_user.tenant_id)
    tenant_slug = effective_tenant_id[:12].replace('-', '')

    # Determine domain type: apex if no subdomain, customer_subdomain otherwise
    parts = request.hostname.split(".")
    domain_type = "apex" if len(parts) <= 2 else "customer_subdomain"

    try:
        domain = request_custom_domain(
            db=db,
            tenant_id=effective_tenant_id,
            hostname=request.hostname,
            domain_type=domain_type,
            tenant_slug=tenant_slug,
            created_by=current_user.email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _domain_to_response(domain, include_dns=True)


@router.get('/my-domains', response_model=list[DomainResponse])
def get_my_domains(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all custom domains for the authenticated user's tenant."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User is not associated with a tenant")
    rows = list_tenant_domains(db, str(current_user.tenant_id))
    return [_domain_to_response(x, include_dns=True) for x in rows]


@router.get('/{domain_id}/dns-instructions', response_model=DNSInstructionsResponse)
def get_domain_dns_instructions(
    domain_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the DNS records a tenant needs to add at their registrar for this domain."""
    instructions = get_dns_instructions(db, domain_id)
    if not instructions:
        raise HTTPException(status_code=404, detail="Domain not found")
    return DNSInstructionsResponse(**instructions)


@router.post('/{domain_id}/verify', response_model=dict)
def verify_domain(
    domain_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify a domain's DNS records and auto-activate if all checks pass.
    Works in both Cloudflare and manual DNS modes."""
    result = verify_and_activate_domain(db, domain_id)
    if "error" in result and result.get("error") == "Domain not found":
        raise HTTPException(status_code=404, detail="Domain not found")
    return result


@router.get('/{domain_id}/refresh-status', response_model=DomainResponse)
def refresh_domain_status(
    domain_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Polls Cloudflare for the latest SSL/verification status and updates the record."""
    domain = db.query(CustomDomain).filter(CustomDomain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail='Domain not found')
    if domain.cloudflare_hostname_id:
        cf_result = get_custom_hostname_status(domain.cloudflare_hostname_id)
        if cf_result:
            ssl = cf_result.get('ssl', {})
            domain.ssl_status = ssl.get('status', domain.ssl_status)
            if cf_result.get('status') == 'active':
                domain.status = DomainStatus.ACTIVE
            db.commit()
            db.refresh(domain)
    return _domain_to_response(domain)


# ─── Legacy endpoints (kept for backward compatibility) ───

@router.post('/request', response_model=DomainResponse)
def request_domain(
    tenant_id: str,
    request: DomainRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature('custom_domain')),
):
    effective_tenant_id = current_user.tenant_id or tenant_id or request.tenant_id
    if not effective_tenant_id:
        raise HTTPException(status_code=400, detail="No tenant_id provided and user has no tenant")
    tenant_slug = str(effective_tenant_id)[:12].replace('-', '')
    try:
        domain = request_custom_domain(
            db=db,
            tenant_id=effective_tenant_id,
            hostname=request.hostname,
            domain_type=request.domain_type,
            tenant_slug=tenant_slug,
            created_by=request.created_by,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _domain_to_response(domain, include_dns=True)


@router.get('/tenant/{tenant_id}', response_model=list[DomainResponse])
def get_tenant_domains(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = list_tenant_domains(db, tenant_id)
    return [_domain_to_response(x) for x in rows]


@router.post('/activate', response_model=DomainResponse | None)
def activate_domain_route(
    request: DomainActivateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    domain = activate_domain(db, tenant_id=request.tenant_id, hostname=request.hostname)
    if not domain:
        return None
    return _domain_to_response(domain)


@router.post('/{domain_id}/fail', response_model=DomainResponse | None)
def fail_domain(
    domain_id: str,
    request: DomainFailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    domain = mark_domain_failed(db, domain_id=domain_id, reason=request.reason)
    if not domain:
        return None
    return _domain_to_response(domain)


@router.get('/{domain_id}/events', response_model=list[DomainEventResponse])
def get_domain_events(
    domain_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(CustomDomainEvent).filter(CustomDomainEvent.domain_id == domain_id).order_by(CustomDomainEvent.created_at.asc()).all()
    return [DomainEventResponse(id=str(x.id), domain_id=str(x.domain_id), event_type=x.event_type, message=x.message, payload_json=x.payload_json) for x in rows]


@router.get('/settings/{tenant_id}', response_model=TenantDomainSettingsResponse | None)
def get_tenant_domain_settings(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
