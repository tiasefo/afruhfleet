from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.structured_logging import get_logger
from app.db.session import get_db
from app.models.user import User
from app.services.tenant_creation_service import TenantCreationService
from app.schemas.tenant import TenantCreationRequest, TenantCreationResponse

logger = get_logger("afruheritage.tenant_creation_api")

router = APIRouter(prefix="/tenants", tags=["Tenant Creation"])


@router.post("/create", response_model=TenantCreationResponse)
def create_tenant(
    request: TenantCreationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new tenant with complete setup"""
    
    # Only platform admins can create tenants
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only platform administrators can create tenants"
        )
    
    try:
        tenant_service = TenantCreationService(db)
        
        # Create tenant
        tenant = tenant_service.create_tenant_from_request(
            company_name=request.company_name,
            contact_email=request.contact_email,
            contact_name=request.contact_name,
            business_type=request.business_type,
            country=request.country,
            city=request.city,
            address=request.address,
            phone=request.phone,
            website=request.website,
            plan=request.plan,
        )
        
        logger.info("Tenant created successfully", extra={
            "tenant_id": str(tenant.id),
            "subdomain": tenant.subdomain,
            "company_name": tenant.company_name,
            "created_by": current_user.email
        })
        
        return TenantCreationResponse(
            tenant_id=str(tenant.id),
            subdomain=tenant.subdomain,
            company_name=tenant.company_name,
            portal_url=tenant_service.get_tenant_portal_url(tenant),
            status="created",
            message="Tenant created successfully. Infrastructure setup in progress."
        )
        
    except Exception as e:
        logger.error("Failed to create tenant", extra={
            "company_name": request.company_name,
            "contact_email": request.contact_email,
            "error": str(e),
            "created_by": current_user.email
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create tenant: {str(e)}"
        )


@router.post("/{tenant_id}/setup-infrastructure")
def setup_tenant_infrastructure(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Setup complete infrastructure for a tenant"""
    
    # Only platform admins can setup infrastructure
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only platform administrators can setup infrastructure"
        )
    
    try:
        tenant_service = TenantCreationService(db)
        
        # Get tenant
        from app.models.tenant import Tenant
        tenant = db.get(Tenant, tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Setup infrastructure
        result = tenant_service.setup_tenant_infrastructure(tenant)
        
        logger.info("Tenant infrastructure setup complete", extra={
            "tenant_id": tenant_id,
            "subdomain": tenant.subdomain,
            "setup_by": current_user.email
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to setup tenant infrastructure", extra={
            "tenant_id": tenant_id,
            "error": str(e),
            "setup_by": current_user.email
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to setup infrastructure: {str(e)}"
        )


@router.get("/{tenant_id}/status")
def get_tenant_status(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive tenant status"""
    
    # Users can only view their own tenant status, admins can view any
    if not current_user.is_superuser and current_user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )
    
    try:
        tenant_service = TenantCreationService(db)
        status = tenant_service.get_tenant_status(tenant_id)
        
        return status
        
    except Exception as e:
        logger.error("Failed to get tenant status", extra={
            "tenant_id": tenant_id,
            "error": str(e),
            "requested_by": current_user.email
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get tenant status: {str(e)}"
        )


@router.get("/{tenant_id}/portal-url")
def get_tenant_portal_url(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the portal URL for a tenant"""
    
    # Users can only get their own portal URL, admins can get any
    if not current_user.is_superuser and current_user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )
    
    try:
        tenant_service = TenantCreationService(db)
        
        from app.models.tenant import Tenant
        tenant = db.get(Tenant, tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        portal_url = tenant_service.get_tenant_portal_url(tenant)
        
        return {
            "tenant_id": tenant_id,
            "subdomain": tenant.subdomain,
            "portal_url": portal_url,
            "custom_domain": tenant.custom_domain,
            "custom_domain_verified": tenant.custom_domain_verified
        }
        
    except Exception as e:
        logger.error("Failed to get tenant portal URL", extra={
            "tenant_id": tenant_id,
            "error": str(e),
            "requested_by": current_user.email
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get portal URL: {str(e)}"
        )


@router.post("/auto-provision")
def auto_provision_tenant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Auto-provision tenant from registration request (for admin approval)"""
    
    # Only platform admins can auto-provision
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only platform administrators can auto-provision tenants"
        )
    
    # This would typically be called from admin interface when approving a registration request
    # For now, it's a placeholder that shows the concept
    
    return {
        "message": "Auto-provision endpoint ready. Integration with registration requests needed.",
        "next_steps": [
            "1. Fetch pending registration request",
            "2. Create tenant using TenantCreationService",
            "3. Setup infrastructure",
            "4. Send welcome notifications"
        ]
    }
