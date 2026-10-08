from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_user,
    get_current_user_no_tenant_check,
    get_db,
    require_active_subscription,
    require_tenant_admin,
)
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.core.structured_logging import security_logger
from jose import jwt as jwt_lib, JWTError


def _read_bearer_token(request: Request) -> str | None:
    auth = request.headers.get('Authorization')
    if auth and auth.lower().startswith('bearer '):
        return auth[7:].strip()
    return request.cookies.get('access_token')


def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    """Authenticate bearer/cookie token if present, otherwise return None."""
    token = _read_bearer_token(request)
    if not token:
        return None
    try:
        payload = jwt_lib.decode(token, settings.secret_key, algorithms=['HS256'])
        sub = payload.get('sub')
        token_tenant_id = payload.get('tenant_id')
        if not sub:
            return None
        user = db.get(User, uuid.UUID(str(sub)))
        if not user or not user.is_active:
            return None
        if token_tenant_id and str(user.tenant_id) != str(token_tenant_id):
            return None
        return user
    except (JWTError, ValueError, TypeError):
        return None
from app.models.tenant import LaunchStatus, Tenant
from app.models.tenant_invitation import InvitationStatus, TenantInvitation
from app.models.user import User, UserRole
from app.schemas.auth import TokenResponse
from app.schemas.team import (
    TeamInvitationAcceptRequest,
    TeamInvitationCreateRequest,
    TeamInvitationResponse,
    TeamMemberResponse,
    TeamMemberTokenResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix='/team', tags=['Team'])

INVITATION_TOKEN_BYTES = 24
INVITATION_LIFETIME_DAYS = 7


def _generate_invitation_token() -> str:
    return secrets.token_urlsafe(INVITATION_TOKEN_BYTES)


def _is_role_permitted(role: UserRole) -> bool:
    return role != UserRole.platform_admin


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _build_accept_url(token: str) -> str:
    base = settings.web_url.rstrip('/')
    return f'{base}/invite/accept?token={token}'


@router.post('/invitations', response_model=TeamInvitationResponse, status_code=status.HTTP_201_CREATED)
def create_invitation(
    request: TeamInvitationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
    _: User = Depends(require_tenant_admin),
) -> TenantInvitation:
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context')

    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')

    # Suspended tenants cannot issue invitations
    if tenant.launch_status == LaunchStatus.suspended:
        raise HTTPException(status_code=403, detail='Tenant is suspended')

    try:
        role = UserRole(request.role)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f'Invalid role: {request.role}') from exc

    if not _is_role_permitted(role):
        raise HTTPException(status_code=403, detail='This role cannot be assigned through team invitations')

    email = request.email.lower()

    # Prevent inviting a user that is already a member of this tenant
    existing_member = db.scalar(select(User).where(User.email == email, User.tenant_id == current_user.tenant_id))
    if existing_member:
        raise HTTPException(status_code=409, detail='User is already a member of this tenant')

    # Safe duplicate handling: return existing pending invitation for the same email+tenant
    existing_pending = db.scalar(
        select(TenantInvitation).where(
            TenantInvitation.email == email,
            TenantInvitation.tenant_id == current_user.tenant_id,
            TenantInvitation.status == InvitationStatus.pending,
        )
    )
    if existing_pending:
        return existing_pending

    token = _generate_invitation_token()
    invitation = TenantInvitation(
        tenant_id=current_user.tenant_id,
        inviter_id=current_user.id,
        email=email,
        full_name=request.full_name,
        role=role.value,
        token=token,
        status=InvitationStatus.pending,
        expires_at=_now() + timedelta(days=INVITATION_LIFETIME_DAYS),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    accept_url = _build_accept_url(token)
    notification = NotificationService()
    notification.send_generic_email(
        to=email,
        subject=f'You have been invited to join {tenant.company_name} on Afruheritage',
        html_body=f'''
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">You're invited to join {tenant.company_name}</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                {current_user.full_name} has invited you to collaborate on <strong>{tenant.company_name}</strong> as a <strong>{role.value}</strong>.
            </p>
            <p style="color: #94a3b8; font-size: 14px;">
                This invitation expires in {INVITATION_LIFETIME_DAYS} days.
            </p>
            <p style="color: #94a3b8; font-size: 14px;">
                Accept the invitation here: {accept_url}
            </p>
        </div>
        ''',
        plain_body=f'You have been invited to join {tenant.company_name} on Afruheritage.\n\nAccept here: {accept_url}\n\nThis invitation expires in {INVITATION_LIFETIME_DAYS} days.',
    )

    return invitation


@router.get('/invitations', response_model=list[TeamInvitationResponse])
def list_invitations(
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
    _: User = Depends(require_tenant_admin),
) -> list[TenantInvitation]:
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context')

    query = select(TenantInvitation).where(TenantInvitation.tenant_id == current_user.tenant_id)
    if status:
        query = query.where(TenantInvitation.status == status)
    return db.scalars(query.order_by(TenantInvitation.created_at.desc())).all()


@router.get('/members', response_model=list[TeamMemberResponse])
def list_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
) -> list[User]:
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context')
    return db.scalars(
        select(User).where(User.tenant_id == current_user.tenant_id).order_by(User.created_at.desc())
    ).all()


