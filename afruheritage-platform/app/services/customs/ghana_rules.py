from __future__ import annotations

from datetime import datetime
from pathlib import Path
import json
from typing import Any




ROOT = Path(__file__).resolve().parents[3]
GHANA_BOE_CALIBRATION_FILE = ROOT / "data" / "customs" / "gh" / "boe_calibration_records.json"


def load_ghana_calibration_records() -> list[dict]:
    try:
        if GHANA_BOE_CALIBRATION_FILE.exists():
            return json.loads(GHANA_BOE_CALIBRATION_FILE.read_text())
    except Exception:
        pass
    return []


def find_ghana_calibration(payload: dict) -> dict | None:
    vin = str(payload.get("vin") or "").strip().upper()
    make = str(payload.get("make") or "").strip().lower()
    model = str(payload.get("model") or "").strip().lower()
    year = payload.get("vehicle_year")
    cc = payload.get("engine_cc")

    for row in load_ghana_calibration_records():
        if vin and vin == str(row.get("vin", "")).upper():
            return row

    for row in load_ghana_calibration_records():
        row_make = str(row.get("make") or "").lower()
        row_model = str(row.get("model") or "").lower()
        if make and model and make in row_make and model in row_model:
            if year and int(year) == int(row.get("vehicle_year")):
                return row

    for row in load_ghana_calibration_records():
        if year and cc:
            if int(year) == int(row.get("vehicle_year")) and abs(int(cc) - int(row.get("engine_cc"))) <= 250:
                return row

    return None


def import_duty_rate_by_engine_cc(engine_cc: int | None) -> float:
    if not engine_cc:
        return 0.20
    if engine_cc <= 1000:
        return 0.05
    if engine_cc <= 2000:
        return 0.10
    return 0.20


def overage_penalty_rate(vehicle_year: int | None) -> float:
    if not vehicle_year:
        return 0.0
    age = max(0, datetime.utcnow().year - int(vehicle_year))
    if age <= 10:
        return 0.0
    # Conservative fallback until exact GRA penalty table is encoded.
    return min(0.20, (age - 10) * 0.025)


def estimate_hdv_usd(make: str | None, model: str | None, vehicle_year: int | None, engine_cc: int | None) -> float:
    base = 12000.0

    if vehicle_year:
        age = max(0, datetime.utcnow().year - int(vehicle_year))
        base = max(3500.0, base - (age * 650))

    if engine_cc:
        if engine_cc >= 3000:
            base *= 1.45
        elif engine_cc >= 2000:
            base *= 1.25
        elif engine_cc <= 1300:
            base *= 0.85

    return round(base, 2)


