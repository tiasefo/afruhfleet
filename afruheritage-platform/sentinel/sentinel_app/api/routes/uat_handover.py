from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse

router = APIRouter(prefix="/uat-handover", tags=["Admin – UAT Handover"])

_PKG_DIR = Path(
    os.environ.get("UAT_HANDOVER_DIR", "/app/static/uat-handover")
).resolve()
_KEY_FILE = Path(
    os.environ.get("UAT_HANDOVER_KEY_FILE", "/app/static/.uat-handover-key")
)


def _share_key() -> str:
    try:
        return _KEY_FILE.read_text().strip()
    except OSError:
        return ""


def _check_key(key: str | None) -> None:
    expected = _share_key()
    if not expected or not key or key != expected:
        raise HTTPException(status_code=403, detail="Invalid or missing handover key")


def _resolve(name: str) -> Path:
    if "/" in name or "\\" in name or name.startswith("."):
        raise HTTPException(status_code=404, detail="Not found")
    path = (_PKG_DIR / name).resolve()
    if path.parent != _PKG_DIR or not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return path


@router.get("/", response_class=HTMLResponse)
def index(key: str | None = Query(default=None)):
    _check_key(key)
    if not _PKG_DIR.is_dir():
        raise HTTPException(status_code=404, detail="Handover package not staged")
    rows = []
    for p in sorted(_PKG_DIR.iterdir()):
        if p.is_file() and not p.name.startswith("."):
            size = f"{p.stat().st_size / 1024:.0f} KB"
            rows.append(
                f'<tr><td><a href="/sentinel/uat-handover/download/{p.name}?key={key}">'
                f"{p.name}</a></td><td>{size}</td></tr>"
            )
    return (
        "<!doctype html><html><head><title>Afruheritage UAT Handover</title>"
        "<style>body{font-family:sans-serif;max-width:760px;margin:40px auto}"
        "td{padding:6px 14px;border-bottom:1px solid #ddd}</style></head><body>"
        "<h2>Afruheritage — Customer UAT Handover Package</h2>"
        "<p>Click any document to download it.</p>"
        f"<table>{''.join(rows)}</table></body></html>"
    )


@router.get("/download/{name}")
def download(name: str, key: str | None = Query(default=None)):
    _check_key(key)
    return FileResponse(_resolve(name), filename=name)
