from app.core.config import settings
from fastapi import APIRouter, Request, HTTPException
from app.services.whatsapp_service import get_whatsapp_service

router = APIRouter(prefix="/whatsapp-bot", tags=["WhatsApp Bot"])

@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    """Webhook endpoint for WhatsApp bot (Meta API callback)"""
    try:
        data = await request.json()
        # Basic verification (Meta will send challenge for verification)
        if "hub.mode" in request.query_params and "hub.challenge" in request.query_params:
            verify_token = getattr(settings, "whatsapp_verify_token", "") or ""
            if request.query_params.get("hub.verify_token") == verify_token:
                return int(request.query_params["hub.challenge"])
            else:
                raise HTTPException(status_code=403, detail="Invalid verify token")
        # Handle incoming WhatsApp messages
        entries = data.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                for msg in messages:
                    sender = msg.get("from", "")
                    msg_type = msg.get("type", "")
                    text_body = ""
                    if msg_type == "text":
                        text_body = msg.get("text", {}).get("body", "")
                    elif msg_type == "interactive":
                        text_body = msg.get("interactive", {}).get("button_reply", {}).get("title", "")
                    if text_body:
                        whatsapp_service = get_whatsapp_service()
                        await whatsapp_service.send_text(sender, f"Received: {text_body}")
        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
