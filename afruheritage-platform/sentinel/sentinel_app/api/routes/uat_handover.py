from __future__ import annotations

import hashlib
import hmac
import os
import time
from pathlib import Path

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_current_admin
from sentinel_app.core.config import admin_settings
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.models.uat_handover_link import UatHandoverLink
from sentinel_app.services.audit_service import record_admin_audit

router = APIRouter(prefix="/uat-handover", tags=["Admin – UAT Handover"])

_PKG_DIR = Path(
    os.environ.get("UAT_HANDOVER_DIR", "/app/static/uat-handover")
).resolve()


def _token_for(exp: int) -> str:
    # Signed with the Sentinel secret key (domain-separated). An explicit
    # UAT_HANDOVER_SIGNING_SECRET env var overrides for key rotation.
    secret = os.environ.get("UAT_HANDOVER_SIGNING_SECRET") or admin_settings.secret_key
    return hmac.new(
        secret.encode(), f"uat-handover-link:{exp}".encode(), hashlib.sha256
    ).hexdigest()


def _check_token(t: str | None, exp: int | None, db: Session) -> UatHandoverLink:
    if not t or not exp:
        raise HTTPException(status_code=403, detail="Signed handover link required")
    if int(time.time()) > exp:
        raise HTTPException(status_code=403, detail="Handover link has expired — request a new one")
    if not hmac.compare_digest(t, _token_for(exp)):
        raise HTTPException(status_code=403, detail="Invalid handover link signature")
    # The link must be a live minted record — signature alone is not enough.
    # This is what makes revocation meaningful for forwarded bearer links.
    link = db.query(UatHandoverLink).filter(
        UatHandoverLink.token_hash == hashlib.sha256(t.encode()).hexdigest(),
        UatHandoverLink.expires_at == exp,
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Unknown handover link")
    if link.revoked_at is not None:
        raise HTTPException(status_code=403, detail="Handover link has been revoked")
    return link


def _log_access(db: Session, link: UatHandoverLink, request: Request, action: str, detail: dict) -> None:
    try:
        record_admin_audit(
            db,
            admin_email=f"handover-link:{link.created_by}",
            action=action,
            entity_type="uat_handover",
            details={
                "link_id": str(link.id),
                "client_ip": request.client.host if request.client else None,
                **detail,
            },
        )
    except Exception:
        pass


def _qs(t: str, exp: int) -> str:
    return f"?t={t}&exp={exp}"


def _resolve(name: str) -> Path:
    if "/" in name or "\\" in name or name.startswith("."):
        raise HTTPException(status_code=404, detail="Not found")
    path = (_PKG_DIR / name).resolve()
    if path.parent != _PKG_DIR or not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return path


@router.post("/mint")
def mint_link(
    hours: int = Query(default=72, ge=1, le=168),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    exp = int(time.time()) + hours * 3600
    t = _token_for(exp)
    url = f"/sentinel/uat-handover/{_qs(t, exp)}"
    db.add(UatHandoverLink(
        token_hash=hashlib.sha256(t.encode()).hexdigest(),
        expires_at=exp,
        created_by=current_admin.email,
    ))
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="uat_handover_link_minted",
        entity_type="uat_handover",
        details={"expires_at": exp, "ttl_hours": hours},
    )
    db.commit()
    return {"url": url, "expires_at": exp, "ttl_hours": hours}


@router.post("/revoke")
def revoke_links(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Revoke all outstanding (unexpired, unrevoked) handover links."""
    now = int(time.time())
    count = db.query(UatHandoverLink).filter(
        UatHandoverLink.expires_at > now,
        UatHandoverLink.revoked_at.is_(None),
    ).update({"revoked_at": datetime.utcnow(), "revoked_by": current_admin.email})
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="uat_handover_links_revoked",
        entity_type="uat_handover",
        details={"revoked_count": count},
    )
    db.commit()
    return {"revoked": count}


@router.get("/", response_class=HTMLResponse)
def index(request: Request, t: str | None = Query(default=None), exp: int | None = Query(default=None), db: Session = Depends(get_db)):
    link = _check_token(t, exp, db)
    _log_access(db, link, request, "uat_handover_index_accessed", {})
    if not _PKG_DIR.is_dir():
        raise HTTPException(status_code=404, detail="Handover package not staged")
    rows = []
    for p in sorted(_PKG_DIR.iterdir()):
        if p.is_file() and not p.name.startswith("."):
            size = f"{p.stat().st_size / 1024:.0f} KB"
            rows.append(
                f'<tr><td><a href="/sentinel/uat-handover/download/{p.name}{_qs(t, exp)}">'
                f"{p.name}</a></td><td>{size}</td></tr>"
            )
    return (
        "<!doctype html><html><head><title>Afruheritage UAT Handover</title>"
        "<style>body{font-family:sans-serif;max-width:760px;margin:40px auto}"
        "td{padding:6px 14px;border-bottom:1px solid #ddd}</style></head><body>"
        "<h2>Afruheritage — Customer UAT Handover Package</h2>"
        "<p>Click any document to download it. This link expires — request a "
        "fresh link from the platform team if it stops working.</p>"
        f"<table>{''.join(rows)}</table></body></html>"
    )


@router.get("/download/{name}")
def download(name: str, request: Request, t: str | None = Query(default=None), exp: int | None = Query(default=None), db: Session = Depends(get_db)):
    link = _check_token(t, exp, db)
    _log_access(db, link, request, "uat_handover_file_downloaded", {"file": name})
    return FileResponse(_resolve(name), filename=name)
