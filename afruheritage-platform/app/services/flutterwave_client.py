from __future__ import annotations
import hashlib
import hmac
import time
import os

import httpx

FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"


def _secret_key() -> str:
    key = os.getenv("FLUTTERWAVE_SECRET_KEY", "")
    if not key:
        raise RuntimeError("FLUTTERWAVE_SECRET_KEY is not set")
    return key


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_secret_key()}",
        "Content-Type": "application/json",
    }


def initialize_transaction(
    *,
    email: str,
    amount_major: float,
    reference: str,
    currency: str,
    callback_url: str | None = None,
    metadata: dict | None = None,
) -> dict:
    """
    Flutterwave standard payment link.
    Returns a dict with `data.link` as the redirect URL.
    """
    payload: dict = {
        "tx_ref": reference,
        "amount": amount_major,
        "currency": currency,
        "payment_options": "card,mobilemoney,ussd",
        "customer": {"email": email},
        "customizations": {
            "title": "Afruheritage Platform",
            "description": "Subscription Payment",
        },
        "meta": metadata or {},
    }
    if callback_url:
        payload["redirect_url"] = callback_url

    resp = _request_with_retries("POST", "/payments", json=payload)
    # Normalise to match Paystack-shaped response used by billing route:
    # billing route expects: resp["data"]["authorization_url"]
    link = resp.get("data", {}).get("link", "")
    return {
        "status": resp.get("status", "error"),
        "data": {
            "authorization_url": link,
            "access_code": reference,
        },
        "_raw": resp,
    }


def verify_transaction(transaction_id: str) -> dict:
    """
    Verify by Flutterwave transaction ID.
    Returns dict with data.status == 'successful' on success.
    """
    resp = _request_with_retries("GET", f"/transactions/{transaction_id}/verify")
    # Normalise to Paystack-shaped response:
    flw_data = resp.get("data", {})
    status = flw_data.get("status", "failed")
    return {
        "status": "success" if status == "successful" else "error",
        "data": {
            "status": "success" if status == "successful" else status,
            "amount": flw_data.get("amount", 0),
            "currency": flw_data.get("currency", ""),
            "reference": flw_data.get("tx_ref", ""),
            "metadata": flw_data.get("meta", {}),
        },
        "_raw": resp,
    }


def verify_webhook_signature(payload: bytes, signature: str | None) -> bool:
    if not signature:
        return False
    secret_hash = os.getenv("FLUTTERWAVE_WEBHOOK_SECRET", _secret_key())
    expected = hmac.new(secret_hash.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def _request_with_retries(
    method: str, path: str, json: dict | None = None, max_attempts: int = 3
) -> dict:
    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.request(
                    method,
                    f"{FLUTTERWAVE_BASE_URL}{path}",
                    headers=_headers(),
                    json=json,
                )
                resp.raise_for_status()
                return resp.json()
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            last_error = exc
            if attempt < max_attempts:
                time.sleep(0.5 * attempt)
                continue
            break
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            if status >= 500 and attempt < max_attempts:
                last_error = exc
                time.sleep(0.5 * attempt)
                continue
            detail = exc.response.text[:300]
            raise RuntimeError(f"Flutterwave API error ({status}): {detail}") from exc

    raise RuntimeError(f"Flutterwave request failed after {max_attempts} attempts: {last_error}")
