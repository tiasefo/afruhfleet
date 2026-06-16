from __future__ import annotations

import hashlib
import json
import os
import uuid
from typing import Any

import psycopg
import requests
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr

from app.services.customs.ghana_rules import ghana_vehicle_fallback, ghana_goods_fallback
from app.services.customs.providers import calculate_with_fallback

router = APIRouter(prefix="/customs/guest", tags=["Customs Guest"])

FREE_CHECK_LIMIT = int(os.getenv("CUSTOMS_GUEST_FREE_LIMIT", "2"))
PAYSTACK_CALLBACK_URL = os.getenv(
    "CUSTOMS_PAYSTACK_CALLBACK_URL",
    "https://afruheritage.com/customs/duty-calculator?payment=callback",
)

PRICES = {
    ("GH", "vehicle"): ("GHS", 10000),
    ("GH", "cargo"): ("GHS", 7000),
    ("KE", "vehicle"): ("KES", 115000),
    ("KE", "cargo"): ("KES", 80000),
}


class GuestDutyRequest(BaseModel):
    guest_id: str
    email: EmailStr | None = None
    country: str
    commodity_type: str
    payload: dict[str, Any]


def get_paystack_secret() -> str:
    return os.getenv("PAYSTACK_SECRET_KEY", "")


def get_dsn() -> str:
    dsn = os.getenv("DATABASE_URL") or "postgresql://afruheritage:afruheritage@postgres:5432/afruheritage"
    if dsn.startswith("postgresql+psycopg://"):
        dsn = dsn.replace("postgresql+psycopg://", "postgresql://", 1)
    if dsn.startswith("postgresql+psycopg2://"):
        dsn = dsn.replace("postgresql+psycopg2://", "postgresql://", 1)
    return dsn


def db_fetchone(sql: str, params: tuple = ()):
    conn = psycopg.connect(get_dsn())
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchone()
    finally:
        conn.close()


def db_execute(sql: str, params: tuple = ()):
    conn = psycopg.connect(get_dsn())
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
    finally:
        conn.close()


def fingerprint_parts(request: Request, guest_id: str) -> tuple[str, str, str]:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip = forwarded or (request.client.host if request.client else "")
    ua = request.headers.get("user-agent", "")
    accept_lang = request.headers.get("accept-language", "")
    raw = f"{guest_id}|{ip}|{ua}|{accept_lang}"
    return hashlib.sha256(raw.encode()).hexdigest(), ip, ua


def price_for(country: str, commodity_type: str) -> tuple[str, int]:
    key = (country.upper(), commodity_type.lower())
    if key not in PRICES:
        raise HTTPException(status_code=400, detail="Unsupported country/commodity pricing")
    return PRICES[key]


def normalize_payload(body: GuestDutyRequest) -> dict[str, Any]:
    payload = dict(body.payload or {})
    payload["country"] = body.country.upper()
    payload["commodity_type"] = body.commodity_type.lower()
    return payload


def run_customs(payload: dict[str, Any]) -> dict[str, Any]:
    country = str(payload.get("country") or "").upper()
    commodity = str(payload.get("commodity_type") or "").lower()

    if country == "GH" and commodity == "vehicle":
        return ghana_vehicle_fallback(payload)

    if country == "GH" and commodity in ["cargo", "goods"]:
        payload["commodity_type"] = "cargo"
        return ghana_goods_fallback(payload)

    # Kenya and any supported future countries flow through shared engine.
    return calculate_with_fallback(payload)


def create_paystack_payment(email: str, amount_minor: int, currency: str, reference: str) -> str:
    secret = get_paystack_secret()
    if not secret:
        raise HTTPException(status_code=500, detail="PAYSTACK_SECRET_KEY missing")

    r = requests.post(
        "https://api.paystack.co/transaction/initialize",
        headers={
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
        },
        json={
            "email": email,
            "amount": amount_minor,
            "currency": currency,
            "reference": reference,
            "callback_url": PAYSTACK_CALLBACK_URL,
        },
        timeout=30,
    )

    if r.status_code >= 400:
        raise HTTPException(status_code=502, detail=r.text)

    return r.json()["data"]["authorization_url"]


