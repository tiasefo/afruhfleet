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
            if request.query_params.get("hub.verify_token") == "YOUR_VERIFY_TOKEN":
                return int(request.query_params["hub.challenge"])
            else:
                raise HTTPException(status_code=403, detail="Invalid verify token")
        # Handle incoming WhatsApp messages
        # TODO: Implement message parsing and bot logic here
        # Example: echo received message
        # messages = data.get("entry", [])[0].get("changes", [])[0].get("value", {}).get("messages", [])
        # for msg in messages:
        #     sender = msg["from"]
        #     text = msg["text"]["body"]
        #     # Respond or trigger workflow
        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
