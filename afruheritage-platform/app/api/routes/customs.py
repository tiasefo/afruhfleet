from __future__ import annotations

from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.vin_decoder import decode_vin
from app.services.customs.providers import calculate_with_fallback
from app.services.customs.vehicle_valuation import search_kra_crsp, ghana_icums_public_metadata, estimate_ghana_from_vehicle_details
from app.services.customs.ghana_public_providers import ghana_vehicle_orchestrator, ghana_goods_orchestrator, ghana_public_sources

router = APIRouter(prefix="/customs", tags=["Customs Engine"])

CountryCode = Literal["GH", "KE"]
CommodityType = Literal["vehicle", "cargo"]






class VehicleValueRequest(BaseModel):
    country: CountryCode
    make: str | None = None
    model: str | None = None
    vehicle_year: int | None = None
    engine_cc: int | None = None
    vin: str | None = None


class VINDecodeRequest(BaseModel):
    vin: str = Field(..., min_length=5, max_length=32)






class KenyaVehicleDutyRequest(BaseModel):
    country: CountryCode = "KE"
    commodity_type: CommodityType = "vehicle"
    make: str | None = None
    model: str | None = None
    vehicle_year: int | None = None
    engine_cc: int | None = None
    fuel_type: str | None = None
    vehicle_type: str | None = None
    vin: str | None = None


class GhanaVehicleDutyRequest(BaseModel):
    country: CountryCode = "GH"
    commodity_type: CommodityType = "vehicle"
    currency: str | None = None
    cif_value: float | None = None
    make: str | None = None
    model: str | None = None
    vehicle_year: int | None = None
    engine_cc: int | None = None
    fuel_type: str | None = None
    vehicle_type: str | None = None
    vin: str | None = None
    exchange_rate: float | None = None
    freight_usd: float | None = None
    prefer_official: bool = True


class CustomsCalcRequest(BaseModel):
    country: CountryCode
    commodity_type: CommodityType

    currency: str | None = None
    cif_value: float = Field(..., gt=0)

    # Vehicle fields
    vehicle_year: int | None = None
    engine_cc: int | None = None
    fuel_type: str | None = None
    vehicle_type: str | None = None
    vin: str | None = None

    # Cargo fields
    hs_code: str | None = None
    description: str | None = None
    quantity: float | None = None
    weight_kg: float | None = None

    prefer_official: bool = False


COUNTRIES = {
    "GH": {
        "name": "Ghana",
        "currency": "GHS",
        "system": "ICUMS-style estimate mode",
        "supports": ["vehicle", "cargo"],
    },
    "KE": {
        "name": "Kenya",
        "currency": "KES",
        "system": "iCMS-style estimate mode",
        "supports": ["vehicle", "cargo"],
    },
}


# Initial configurable estimate rules.
# These should later be replaced by tariff-table records in DB.
RULES = {
    "GH": {
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


@router.get("/countries")
def countries():
    return {"countries": COUNTRIES}


@router.post("/calculate")
def calculate_customs(payload: CustomsCalcRequest):
    data = payload.model_dump()

    if payload.country == "GH" and payload.commodity_type == "vehicle":
        return ghana_vehicle_orchestrator(data)

    if payload.country == "GH" and payload.commodity_type == "cargo":
        return ghana_goods_orchestrator(data)

    return calculate_with_fallback(data)


@router.post("/vin-decode")
def vin_decode(payload: VINDecodeRequest):
    return decode_vin(payload.vin)


@router.post("/vehicle-value")
def vehicle_value(payload: VehicleValueRequest):
    data = payload.model_dump()

    if payload.country == "KE":
        return search_kra_crsp(
            make=payload.make,
            model=payload.model,
            year=payload.vehicle_year,
        )

    if payload.country == "GH":
        return {
            "icums": ghana_icums_public_metadata(),
            "valuation": estimate_ghana_from_vehicle_details(data),
        }

    return {"matched": False, "message": "Unsupported country"}


@router.get("/ghana/sources")
def ghana_sources():
    return ghana_public_sources()


@router.post("/ghana/vehicle-duty")
def ghana_vehicle_duty(payload: GhanaVehicleDutyRequest):
    data = payload.model_dump()
    return ghana_vehicle_orchestrator(data)


@router.post("/ghana/goods-duty")
def ghana_goods_duty(payload: CustomsCalcRequest):
    data = payload.model_dump()
    return ghana_goods_orchestrator(data)


@router.post("/kenya/vehicle-duty")
def kenya_vehicle_duty(payload: KenyaVehicleDutyRequest):
    data = payload.model_dump()

    decoded = None
    if payload.vin:
        decoded = decode_vin(payload.vin)
        vehicle = decoded.get("vehicle") or {}
        data["make"] = data.get("make") or vehicle.get("make")
        data["model"] = data.get("model") or vehicle.get("model")
        data["vehicle_year"] = data.get("vehicle_year") or vehicle.get("year")
        data["engine_cc"] = data.get("engine_cc") or vehicle.get("engine_cc")
        data["fuel_type"] = data.get("fuel_type") or vehicle.get("fuel_type")
        data["vehicle_type"] = data.get("vehicle_type") or vehicle.get("body_type")

    value = search_kra_crsp(
        make=data.get("make"),
        model=data.get("model"),
        year=data.get("vehicle_year"),
    )

    if not value.get("matched"):
        return {
            "provider": "kra_crsp",
            "mode": "needs_manual_review",
            "official": False,
            "country": "KE",
            "commodity_type": "vehicle",
            "vin_decode": decoded,
            "valuation": value,
            "message": value.get("message", "Could not confidently match KRA CRSP."),
        }

    customs_value = value.get("estimated_customs_value_kes") or value.get("crsp_kes")

    calc_payload = {
        "country": "KE",
        "commodity_type": "vehicle",
        "cif_value": customs_value,
        "vehicle_year": data.get("vehicle_year"),
        "engine_cc": data.get("engine_cc"),
        "fuel_type": data.get("fuel_type"),
        "vehicle_type": data.get("vehicle_type"),
        "vin": data.get("vin"),
    }

    result = calculate_with_fallback(calc_payload)
    result["provider"] = "kenya_kra_crsp_engine"
    result["mode"] = "kra_crsp_estimate"
    result["official"] = False
    result["vin_decode"] = decoded
    result["valuation"] = value
    result["customs_value_kes"] = customs_value
    result["notes"].append("Vehicle customs value generated from KRA CRSP lookup before duty calculation.")
    return result
