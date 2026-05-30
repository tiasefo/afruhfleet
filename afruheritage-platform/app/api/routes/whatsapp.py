from __future__ import annotations
from app.core.config import settings

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.structured_logging import get_logger
from app.db.session import get_db
from app.models.user import User
from app.services.whatsapp_service import get_whatsapp_service

logger = get_logger("afruheritage.whatsapp_api")

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Notifications"])


@router.post("/configure-groups")
async def configure_whatsapp_groups(
    groups: list[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Configure WhatsApp groups for tenant notifications"""
    try:
        whatsapp_service = get_whatsapp_service(str(current_user.tenant_id))
        
        result = await whatsapp_service.configure_whatsapp_groups(groups)
        
        logger.info("WhatsApp groups configured", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "groups_count": result.get("groups_count", 0)
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to configure WhatsApp groups", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to configure WhatsApp groups: {str(e)}"
        )


@router.post("/test-connection")
async def test_whatsapp_connection(
    current_user: User = Depends(get_current_user),
):
    """Test WhatsApp API connection"""
    try:
        whatsapp_service = get_whatsapp_service(str(current_user.tenant_id))
        
        result = await whatsapp_service.test_whatsapp_connection()
        
        logger.info("WhatsApp connection test", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "status": result["status"]
        })
        
        return result
        
    except Exception as e:
        logger.error("WhatsApp connection test failed", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"WhatsApp connection test failed: {str(e)}"
        )


@router.post("/send-shipment-update")
async def send_shipment_update(
    shipment_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send shipment update to WhatsApp groups"""
    try:
        whatsapp_service = get_whatsapp_service(str(current_user.tenant_id))
        
        result = await whatsapp_service.send_shipment_update_to_groups(shipment_data)
        
        logger.info("Shipment update sent to WhatsApp", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "tracking_number": shipment_data.get("tracking_number"),
            "status": result["status"]
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to send shipment update", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "tracking_number": shipment_data.get("tracking_number"),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send shipment update: {str(e)}"
        )


@router.post("/send-customer-notification")
async def send_customer_notification(
    customer_phone: str,
    shipment_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send WhatsApp notification directly to customer"""
    try:
        whatsapp_service = get_whatsapp_service(str(current_user.tenant_id))
        
        result = await whatsapp_service.send_customer_notification(customer_phone, shipment_data)
        
        logger.info("Customer WhatsApp notification sent", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "customer_phone": customer_phone,
            "tracking_number": shipment_data.get("tracking_number"),
            "status": result["status"]
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to send customer notification", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "customer_phone": customer_phone,
            "tracking_number": shipment_data.get("tracking_number"),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send customer notification: {str(e)}"
        )


@router.get("/status")
async def get_whatsapp_status(
    current_user: User = Depends(get_current_user),
):
    """Get WhatsApp service status"""
    try:
        whatsapp_service = get_whatsapp_service(str(current_user.tenant_id))
        
        # Test connection
        connection_test = await whatsapp_service.test_whatsapp_connection()
        
        # Get configured groups
        groups = await whatsapp_service._get_tenant_whatsapp_groups()
        
        return {
            "connection_status": connection_test["status"],
            "connection_message": connection_test["message"],
            "configured_groups": len(groups),
            "groups": groups,
            "tenant_id": str(current_user.tenant_id)
        }
        
    except Exception as e:
        logger.error("Failed to get WhatsApp status", extra={
            "user_id": str(current_user.id),
            "tenant_id": str(current_user.tenant_id),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get WhatsApp status: {str(e)}"
        )
