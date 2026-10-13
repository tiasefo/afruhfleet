from __future__ import annotations

import hashlib
import hmac
import os
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_current_admin
from sentinel_app.core.config import admin_settings
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
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


def _check_token(t: str | None, exp: int | None) -> None:
    if not t or not exp:
        raise HTTPException(status_code=403, detail="Signed handover link required")
    if int(time.time()) > exp:
        raise HTTPException(status_code=403, detail="Handover link has expired — request a new one")
    if not hmac.compare_digest(t, _token_for(exp)):
        raise HTTPException(status_code=403, detail="Invalid handover link signature")


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
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="uat_handover_link_minted",
        entity_type="uat_handover",
        details={"expires_at": exp, "ttl_hours": hours},
    )
    return {"url": url, "expires_at": exp, "ttl_hours": hours}


@router.get("/", response_class=HTMLResponse)
def index(t: str | None = Query(default=None), exp: int | None = Query(default=None)):
    _check_token(t, exp)
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
def download(name: str, t: str | None = Query(default=None), exp: int | None = Query(default=None)):
    _check_token(t, exp)
    return FileResponse(_resolve(name), filename=name)
