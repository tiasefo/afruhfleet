from app.core.config import settings
"""
Auto-Provisioning Service
Bridges payment confirmation → subscription activation → tenant launch.

Flow: Paystack webhook (charge.success for subscription) →
      activate subscription → auto-approve tenant → queue provisioning job.
"""
from __future__ import annotations

import logging
import secrets
from sqlalchemy.orm import Session

from app.models.tenant import LaunchStatus, Tenant
from app.models.billing import Subscription, SubscriptionStatus, WalletTransactionType
from app.services.billing_service import activate_or_upgrade_subscription, ensure_wallet, add_wallet_credits
from app.services.fleetbase_api_client import fleetbase_client

# Credits granted per plan tier (matches subscription amount in GHS → credits 1:1)
PLAN_CREDITS = {
    "free_trial": 0,
    "professional": 1000,
    "business": 2500,
}

logger = logging.getLogger("afruheritage.auto_provisioning")


def handle_subscription_payment_success(
    db: Session,
    tenant_id: str,
    plan_code: str,
    currency: str = "GHS",
) -> dict:
    """
    Called after a successful subscription payment.
    Activates subscription and auto-launches the tenant via Fleetbase org creation.

    Returns a dict describing what actions were taken.
    """
    actions = []

    # 1. Activate/upgrade the subscription
    sub = activate_or_upgrade_subscription(db, tenant_id, plan_code, currency)
    actions.append(f"subscription_activated:{sub.plan_code.value}")

    # 2. Ensure wallet exists and credit it with plan-tier credits
    ensure_wallet(db, tenant_id=tenant_id)
    credits = PLAN_CREDITS.get(plan_code, 0)
    if credits > 0:
        add_wallet_credits(
            db,
            tenant_id=tenant_id,
            credits=credits,
            tx_type=WalletTransactionType.CREDIT_PURCHASE,
            reference=f"sub_payment_{plan_code}",
            memo=f"Subscription credit for {plan_code} plan",
        )
        actions.append(f"wallet_credited:{credits}")
    else:
        actions.append("wallet_ensured")

    # 3. Auto-approve and auto-launch via Fleetbase org creation
    tenant = db.query(Tenant).filter(Tenant.id == sub.tenant_id).first()
    if not tenant:
        logger.error("Tenant %s not found after payment", tenant_id)
        return {"actions": actions, "launched": False, "error": "tenant_not_found"}

    if tenant.launch_status in (LaunchStatus.active, LaunchStatus.provisioning, LaunchStatus.queued):
        actions.append(f"already_{tenant.launch_status.value}")
        return {"actions": actions, "launched": False, "reason": "already_in_progress_or_active"}

    # Auto-approve if still pending
    if tenant.launch_status in (LaunchStatus.pending_verification, LaunchStatus.draft):
        tenant.launch_status = LaunchStatus.approved
        tenant.verification_notes = "Auto-approved after successful subscription payment"
        db.commit()
        actions.append("auto_approved")

    # Auto-launch via Fleetbase org creation
    if tenant.launch_status == LaunchStatus.approved:
        try:
            # Create Fleetbase organization for this tenant
            org = fleetbase_client.provision_org(
                company_name=tenant.company_name,
                admin_email=tenant.contact_email,
                admin_password=secrets.token_urlsafe(16),  # Random password, user never logs in directly
                phone="",
            )
            tenant.fleetbase_org_id = org.org_id
            tenant.fleetbase_api_key = org.api_key
            tenant.fleetbase_admin_token = org.admin_token
            tenant.live_api_token = org.api_key
            tenant.live_console_url = org.console_url
            tenant.live_api_url = settings.fleetbase_internal_url.rstrip("/")
            tenant.fleetbase_admin_token = org.admin_token
            tenant.live_api_token = org.api_key
            tenant.live_console_url = org.console_url
            tenant.live_api_url = settings.fleetbase_internal_url.rstrip("/")
            tenant.launch_status = LaunchStatus.active
            db.commit()
            actions.append(f"fleetbase_org_created:{org.org_id}")
            actions.append("tenant_active")
            logger.info(
                "Fleetbase org provisioned for tenant %s (org %s)",
                tenant.slug, org.org_id
            )
            return {"actions": actions, "launched": True, "fleetbase_org_id": org.org_id}
        except Exception as exc:
            actions.append(f"fleetbase_provision_failed:{exc}")
            logger.error("Fleetbase provisioning failed for tenant %s: %s", tenant.slug, exc)
            return {"actions": actions, "launched": False, "error": str(exc)}

    # Tenant is in failed/suspended state — don't auto-launch
    actions.append(f"skipped_status:{tenant.launch_status.value}")
    return {"actions": actions, "launched": False, "reason": f"tenant_status_{tenant.launch_status.value}"}
