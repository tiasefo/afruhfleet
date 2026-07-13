from __future__ import annotations

import logging
import secrets
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.tenant import LaunchStatus, Tenant
from app.models.platform_config import ProvisioningAlert, PlatformAlertSettings
from app.services.fleetbase_api_client import fleetbase_client
from app.services.email_client import send_email

logger = logging.getLogger("afruheritage.tenant_lifecycle")


def _get_alert_emails(db: Session) -> list[str]:
    row = db.query(PlatformAlertSettings).first()
    if not row or not row.provisioning_failure_emails:
        return []
    return [e.strip() for e in row.provisioning_failure_emails.split(",") if e.strip()]


def _send_provisioning_failure_email(db: Session, tenant: Tenant, alert: ProvisioningAlert) -> None:
    emails = _get_alert_emails(db)
    if not emails:
        return
    subject = f"Provisioning failed for tenant {tenant.company_name}"
    body = (
        f"Provisioning failed for tenant:\n\n"
        f"  Tenant: {tenant.company_name} ({tenant.slug})\n"
        f"  Stage: {alert.stage}\n"
        f"  Error: {alert.failure_reason}\n"
        f"  Time: {alert.created_at}\n\n"
        f"Retry from Sentinel > Tenant Provisioning.\n"
    )
    for addr in emails:
        try:
            send_email(to=addr, subject=subject, body=body)
        except Exception as exc:
            logger.error("Failed to send provisioning alert email to %s: %s", addr, exc)


def advance_tenant_lifecycle(db: Session, tenant_id: str) -> dict:
    """Single idempotent function that checks a tenant's current state and
    does whatever's next.

    States and actions:
      - draft / pending_verification → approve, then provision Fleetbase org
      - approved → provision Fleetbase org if missing
      - failed → retry Fleetbase org provisioning
      - provisioning → check if org exists, mark active if so
      - active → no-op

    On any failure, creates a ProvisioningAlert row and sends email to
    configured addresses. Returns a dict describing what happened.
    """
    actions: list[str] = []

    try:
        tenant_pk = uuid.UUID(str(tenant_id))
    except (ValueError, TypeError):
        tenant = db.query(Tenant).filter(Tenant.slug == tenant_id).first()
        if not tenant:
            return {"advanced": False, "error": "tenant_not_found"}
        tenant_pk = tenant.id
    else:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_pk).first()

    if not tenant:
        return {"advanced": False, "error": "tenant_not_found"}

    # Already active and has org — nothing to do
    if tenant.launch_status == LaunchStatus.active and tenant.fleetbase_org_id:
        actions.append("already_active")
        return {"advanced": False, "actions": actions, "reason": "already_active"}

    # Auto-approve if draft or pending
    if tenant.launch_status in (LaunchStatus.draft, LaunchStatus.pending_verification):
        tenant.launch_status = LaunchStatus.approved
        tenant.verification_notes = "Auto-approved by advance_tenant_lifecycle"
        db.commit()
        actions.append("auto_approved")

    # If org already exists, just mark active
    if tenant.fleetbase_org_id:
        if tenant.launch_status != LaunchStatus.active:
            tenant.launch_status = LaunchStatus.active
            db.commit()
            actions.append("marked_active")
        return {"advanced": True, "actions": actions, "fleetbase_org_id": tenant.fleetbase_org_id}

    # Need to provision Fleetbase org
    stage = "fleetbase_org"
    try:
        tenant.launch_status = LaunchStatus.provisioning
        db.commit()

        org = fleetbase_client.provision_org(
            company_name=tenant.company_name,
            admin_email=tenant.contact_email,
            admin_password=secrets.token_urlsafe(16),
            phone="",
        )
        tenant.fleetbase_org_id = org.org_id
        tenant.fleetbase_api_key = org.api_key
        tenant.fleetbase_admin_token = org.admin_token
        tenant.live_api_token = org.api_key
        tenant.live_console_url = org.console_url
        tenant.live_api_url = settings.fleetbase_internal_url.rstrip("/")
        tenant.launch_status = LaunchStatus.active
        db.commit()
        actions.append(f"fleetbase_org_created:{org.org_id}")
        actions.append("tenant_active")
        logger.info("advance_tenant_lifecycle: provisioned org %s for tenant %s", org.org_id, tenant.slug)
        return {"advanced": True, "actions": actions, "fleetbase_org_id": org.org_id}

    except Exception as exc:
        logger.error("advance_tenant_lifecycle: provisioning failed for tenant %s: %s", tenant.slug, exc)
        tenant.launch_status = LaunchStatus.failed
        db.commit()

        alert = ProvisioningAlert(
            tenant_id=tenant.id,
            failure_reason=str(exc)[:2000],
            stage=stage,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        _send_provisioning_failure_email(db, tenant, alert)

        actions.append(f"provisioning_failed:{exc}")
        return {"advanced": False, "actions": actions, "error": str(exc), "alert_id": str(alert.id)}


def resolve_provisioning_alert(db: Session, alert_id: str) -> bool:
    """Mark a ProvisioningAlert as resolved."""
    from datetime import datetime
    try:
        alert_pk = uuid.UUID(alert_id)
    except (ValueError, TypeError):
        return False
    alert = db.query(ProvisioningAlert).filter(ProvisioningAlert.id == alert_pk).first()
    if not alert:
        return False
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return True


def ensure_alert_settings(db: Session) -> PlatformAlertSettings:
    """Get or create the singleton PlatformAlertSettings row."""
    row = db.query(PlatformAlertSettings).first()
    if row:
        return row
    row = PlatformAlertSettings(provisioning_failure_emails="")
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
