from __future__ import annotations

import base64

import httpx

from app.core.config import settings


def _auth_header() -> str:
    if not settings.paypal_client_id or not settings.paypal_client_secret:
        raise RuntimeError("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is not set")
    raw = f"{settings.paypal_client_id}:{settings.paypal_client_secret}".encode("utf-8")
    return f"Basic {base64.b64encode(raw).decode('utf-8')}"


def _base_url() -> str:
    return (settings.paypal_base_url or "https://api-m.sandbox.paypal.com").rstrip("/")


def get_access_token() -> str:
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"{_base_url()}/v1/oauth2/token",
            headers={
                "Authorization": _auth_header(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials"},
        )
        resp.raise_for_status()
        body = resp.json()
        token = body.get("access_token")
        if not token:
            raise RuntimeError("PayPal access token missing from response")
        return token


def create_order(*, amount: float, currency: str, reference: str, return_url: str, cancel_url: str, metadata: dict | None = None) -> dict:
    token = get_access_token()
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"{_base_url()}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "reference_id": reference,
                        "custom_id": reference,
                        "amount": {
                            "currency_code": currency,
                            "value": f"{amount:.2f}",
                        },
                        "description": "Afruheritage platform payment",
                    }
                ],
                "application_context": {
                    "return_url": return_url,
                    "cancel_url": cancel_url,
                    "shipping_preference": "NO_SHIPPING",
                },
            },
        )
        resp.raise_for_status()
        return resp.json()


def capture_order(order_id: str) -> dict:
    token = get_access_token()
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"{_base_url()}/v2/checkout/orders/{order_id}/capture",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        resp.raise_for_status()
        return resp.json()


def get_order(order_id: str) -> dict:
    token = get_access_token()
    with httpx.Client(timeout=30.0) as client:
        resp = client.get(
            f"{_base_url()}/v2/checkout/orders/{order_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        resp.raise_for_status()
        return resp.json()