def ghana_vehicle_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    make = payload.get("make")
    model = payload.get("model")
    vehicle_year = payload.get("vehicle_year")
    engine_cc = payload.get("engine_cc")

    calibration = find_ghana_calibration(payload)
    if calibration:
        customs_value_ghs = float(calibration["customs_value_ghs"])
        duty_rate = float(calibration.get("import_duty_rate") or import_duty_rate_by_engine_cc(engine_cc))
        overage_rate = overage_penalty_rate(vehicle_year)

        rules = [
            ("import_duty", "Import Duty", duty_rate),
            ("vat", "Import VAT", 0.15),
            ("ecowas", "ECOWAS Levy", 0.005),
            ("vehicle_examination", "Vehicle Examination Fee", 0.01),
            ("network_charge", "Network Charge", 0.004),
            ("nhil", "Import NHIL", 0.025),
            ("withholding_tax", "1% Withholding Tax on Import", 0.01),
            ("special_import_levy", "Special Import Levy", 0.02),
            ("exim", "Ghana Export-Import Bank Levy", 0.0075),
            ("getfund", "GETFund Import Levy", 0.025),
            ("au_levy", "African Union Import Levy", 0.002),
            ("overage_penalty", "Overage Penalty", overage_rate),
        ]

        breakdown = []
        total_tax = 0.0

        for code, label, rate in rules:
            amount = round(customs_value_ghs * rate, 2)
            total_tax += amount
            breakdown.append({
                "code": code,
                "label": label,
                "rate": rate,
                "amount": amount,
                "currency": "GHS",
            })

        # If this exact VIN exists in BOE calibration, use the real BOE payable total.
        if calibration.get("vin") and str(payload.get("vin") or "").strip().upper() == str(calibration.get("vin")).upper():
            total_tax = float(calibration.get("total_tax_ghs") or total_tax)

        return {
            "provider": "afruheritage_ghana_engine",
            "mode": "boe_calibrated_fallback",
            "official": False,
            "country": "GH",
            "commodity_type": "vehicle",
            "make": calibration.get("make") or make,
            "model": calibration.get("model") or model,
            "vehicle_year": calibration.get("vehicle_year") or vehicle_year,
            "engine_cc": calibration.get("engine_cc") or engine_cc,
            "fob_ghs": calibration.get("fob_ghs"),
            "freight_ghs": calibration.get("freight_ghs"),
            "insurance_ghs": calibration.get("insurance_ghs"),
            "customs_value_ghs": round(customs_value_ghs, 2),
            "charges_total": round(total_tax, 2),
            "estimated_total_landed_cost": round(total_tax, 2),
            "breakdown": breakdown,
            "confidence": "boe_calibrated",
            "calibration_source": calibration.get("source"),
            "real_boe_total_tax_ghs": calibration.get("total_tax_ghs"),
            "notes": [
                "Fallback used AfruHeritage BOE calibration record.",
                "This estimate is calibrated from a real GRA Bill of Entry but is not an official ICUMS response.",
            ],
        }

    exchange_rate = float(payload.get("exchange_rate") or 15.0)

    hdv_usd = estimate_hdv_usd(make, model, vehicle_year, engine_cc)
    freight_usd = float(payload.get("freight_usd") or 1300.0)
    insurance_usd = round(hdv_usd * 0.01, 2)

    cif_usd = round(hdv_usd + freight_usd + insurance_usd, 2)
    customs_value_ghs = round(cif_usd * exchange_rate, 2)

    duty_rate = import_duty_rate_by_engine_cc(engine_cc)
    overage_rate = overage_penalty_rate(vehicle_year)

    rules = [
        ("import_duty", "Import Duty", duty_rate),
        ("vat", "Import VAT", 0.15),
        ("nhil", "Import NHIL", 0.025),
        ("getfund", "GETFund Import Levy", 0.025),
        ("ecowas", "ECOWAS Levy", 0.005),
        ("exim", "EXIM Bank Levy", 0.0075),
        ("special_import_levy", "Special Import Levy", 0.02),
        ("overage_penalty", "Overage Penalty", overage_rate),
    ]

    breakdown = []
    total_tax = 0.0

    for code, label, rate in rules:
        amount = round(customs_value_ghs * rate, 2)
        total_tax += amount
        breakdown.append({
            "code": code,
            "label": label,
            "rate": rate,
            "amount": amount,
            "currency": "GHS",
        })

    processing_fee = round(customs_value_ghs * 0.01, 2)
    total_tax += processing_fee
    breakdown.append({
        "code": "processing",
        "label": "Processing / Examination Estimate",
        "rate": 0.01,
        "amount": processing_fee,
        "currency": "GHS",
    })

    return {
        "provider": "afruheritage_ghana_engine",
        "mode": "fallback",
        "official": False,
        "country": "GH",
        "commodity_type": "vehicle",
        "make": make,
        "model": model,
        "vehicle_year": vehicle_year,
        "engine_cc": engine_cc,
        "hdv_usd": hdv_usd,
        "freight_usd": freight_usd,
        "insurance_usd": insurance_usd,
        "cif_usd": cif_usd,
        "exchange_rate": exchange_rate,
        "customs_value_ghs": customs_value_ghs,
        "charges_total": round(total_tax, 2),
        "estimated_total_landed_cost": round(total_tax, 2),
        "breakdown": breakdown,
        "confidence": "ghana_fallback_estimate",
        "notes": [
            "Fallback Ghana engine used because ICUMS public lookup was unavailable or incomplete.",
            "Vehicle value is HDV-style estimate, not official GRA payable duty.",
            "Overage penalty is estimated for vehicles older than 10 years.",
        ],
    }


def ghana_goods_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    cif_value = float(payload.get("cif_value") or 0)
    currency = payload.get("currency") or "GHS"

    rules = [
        ("import_duty", "Import Duty", float(payload.get("duty_rate") or 0.20)),
        ("vat", "Import VAT", 0.15),
        ("nhil", "Import NHIL", 0.025),
        ("getfund", "GETFund Import Levy", 0.025),
        ("ecowas", "ECOWAS Levy", 0.005),
        ("exim", "EXIM Bank Levy", 0.0075),
        ("special_import_levy", "Special Import Levy", 0.02),
    ]

    total = 0.0
    breakdown = []

    for code, label, rate in rules:
        amount = round(cif_value * rate, 2)
        total += amount
        breakdown.append({
            "code": code,
            "label": label,
            "rate": rate,
            "amount": amount,
            "currency": currency,
        })

    return {
        "provider": "afruheritage_ghana_engine",
        "mode": "fallback",
        "official": False,
        "country": "GH",
        "commodity_type": "cargo",
        "currency": currency,
        "cif_value": round(cif_value, 2),
        "charges_total": round(total, 2),
        "estimated_total_landed_cost": round(total, 2),
        "breakdown": breakdown,
        "confidence": "ghana_goods_fallback_estimate",
        "notes": [
            "Fallback Ghana goods engine used because ICUMS public lookup was unavailable or incomplete.",
            "HS-code-specific duty rates should be added for production accuracy.",
        ],
    }
