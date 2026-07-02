from __future__ import annotations

import os
import requests

from fastapi import APIRouter, HTTPException
from app.core.config import settings

router = APIRouter(prefix="/fleetbase-proxy", tags=["Fleetbase Proxy"])

FLEETBASE_API_URL = os.getenv(
    "FLEETBASE_INTERNAL_URL",
    "http://10.0.0.115:8003"
).rstrip("/")

FLEETBASE_API_TOKEN = os.getenv(
    "FLEETBASE_API_TOKEN",
    "1|KPPhwb69LydQ7mNNK2AvCQVGD9ifGtFSX2GNKok2"
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
        import logging
        logger = logging.getLogger("afruheritage.fleetbase_proxy")
        logger.info(f"Fetching from Fleetbase: {FLEETBASE_API_URL}{path}")
        
        r = requests.get(
            f"{FLEETBASE_API_URL}{path}",
            headers=_headers(),
            timeout=30,
        )

        if r.status_code >= 400:
            logger.error(f"Fleetbase returned {r.status_code}: {r.text}")
            raise HTTPException(
                status_code=r.status_code,
                detail=r.text,
            )

        return r.json()

    except requests.RequestException as exc:
        import logging
        logger = logging.getLogger("afruheritage.fleetbase_proxy")
        logger.error(f"Fleetbase request failed: {exc}")
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
