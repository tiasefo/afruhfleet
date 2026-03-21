from __future__ import annotations

import os

import httpx

# Choose provider based on environment
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "twilio").lower()

# Twilio implementation
def _twilio_headers() -> dict[str, str]:
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    if not account_sid or not auth_token:
        raise RuntimeError("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are not set")
    
    import base64
    credentials = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()
    return {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

def _send_via_twilio(to_phone: str, message: str, from_phone: str | None = None) -> dict:
    from_phone = from_phone or os.getenv("TWILIO_PHONE_NUMBER", "")
    if not from_phone:
        raise RuntimeError("TWILIO_PHONE_NUMBER is not set")
    
    payload = {
        "To": to_phone,
        "From": from_phone,
        "Body": message,
    }
    
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
            headers=_twilio_headers(),
            data=payload,
        )
        resp.raise_for_status()
        response_data = resp.json()
        return {"message_id": response_data.get("sid"), "provider": "twilio"}

# Africa's Talking implementation
def _africastalking_headers() -> dict[str, str]:
    api_key = os.getenv("AFRICASTALKING_API_KEY", "")
    username = os.getenv("AFRICASTALKING_USERNAME", "")
    if not api_key or not username:
        raise RuntimeError("AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME are not set")
    return {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": api_key,
    }

def _send_via_africastalking(to_phone: str, message: str, from_phone: str | None = None) -> dict:
    username = os.getenv("AFRICASTALKING_USERNAME", "")
    
    payload = {
        "username": username,
        "to": to_phone,
        "message": message,
    }
    
    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            "https://api.sandbox.africastalking.com/v1/sms",
            headers=_africastalking_headers(),
            data=payload,
        )
        resp.raise_for_status()
        response_data = resp.json()
        return {"message_id": response_data.get("SMSMessageData", {}).get("Recipients", [{}])[0].get("messageId"), "provider": "africastalking"}

# Public interface
def send_sms(
    to_phone: str,
    message: str,
    from_phone: str | None = None,
) -> dict:
    """
    Send SMS using configured provider
    
    Args:
        to_phone: Recipient phone number (E.164 format)
        message: SMS message content
        from_phone: Sender phone number (provider-specific)
    
    Returns:
        dict with message_id and provider
    """
    # Route to appropriate provider
    if SMS_PROVIDER == "africastalking":
        return _send_via_africastalking(to_phone, message, from_phone)
    else:  # Default to Twilio
        return _send_via_twilio(to_phone, message, from_phone)
