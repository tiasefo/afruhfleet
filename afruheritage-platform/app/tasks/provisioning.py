import logging
import time

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.structured_logging import business_logger
from app.db.session import SessionLocal
from app.models.tenant import LaunchStatus, ProvisioningJob, Tenant
from app.services.fleetbase_provisioner import FleetbaseProvisioner
from app.services.notification_service import notification_service
from app.tasks.celery_app import celery_app

logger = logging.getLogger('afruheritage.provisioning')


@celery_app.task(
    name='app.tasks.provisioning.provision_tenant',
    soft_time_limit=settings.provisioning_timeout_seconds,
    time_limit=settings.provisioning_timeout_seconds + 60,
    acks_late=True,
    max_retries=0,
)
def provision_tenant(job_id: str) -> None:
    db: Session = SessionLocal()
    start_time = time.time()
    
    try:
        job = db.get(ProvisioningJob, job_id)
        if not job:
            raise RuntimeError(f'Provisioning job {job_id} not found')

        if job.status in (LaunchStatus.provisioning, LaunchStatus.active):
            logger.info('Job %s already in state %s, skipping', job_id, job.status.value)
            return

        tenant = db.get(Tenant, job.tenant_id)
        if not tenant or not tenant.runner:
            raise RuntimeError('Tenant or assigned runner node not found')

        logger.info('Starting provisioning for tenant %s (job %s)', tenant.slug, job_id)
        business_logger.log_tenant_provisioning(
            tenant_id=tenant.id,
            tenant_name=tenant.company_name,
            status="started"
        )

        tenant.launch_status = LaunchStatus.provisioning
        job.status = LaunchStatus.provisioning
        db.commit()

        provisioner = FleetbaseProvisioner(tenant.runner)
        result = provisioner.provision(tenant)

        tenant.launch_status = LaunchStatus.active
        tenant.fleetbase_install_path = result.install_path
        tenant.live_console_url = result.console_url
        tenant.live_api_url = result.api_url
        job.status = LaunchStatus.active
        job.details = result.detail
        db.commit()

        duration_ms = (time.time() - start_time) * 1000
        logger.info('Provisioning completed for tenant %s', tenant.slug)
        business_logger.log_tenant_provisioning(
            tenant_id=tenant.id,
            tenant_name=tenant.company_name,
            status="completed",
            duration_ms=duration_ms
        )
        
        # Send launch notification
        try:
            notification_service.send_tenant_launched_email(
                to=tenant.contact_email,
                company_name=tenant.company_name,
                console_url=tenant.live_console_url
            )
        except Exception as e:
            logger.error("Failed to send launch email for tenant %s: %s", tenant.slug, e)
            
    except Exception as exc:
        duration_ms = (time.time() - start_time) * 1000
        logger.exception('Provisioning failed for job %s: %s', job_id, exc)
        
        # Log business event
        if 'tenant' in locals() and tenant:
            business_logger.log_tenant_provisioning(
                tenant_id=tenant.id,
                tenant_name=tenant.company_name,
                status="failed",
                duration_ms=duration_ms,
                error=str(exc)
            )
        
        if 'job' in locals() and job:
            job.status = LaunchStatus.failed
            job.details = str(exc)[:2000]
        if 'tenant' in locals() and tenant:
            tenant.launch_status = LaunchStatus.failed
        db.commit()
        raise
    finally:
        db.close()
