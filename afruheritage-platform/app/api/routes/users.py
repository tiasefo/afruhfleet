from __future__ import annotations

import csv
import io
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_current_user
from app.core.security import get_password_hash
from app.core.config import settings
from app.db.session import get_db
from app.models.audit import AuditEvent
from app.models.user import User
from app.services.notification_service import notification_service
from app.schemas.user_directory import (
    TenantUserAuditResponse,
    TenantUserCreateRequest,
    TenantUserResetResponse,
    TenantUserRoleUpdateRequest,
    TenantUserResponse,
    TenantUserStatusUpdateRequest,
)

router = APIRouter(prefix='/users', tags=['User Directory'])


def _to_response(user: User) -> TenantUserResponse:
    return TenantUserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        tenant_id=str(user.tenant_id) if user.tenant_id else None,
        is_tenant_admin=user.is_tenant_admin,
        is_superuser=user.is_superuser,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else '',
    )


def _resolve_tenant_scope(current_user: User, tenant_id: str | None) -> str:
    if current_user.is_superuser:
        if not tenant_id:
            raise HTTPException(status_code=400, detail='tenant_id is required for superuser user-management operations')
        return tenant_id

    if not current_user.is_tenant_admin:
        raise HTTPException(status_code=403, detail='Tenant admin or superuser access required')

    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='Current user has no tenant context')

    if tenant_id and str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(status_code=403, detail='Tenant access denied')

    return str(current_user.tenant_id)


def _write_audit_event(
    db: Session,
    *,
    actor_email: str,
    event_type: str,
    entity_type: str,
    entity_id: str,
    details_json: str,
) -> None:
    db.add(
        AuditEvent(
            actor_email=actor_email,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            details_json=details_json,
        )
    )


def _issue_password_reset_token(user: User) -> str:
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    user.must_reset_password = True
    return token


def _send_password_setup_email(user: User, tenant_id: str) -> None:
    token = _issue_password_reset_token(user)
    base_url = settings.base_url.rstrip("/")
    reset_url = f"{base_url}/login?tenant_id={tenant_id}&reset_token={token}"
    notification_service.send_password_reset_email(
        to=user.email,
        reset_url=reset_url,
        company_name='Afruheritage',
    )


def _ensure_not_last_tenant_admin(db: Session, target_user: User) -> None:
    if not target_user.tenant_id or not target_user.is_tenant_admin:
        return

    active_admins = (
        db.query(User)
        .filter(
            User.tenant_id == target_user.tenant_id,
            User.is_tenant_admin.is_(True),
            User.is_active.is_(True),
        )
        .count()
    )
    if active_admins <= 1:
        raise HTTPException(status_code=409, detail='Cannot remove or disable the last active tenant admin')


@router.get('', response_model=list[TenantUserResponse])
def list_users(
    tenant_id: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scope_tenant_id = _resolve_tenant_scope(current_user, tenant_id)
    users = db.query(User).filter(User.tenant_id == scope_tenant_id).order_by(User.created_at.desc()).all()
    return [_to_response(user) for user in users]


@router.post('', response_model=TenantUserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: TenantUserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scope_tenant_id = _resolve_tenant_scope(current_user, payload.tenant_id)

    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail='A user with this email already exists')

    if not payload.send_invite_email and not payload.password:
        raise HTTPException(status_code=400, detail='Password is required when invite email is disabled')

    hashed_password = get_password_hash(payload.password) if payload.password and not payload.send_invite_email else get_password_hash(secrets.token_urlsafe(40))
    should_send_invite = payload.send_invite_email or payload.password is None
    
    # Map role to is_tenant_admin for backward compatibility
    is_tenant_admin = payload.role == 'admin'
    
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hashed_password,
        tenant_id=scope_tenant_id,
        is_tenant_admin=is_tenant_admin,
        is_superuser=False,
        is_active=True,
        must_reset_password=should_send_invite,
    )
    db.add(user)
    if should_send_invite:
        _send_password_setup_email(user, scope_tenant_id)
    _write_audit_event(
        db,
        actor_email=current_user.email,
        event_type='tenant_user_created',
        entity_type='user',
        entity_id=str(user.id),
        details_json=f'{{"tenant_id":"{scope_tenant_id}","role":"{payload.role}","invite_email":{str(should_send_invite).lower()}}}',
    )
    db.commit()
    db.refresh(user)
    
    # Create GroupMember with the specified role
    from app.models.shipment import GroupMember as GroupMemberModel
    member = GroupMemberModel(
        tenant_id=scope_tenant_id,
        user_id=user.id,
        full_name=payload.full_name,
        email=payload.email,
        role=payload.role,  # Use the role from the request
        is_active=True,
    )
    db.add(member)
    db.commit()
    
    return _to_response(user)


