from __future__ import annotations
from app.core.config import settings

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.deps import require_superuser
from app.db.session import get_db
from app.core.structured_logging import get_logger
from app.models.tenant_request import TenantRequest
from app.models.user import User

logger = get_logger("afruheritage.tenant_requests")

router = APIRouter(prefix="/tenants", tags=["Tenant Requests"])


class TenantRegistrationRequest(BaseModel):
    """Tenant registration request model"""
    companyName: str
    businessType: str
    country: str
    city: str
    address: str
    contactName: str
    contactEmail: EmailStr
    phone: str
    website: str | None = None
    message: str | None = None
    volume: str | None = None
    services: list[str] | None = None
    timeline: str | None = None
    terms: bool = False


@router.post("/register-request")
async def create_tenant_registration_request(request: TenantRegistrationRequest, db: Session = Depends(get_db)):
    """Create a new tenant registration request"""
    try:
        # Log the registration request
        logger.info("New tenant registration request", extra={
            "company_name": request.companyName,
            "business_type": request.businessType,
            "country": request.country,
            "city": request.city,
            "contact_email": request.contactEmail,
            "phone": request.phone,
            "services": request.services,
            "volume": request.volume,
            "timeline": request.timeline,
        })
        
        row = TenantRequest(
            company_name=request.companyName,
            business_type=request.businessType,
            country=request.country,
            city=request.city,
            address=request.address,
            contact_name=request.contactName,
            contact_email=str(request.contactEmail),
            phone=request.phone,
            website=request.website,
            message=request.message,
            volume=request.volume,
            services=json.dumps(request.services or []),
            timeline=request.timeline,
            terms_accepted=request.terms,
            status="pending_review",
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        
        # Send notification email (would integrate with notification service)
        try:
            from app.services.notification_service import notification_service
            notification_service.send_tenant_registration_email(
                to="admin@afruheritage.com",
                company_name=request.companyName,
                contact_name=request.contactName,
                contact_email=request.contactEmail,
                business_type=request.businessType,
                country=request.country,
                city=request.city,
                phone=request.phone,
                message=request.message,
                services=request.services,
                volume=request.volume,
                timeline=request.timeline,
            )
            logger.info("Registration notification sent to admin")
        except Exception as e:
            logger.warning("Failed to send registration notification: %s", e)
        
        return {
            "success": True,
            "message": "Registration request submitted successfully. We'll contact you within 48 hours.",
            "request_id": str(row.id)
        }
        
    except Exception as e:
        logger.error("Failed to process tenant registration request: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to process registration request"
        )


@router.get("/registration-status/{request_id}")
async def get_registration_status(request_id: str, db: Session = Depends(get_db)):
    """Get registration request status"""
    row = db.get(TenantRequest, request_id)
    if not row:
        raise HTTPException(status_code=404, detail="Registration request not found")
    return {
        "request_id": str(row.id),
        "status": row.status,
        "message": row.review_notes or "Your request is being reviewed",
        "tenant_id": str(row.tenant_id) if row.tenant_id else None,
    }


@router.get("/register-requests")
def list_registration_requests(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    rows = db.query(TenantRequest)
    if status:
        rows = rows.filter(TenantRequest.status == status)
    total = rows.count()
    items = rows.order_by(TenantRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [
            {
                "id": str(r.id),
                "company_name": r.company_name,
                "contact_name": r.contact_name,
                "contact_email": r.contact_email,
                "business_type": r.business_type,
                "country": r.country,
                "city": r.city,
                "status": r.status,
                "timeline": r.timeline,
                "volume": r.volume,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


class TenantRequestReviewPayload(BaseModel):
    status: str
    review_notes: str | None = None


@router.patch("/register-requests/{request_id}")
def review_registration_request(
    request_id: str,
    payload: TenantRequestReviewPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    row = db.get(TenantRequest, request_id)
    if not row:
        raise HTTPException(status_code=404, detail="Registration request not found")
    allowed = {"pending_review", "approved", "rejected", "provisioning", "completed"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    row.status = payload.status
    row.review_notes = payload.review_notes
    db.commit()
    db.refresh(row)
    return {"id": str(row.id), "status": row.status, "review_notes": row.review_notes}
