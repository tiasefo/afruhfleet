from app.core.config import settings
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import csv
from io import StringIO

from app.api.deps import get_current_user, get_db, require_superuser
from app.models.user import User

from app.services.whatsapp_service import get_whatsapp_service
from app.models.tenant_branding import TenantBranding

router = APIRouter(prefix="/whatsapp-csv", tags=["WhatsApp CSV Upload"])

@router.post("/upload")
async def upload_csv_and_notify(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Upload CSV of phone numbers and send WhatsApp notifications"""
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
        phone = row.get('phone')
        message = row.get('message', 'Notification from Afruheritage')
        if phone:
            result = await whatsapp_service.send_message(phone, message)
            results.append({"phone": phone, "result": result})
    return {"status": "completed", "results": results}
