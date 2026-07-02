from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db

router = APIRouter(prefix="/warehouse-notices", tags=["Warehouse Notices"])

class NoticeCreate(BaseModel):
    tenant_slug: str
    notice_type: str
    title: str
    message: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    is_public: bool = True

def get_tenant_id(db: Session, slug: str):
    row = db.execute(text("""
        SELECT id FROM tenants
        WHERE slug=:slug OR requested_domain=:slug OR custom_domain=:slug
        LIMIT 1
    """), {"slug": slug}).mappings().first()
    if not row:
        raise HTTPException(404, "Tenant not found")
    return row["id"]

@router.post("")
def create_notice(payload: NoticeCreate, db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(db, payload.tenant_slug)

    row = db.execute(text("""
        INSERT INTO warehouse_notices (
            tenant_id, notice_type, title, message, media_url, media_type, is_public
        )
        VALUES (:tenant_id,:notice_type,:title,:message,:media_url,:media_type,:is_public)
        RETURNING id
    """), {
        "tenant_id": tenant_id,
        "notice_type": payload.notice_type,
        "title": payload.title,
        "message": payload.message,
        "media_url": payload.media_url,
        "media_type": payload.media_type,
        "is_public": payload.is_public,
    }).mappings().first()

    db.commit()
    return {"status": "created", "id": row["id"]}

@router.get("/{tenant_slug}")
def list_notices(tenant_slug: str, db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(db, tenant_slug)

    rows = db.execute(text("""
        SELECT id, notice_type, title, message, media_url, media_type, created_at
        FROM warehouse_notices
        WHERE tenant_id=:tenant_id
          AND is_public=true
          AND is_active=true
          AND (expires_at IS NULL OR expires_at > now())
        ORDER BY created_at DESC
        LIMIT 50
    """), {"tenant_id": tenant_id}).mappings().all()

    return {"tenant_slug": tenant_slug, "count": len(rows), "notices": [dict(r) for r in rows]}
