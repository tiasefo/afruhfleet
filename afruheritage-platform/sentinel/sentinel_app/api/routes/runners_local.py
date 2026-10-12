from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from sentinel_app.api.deps import get_current_admin
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.schemas.proxy import ProxyRunnerCreate
from sentinel_app.services.audit_service import record_admin_audit
from sentinel_app.services import control_plane_client as cp

router = APIRouter(prefix="/runners", tags=["Admin – Runners"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


def _find_runner(cp_token: str, runner_id: str) -> dict:
    for runner in cp.list_runners(cp_token):
        if str(runner.get("id")) == runner_id:
            return runner
    raise HTTPException(status_code=404, detail="Runner not found")


@router.get("")
def list_runners(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List all runner nodes registered in the control plane."""
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runners.listed",
        entity_type="runner",
    )
    try:
        return cp.list_runners(_get_cp_token(request))
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("")
def create_runner(
    payload: ProxyRunnerCreate,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Register a new runner node in the control plane."""
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.created",
        entity_type="runner",
        details={"name": payload.name, "outcome": "attempt"},
    )
    try:
        result = cp.create_runner(
            _get_cp_token(request),
            {
                "name": payload.name,
                "hostname": payload.host,
                "ssh_port": payload.ssh_port,
                "ssh_user": payload.ssh_user,
                "root_runtime_path": payload.fleetbase_root,
                "supports_reference_install": payload.reserved_for_single_tenant,
            },
        )
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.created",
        entity_type="runner",
        entity_id=str(result.get("id")) if isinstance(result, dict) else None,
        details={"name": payload.name, "outcome": "success"},
    )
    return result


@router.get("/{runner_id}")
def get_runner(
    runner_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get detailed information about a specific runner."""
    runner = _find_runner(_get_cp_token(request), runner_id)

    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.viewed",
        entity_type="runner",
        entity_id=runner_id,
    )

    return runner


@router.post("/{runner_id}/restart")
def restart_runner(
    runner_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
) -> Dict[str, str]:
    """Restart a runner node — not yet supported by the control plane."""
    _find_runner(_get_cp_token(request), runner_id)
    raise HTTPException(
        status_code=501,
        detail="Runner restart is not supported by the control plane API",
    )


@router.post("/{runner_id}/shutdown")
def shutdown_runner(
    runner_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
) -> Dict[str, str]:
    """Shutdown a runner node — not yet supported by the control plane."""
    _find_runner(_get_cp_token(request), runner_id)
    raise HTTPException(
        status_code=501,
        detail="Runner shutdown is not supported by the control plane API",
    )


@router.delete("/{runner_id}")
def delete_runner(
    runner_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
) -> Dict[str, str]:
    """Delete a runner node — not yet supported by the control plane."""
    _find_runner(_get_cp_token(request), runner_id)
    raise HTTPException(
        status_code=501,
        detail="Runner deletion is not supported by the control plane API",
    )


@router.get("/{runner_id}/metrics")
def get_runner_metrics(
    runner_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Runner-level metrics — not yet exposed by the control plane."""
    _find_runner(_get_cp_token(request), runner_id)
    raise HTTPException(
        status_code=501,
        detail="Runner metrics are not exposed by the control plane API",
    )
