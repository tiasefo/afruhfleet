import logging
from datetime import datetime, timezone

from celery import Task
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.tenant import LaunchStatus, ProvisioningJob, Tenant
from app.services.fleetbase_provisioner import FleetbaseProvisioner
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

# Maximum characters stored from stdout/stderr to avoid unbounded DB growth
_LOG_EXCERPT_MAX = 4096


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _set_step(db: Session, job: ProvisioningJob, step: str) -> None:
    """Update the job's current_step and persist."""
    job.current_step = step
    db.commit()
    logger.info('job_id=%s tenant_id=%s step=%s', job.id, job.tenant_id, step)


def _fail_job(db: Session, job: ProvisioningJob, tenant: Tenant | None, exc: Exception) -> None:
    """Persist failure state on both the job and tenant atomically."""
    error_text = str(exc)[:_LOG_EXCERPT_MAX]
    try:
        if job:
            job.status = LaunchStatus.failed
            job.finished_at = _utcnow()
            job.last_error = error_text
            job.current_step = 'failed'
        if tenant:
            tenant.launch_status = LaunchStatus.failed
        db.commit()
    except Exception:
        logger.exception(
            'job_id=%s tenant_id=%s Failed to persist failure state',
            getattr(job, 'id', 'unknown'),
            getattr(tenant, 'id', 'unknown'),
        )


@celery_app.task(
    name='app.tasks.provisioning.provision_tenant',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def provision_tenant(self: Task, job_id: str) -> None:
    db: Session = SessionLocal()
    job: ProvisioningJob | None = None
    tenant: Tenant | None = None
    try:
        # ------------------------------------------------------------------
        # Step 1: Load job + tenant
        # ------------------------------------------------------------------
        job = db.get(ProvisioningJob, job_id)
        if not job:
            raise RuntimeError(f'Provisioning job {job_id} not found')

        logger.info('job_id=%s tenant_id=%s Starting provisioning', job.id, job.tenant_id)

        # Idempotency: skip if already completed or currently active
        if job.status == LaunchStatus.active:
            logger.info('job_id=%s Already active, skipping', job.id)
            return

        tenant = db.get(Tenant, job.tenant_id)
        if not tenant or not tenant.runner:
            raise RuntimeError('Tenant or assigned runner node not found')

        # ------------------------------------------------------------------
        # Step 2: Mark as provisioning
        # ------------------------------------------------------------------
        _set_step(db, job, 'starting')
        job.status = LaunchStatus.provisioning
        job.started_at = _utcnow()
        job.retry_count = self.request.retries
        tenant.launch_status = LaunchStatus.provisioning
        db.commit()

        # ------------------------------------------------------------------
        # Step 3: Execute Fleetbase provisioning via SSH
        # ------------------------------------------------------------------
        _set_step(db, job, 'provisioning')
        provisioner = FleetbaseProvisioner(tenant.runner)
        result = provisioner.provision(tenant)

        # ------------------------------------------------------------------
        # Step 4: Record success
        # ------------------------------------------------------------------
        _set_step(db, job, 'finalising')

        tenant.launch_status = LaunchStatus.active
        tenant.fleetbase_install_path = result.install_path
        tenant.live_console_url = result.console_url
        tenant.live_api_url = result.api_url

        job.status = LaunchStatus.active
        job.details = result.detail
        job.log_excerpt = result.log_excerpt[:_LOG_EXCERPT_MAX] if result.log_excerpt else None
        job.finished_at = _utcnow()
        job.current_step = 'done'
        job.last_error = None
        db.commit()

        logger.info(
            'job_id=%s tenant_id=%s runner_id=%s Provisioning completed successfully',
            job.id,
            tenant.id,
            tenant.runner_id,
        )

    except Exception as exc:
        logger.exception(
            'job_id=%s tenant_id=%s Provisioning failed: %s',
            job_id,
            getattr(tenant, 'id', 'unknown') if tenant else 'unknown',
            exc,
        )
        _fail_job(db, job, tenant, exc)
        # Celery retry (re-raises Retry exception which bypasses the finally close)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(
                'job_id=%s tenant_id=%s Max retries exceeded, job permanently failed',
                job_id,
                getattr(tenant, 'id', 'unknown') if tenant else 'unknown',
            )
    finally:
        db.close()
