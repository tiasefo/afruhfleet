from __future__ import annotations

import re
from typing import Any

import requests

from app.services.customs.ghana_rules import ghana_vehicle_fallback, ghana_goods_fallback


USED_VEHICLE_URL = "https://external.unipassghana.com/cl/tm/tax/selectUsedVehicleTaxCalculate.do"
GENERAL_GOODS_URL = "https://external.unipassghana.com/cl/tm/tax/selectGeneralTaxCalculate.do"
VAT_URL = "https://gra.gov.gh/online-tools/tax-calculators/value-added-tax/"
CST_URL = "https://gra.gov.gh/online-tools/tax-calculators/communication-service-tax/"


def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": "AfruHeritageCustomsEngine/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return s


def _extract_money(text: str, labels: list[str]) -> float | None:
    for label in labels:
        pattern = rf"{re.escape(label)}[^0-9\-]*([0-9,]+(?:\.[0-9]+)?)"
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return float(m.group(1).replace(",", ""))
    return None


def try_icums_used_vehicle(payload: dict[str, Any], timeout: int = 3) -> dict[str, Any] | None:
    """
    Public-page adapter.
    Returns None silently when ICUMS page is unavailable, changed, or does not return parseable tax.
    """
    try:
        s = _session()

        params = {
            "decorator": "popup",
            "MENU_ID": "IIM01S03V02",
        }

        # First GET warms session and confirms availability.
        r = s.get(USED_VEHICLE_URL, params=params, timeout=timeout)
        if r.status_code >= 400:
            return None

        # Conservative POST attempt. Field names may need tuning after observing ICUMS form payload.
        data = {
            "vin": payload.get("vin") or "",
            "make": payload.get("make") or "",
            "model": payload.get("model") or "",
            "yy": payload.get("vehicle_year") or "",
            "year": payload.get("vehicle_year") or "",
        }

        r2 = s.post(USED_VEHICLE_URL, params=params, data=data, timeout=timeout)
        if r2.status_code >= 400:
            return None

        html = r2.text
        total_tax = _extract_money(html, ["Total Tax", "Total Duty", "Total Payable"])
        hdv = _extract_money(html, ["HDV", "Home Delivery Value"])
        cif = _extract_money(html, ["CIF NCY", "CIF"])

        # Reject false-positive parses from menu IDs, script constants, style values, etc.
        parsed_values = [v for v in [total_tax, hdv, cif] if v is not None]
        if not parsed_values:
            return None

        if max(parsed_values) < 1000:
            return None

        return {
            "provider": "ghana_icums_public_used_vehicle",
            "mode": "public_lookup",
            "official": False,
            "country": "GH",
            "commodity_type": "vehicle",
            "hdv": hdv,
            "cif": cif,
            "total_tax": total_tax,
            "raw_parse_confidence": "partial",
            "notes": [
                "Result parsed from ICUMS public used vehicle calculator page.",
                "This is not a certified private ICUMS API integration.",
            ],
        }

    except Exception:
        return None


def try_icums_general_goods(payload: dict[str, Any], timeout: int = 3) -> dict[str, Any] | None:
    try:
        s = _session()
        params = {
            "decorator": "popup",
            "MENU_ID": "IIM01S03V01",
        }

        r = s.get(GENERAL_GOODS_URL, params=params, timeout=timeout)
        if r.status_code >= 400:
            return None

        data = {
            "hsCd": payload.get("hs_code") or "",
            "hs_code": payload.get("hs_code") or "",
            "cif": payload.get("cif_value") or "",
            "fob": payload.get("fob_value") or "",
            "netWeight": payload.get("weight_kg") or "",
            "qty": payload.get("quantity") or "",
            "country": payload.get("origin_country") or "",
        }

        r2 = s.post(GENERAL_GOODS_URL, params=params, data=data, timeout=timeout)
        if r2.status_code >= 400:
            return None

        html = r2.text
        total_tax = _extract_money(html, ["Total Tax", "Total Duty", "Total Payable"])
        if not total_tax:
            return None

        return {
            "provider": "ghana_icums_public_general_goods",
            "mode": "public_lookup",
            "official": False,
            "country": "GH",
            "commodity_type": "cargo",
            "total_tax": total_tax,
            "raw_parse_confidence": "partial",
            "notes": [
                "Result parsed from ICUMS public general goods calculator page.",
                "This is not a certified private ICUMS API integration.",
            ],
        }

    except Exception:
        return None


def ghana_vehicle_orchestrator(payload: dict[str, Any]) -> dict[str, Any]:
    icums = try_icums_used_vehicle(payload, timeout=3)
    if icums:
        return icums
    return ghana_vehicle_fallback(payload)


def ghana_goods_orchestrator(payload: dict[str, Any]) -> dict[str, Any]:
    icums = try_icums_general_goods(payload, timeout=3)
    if icums:
        return icums
    return ghana_goods_fallback(payload)


def ghana_public_sources() -> dict[str, Any]:
    return {
        "used_vehicle_calculator": USED_VEHICLE_URL + "?decorator=popup&MENU_ID=IIM01S03V02",
        "general_goods_calculator": GENERAL_GOODS_URL + "?decorator=popup&MENU_ID=IIM01S03V01",
        "vat_calculator": VAT_URL,
        "cst_calculator": CST_URL,
        "strategy": "Try public ICUMS/GRA endpoints silently; fallback to AfruHeritage Ghana rules engine.",
    }
