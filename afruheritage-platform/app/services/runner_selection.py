import socket
import uuid

from app.core.config import settings
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.runner import RunnerNode
from app.models.tenant import LaunchStatus, Tenant


def _runner_has_active_tenant(db: Session, runner_id) -> bool:
    active_tenant = db.scalar(
        select(Tenant).where(
            Tenant.runner_id == runner_id,
            Tenant.launch_status.in_(
                [
                    LaunchStatus.provisioning,
                    LaunchStatus.active,
                    LaunchStatus.queued,
                ]
            ),
        )
    )
    return active_tenant is not None


def _runner_can_accept_tenant(db: Session, runner: RunnerNode) -> bool:
    if not runner.reserved_for_single_tenant:
        return True
    return not _runner_has_active_tenant(db, runner.id)


def _runner_is_reachable(runner: RunnerNode, timeout_seconds: float = 5.0) -> bool:
    try:
        with socket.create_connection((runner.host, runner.ssh_port), timeout=timeout_seconds):
            return True
    except OSError:
        return False


def select_runner_for_tenant(db: Session, explicit_runner_id: str | None = None) -> RunnerNode:
    if explicit_runner_id:
        try:
            explicit_runner_key = uuid.UUID(str(explicit_runner_id))
        except (TypeError, ValueError):
            explicit_runner_key = explicit_runner_id
        runner = db.get(RunnerNode, explicit_runner_key)
        if not runner or not runner.is_active:
            raise ValueError('Requested runner is not available')
        if not _runner_is_reachable(runner):
            raise ValueError('Requested runner is unreachable')
        if not _runner_can_accept_tenant(db, runner):
            raise ValueError('Requested runner is already occupied')
        return runner

    candidates = db.scalars(select(RunnerNode).where(RunnerNode.is_active.is_(True))).all()
    for runner in candidates:
        if _runner_is_reachable(runner) and _runner_can_accept_tenant(db, runner):
            return runner
    raise ValueError('No runner nodes are currently available')