@router.get('/invitations/{token}', response_model=TeamInvitationResponse)
def get_invitation_by_token(token: str, db: Session = Depends(get_db)) -> TenantInvitation:
    invitation = db.scalar(select(TenantInvitation).where(TenantInvitation.token == token))
    if not invitation:
        raise HTTPException(status_code=404, detail='Invitation not found')
    return invitation


@router.post('/invitations/{token}/accept', response_model=TeamMemberTokenResponse)
def accept_invitation(
    token: str,
    request: TeamInvitationAcceptRequest,
    auth_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> TeamMemberTokenResponse:
    invitation = db.scalar(
        select(TenantInvitation).where(TenantInvitation.token == token)
    )
    if not invitation:
        raise HTTPException(status_code=404, detail='Invitation not found')

    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=410, detail=f'Invitation is {invitation.status.value}')

    if invitation.expires_at < _now():
        invitation.status = InvitationStatus.expired
        db.commit()
        raise HTTPException(status_code=410, detail='Invitation has expired')

    tenant = db.get(Tenant, invitation.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')

    if tenant.launch_status == LaunchStatus.suspended:
        raise HTTPException(status_code=403, detail='Tenant is suspended')

    # Existing user path
    if auth_user:
        if auth_user.email.lower() != invitation.email.lower():
            raise HTTPException(status_code=403, detail='This invitation was sent to a different email address')
        if auth_user.tenant_id and str(auth_user.tenant_id) != str(invitation.tenant_id):
            raise HTTPException(status_code=409, detail='User is already associated with another tenant')
        if auth_user.tenant_id and str(auth_user.tenant_id) == str(invitation.tenant_id):
            raise HTTPException(status_code=409, detail='User is already a member of this tenant')

        user = auth_user
    else:
        # New user path
        if not request.full_name or not request.password:
            raise HTTPException(
                status_code=422,
                detail='full_name and password are required to create a new account from this invitation',
            )
        existing_user = db.scalar(select(User).where(User.email == invitation.email.lower()))
        if existing_user:
            raise HTTPException(status_code=409, detail='An account with this email already exists. Please log in and accept the invitation.')
        user = User(
            email=invitation.email.lower(),
            full_name=request.full_name,
            hashed_password=get_password_hash(request.password),
            tenant_id=invitation.tenant_id,
            is_tenant_admin=False,
            is_active=True,
            onboarding_complete=True,
            role=UserRole(invitation.role),
        )
        db.add(user)
        db.flush()

    user.tenant_id = invitation.tenant_id
    user.role = UserRole(invitation.role)
    db.flush()
    db.refresh(user)

    invitation.status = InvitationStatus.accepted
    invitation.consumed_by = user.id
    invitation.consumed_at = _now()
    db.commit()
    db.refresh(user)

    subdomain: Optional[str] = tenant.slug if tenant.slug else None
    portal_url = f'https://{subdomain}.afruheritage.com' if subdomain else 'https://afruheritage.com'
    access_token = create_access_token(str(user.id), tenant_id=str(user.tenant_id))

    return TeamMemberTokenResponse(
        access_token=access_token,
        token_type='bearer',
        tenant_id=str(user.tenant_id),
        subdomain=subdomain,
        portal_url=portal_url,
        requires_subscription=True,
    )


@router.post('/invitations/{token}/decline', response_model=TeamInvitationResponse)
def decline_invitation(token: str, db: Session = Depends(get_db)) -> TenantInvitation:
    invitation = db.scalar(select(TenantInvitation).where(TenantInvitation.token == token))
    if not invitation:
        raise HTTPException(status_code=404, detail='Invitation not found')
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=410, detail=f'Invitation is {invitation.status.value}')
    if invitation.expires_at < _now():
        invitation.status = InvitationStatus.expired
        db.commit()
        raise HTTPException(status_code=410, detail='Invitation has expired')

    invitation.status = InvitationStatus.declined
    db.commit()
    db.refresh(invitation)
    return invitation
