from __future__ import annotations

import os

import httpx

PAYSTACK_BASE_URL = "https://api.paystack.co"


def _headers() -> dict[str, str]:
    secret = os.getenv("PAYSTACK_SECRET_KEY", "")
    if not secret:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not set")
    return {
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json",
    }


def initialize_transaction(*, email: str, amount_minor: int, reference: str, currency: str, callback_url: str | None = None, metadata: dict | None = None) -> dict:
    payload = {
        "email": email,
        "amount": amount_minor,
        "reference": reference,
        "currency": currency,
        "metadata": metadata or {},
    }
    if callback_url:
        payload["callback_url"] = callback_url

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(f"{PAYSTACK_BASE_URL}/transaction/initialize", headers=_headers(), json=payload)
        resp.raise_for_status()
        return resp.json()


def verify_transaction(reference: str) -> dict:
    with httpx.Client(timeout=60.0) as client:
        resp = client.get(f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}", headers=_headers())
        resp.raise_for_status()
        return resp.json()
