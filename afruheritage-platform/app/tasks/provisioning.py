from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.tenant import LaunchStatus, ProvisioningJob, Tenant
from app.services.fleetbase_provisioner import FleetbaseProvisioner
from app.tasks.celery_app import celery_app


@celery_app.task(name='app.tasks.provisioning.provision_tenant')
def provision_tenant(job_id: str) -> None:
    db: Session = SessionLocal()
    try:
        job = db.get(ProvisioningJob, job_id)
        if not job:
            raise RuntimeError(f'Provisioning job {job_id} not found')
        tenant = db.get(Tenant, job.tenant_id)
        if not tenant or not tenant.runner:
            raise RuntimeError('Tenant or assigned runner node not found')

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
    except Exception as exc:
        if 'job' in locals() and job:
            job.status = LaunchStatus.failed
            job.details = str(exc)
        if 'tenant' in locals() and tenant:
            tenant.launch_status = LaunchStatus.failed
        db.commit()
        raise
    finally:
        db.close()
