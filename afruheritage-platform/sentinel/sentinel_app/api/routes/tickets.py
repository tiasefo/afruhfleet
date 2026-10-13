from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_current_admin
from sentinel_app.api.validation import uuid_param_or_400
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.services import control_plane_client as cp
from sentinel_app.services.audit_service import audited_admin_mutation

router = APIRouter(prefix="/tickets", tags=["Admin – Tickets"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("")
def list_tickets(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    status: str | None = Query(None),
    tenant_id: str | None = Query(None),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    params = {"page": page, "page_size": page_size}
    if status:
        params["status"] = status
    if tenant_id:
        params["tenant_id"] = tenant_id
    if q:
        params["q"] = q
    try:
        return cp.list_admin_tickets(_get_cp_token(request), params)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/{ticket_id}/messages")
def list_ticket_messages(
    ticket_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    ticket_id = uuid_param_or_400(ticket_id, "ticket_id")
    try:
        return cp.list_admin_ticket_messages(_get_cp_token(request), ticket_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("/{ticket_id}/reply")
def reply_ticket(
    ticket_id: str,
    request: Request,
    payload: dict,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ticket_id = uuid_param_or_400(ticket_id, "ticket_id")
    body = (payload.get("body") or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Reply body is required")
    try:
        # Support replies are in the PO "continue" audit tier: audited but
        # tolerant if the audit store is unavailable.
        return audited_admin_mutation(
            db,
            admin_email=current_admin.email,
            action="ticket.reply_sent",
            entity_type="support_ticket",
            entity_id=ticket_id,
            details={"body_length": len(body)},
            operation=lambda: cp.reply_admin_ticket(
                _get_cp_token(request), ticket_id, body,
                author_name=current_admin.full_name or current_admin.email,
            ),
        )
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.patch("/{ticket_id}/status")
def update_ticket_status(
    ticket_id: str,
    status: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ticket_id = uuid_param_or_400(ticket_id, "ticket_id")
    try:
        return audited_admin_mutation(
            db,
            admin_email=current_admin.email,
            action="ticket.status_updated",
            entity_type="support_ticket",
            entity_id=ticket_id,
            details={"status": status},
            operation=lambda: cp.update_admin_ticket_status(_get_cp_token(request), ticket_id, status),
        )
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
