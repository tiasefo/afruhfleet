from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings
from app.core.structured_logging import get_logger

logger = get_logger("afruheritage.whatsapp")


class WhatsAppNotificationService:
    """WhatsApp Business API service for tenant notifications"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.api_url = "https://graph.facebook.com/v18.0"
        self.access_token = settings.whatsapp_access_token
        self.phone_number_id = settings.whatsapp_phone_number_id
    
    async def send_message(self, recipient: str, message: str, message_type: str = "text") -> dict[str, Any]:
        """Send WhatsApp message to recipient"""
        try:
            if not self.access_token or not self.phone_number_id:
                logger.warning("WhatsApp not configured for tenant notification delivery")
                return {
                    "status": "not_configured",
                    "recipient": recipient,
                    "error": "WhatsApp API credentials are not configured"
                }
            
            # Real WhatsApp Business API call
            import httpx
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "messaging_product": "whatsapp",
                "to": recipient,
                "type": message_type,
                "text": {
                    "body": message
                }
            }
            
            url = f"{self.api_url}/{self.phone_number_id}/messages"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                result = response.json()
                
                logger.info("WhatsApp message sent", extra={
                    "tenant_id": self.tenant_id,
                    "recipient": recipient,
                    "message_id": result.get("messages", [{}])[0].get("id"),
                    "status": "sent"
                })
                
                return {
                    "message_id": result.get("messages", [{}])[0].get("id"),
                    "status": "sent",
                    "recipient": recipient
                }
        
        except Exception as e:
            logger.error("Failed to send WhatsApp message", extra={
                "tenant_id": self.tenant_id,
                "recipient": recipient,
                "error": str(e)
            })
            return {
                "status": "failed",
                "error": str(e),
                "recipient": recipient
            }
    
    async def send_shipment_update_to_groups(self, shipment_data: dict[str, Any]) -> dict[str, Any]:
        """Send shipment update to tenant's WhatsApp groups"""
        try:
            # Get tenant's WhatsApp groups
            groups = await self._get_tenant_whatsapp_groups()
            
            if not groups:
                logger.info("No WhatsApp groups configured for tenant", extra={
                    "tenant_id": self.tenant_id
                })
                return {"status": "no_groups", "message": "No WhatsApp groups configured"}
            
            # Create tracking link
            tracking_url = f"https://{await self._get_tenant_subdomain()}.afruheritage.com/track/{shipment_data['tracking_number']}"
            
            # Format message
            message = self._format_shipment_update_message(shipment_data, tracking_url)
            
            # Send to all groups
            results = []
            for group in groups:
                result = await self.send_message(group["group_id"], message)
                results.append({
                    "group_id": group["group_id"],
                    "group_name": group["group_name"],
                    "result": result
                })
            
            successful_sends = len([r for r in results if r["result"]["status"] == "sent"])
            
            logger.info("Shipment update sent to WhatsApp groups", extra={
                "tenant_id": self.tenant_id,
                "tracking_number": shipment_data["tracking_number"],
                "groups_count": len(groups),
                "successful_sends": successful_sends
            })
            
            return {
                "status": "completed",
                "tracking_number": shipment_data["tracking_number"],
                "groups_notified": successful_sends,
                "total_groups": len(groups),
                "results": results
            }
        
        except Exception as e:
            logger.error("Failed to send shipment update to groups", extra={
                "tenant_id": self.tenant_id,
                "tracking_number": shipment_data.get("tracking_number"),
                "error": str(e)
            })
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def send_customer_notification(self, customer_phone: str, shipment_data: dict[str, Any]) -> dict[str, Any]:
        """Send WhatsApp notification directly to customer"""
        try:
            tracking_url = f"https://{await self._get_tenant_subdomain()}.afruheritage.com/track/{shipment_data['tracking_number']}"
            
            message = self._format_customer_message(shipment_data, tracking_url)
            
            result = await self.send_message(customer_phone, message)
            
            logger.info("Customer WhatsApp notification sent", extra={
                "tenant_id": self.tenant_id,
                "customer_phone": customer_phone,
                "tracking_number": shipment_data["tracking_number"],
                "status": result["status"]
            })
            
            return result
        
        except Exception as e:
            logger.error("Failed to send customer WhatsApp notification", extra={
                "tenant_id": self.tenant_id,
                "customer_phone": customer_phone,
                "tracking_number": shipment_data.get("tracking_number"),
                "error": str(e)
            })
            return {
                "status": "failed",
                "error": str(e)
            }
    
    def _format_shipment_update_message(self, shipment_data: dict[str, Any], tracking_url: str) -> str:
        """Format shipment update message for WhatsApp groups"""
        status_emojis = {
            "picked_up": "🚚",
            "in_transit": "🛣️",
            "at_customs": "🏛️",
            "customs_cleared": "✅",
            "out_for_delivery": "📦",
            "delivered": "🎯",
            "created": "📝",
            "booked": "📋"
        }
        
        emoji = status_emojis.get(shipment_data.get("status", "created"), "📦")
        
        message = f"""{emoji} *Shipment Update*

📦 Tracking: {shipment_data['tracking_number']}
📍 Status: {shipment_data.get('status', 'Unknown').title()}
👤 Customer: {shipment_data.get('customer_name', 'N/A')}
📍 Location: {shipment_data.get('location', 'N/A')}

🔗 Track: {tracking_url}

📅 Updated: {shipment_data.get('timestamp', 'Just now')}
"""
        return message
    
    def _format_customer_message(self, shipment_data: dict[str, Any], tracking_url: str) -> str:
        """Format message for direct customer notification"""
        status_messages = {
            "picked_up": "Your package has been picked up and is on its way!",
            "in_transit": "Your package is in transit to its destination.",
            "at_customs": "Your package is currently in customs clearance.",
            "customs_cleared": "Great news! Your package has cleared customs.",
            "out_for_delivery": "Your package is out for delivery today!",
            "delivered": "Your package has been delivered successfully! 🎉"
        }
        
        message = status_messages.get(shipment_data.get("status"), "Your shipment status has been updated.")
        
        return f"""📦 {shipment_data['tracking_number']}

{message}

🔗 Track your package: {tracking_url}

Thank you for choosing our service! 🚀
"""
    
    async def _get_tenant_whatsapp_groups(self) -> list[dict[str, Any]]:
        """Get tenant's configured WhatsApp groups"""
        return []
    
    async def _get_tenant_subdomain(self) -> str:
        """Get tenant's subdomain for tracking URLs"""
        return self.tenant_id
    
    async def configure_whatsapp_groups(self, groups: list[dict[str, Any]]) -> dict[str, Any]:
        """Configure WhatsApp groups for tenant"""
        try:
            configured_groups = []
            for group in groups:
                group_id = group.get("group_id", "")
                group_name = group.get("group_name", "")
                if not group_id or not group_name:
                    continue
                if not group_id.endswith("@g.us"):
                    logger.warning("Invalid WhatsApp group ID", extra={
                        "tenant_id": self.tenant_id,
                        "group_id": group_id
                    })
                    continue
                configured_groups.append({
                    "group_id": group_id,
                    "group_name": group_name,
                    "notifications": group.get("notifications", ["all"])
                })

            if not configured_groups:
                return {
                    "status": "not_enabled",
                    "error": "No valid WhatsApp groups submitted",
                    "groups_count": 0,
                    "groups": []
                }

            logger.info("WhatsApp group configuration accepted but persistence is not enabled", extra={
                "tenant_id": self.tenant_id,
                "groups_count": len(configured_groups)
            })

            return {
                "status": "not_enabled",
                "error": "Persistent WhatsApp group storage is not enabled yet",
                "groups_count": len(configured_groups),
                "groups": configured_groups
            }
        
        except Exception as e:
            logger.error("Failed to configure WhatsApp groups", extra={
                "tenant_id": self.tenant_id,
                "error": str(e)
            })
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def test_whatsapp_connection(self) -> dict[str, Any]:
        """Test WhatsApp API connection"""
        try:
            if not self.access_token:
                return {
                    "status": "not_configured",
                    "message": "WhatsApp access token not configured"
                }
            
            # Test API connectivity
            import httpx
            
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            url = f"{self.api_url}/me"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    return {
                        "status": "connected",
                        "message": "WhatsApp API connection successful"
                    }
                else:
                    return {
                        "status": "failed",
                        "message": f"WhatsApp API error: {response.status_code}"
                    }
        
        except Exception as e:
            return {
                "status": "failed",
                "message": f"Connection test failed: {str(e)}"
            }


# Global service factory
def get_whatsapp_service(tenant_id: str) -> WhatsAppNotificationService:
    """Get WhatsApp notification service for tenant"""
    return WhatsAppNotificationService(tenant_id)
