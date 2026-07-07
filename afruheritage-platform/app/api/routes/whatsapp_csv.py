from app.core.config import settings
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import csv
from io import StringIO
from typing import Optional

from app.api.deps import get_current_user, get_db, require_superuser, require_active_subscription
from app.models.user import User
from app.models.marketplace import MarketplaceShipment

from app.services.whatsapp_service import get_whatsapp_service
from app.models.tenant_branding import TenantBranding

router = APIRouter(prefix="/whatsapp-csv", tags=["WhatsApp CSV Upload"])

# Candidate column names for tracking/container numbers in uploaded CSVs
_TRACKING_COLS = ("tracking_number", "tracking", "container", "container_number", "waybill", "awb", "shipment_id")
_PHONE_COLS    = ("phone", "phone_number", "mobile", "whatsapp", "contact")
_MESSAGE_COLS  = ("message", "msg", "notification", "text")


def _find_col(row: dict, candidates: tuple) -> Optional[str]:
    """Return the first matching column value from a CSV row (case-insensitive)."""
    lower = {k.lower().strip(): v for k, v in row.items()}
    for candidate in candidates:
        if candidate in lower:
            return lower[candidate]
    return None


@router.post("/upload")
async def upload_csv_and_notify(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Upload CSV of phone numbers (+ optional tracking numbers) and send WhatsApp notifications.

    Supported CSV columns:
    - phone / phone_number / mobile / whatsapp (required)
    - message / msg (optional — default template used if absent)
    - tracking_number / container / waybill / awb (optional — linked to shipment record)
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    # Enforce tenant opt-in for CSV import
    branding = db.query(TenantBranding).filter(TenantBranding.tenant_id == current_user.tenant_id).first()
    if not branding or not branding.csv_import_enabled:
        raise HTTPException(status_code=403, detail="CSV import is not enabled for this tenant.")

    content = await file.read()
    csv_text = content.decode('utf-8')
    reader = csv.DictReader(StringIO(csv_text))

    whatsapp_service = get_whatsapp_service(str(current_user.tenant_id))
    results = []

    for row in reader:
        phone = _find_col(row, _PHONE_COLS)
        if not phone:
            continue

        tracking_number = _find_col(row, _TRACKING_COLS)
        custom_message  = _find_col(row, _MESSAGE_COLS)

        # Build message — include tracking number if present, or use custom message
        if custom_message:
            message = custom_message
        elif tracking_number:
            # Look up shipment for live status
            shipment = (
                db.query(MarketplaceShipment)
                .filter(MarketplaceShipment.tracking_number == tracking_number)
                .first()
            )
            status_text = shipment.status.value if shipment else "in transit"
            message = (
                f"Update on your shipment {tracking_number}: "
                f"current status is *{status_text}*. "
                f"Track at {settings.base_url}/track/{tracking_number}"
            )
        else:
            message = "Notification from Afruheritage Freight"

        result = await whatsapp_service.send_message(phone, message)
        results.append({
            "phone": phone,
            "tracking_number": tracking_number,
            "result": result,
        })

    return {
        "status": "completed",
        "sent": len(results),
        "results": results,
    }
