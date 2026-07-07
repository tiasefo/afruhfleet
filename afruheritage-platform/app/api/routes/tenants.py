from app.core.config import settings
import secrets
import uuid
from slugify import slugify
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import require_superuser, get_current_user
from app.db.session import get_db
from app.models.tenant import DomainType, LaunchStatus, ProvisioningJob, Tenant
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.schemas.tenant import ApprovalRequest, JobResponse, LaunchRequest, TenantCreate, TenantResponse, TenantRuntimeAuthUpdate, TenantUpdate
from app.services.audit_service import record_audit_event
from app.services.billing_service import assert_tenant_launch_ready, create_trial_subscription, ensure_wallet
from app.services.notification_service import get_notification_service
from app.services.tenant_creation_service import TenantCreationService
from app.tasks.provisioning import provision_tenant
from app.middleware.rate_limit import rate_limit
from pydantic import BaseModel
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
    tenant = Tenant(company_name=payload.company_name, slug=slug, contact_email=payload.contact_email.lower(), plan_code=payload.plan_code, requested_domain=payload.requested_domain.lower(), domain_type=domain_type, verification_notes=payload.verification_notes, launch_status=LaunchStatus.pending_verification, subdomain=slug)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    if payload.plan_code == 'free_trial':
        create_trial_subscription(db, tenant_id=str(tenant.id))
        ensure_wallet(db, tenant_id=str(tenant.id))
    from app.services.tenant_branding_service import ensure_tenant_branding
    ensure_tenant_branding(db, tenant_id=str(tenant.id), company_name=tenant.company_name, contact_email=tenant.contact_email)
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


@router.patch('/{tenant_id}', response_model=TenantResponse)
def update_tenant(tenant_id: str, payload: TenantUpdate, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)) -> Tenant:
    """Update tenant settings (e.g., WhatsApp channel URL, Fleetbase integration)."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')

    # Only allow updating own tenant unless superuser
    if current_user.tenant_id != tenant.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='You can only update your own tenant')

    if payload.whatsapp_channel_url is not None:
        tenant.whatsapp_channel_url = payload.whatsapp_channel_url

    if payload.fleetbase_org_id is not None:
        tenant.fleetbase_org_id = payload.fleetbase_org_id

    if payload.fleetbase_api_key is not None:
        tenant.fleetbase_api_key = payload.fleetbase_api_key

    if payload.live_console_url is not None:
        tenant.live_console_url = payload.live_console_url

    if payload.live_api_url is not None:
        tenant.live_api_url = payload.live_api_url

    db.commit()
    db.refresh(tenant)
    return tenant


@router.get('/me', response_model=TenantResponse)
def get_my_tenant(db: Session=Depends(get_db), current_user: User=Depends(get_current_user)) -> Tenant:
    """Get the current user's tenant."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=404, detail='User is not associated with a tenant')
    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
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


# ── Support: lookup tenant + resend portal URL ────────────────────────────────

from fastapi import Query as QueryParam  # noqa: E402 — local import to avoid collision

