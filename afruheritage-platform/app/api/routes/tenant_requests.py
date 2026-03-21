from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.core.structured_logging import get_logger

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
async def create_tenant_registration_request(request: TenantRegistrationRequest):
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
        
        # TODO: Save to database when tenant_requests model is created
        # For now, just log and return success
        
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
            "request_id": f"REQ-{hash(request.contactEmail) % 10000:04d}"
        }
        
    except Exception as e:
        logger.error("Failed to process tenant registration request: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to process registration request"
        )


@router.get("/registration-status/{request_id}")
async def get_registration_status(request_id: str):
    """Get registration request status"""
    # TODO: Implement when database model is ready
    return {
        "request_id": request_id,
        "status": "pending_review",
        "message": "Your request is being reviewed"
    }
