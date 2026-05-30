from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.structured_logging import get_logger
from app.db.session import get_db
from app.models.tenant import LaunchStatus
from app.models.tenant_request import TenantRequest
from app.models.user import User
from app.services.tenant_creation_service import TenantCreationService
from app.schemas.tenant import TenantCreationRequest, TenantCreationResponse
logger = get_logger('afruheritage.tenant_creation_api')
router = APIRouter(prefix='/tenants', tags=['Tenant Creation'])


def _resolve_uuid(value: str):
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return value

@router.post('/create', response_model=TenantCreationResponse)
def create_tenant(request: TenantCreationRequest, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    """Create a new tenant with complete setup"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Only platform administrators can create tenants')
    try:
        tenant_service = TenantCreationService(db)
        tenant = tenant_service.create_tenant_from_request(company_name=request.company_name, contact_email=request.contact_email, contact_name=request.contact_name, business_type=request.business_type, country=request.country, city=request.city, address=request.address, phone=request.phone, website=request.website, plan=request.plan)
        logger.info('Tenant created successfully', extra={'tenant_id': str(tenant.id), 'subdomain': tenant.subdomain, 'company_name': tenant.company_name, 'created_by': current_user.email})
        return TenantCreationResponse(tenant_id=str(tenant.id), subdomain=tenant.subdomain, company_name=tenant.company_name, portal_url=tenant_service.get_tenant_portal_url(tenant), status='created', message='Tenant created successfully. Infrastructure setup in progress.')
    except Exception as e:
        logger.error('Failed to create tenant', extra={'company_name': request.company_name, 'contact_email': request.contact_email, 'error': str(e), 'created_by': current_user.email})
        raise HTTPException(status_code=500, detail=f'Failed to create tenant: {str(e)}')

@router.post('/{tenant_id}/setup-infrastructure')
def setup_tenant_infrastructure(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    """Queue infrastructure provisioning for a tenant."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Only platform administrators can setup infrastructure')
    try:
        tenant_service = TenantCreationService(db)
        from app.models.tenant import Tenant
        tenant = db.get(Tenant, _resolve_uuid(tenant_id))
        if not tenant:
            raise HTTPException(status_code=404, detail='Tenant not found')
        result = tenant_service.setup_tenant_infrastructure(tenant)
        logger.info('Tenant infrastructure setup queued', extra={'tenant_id': tenant_id, 'subdomain': tenant.subdomain, 'setup_by': current_user.email})
        return result
    except ValueError as e:
        logger.error('Tenant infrastructure setup blocked by business rule', extra={'tenant_id': tenant_id, 'error': str(e), 'setup_by': current_user.email})
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.error('Failed to setup tenant infrastructure', extra={'tenant_id': tenant_id, 'error': str(e), 'setup_by': current_user.email})
        raise HTTPException(status_code=500, detail=f'Failed to setup infrastructure: {str(e)}')

@router.get('/{tenant_id}/status')
def get_tenant_status(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    """Get comprehensive tenant status"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Only platform administrators can view tenant status')
    try:
        tenant_service = TenantCreationService(db)
        status = tenant_service.get_tenant_status(tenant_id)
        return status
    except Exception as e:
        logger.error('Failed to get tenant status', extra={'tenant_id': tenant_id, 'error': str(e), 'requested_by': current_user.email})
        raise HTTPException(status_code=500, detail=f'Failed to get tenant status: {str(e)}')

@router.get('/{tenant_id}/portal-url')
def get_tenant_portal_url(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    """Get the portal URL for a tenant"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Only platform administrators can view tenant portal URL')
    try:
        tenant_service = TenantCreationService(db)
        from app.models.tenant import Tenant
        tenant = db.get(Tenant, _resolve_uuid(tenant_id))
        if not tenant:
            raise HTTPException(status_code=404, detail='Tenant not found')
        portal_url = tenant_service.get_tenant_portal_url(tenant)
        return {'tenant_id': tenant_id, 'subdomain': tenant.subdomain, 'portal_url': portal_url, 'custom_domain': tenant.custom_domain, 'custom_domain_verified': tenant.custom_domain_verified}
    except Exception as e:
        logger.error('Failed to get tenant portal URL', extra={'tenant_id': tenant_id, 'error': str(e), 'requested_by': current_user.email})
        raise HTTPException(status_code=500, detail=f'Failed to get portal URL: {str(e)}')

@router.post('/auto-provision')
def auto_provision_tenant(request_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    """Auto-provision tenant from registration request (for admin approval)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Only platform administrators can auto-provision tenants')
    row = db.get(TenantRequest, _resolve_uuid(request_id))
    if not row:
        raise HTTPException(status_code=404, detail='Registration request not found')
    if row.status in {'completed', 'provisioning'}:
        raise HTTPException(status_code=409, detail='Registration request already processed')

    row.status = 'provisioning'
    db.commit()

    try:
        tenant_service = TenantCreationService(db)
        tenant = tenant_service.create_tenant_from_request(
            company_name=row.company_name,
            contact_email=row.contact_email,
            contact_name=row.contact_name,
            business_type=row.business_type,
            country=row.country,
            city=row.city,
            address=row.address,
            phone=row.phone,
            website=row.website,
            plan='free_trial',
        )
        tenant.launch_status = LaunchStatus.approved
        tenant.verification_notes = row.review_notes or 'Auto-approved from registration request'
        db.commit()
        db.refresh(tenant)

        setup = tenant_service.setup_tenant_infrastructure(tenant)

        row.status = 'provisioning'
        row.tenant_id = tenant.id
        row.review_notes = row.review_notes or 'Auto-provision queued'
        db.commit()

        return {
            'request_id': str(row.id),
            'tenant_id': str(tenant.id),
            'status': row.status,
            'provisioning': setup,
        }
    except ValueError as exc:
        row.status = 'pending_review'
        row.review_notes = str(exc)
        db.commit()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as e:
        row.status = 'pending_review'
        row.review_notes = f'Auto-provision failed: {str(e)}'
        db.commit()
        raise HTTPException(status_code=500, detail=f'Failed to auto-provision tenant: {str(e)}')
