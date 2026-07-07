"""
Celery tasks for subscription lifecycle:
- Daily check for expiring subscriptions
- Send reminder emails 7 days, 3 days, 1 day before expiry
- Auto-suspend tenant on expiry
- Admin "hotstop" support via existing /suspend endpoint
- Trial expiry: auto-downgrade expired trials to Starter (not suspend)
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.billing import Subscription, SubscriptionStatus
from app.models.saas_subscription import TenantSubscription
from app.models.tenant import Tenant, LaunchStatus
from app.services.notification_service import get_notification_service
from app.services.entitlements import downgrade_expired_trial
from app.tasks.celery_app import celery_app

logger = logging.getLogger("afruheritage.subscription_checks")


def _get_db() -> Session:
    return SessionLocal()


def _send_expiry_reminder(tenant: Tenant, days_remaining: int) -> None:
    subject = f"Your Afruheritage subscription expires in {days_remaining} day(s)"
    body = (
        f"<p>Hi {tenant.company_name or 'there'},</p>"
        f"<p>Your subscription expires in <strong>{days_remaining} day(s)</strong>. "
        f"Please renew to avoid service interruption.</p>"
        f"<p>Log in at <a href='https://{tenant.slug}.afruheritage.com'>https://{tenant.slug}.afruheritage.com</a> to renew.</p>"
        f"<p>– Afruheritage Team</p>"
    )
    try:
        notification_service = get_notification_service()
        notification_service.send_email(to_email=tenant.contact_email, subject=subject, html_content=body)
        logger.info("Sent expiry reminder to %s (%d days)", tenant.contact_email, days_remaining)
    except Exception as exc:
        logger.error("Failed to send expiry reminder: %s", exc)


def _suspend_tenant(tenant: Tenant, db: Session) -> None:
    tenant.launch_status = LaunchStatus.suspended
    db.commit()
    logger.info("Tenant %s suspended due to subscription expiry", tenant.slug)
    try:
        notification_service = get_notification_service()
        notification_service.send_email(
            to_email=tenant.contact_email,
            subject="Your Afruheritage subscription has expired",
            html_content=(
                f"<p>Hi {tenant.company_name or 'there'},</p>"
                f"<p>Your subscription has expired and your account has been <strong>suspended</strong>. "
                f"Please renew to reactivate your services.</p>"
                f"<p>– Afruheritage Team</p>"
            ),
        )
    except Exception as exc:
        logger.error("Failed to send suspension email: %s", exc)


@celery_app.task(name="app.tasks.subscription_checks.check_expiring_subscriptions")
def check_expiring_subscriptions() -> None:
    """
    Run daily.  For every active subscription that is about to expire:
      - 7 days out  → reminder email
      - 3 days out  → reminder email
      - 1 day out   → reminder email
      - expired     → suspend tenant + email
    """
    db = _get_db()
    try:
        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(days=8)

        subs = db.scalars(
            select(Subscription)
            .where(
                Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.trialing]),
                Subscription.current_period_end <= cutoff,
            )
        ).all()

        for sub in subs:
            tenant = db.get(Tenant, sub.tenant_id)
            if not tenant:
                continue

            days_left = (sub.current_period_end - now).days
            if days_left <= 0:
                # Expired
                sub.status = SubscriptionStatus.past_due
                _suspend_tenant(tenant, db)
            elif days_left in (1, 3, 7):
                _send_expiry_reminder(tenant, days_left)

        db.commit()
        logger.info("Checked %d subscriptions for expiry", len(subs))
    finally:
        db.close()


@celery_app.task(name="app.tasks.subscription_checks.downgrade_expired_trials")
def downgrade_expired_trials() -> dict[str, int]:
    """Run daily. Finds all TenantSubscriptions with trial == True and
    trial_ends_at in the past, and downgrades them to the Starter tier
    (status=active, trial=False) instead of suspending the tenant.
    """
    db = _get_db()
    downgraded = 0
    notified = 0
    try:
        now = datetime.utcnow()
        trial_subs = db.query(TenantSubscription).filter(
            TenantSubscription.trial == True,  # noqa: E712
            TenantSubscription.status == "trial",
        ).all()

        for sub in trial_subs:
            if not sub.trial_ends_at:
                continue

            if now >= sub.trial_ends_at:
                old_plan = sub.plan_code
                changed = downgrade_expired_trial(db, sub)
                if changed:
                    downgraded += 1
                    logger.info(
                        "Trial expired for tenant %s: downgraded from %s to starter",
                        sub.tenant_id, old_plan,
                    )
                    try:
                        tenant = db.query(Tenant).filter(
                            Tenant.slug == sub.tenant_id
                        ).first()
                        if not tenant:
                            tenant = db.query(Tenant).filter(
                                Tenant.id == sub.tenant_id
                            ).first()

                        if tenant and tenant.contact_email:
                            notification_service = get_notification_service()
                            notification_service.send_email(
                                to_email=tenant.contact_email,
                                subject="Your Afruheritage trial has ended",
                                html_content=(
                                    f"<p>Hi {tenant.company_name or 'there'},</p>"
                                    f"<p>Your 14-day trial has ended and your account has been "
                                    f"automatically moved to the <strong>Starter</strong> plan.</p>"
                                    f"<p>You still have access to your storefront with core features. "
                                    f"To unlock AI chat, custom domains, shipping estimator, and more, "
                                    f"upgrade to <strong>Pro</strong>.</p>"
                                    f"<p>Log in at <a href='https://{tenant.slug}.afruheritage.com'>"
                                    f"https://{tenant.slug}.afruheritage.com</a> to upgrade.</p>"
                                    f"<p>– Afruheritage Team</p>"
                                ),
                            )
                            notified += 1
                    except Exception as exc:
                        logger.error("Failed to send trial expiry email: %s", exc)

        logger.info("Trial expiry check: downgraded=%d, notified=%d", downgraded, notified)
        return {"downgraded": downgraded, "notified": notified}
    finally:
        db.close()
