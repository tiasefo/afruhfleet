"""
Page Generator API Routes

Endpoints for automatically generating missing pages for templates.
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_tenant_admin, require_active_subscription
from app.models.user import User
from app.services.page_generator_service import PageGeneratorService, generate_pages_for_tenant

router = APIRouter(prefix='/page-generator', tags=['Page Generator'])


@router.get("/status")
def get_page_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
) -> dict[str, Any]:
    """Get the status of pages for the current tenant (existing vs generated)."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User must be associated with a tenant")
    
    service = PageGeneratorService(db)
    status = service.get_page_status(str(current_user.tenant_id))
    
    if not status["success"]:
        raise HTTPException(status_code=500, detail=status.get("error", "Failed to get page status"))
    
    return status


@router.post("/generate")
def generate_missing_pages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict[str, Any]:
    """Generate all missing pages for the current tenant's template.
    
    This endpoint uses the template's branding and styling to automatically
    create pages that are missing from the template but required by the platform.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User must be associated with a tenant")
    
    result = generate_pages_for_tenant(str(current_user.tenant_id), db)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate pages"))
    
    return result


@router.get("/templates/{template_code}/pages")
def get_template_pages(
    template_code: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Get the list of pages available in a specific template."""
    service = PageGeneratorService(db)
    pages = service.get_template_pages(template_code)
    
    return {
        "template_code": template_code,
        "pages": pages,
        "total": len(pages),
    }


@router.get("/required-pages")
def get_required_pages() -> dict[str, Any]:
    """Get the list of all required pages for the platform."""
    from app.services.page_generator_service import REQUIRED_PAGES
    
    return {
        "required_pages": REQUIRED_PAGES,
        "total": len(REQUIRED_PAGES),
        "required_count": sum(1 for p in REQUIRED_PAGES.values() if p["required"]),
    }