@router.post("/calculate")
def guest_calculate(body: GuestDutyRequest, request: Request):
    country = body.country.upper()
    commodity = body.commodity_type.lower()
    payload = normalize_payload(body)
    fp, ip, user_agent = fingerprint_parts(request, body.guest_id)

    row = db_fetchone(
        "SELECT COUNT(*) FROM guest_customs_checks WHERE fingerprint=%s",
        (fp,),
    )
    used_count = int(row[0] if row else 0)

    if used_count < FREE_CHECK_LIMIT:
        result = run_customs(payload)

        db_execute(
            """
            INSERT INTO guest_customs_checks
            (guest_id, ip_address, user_agent, fingerprint, country, commodity_type, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'used')
            """,
            (body.guest_id, ip, user_agent, fp, country, commodity),
        )

        return {
            "payment_required": False,
            "free_remaining": max(0, FREE_CHECK_LIMIT - used_count - 1),
            "used_count": used_count + 1,
            "result": result,
        }

    currency, amount_minor = price_for(country, commodity)
    result = run_customs(payload)
    reference = f"customs_{country}_{commodity}_{uuid.uuid4().hex[:18]}"
    email = str(body.email or f"guest-{body.guest_id[:8]}@afruheritage.local")

    authorization_url = create_paystack_payment(email, amount_minor, currency, reference)

    db_execute(
        """
        INSERT INTO customs_payment_intents
        (guest_id, fingerprint, country, commodity_type, amount_minor, currency, reference,
         status, request_payload, result_payload, authorization_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s::jsonb, %s::jsonb, %s)
        """,
        (
            body.guest_id,
            fp,
            country,
            commodity,
            amount_minor,
            currency,
            reference,
            json.dumps(payload),
            json.dumps(result),
            authorization_url,
        ),
    )

    return {
        "payment_required": True,
        "free_remaining": 0,
        "currency": currency,
        "amount_minor": amount_minor,
        "amount": amount_minor / 100,
        "reference": reference,
        "authorization_url": authorization_url,
    }


@router.get("/payment/verify/{reference}")
def verify_payment(reference: str):
    secret = get_paystack_secret()
    if not secret:
        raise HTTPException(status_code=500, detail="PAYSTACK_SECRET_KEY missing")

    r = requests.get(
        f"https://api.paystack.co/transaction/verify/{reference}",
        headers={"Authorization": f"Bearer {secret}"},
        timeout=30,
    )

    if r.status_code >= 400:
        raise HTTPException(status_code=502, detail=r.text)

    data = r.json()["data"]
    paid = data.get("status") == "success"

    if paid:
        db_execute(
            """
            UPDATE customs_payment_intents
            SET status='paid', paid_at=now()
            WHERE reference=%s
            """,
            (reference,),
        )

    row = db_fetchone(
        """
        SELECT result_payload, currency, amount_minor, status
        FROM customs_payment_intents
        WHERE reference=%s
        """,
        (reference,),
    )

    return {
        "reference": reference,
        "paid": paid,
        "status": data.get("status"),
        "currency": row[1] if row else data.get("currency"),
        "amount_minor": row[2] if row else data.get("amount"),
        "payment_status": row[3] if row else None,
        "result": row[0] if row else None,
    }


@router.delete("/admin/reset-guest/{guest_id}")
def reset_guest_usage(guest_id: str):
    db_execute("DELETE FROM guest_customs_checks WHERE guest_id=%s", (guest_id,))
    db_execute("DELETE FROM customs_payment_intents WHERE guest_id=%s", (guest_id,))
    return {"ok": True, "guest_id": guest_id, "message": "Guest usage/payment intents reset"}
