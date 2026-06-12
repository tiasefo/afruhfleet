from __future__ import annotations

import os
import requests
from abc import ABC, abstractmethod
from typing import Any


class CustomsProvider(ABC):
    name: str = "base"

    @abstractmethod
    def calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError


class EstimateProvider(CustomsProvider):
    name = "estimate"

    RULES = {
        "GH": {
            "currency": "GHS",
            "vehicle": {
                "import_duty": 0.20,
                "vat": 0.15,
                "nhil": 0.025,
                "getfund": 0.025,
                "processing": 0.01,
            },
            "cargo": {
                "import_duty": 0.20,
                "vat": 0.15,
                "nhil": 0.025,
                "getfund": 0.025,
                "processing": 0.01,
            },
        },
        "KE": {
            "currency": "KES",
            "vehicle": {
                "import_duty": 0.25,
                "vat": 0.16,
                "import_declaration_fee": 0.035,
                "railway_development_levy": 0.02,
            },
            "cargo": {
                "import_duty": 0.25,
                "vat": 0.16,
                "import_declaration_fee": 0.035,
                "railway_development_levy": 0.02,
            },
        },
    }

    def calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        country = payload["country"]
        commodity_type = payload["commodity_type"]
        cif_value = float(payload["cif_value"])

        country_rules = self.RULES[country]
        currency = payload.get("currency") or country_rules["currency"]
        rules = country_rules[commodity_type]

        charges_total = 0.0
        breakdown = []

        for code, rate in rules.items():
            amount = round(cif_value * rate, 2)
            charges_total += amount
            breakdown.append({
                "code": code,
                "label": code.replace("_", " ").title(),
                "rate": rate,
                "amount": amount,
                "currency": currency,
            })

        return {
            "provider": self.name,
            "mode": "estimate",
            "country": country,
            "commodity_type": commodity_type,
            "currency": currency,
            "cif_value": round(cif_value, 2),
            "charges_total": round(charges_total, 2),
            "estimated_total_landed_cost": round(cif_value + charges_total, 2),
            "breakdown": breakdown,
            "confidence": "estimate",
            "official": False,
            "notes": [
                "Estimate mode: uses AfruHeritage configurable country rules.",
                "Official payable duty requires validation through ICUMS/GRA or KRA iCMS.",
            ],
        }


class GhanaICUMSProvider(CustomsProvider):
    name = "ghana_icums"

    def calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        base_url = os.getenv("GHANA_ICUMS_API_URL", "").rstrip("/")
        api_key = os.getenv("GHANA_ICUMS_API_KEY", "")

        if not base_url or not api_key:
            raise RuntimeError("GHANA_ICUMS credentials not configured")

        response = requests.post(
            f"{base_url}/customs/calculate",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=45,
        )

        if response.status_code >= 400:
            raise RuntimeError(response.text)

        data = response.json()
        data["provider"] = self.name
        data["mode"] = "official"
        data["official"] = True
        return data


class KenyaICMSProvider(CustomsProvider):
    name = "kenya_icms"

    def calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        base_url = os.getenv("KENYA_ICMS_API_URL", "").rstrip("/")
        api_key = os.getenv("KENYA_ICMS_API_KEY", "")

        if not base_url or not api_key:
            raise RuntimeError("KENYA_ICMS credentials not configured")

        response = requests.post(
            f"{base_url}/customs/calculate",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=45,
        )

        if response.status_code >= 400:
            raise RuntimeError(response.text)

        data = response.json()
        data["provider"] = self.name
        data["mode"] = "official"
        data["official"] = True
        return data


def get_provider(country: str, prefer_official: bool = False) -> CustomsProvider:
    if prefer_official and country == "GH":
        return GhanaICUMSProvider()

    if prefer_official and country == "KE":
        return KenyaICMSProvider()

    return EstimateProvider()


def calculate_with_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    prefer_official = bool(payload.get("prefer_official"))
    country = payload["country"]

    if prefer_official:
        try:
            provider = get_provider(country, prefer_official=True)
            return provider.calculate(payload)
        except Exception as exc:
            estimate = EstimateProvider().calculate(payload)
            estimate["official_attempted"] = True
            estimate["official_error"] = str(exc)
            estimate["notes"].append("Official provider unavailable; returned estimate fallback.")
            return estimate

    return EstimateProvider().calculate(payload)
