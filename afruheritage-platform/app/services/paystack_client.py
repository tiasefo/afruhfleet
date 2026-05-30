from __future__ import annotations
from app.core.config import settings

import hashlib
import hmac
import time

import httpx

PAYSTACK_BASE_URL = "https://api.paystack.co"


def _headers() -> dict[str, str]:
    secret = settings.paystack_secret_key
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

    return _request_with_retries("POST", "/transaction/initialize", json=payload)


def verify_transaction(reference: str) -> dict:
    return _request_with_retries("GET", f"/transaction/verify/{reference}")


def verify_webhook_signature(payload: bytes, signature: str | None) -> bool:
    if not signature:
        return False
    secret = settings.paystack_webhook_secret or settings.paystack_secret_key
    if not secret:
        return False
    expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature)


def _request_with_retries(method: str, path: str, json: dict | None = None, max_attempts: int = 3) -> dict:
    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.request(method, f"{PAYSTACK_BASE_URL}{path}", headers=_headers(), json=json)
                resp.raise_for_status()
                return resp.json()
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            last_error = exc
            if attempt < max_attempts:
                time.sleep(0.5 * attempt)
                continue
            break
        except httpx.HTTPStatusError as exc:
            # For provider-side failures, surface immediately without retrying 4xx.
            status = exc.response.status_code
            if status >= 500 and attempt < max_attempts:
                last_error = exc
                time.sleep(0.5 * attempt)
                continue
            detail = exc.response.text[:300]
            raise RuntimeError(f"Paystack API error ({status}): {detail}") from exc

    raise RuntimeError(f"Paystack request failed after {max_attempts} attempts: {last_error}")
