from slugify import slugify
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_superuser
from app.db.session import get_db
from app.models.tenant import DomainType, LaunchStatus, ProvisioningJob, Tenant
from app.models.user import User
from app.schemas.tenant import ApprovalRequest, JobResponse, LaunchRequest, TenantCreate, TenantResponse
from app.services.audit_service import record_audit_event
from app.services.runner_selection import select_runner_for_tenant
from app.tasks.provisioning import provision_tenant

router = APIRouter(prefix='/tenants', tags=['tenants'])


@router.post('', response_model=TenantResponse)
def create_tenant(
    payload: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
) -> Tenant:
    slug = slugify(payload.company_name)
    if db.scalar(select(Tenant).where((Tenant.slug == slug) | (Tenant.contact_email == payload.contact_email.lower()) | (Tenant.requested_domain == payload.requested_domain.lower()))):
        raise HTTPException(status_code=409, detail='Tenant already exists with same slug, email, or domain')

    try:
        domain_type = DomainType(payload.domain_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail='Unsupported domain type') from exc

    tenant = Tenant(
        company_name=payload.company_name,
        slug=slug,
        contact_email=payload.contact_email.lower(),
        plan_code=payload.plan_code,
        requested_domain=payload.requested_domain.lower(),
        domain_type=domain_type,
        verification_notes=payload.verification_notes,
        launch_status=LaunchStatus.pending_verification,
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    record_audit_event(db, current_user, 'tenant.created', 'tenant', str(tenant.id), {'company_name': tenant.company_name})
    return tenant


@router.get('', response_model=list[TenantResponse])
def list_tenants(db: Session = Depends(get_db), _: User = Depends(require_superuser)) -> list[Tenant]:
    return list(db.scalars(select(Tenant).order_by(Tenant.created_at.desc())).all())


@router.post('/{tenant_id}/approve', response_model=TenantResponse)
def approve_tenant(
    tenant_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
) -> Tenant:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    tenant.launch_status = LaunchStatus.approved
    tenant.verification_notes = payload.verification_notes
    db.commit()
    db.refresh(tenant)
    record_audit_event(db, current_user, 'tenant.approved', 'tenant', str(tenant.id), {'notes': payload.verification_notes})
    return tenant


@router.post('/{tenant_id}/launch', response_model=JobResponse)
def launch_tenant(
    tenant_id: str,
    payload: LaunchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
) -> ProvisioningJob:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    if tenant.launch_status != LaunchStatus.approved:
        raise HTTPException(status_code=409, detail='Tenant must be approved before launch')

    try:
        runner = select_runner_for_tenant(db, payload.runner_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    tenant.runner_id = runner.id
    tenant.launch_status = LaunchStatus.queued
    job = ProvisioningJob(tenant_id=tenant.id, status=LaunchStatus.queued, details='Queued for Fleetbase deployment.')
    db.add(job)
    db.commit()
    db.refresh(job)

    async_result = provision_tenant.delay(str(job.id))
    job.task_id = async_result.id
    db.commit()
    db.refresh(job)

    record_audit_event(db, current_user, 'tenant.launch.requested', 'tenant', str(tenant.id), {'runner': runner.name, 'job_id': str(job.id)})
    return job


@router.get('/jobs/{job_id}', response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db), _: User = Depends(require_superuser)) -> ProvisioningJob:
    job = db.get(ProvisioningJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job
