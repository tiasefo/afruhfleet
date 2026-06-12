from __future__ import annotations

import os
import re
import requests
from dataclasses import dataclass

VIN_REGEX = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$", re.IGNORECASE)

YEAR_CODES = {
    "A": 2010, "B": 2011, "C": 2012, "D": 2013, "E": 2014,
    "F": 2015, "G": 2016, "H": 2017, "J": 2018, "K": 2019,
    "L": 2020, "M": 2021, "N": 2022, "P": 2023, "R": 2024,
    "S": 2025, "T": 2026, "V": 2027, "W": 2028, "X": 2029,
    "Y": 2030, "1": 2031, "2": 2032, "3": 2033, "4": 2034,
    "5": 2035, "6": 2036, "7": 2037, "8": 2038, "9": 2039,
}



KNOWN_VIN_OVERRIDES = {
    "2T3P1RFV1SW611866": {
        "make": "TOYOTA",
        "model": "RAV4",
        "year": 2025,
        "engine_cc": 2500,
        "fuel_type": "Gasoline",
        "body_type": "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)",
        "country_of_origin": "United States",
    },
    "KNME5C2M7HP026137": {
        "make": "SAMSUNG",
        "model": "QM6",
        "year": 2017,
        "engine_cc": 2000,
        "fuel_type": "Diesel",
        "body_type": "Station Wagon",
        "country_of_origin": "Korea, Republic of",
    }
}

WMI_HINTS = {
    "JT": {"make": "Toyota", "country_of_origin": "Japan"},
    "JH": {"make": "Honda", "country_of_origin": "Japan"},
    "JN": {"make": "Nissan", "country_of_origin": "Japan"},
    "JM": {"make": "Mazda", "country_of_origin": "Japan"},
    "KM": {"make": "Hyundai", "country_of_origin": "South Korea"},
    "KN": {"make": "Kia", "country_of_origin": "South Korea"},
    "WBA": {"make": "BMW", "country_of_origin": "Germany"},
    "WDB": {"make": "Mercedes-Benz", "country_of_origin": "Germany"},
    "WVW": {"make": "Volkswagen", "country_of_origin": "Germany"},
    "1G": {"make": "General Motors", "country_of_origin": "United States"},
    "1F": {"make": "Ford", "country_of_origin": "United States"},
    "5YJ": {"make": "Tesla", "country_of_origin": "United States"},
}


def _clean(v):
    if v is None:
        return None
    v = str(v).strip()
    return v or None


def _int_or_none(v):
    try:
        if v in [None, ""]:
            return None
        return int(float(str(v).replace(",", "")))
    except Exception:
        return None


def decode_vin_basic(vin: str) -> dict:
    normalized = vin.strip().upper()

    if not VIN_REGEX.match(normalized):
        return {
            "vin": normalized,
            "valid": False,
            "source": "basic-vin-decoder",
            "vehicle": {},
            "confidence": "invalid",
            "notes": ["VIN must be 17 characters and cannot contain I, O, or Q."],
        }

    year = YEAR_CODES.get(normalized[9])
    hint = None
    for prefix, data in WMI_HINTS.items():
        if normalized.startswith(prefix):
            hint = data
            break

    return {
        "vin": normalized,
        "valid": True,
        "source": "basic-vin-decoder",
        "vehicle": {
            "make": hint["make"] if hint else None,
            "model": None,
            "year": year,
            "engine_cc": None,
            "fuel_type": None,
            "body_type": None,
            "country_of_origin": hint["country_of_origin"] if hint else None,
        },
        "confidence": "basic",
        "notes": ["Basic VIN decode using VIN structure and WMI manufacturer hints."],
    }


def decode_vin_nhtsa(vin: str) -> dict | None:
    if os.getenv("VIN_NHTSA_ENABLED", "true").lower() not in ["1", "true", "yes"]:
        return None

    normalized = vin.strip().upper()
    url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{normalized}?format=json"

    try:
        r = requests.get(url, timeout=8)
        if r.status_code >= 400:
            return None

        data = r.json()
        rows = data.get("Results") or []
        if not rows:
            return None

        row = rows[0]
        make = _clean(row.get("Make"))
        model = _clean(row.get("Model"))
        year = _int_or_none(row.get("ModelYear"))
        fuel = _clean(row.get("FuelTypePrimary"))
        body = _clean(row.get("BodyClass"))
        displacement_l = row.get("DisplacementL")
        engine_cc = _int_or_none(row.get("DisplacementCC"))

        if not engine_cc and displacement_l:
            try:
                engine_cc = int(float(displacement_l) * 1000)
            except Exception:
                engine_cc = None

        if not make and not model and not year:
            return None

        return {
            "vin": normalized,
            "valid": True,
            "source": "nhtsa-vpic-public",
            "vehicle": {
                "make": make,
                "model": model,
                "year": year,
                "engine_cc": engine_cc,
                "fuel_type": fuel,
                "body_type": body,
                "country_of_origin": _clean(row.get("PlantCountry")),
            },
            "confidence": "public_vin_api",
            "notes": [
                "Decoded using NHTSA vPIC public VIN data.",
                "For auction history, mileage, accident records, and trim-level certainty, connect a premium VIN provider.",
            ],
        }
    except Exception:
        return None


def decode_vin(vin: str) -> dict:
    normalized = vin.strip().upper()

    if normalized in KNOWN_VIN_OVERRIDES:
        return {
            "vin": normalized,
            "valid": True,
            "source": "afruheritage-known-vin-override",
            "vehicle": KNOWN_VIN_OVERRIDES[normalized],
            "confidence": "boe_verified",
            "notes": ["Vehicle decoded from AfruHeritage BOE calibration record."],
        }

    nhtsa = decode_vin_nhtsa(vin)
    if nhtsa:
        vehicle = nhtsa.get("vehicle") or {}
        year = vehicle.get("year")
        # Reject obviously bad decode for modern import workflow if model is missing or year is suspicious.
        if vehicle.get("model") and year and int(year) >= 1995:
            return nhtsa

    return decode_vin_basic(vin)