@router.patch('/{user_id}/status', response_model=TenantUserResponse)
def update_user_status(
    user_id: str,
    payload: TenantUserStatusUpdateRequest,
    tenant_id: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scope_tenant_id = _resolve_tenant_scope(current_user, tenant_id)

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Invalid user id') from exc

    user = db.get(User, user_uuid)
    if not user or str(user.tenant_id) != str(scope_tenant_id):
        raise HTTPException(status_code=404, detail='User not found')

    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail='You cannot change your own active status')

    if not payload.is_active:
        _ensure_not_last_tenant_admin(db, user)

    user.is_active = payload.is_active
    db.add(user)
    _write_audit_event(
        db,
        actor_email=current_user.email,
        event_type='tenant_user_status_updated',
        entity_type='user',
        entity_id=str(user.id),
        details_json=f'{{"tenant_id":"{scope_tenant_id}","is_active":{str(payload.is_active).lower()}}}',
    )
    db.commit()
    db.refresh(user)
    return _to_response(user)


@router.patch('/{user_id}/role', response_model=TenantUserResponse)
def update_user_role(
    user_id: str,
    payload: TenantUserRoleUpdateRequest,
    tenant_id: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scope_tenant_id = _resolve_tenant_scope(current_user, tenant_id)

    if not (current_user.is_superuser or current_user.is_tenant_admin):
        raise HTTPException(status_code=403, detail='Tenant admin or superuser access required')

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Invalid user id') from exc

    user = db.get(User, user_uuid)
    if not user or str(user.tenant_id) != str(scope_tenant_id):
        raise HTTPException(status_code=404, detail='User not found')

    if str(user.id) == str(current_user.id) and not payload.is_tenant_admin:
        _ensure_not_last_tenant_admin(db, user)

    if not payload.is_tenant_admin:
        _ensure_not_last_tenant_admin(db, user)

    user.is_tenant_admin = payload.is_tenant_admin
    db.add(user)
    _write_audit_event(
        db,
        actor_email=current_user.email,
        event_type='tenant_user_role_updated',
        entity_type='user',
        entity_id=str(user.id),
        details_json=f'{{"tenant_id":"{scope_tenant_id}","is_tenant_admin":{str(payload.is_tenant_admin).lower()}}}',
    )
    db.commit()
    db.refresh(user)
    return _to_response(user)


@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    tenant_id: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scope_tenant_id = _resolve_tenant_scope(current_user, tenant_id)

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Invalid user id') from exc

    user = db.get(User, user_uuid)
    if not user or str(user.tenant_id) != str(scope_tenant_id):
        raise HTTPException(status_code=404, detail='User not found')

    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail='You cannot delete your own account')

    _ensure_not_last_tenant_admin(db, user)
    _write_audit_event(
        db,
        actor_email=current_user.email,
        event_type='tenant_user_deleted',
        entity_type='user',
        entity_id=str(user.id),
        details_json=f'{{"tenant_id":"{scope_tenant_id}","email":"{user.email}"}}',
    )
    db.delete(user)
    db.commit()
    return None


