from app.core.config import settings
import uuid
from slugify import slugify
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import require_superuser
from app.db.session import get_db
from app.models.tenant import DomainType, LaunchStatus, ProvisioningJob, Tenant
from app.models.user import User
from app.schemas.tenant import ApprovalRequest, JobResponse, LaunchRequest, TenantCreate, TenantResponse, TenantRuntimeAuthUpdate
from app.services.audit_service import record_audit_event
from app.services.billing_service import create_trial_subscription, ensure_wallet
from app.services.notification_service import get_notification_service
from app.services.tenant_creation_service import TenantCreationService
from app.middleware.rate_limit import rate_limit
router = APIRouter(prefix='/tenants', tags=['tenants'])


def _resolve_uuid(value: str):
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return value

@router.post('', response_model=TenantResponse)
def create_tenant(payload: TenantCreate, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> Tenant:
    slug = slugify(payload.company_name)
    if db.scalar(select(Tenant).where((Tenant.slug == slug) | (Tenant.contact_email == payload.contact_email.lower()) | (Tenant.requested_domain == payload.requested_domain.lower()))):
        raise HTTPException(status_code=409, detail='Tenant already exists with same slug, email, or domain')
    # Normalise common aliases that callers (tests, frontend) may send.
    _DOMAIN_TYPE_ALIASES: dict[str, str] = {
        "custom": DomainType.customer_domain.value,
        "apex": DomainType.customer_domain.value,
        "subdomain": DomainType.provider_subdomain.value,
        "provider": DomainType.provider_subdomain.value,
        "provider_sub": DomainType.provider_subdomain.value,
    }
    normalised = _DOMAIN_TYPE_ALIASES.get(
        (payload.domain_type or "").lower().strip(),
        (payload.domain_type or "").lower().strip(),
    )
    try:
        domain_type = DomainType(normalised)
    except ValueError:
        # Fall back to provider_subdomain rather than hard-rejecting; the admin
        # can correct it after tenant creation.
        domain_type = DomainType.provider_subdomain
    tenant = Tenant(company_name=payload.company_name, slug=slug, contact_email=payload.contact_email.lower(), plan_code=payload.plan_code, requested_domain=payload.requested_domain.lower(), domain_type=domain_type, verification_notes=payload.verification_notes, launch_status=LaunchStatus.pending_verification)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    if payload.plan_code == 'free_trial':
        create_trial_subscription(db, tenant_id=str(tenant.id))
        ensure_wallet(db, tenant_id=str(tenant.id))
    record_audit_event(db, current_user, 'tenant.created', 'tenant', str(tenant.id), {'company_name': tenant.company_name})
    return tenant

@router.get('', response_model=list[TenantResponse])
def list_tenants(db: Session=Depends(get_db), _: User=Depends(require_superuser)) -> list[Tenant]:
    return list(db.scalars(select(Tenant).order_by(Tenant.created_at.desc())).all())

@router.post('/{tenant_id}/approve', response_model=TenantResponse)
def approve_tenant(tenant_id: str, payload: ApprovalRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> Tenant:
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    tenant.launch_status = LaunchStatus.approved
    tenant.verification_notes = payload.verification_notes
    db.commit()
    db.refresh(tenant)
    record_audit_event(db, current_user, 'tenant.approved', 'tenant', str(tenant.id), {'notes': payload.verification_notes})
    try:
        notification_service = get_notification_service(db)
        notification_service.send_tenant_approved_email(to=tenant.contact_email, company_name=tenant.company_name, login_url='https://app.afruheritage.com/login')
    except Exception as e:
        import logging
        logging.getLogger('afruheritage.notifications').error('Failed to send approval email: %s', e)
    return tenant

@router.post('/{tenant_id}/launch', response_model=JobResponse)
@rate_limit(category='admin', rule='provision')
async def launch_tenant(request: Request, tenant_id: str, payload: LaunchRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> ProvisioningJob:
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    if tenant.launch_status != LaunchStatus.approved:
        raise HTTPException(status_code=409, detail='Tenant must be approved before launch')
    try:
        job = TenantCreationService(db).queue_tenant_launch(tenant, runner_id=payload.runner_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    record_audit_event(db, current_user, 'tenant.launch.requested', 'tenant', str(tenant.id), {'runner_id': str(tenant.runner_id) if tenant.runner_id else None, 'job_id': str(job.id)})
    return job


@router.post('/{tenant_id}/runtime-auth', response_model=TenantResponse)
def update_tenant_runtime_auth(tenant_id: str, payload: TenantRuntimeAuthUpdate, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> Tenant:
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')

    if payload.clear_live_api_token:
        tenant.live_api_token = None
    elif payload.live_api_token is not None:
        tenant.live_api_token = payload.live_api_token

    if payload.live_api_auth_scheme:
        tenant.live_api_auth_scheme = payload.live_api_auth_scheme.lower()

    db.commit()
    db.refresh(tenant)
    record_audit_event(db, current_user, 'tenant.runtime_auth.updated', 'tenant', str(tenant.id), {'auth_scheme': tenant.live_api_auth_scheme, 'token_configured': bool(tenant.live_api_token)})
    return tenant

@router.get('/jobs/{job_id}', response_model=JobResponse)
def get_job(job_id: str, db: Session=Depends(get_db), _: User=Depends(require_superuser)) -> ProvisioningJob:
    job = db.get(ProvisioningJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job

@router.post('/jobs/{job_id}/retry', response_model=JobResponse)
def retry_job(job_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> ProvisioningJob:
    job = db.get(ProvisioningJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    tenant = db.get(Tenant, job.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    if job.status not in (LaunchStatus.failed,):
        raise HTTPException(status_code=409, detail='Only failed jobs can be retried')
    if not tenant.runner_id:
        raise HTTPException(status_code=409, detail='Tenant runner is not assigned')
    try:
        assert_tenant_launch_ready(db, str(tenant.id))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    job.status = LaunchStatus.queued
    job.details = 'Retry requested by admin'
    tenant.launch_status = LaunchStatus.queued
    db.commit()
    db.refresh(job)

    async_result = provision_tenant.delay(str(job.id))
    job.task_id = async_result.id
    db.commit()
    db.refresh(job)

    record_audit_event(db, current_user, 'tenant.launch.retried', 'tenant', str(tenant.id), {'job_id': str(job.id)})
    return job