from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.runner import RunnerNode
from app.models.tenant import LaunchStatus, Tenant


def select_runner_for_tenant(db: Session, explicit_runner_id: str | None = None) -> RunnerNode:
    if explicit_runner_id:
        runner = db.get(RunnerNode, explicit_runner_id)
        if not runner or not runner.is_active:
            raise ValueError('Requested runner is not available')
        return runner

    candidates = db.scalars(select(RunnerNode).where(RunnerNode.is_active.is_(True))).all()
    for runner in candidates:
        if not runner.reserved_for_single_tenant:
            return runner
        active_tenant = db.scalar(select(Tenant).where(Tenant.runner_id == runner.id, Tenant.launch_status.in_([
            LaunchStatus.provisioning,
            LaunchStatus.active,
            LaunchStatus.queued,
        ])))
        if not active_tenant:
            return runner
    raise ValueError('No runner nodes are currently available')