@router.get('/audit', response_model=list[TenantUserAuditResponse])
def list_user_audit_events(
    tenant_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scope_tenant_id = _resolve_tenant_scope(current_user, tenant_id)
    prefix = f'{{"tenant_id":"{scope_tenant_id}"'
    rows = (
        db.query(AuditEvent)
        .filter(
            AuditEvent.entity_type == 'user',
            AuditEvent.details_json.contains(prefix),
        )
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        TenantUserAuditResponse(
            id=str(row.id),
            actor_email=row.actor_email,
            event_type=row.event_type,
            entity_type=row.entity_type,
            entity_id=row.entity_id,
            details_json=row.details_json,
            created_at=row.created_at.isoformat() if row.created_at else '',
        )
        for row in rows
    ]


@router.post('/{user_id}/send-reset-link', response_model=TenantUserResetResponse)
def send_user_reset_link(
    user_id: str,
    tenant_id: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scope_tenant_id = _resolve_tenant_scope(current_user, tenant_id)

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Invalid user id') from exc

    user = db.get(User, user_uuid)
    if not user or str(user.tenant_id) != str(scope_tenant_id):
        raise HTTPException(status_code=404, detail='User not found')

    _send_password_setup_email(user, scope_tenant_id)
    db.add(user)
    _write_audit_event(
        db,
        actor_email=current_user.email,
        event_type='tenant_user_reset_link_sent',
        entity_type='user',
        entity_id=str(user.id),
        details_json=f'{{"tenant_id":"{scope_tenant_id}","email":"{user.email}"}}',
    )
    db.commit()

    return TenantUserResetResponse(status='ok', message='Password setup/reset link sent to user email')


class BulkImportRow(BaseModel):
    full_name: str
    email: str | None = None
    phone: str | None = None
    role: str = 'member'
    goods_description: str | None = None


class BulkImportResult(BaseModel):
    total: int
    created: int
    skipped: int
    duplicates: int
    errors: list[str]
    duplicate_details: list[str]


DEFAULT_IMPORT_PASSWORD = 'afruheritage@1'  # Legacy — only used for backward-compat display. New imports use random passwords.


def _generate_random_password() -> str:
    """Generate a cryptographically secure random password for bulk-imported accounts."""
    return secrets.token_urlsafe(12)


@router.post('/bulk-import', response_model=BulkImportResult)
def bulk_import_users(
    file: UploadFile = File(...),
    tenant_id: str | None = Query(None),
    send_invite_email: bool = Query(True),
    domain: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    CSV columns (header required): full_name, email, phone, role, goods_description

    For each row:
    1. Creates a User login account (email or phone-as-email, random secure password, is_active=True, must_reset_password=True)
    2. Creates a GroupMember record linked to the User via user_id
    3. Creates/updates a tenant_customer record
    4. Skips rows where the user already exists (by email)
    """
    from app.models.user import UserRole as UserRoleEnum
    from app.models.shipment import GroupMember as GroupMemberModel
    from app.models.tenant_branding import TenantBranding

    scope_tenant_id = _resolve_tenant_scope(current_user, tenant_id)
    if not scope_tenant_id:
        raise HTTPException(status_code=400, detail='tenant_id is required')

    # Resolve pseudo-email domain: explicit param > tenant branding > default
    pseudo_domain = domain
    if not pseudo_domain:
        branding = db.query(TenantBranding).filter(
            TenantBranding.tenant_id == scope_tenant_id
        ).first()
        pseudo_domain = branding.pseudo_email_domain if branding else 'phone.afruheritage.com'

    content = file.file.read().decode('utf-8-sig')  # handle BOM
    reader = csv.DictReader(io.StringIO(content))

    created = 0
    skipped = 0
    duplicates = 0
    errors: list[str] = []
    duplicate_details: list[str] = []
    rows_processed = 0

    for row_num, row in enumerate(reader, start=2):
        rows_processed += 1
        full_name = (row.get('full_name') or row.get('name') or '').strip()
        email = (row.get('email') or '').strip().lower() or None
        phone = (row.get('phone') or '').strip() or None
        role = (row.get('role') or 'member').strip() or 'member'
        goods_desc = (row.get('goods_description') or row.get('goods') or '').strip() or None

        if not full_name:
            errors.append(f'Row {row_num}: full_name is required — skipped')
            skipped += 1
            continue

        if not email and not phone:
            errors.append(f'Row {row_num}: at least email or phone required — skipped')
            skipped += 1
            continue

        # Determine login email: use provided email, or phone-as-email if no email
        normalized_phone = ''.join(ch for ch in (phone or '') if ch.isdigit())
        normalized_name = ' '.join(full_name.upper().split())
        login_email = email
        if not login_email and normalized_phone:
            login_email = f'{normalized_phone}@{pseudo_domain}'

        if not login_email:
            errors.append(f'Row {row_num}: could not determine login email (need email or numeric phone) — skipped')
            skipped += 1
            continue

        # Check if User already exists (by email) — track as duplicate
        existing_user = db.query(User).filter(User.email == login_email).first()
        if existing_user:
            duplicates += 1
            duplicate_details.append(f'Row {row_num}: {login_email} already exists as user')
            # Also check if GroupMember exists
            existing_member = db.query(GroupMemberModel).filter(
                GroupMemberModel.user_id == existing_user.id,
                GroupMemberModel.tenant_id == scope_tenant_id
            ).first()
            if existing_member:
                duplicate_details.append(f'  → Already a member of this tenant')
            continue

        # 1. Create User account
        first_name = full_name.split()[0] if full_name else full_name
        user = User(
            email=login_email,
            full_name=full_name,
            hashed_password=get_password_hash(_generate_random_password()),
            role=UserRoleEnum.customer,
            tenant_id=scope_tenant_id,
            is_tenant_admin=False,
            is_superuser=False,
            is_active=True,
            must_reset_password=True,
        )
        db.add(user)
        db.flush()  # get user.id

        # 2. Create GroupMember linked to user
        member = GroupMemberModel(
            tenant_id=scope_tenant_id,
            user_id=user.id,
            full_name=full_name,
            phone=phone,
            email=email or login_email,
            notes=goods_desc,
            preferred_language='en',
            role='customer',  # Default to customer role for CSV imports
            is_active=True,
        )
        db.add(member)
        db.flush()  # get member.id

        # 3. Create/update tenant_customer (keep backward compat)
        existing_customer = None
        if normalized_phone:
            existing_customer = db.execute(text("""
                SELECT id FROM tenant_customers
                WHERE tenant_id=:tenant_id
                  AND normalized_phone=:normalized_phone
                LIMIT 1
            """), {
                "tenant_id": scope_tenant_id,
                "normalized_phone": normalized_phone,
            }).mappings().first()

        if not existing_customer and email:
            existing_customer = db.execute(text("""
                SELECT id FROM tenant_customers
                WHERE tenant_id=:tenant_id
                  AND lower(email)=lower(:email)
                LIMIT 1
            """), {
                "tenant_id": scope_tenant_id,
                "email": email,
            }).mappings().first()

        if existing_customer:
            db.execute(text("""
                UPDATE tenant_customers
                SET display_name=:display_name,
                    normalized_name=:normalized_name,
                    phone=COALESCE(:phone, phone),
                    normalized_phone=COALESCE(NULLIF(:normalized_phone,''), normalized_phone),
                    email=COALESCE(:email, email),
                    source='bulk_member_import',
                    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                        'goods_description', CAST(:goods_desc AS TEXT),
                        'role', CAST(:role AS TEXT),
                        'user_id', CAST(:user_id AS TEXT),
                        'group_member_id', CAST(:group_member_id AS TEXT),
                        'updated_from_bulk_import', true
                    ),
                    updated_at=now()
                WHERE id=:id
            """), {
                "display_name": full_name,
                "normalized_name": normalized_name,
                "phone": phone,
                "normalized_phone": normalized_phone,
                "email": email,
                "goods_desc": goods_desc,
                "role": role,
                "user_id": str(user.id),
                "group_member_id": str(member.id),
                "id": existing_customer["id"],
            })
        else:
            db.execute(text("""
                INSERT INTO tenant_customers (
                    id, tenant_id, display_name, normalized_name,
                    phone, normalized_phone, email, source, metadata,
                    created_at, updated_at
                )
                VALUES (
                    :id, :tenant_id, :display_name, :normalized_name,
                    :phone, :normalized_phone, :email, 'bulk_member_import',
                    jsonb_build_object(
                        'goods_description', CAST(:goods_desc AS TEXT),
                        'role', CAST(:role AS TEXT),
                        'user_id', CAST(:user_id AS TEXT),
                        'group_member_id', CAST(:group_member_id AS TEXT)
                    ),
                    now(), now()
                )
                RETURNING id
            """), {
                "id": str(uuid.uuid4()),
                "tenant_id": scope_tenant_id,
                "display_name": full_name,
                "normalized_name": normalized_name,
                "phone": phone,
                "normalized_phone": normalized_phone,
                "email": email,
                "goods_desc": goods_desc,
                "role": role,
                "user_id": str(user.id),
                "group_member_id": str(member.id),
            })

        _write_audit_event(
            db,
            actor_email=current_user.email,
            event_type='tenant_customer_bulk_imported',
            entity_type='tenant_customer',
            entity_id=str(user.id),
            details_json=f'{{"tenant_id":"{scope_tenant_id}","login_email":"{login_email}","email":"{email}","phone":"{phone}","full_name":"{full_name}","group_member_id":"{member.id}"}}',
        )
        created += 1

    db.commit()
    return BulkImportResult(
        total=rows_processed,
        created=created,
        skipped=skipped,
        duplicates=duplicates,
        errors=errors,
        duplicate_details=duplicate_details
    )


class BulkImportPreviewRow(BaseModel):
    row_number: int
    full_name: str
    email: str | None = None
    phone: str | None = None
    role: str = 'member'
    goods_description: str | None = None
    login_email: str
    is_duplicate: bool
    status: str  # 'new', 'duplicate', 'error'
    error: str | None = None


class BulkImportPreviewResult(BaseModel):
    total: int
    new: int
    duplicates: int
    errors: int
    domain_used: str
    rows: list[BulkImportPreviewRow]


@router.post('/bulk-import/preview', response_model=BulkImportPreviewResult)
def bulk_import_preview(
    file: UploadFile = File(...),
    tenant_id: str | None = Query(None),
    domain: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Parse a CSV file and return a preview of what would happen during bulk import,
    including generated pseudo-emails and duplicate detection — without creating any records.
    """
    from app.models.tenant_branding import TenantBranding

    scope_tenant_id = _resolve_tenant_scope(current_user, tenant_id)
    if not scope_tenant_id:
        raise HTTPException(status_code=400, detail='tenant_id is required')

    # Resolve domain
    pseudo_domain = domain
    if not pseudo_domain:
        branding = db.query(TenantBranding).filter(
            TenantBranding.tenant_id == scope_tenant_id
        ).first()
        pseudo_domain = branding.pseudo_email_domain if branding else 'phone.afruheritage.com'

    content = file.file.read().decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(content))

    rows: list[BulkImportPreviewRow] = []
    new_count = 0
    dup_count = 0
    err_count = 0

    for row_num, row in enumerate(reader, start=2):
        full_name = (row.get('full_name') or row.get('name') or '').strip()
        email = (row.get('email') or '').strip().lower() or None
        phone = (row.get('phone') or '').strip() or None
        role = (row.get('role') or 'member').strip() or 'member'
        goods_desc = (row.get('goods_description') or row.get('goods') or '').strip() or None

        if not full_name:
            err_count += 1
            rows.append(BulkImportPreviewRow(
                row_number=row_num, full_name='', email=email, phone=phone,
                role=role, goods_description=goods_desc,
                login_email='', is_duplicate=False,
                status='error', error='full_name is required',
            ))
            continue

        if not email and not phone:
            err_count += 1
            rows.append(BulkImportPreviewRow(
                row_number=row_num, full_name=full_name, email=None, phone=None,
                role=role, goods_description=goods_desc,
                login_email='', is_duplicate=False,
                status='error', error='at least email or phone required',
            ))
            continue

        normalized_phone = ''.join(ch for ch in (phone or '') if ch.isdigit())
        login_email = email
        if not login_email and normalized_phone:
            login_email = f'{normalized_phone}@{pseudo_domain}'

        if not login_email:
            err_count += 1
            rows.append(BulkImportPreviewRow(
                row_number=row_num, full_name=full_name, email=email, phone=phone,
                role=role, goods_description=goods_desc,
                login_email='', is_duplicate=False,
                status='error', error='could not determine login email',
            ))
            continue

        existing = db.query(User).filter(User.email == login_email).first()
        is_dup = existing is not None
        if is_dup:
            dup_count += 1
            rows.append(BulkImportPreviewRow(
                row_number=row_num, full_name=full_name, email=email, phone=phone,
                role=role, goods_description=goods_desc,
                login_email=login_email, is_duplicate=True,
                status='duplicate',
            ))
        else:
            new_count += 1
            rows.append(BulkImportPreviewRow(
                row_number=row_num, full_name=full_name, email=email, phone=phone,
                role=role, goods_description=goods_desc,
                login_email=login_email, is_duplicate=False,
                status='new',
            ))

    return BulkImportPreviewResult(
        total=len(rows),
        new=new_count,
        duplicates=dup_count,
        errors=err_count,
        domain_used=pseudo_domain,
        rows=rows,
    )
