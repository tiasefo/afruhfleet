from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser
from app.db.session import get_db
from app.models.custom_domains import CustomDomain, CustomDomainEvent, TenantDomainSettings
from app.models.user import User
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


@router.post("/request", response_model=DomainResponse)
def request_domain(
    request: DomainRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_slug = request.tenant_id[:12].replace("-", "")
    try:
        domain = request_custom_domain(
            db=db,
            tenant_id=request.tenant_id,
            hostname=request.hostname,
            domain_type=request.domain_type,
            tenant_slug=tenant_slug,
            created_by=request.created_by,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
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


@router.get("/tenant/{tenant_id}", response_model=list[DomainResponse])
def get_tenant_domains(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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


@router.post("/activate", response_model=DomainResponse | None)
def activate_domain_route(
    request: DomainActivateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
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


@router.post("/{domain_id}/fail", response_model=DomainResponse | None)
def fail_domain(
    domain_id: str,
    request: DomainFailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
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


@router.get("/{domain_id}/events", response_model=list[DomainEventResponse])
def get_domain_events(
    domain_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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


@router.get("/settings/{tenant_id}", response_model=TenantDomainSettingsResponse | None)
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
