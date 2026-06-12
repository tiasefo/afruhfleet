from __future__ import annotations

import os
import requests

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/fleetbase-proxy", tags=["Fleetbase Proxy"])

FLEETBASE_API_URL = os.getenv(
    "FLEETBASE_API_URL",
    "https://fleet.afruheritage.com"
).rstrip("/")

FLEETBASE_API_TOKEN = os.getenv(
    "FLEETBASE_API_TOKEN",
    ""
)


def _headers():
    if not FLEETBASE_API_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="FLEETBASE_API_TOKEN missing"
        )

    return {
        "Authorization": f"Bearer {FLEETBASE_API_TOKEN}",
        "Accept": "application/json",
    }


def _get(path: str):
    try:
        r = requests.get(
            f"{FLEETBASE_API_URL}{path}",
            headers=_headers(),
            timeout=30,
        )

        if r.status_code >= 400:
            raise HTTPException(
                status_code=r.status_code,
                detail=r.text,
            )

        return r.json()

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )


@router.get("/drivers")
def drivers():
    return _get("/int/v1/drivers")


@router.get("/vehicles")
def vehicles():
    return _get("/int/v1/vehicles")


@router.get("/fleets")
def fleets():
    return _get("/int/v1/fleets")


@router.get("/orders")
def orders():
    return _get("/int/v1/orders")


@router.get("/console-url")
def console_url():
    return {
        "url": "https://fleet.afruheritage.com"
    }