@router.post('/{tenant_id}/suspend', response_model=TenantResponse)
def suspend_tenant(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> Tenant:
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    tenant.launch_status = LaunchStatus.suspended
    db.commit()
    db.refresh(tenant)
    record_audit_event(db, current_user, 'tenant.suspended', 'tenant', str(tenant.id), {})
    return tenant


@router.post('/{tenant_id}/activate', response_model=TenantResponse)
def activate_tenant(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> Tenant:
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    tenant.launch_status = LaunchStatus.active
    db.commit()
    db.refresh(tenant)
    record_audit_event(db, current_user, 'tenant.activated', 'tenant', str(tenant.id), {})
    return tenant


@router.delete('/{tenant_id}')
def delete_tenant(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> dict:
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    if tenant.deleted_at:
        raise HTTPException(status_code=409, detail='Tenant already deleted')
    
    from datetime import datetime
    tenant.deleted_at = datetime.utcnow()
    tenant.launch_status = LaunchStatus.suspended
    db.commit()
    db.refresh(tenant)
    
    record_audit_event(db, current_user, 'tenant.deleted', 'tenant', str(tenant.id), {'company_name': tenant.company_name})
    return {'status': 'deleted', 'tenant_id': tenant_id}


@router.post('/{tenant_id}/restore', response_model=TenantResponse)
def restore_tenant(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> Tenant:
    """Restore a soft-deleted tenant."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    if not tenant.deleted_at:
        raise HTTPException(status_code=409, detail='Tenant is not deleted')
    
    tenant.deleted_at = None
    tenant.launch_status = LaunchStatus.active
    db.commit()
    db.refresh(tenant)
    
    record_audit_event(db, current_user, 'tenant.restored', 'tenant', str(tenant.id), {'company_name': tenant.company_name})
    return tenant


@router.post('/{tenant_id}/provision', response_model=TenantResponse)
def provision_tenant_fleetbase(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> Tenant:
    """Manually trigger Fleetbase org provisioning for a tenant."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    if tenant.fleetbase_org_id:
        raise HTTPException(status_code=409, detail='Tenant already has a Fleetbase org')
    from app.services.fleetbase_api_client import fleetbase_client
    try:
        org = fleetbase_client.provision_org(
            company_name=tenant.company_name,
            admin_email=tenant.contact_email,
            admin_password=secrets.token_urlsafe(16),
            phone='',
        )
        tenant.fleetbase_org_id = org.org_id
        tenant.fleetbase_api_key = org.api_key
        tenant.fleetbase_admin_token = org.admin_token
        tenant.live_api_token = org.api_key
        tenant.live_console_url = org.console_url
        tenant.live_api_url = settings.fleetbase_internal_url.rstrip("/")
        tenant.launch_status = LaunchStatus.active
        db.commit()
        db.refresh(tenant)
        record_audit_event(db, current_user, 'tenant.provisioned.fleetbase', 'tenant', str(tenant.id), {'fleetbase_org_id': org.org_id})
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Fleetbase provisioning failed: {exc}') from exc
    return tenant


@router.get('/lookup', response_model=TenantResponse)
def lookup_tenant(
    email: str | None = QueryParam(None, description="Tenant admin email"),
    slug: str | None = QueryParam(None, description="Tenant slug"),
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> Tenant:
    """Admin: find a tenant by contact email or slug (support use case)."""
    if not email and not slug:
        raise HTTPException(status_code=400, detail="Provide 'email' or 'slug' query parameter")

    filters = []
    if email:
        filters.append(Tenant.contact_email == email.lower().strip())
    if slug:
        filters.append(Tenant.slug == slug.lower().strip())

    from sqlalchemy import or_
    tenant = db.scalar(select(Tenant).where(or_(*filters)))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.post('/{tenant_id}/resend-portal-url')
def resend_portal_url(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
) -> dict:
    """
    Admin / support: re-send the tenant portal URL to the company admin's email.
    Also returns the portal_url so it can be copied from the admin console.
    """
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    portal_url = f"https://{tenant.slug}.{settings.default_subdomain_base}"

    try:
        ns = get_notification_service(db)
        plain = (
            f"Hello,\n\n"
            f"Your company portal on AfruHeritage is ready and can be accessed at:\n\n"
            f"  {portal_url}\n\n"
            f"Share this URL with your team. Each user logs in with their own credentials.\n\n"
            f"— AfruHeritage Support"
        )
        html = (
            f"<p>Hello,</p>"
            f"<p>Your company portal on AfruHeritage is ready and can be accessed at:</p>"
            f"<p><a href='{portal_url}'>{portal_url}</a></p>"
            f"<p>Share this URL with your team. Each user logs in with their own credentials.</p>"
            f"<p>— AfruHeritage Support</p>"
        )
        ns.send_generic_email(
            to=tenant.contact_email,
            subject=f"Your {tenant.company_name} portal URL",
            html_body=html,
            plain_body=plain,
        )
        sent = True
    except Exception:
        sent = False

    record_audit_event(
        db, current_user,
        'tenant.portal_url.resent',
        'tenant', str(tenant.id),
        {'portal_url': portal_url, 'email_sent': sent, 'contact_email': tenant.contact_email},
    )

    return {
        "tenant_id": str(tenant.id),
        "company_name": tenant.company_name,
        "slug": tenant.slug,
        "contact_email": tenant.contact_email,
        "portal_url": portal_url,
        "email_sent": sent,
    }


# ── Tenant User Management (Nested RBAC) ─────────────────────────────────

class TenantUserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role_name: str = "tenant_user"  # Default role for tenant users


class TenantUserRoleUpdate(BaseModel):
    role_name: str


@router.get("/{tenant_id}/users")
def list_tenant_users(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """List all users for a specific tenant."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    users = db.scalars(
        select(User).where(User.tenant_id == _resolve_uuid(tenant_id))
    ).all()
    
    return {
        "tenant_id": tenant_id,
        "users": [
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "is_tenant_admin": user.is_tenant_admin,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }
            for user in users
        ]
    }


@router.post("/{tenant_id}/users")
def create_tenant_user(
    tenant_id: str,
    payload: TenantUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Create a new user for a specific tenant with a role."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if user already exists
    existing_user = db.scalar(
        select(User).where(User.email == payload.email.lower())
    )
    if existing_user:
        raise HTTPException(status_code=409, detail="User with this email already exists")
    
    # Find or create the role
    role = db.scalar(
        select(Role).where(
            (Role.name == payload.role_name) & 
            ((Role.tenant_id == _resolve_uuid(tenant_id)) | (Role.tenant_id == None))
        )
    )
    if not role:
        # Create tenant-specific role if it doesn't exist
        role = Role(
            name=payload.role_name,
            display_name=payload.role_name.replace("_", " ").title(),
            description=f"Tenant-specific role for {tenant.company_name}",
            tenant_id=_resolve_uuid(tenant_id),
            is_system_role=False,
            is_public=True,
        )
        db.add(role)
        db.commit()
        db.refresh(role)
    
    # Create user
    from app.core.security import get_password_hash
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        tenant_id=_resolve_uuid(tenant_id),
        is_tenant_admin=(payload.role_name == "tenant_admin"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Assign role
    user_role = UserRole(
        user_id=user.id,
        role_id=role.id,
        tenant_id=_resolve_uuid(tenant_id),
        assigned_by=current_user.id,
    )
    db.add(user_role)
    db.commit()
    
    record_audit_event(
        db, current_user,
        'tenant_user.created',
        'tenant_user', str(user.id),
        {'tenant_id': tenant_id, 'role': payload.role_name},
    )
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": payload.role_name,
        "tenant_id": tenant_id,
    }


@router.patch("/{tenant_id}/users/{user_id}/role")
def update_tenant_user_role(
    tenant_id: str,
    user_id: str,
    payload: TenantUserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Update a tenant user's role."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    user = db.get(User, _resolve_uuid(user_id))
    if not user or user.tenant_id != _resolve_uuid(tenant_id):
        raise HTTPException(status_code=404, detail="User not found in this tenant")
    
    # Find the role
    role = db.scalar(
        select(Role).where(
            (Role.name == payload.role_name) & 
            ((Role.tenant_id == _resolve_uuid(tenant_id)) | (Role.tenant_id == None))
        )
    )
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Deactivate existing role assignments
    existing_roles = db.scalars(
        select(UserRole).where(
            (UserRole.user_id == user.id) & 
            (UserRole.tenant_id == _resolve_uuid(tenant_id)) &
            (UserRole.is_active == True)
        )
    ).all()
    for ur in existing_roles:
        ur.is_active = False
    
    # Create new role assignment
    user_role = UserRole(
        user_id=user.id,
        role_id=role.id,
        tenant_id=_resolve_uuid(tenant_id),
        assigned_by=current_user.id,
    )
    db.add(user_role)
    
    # Update tenant admin flag if role is tenant_admin
    user.is_tenant_admin = (payload.role_name == "tenant_admin")
    
    db.commit()
    
    record_audit_event(
        db, current_user,
        'tenant_user.role_updated',
        'tenant_user', str(user.id),
        {'tenant_id': tenant_id, 'new_role': payload.role_name},
    )
    
    return {"detail": "User role updated successfully"}


@router.delete("/{tenant_id}/users/{user_id}")
def delete_tenant_user(
    tenant_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Delete a tenant user."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    user = db.get(User, _resolve_uuid(user_id))
    if not user or user.tenant_id != _resolve_uuid(tenant_id):
        raise HTTPException(status_code=404, detail="User not found in this tenant")
    
    # Deactivate user instead of hard delete
    user.is_active = False
    
    # Deactivate all role assignments
    user_roles = db.scalars(
        select(UserRole).where(
            (UserRole.user_id == user.id) & 
            (UserRole.tenant_id == _resolve_uuid(tenant_id))
        )
    ).all()
    for ur in user_roles:
        ur.is_active = False
    
    db.commit()
    
    record_audit_event(
        db, current_user,
        'tenant_user.deactivated',
        'tenant_user', str(user_id),
        {'tenant_id': tenant_id},
    )
    
    return {"detail": "User deactivated successfully"}