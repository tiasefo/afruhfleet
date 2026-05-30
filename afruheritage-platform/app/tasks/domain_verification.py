from __future__ import annotations
from app.core.config import settings

import logging

from app.db.session import SessionLocal
from app.models.custom_domains import CustomDomain, CustomDomainEvent, DomainStatus
from app.tasks.celery_app import celery_app

logger = logging.getLogger("afruheritage.domain_verification")


@celery_app.task(bind=True, max_retries=120, default_retry_delay=300)
def poll_domain_verification(self, domain_id: str) -> dict:
    """
    Periodically poll Cloudflare to check domain verification and SSL status.
    Retries every 5 minutes up to ~10 hours until domain is active or failed.
    """
    db = SessionLocal()
    try:
        domain = db.query(CustomDomain).filter(CustomDomain.id == domain_id).first()
        if not domain:
            logger.warning("Domain %s not found, aborting poll", domain_id)
            return {"status": "not_found"}

        if domain.status in (DomainStatus.ACTIVE, DomainStatus.REMOVED, DomainStatus.DISABLED):
            logger.info("Domain %s already in terminal state %s", domain.hostname, domain.status.value)
            return {"status": domain.status.value}

        if not domain.cloudflare_hostname_id:
            logger.warning("Domain %s has no Cloudflare hostname ID", domain.hostname)
            domain.status = DomainStatus.FAILED
            domain.last_error = "No Cloudflare hostname ID"
            _record_event(db, domain, "verification_failed", "No Cloudflare hostname ID")
            db.commit()
            return {"status": "failed", "error": "no_cf_id"}

        from app.services.cloudflare_domains import get_custom_hostname_status
        cf_status = get_custom_hostname_status(domain.cloudflare_hostname_id)

        if cf_status is None:
            logger.warning("Could not fetch CF status for %s, will retry", domain.hostname)
            raise self.retry()

        ssl_status = cf_status.get("ssl", {}).get("status", "")
        ownership_status = cf_status.get("ownership_verification", {}).get("status", "")
        cf_hostname_status = cf_status.get("status", "")

        domain.ssl_status = ssl_status
        logger.info(
            "Domain %s: cf_status=%s, ssl=%s, ownership=%s",
            domain.hostname, cf_hostname_status, ssl_status, ownership_status,
        )

        if cf_hostname_status == "active" and ssl_status == "active":
            domain.status = DomainStatus.ACTIVE
            domain.last_error = None
            _record_event(db, domain, "domain_active", "Domain verified and SSL active")
            db.commit()
            logger.info("Domain %s is now ACTIVE", domain.hostname)
            return {"status": "active"}

        if cf_hostname_status in ("moved", "deleted"):
            domain.status = DomainStatus.FAILED
            domain.last_error = f"Cloudflare hostname {cf_hostname_status}"
            _record_event(db, domain, "verification_failed", f"CF status: {cf_hostname_status}")
            db.commit()
            return {"status": "failed"}

        if ssl_status in ("pending_validation", "pending_issuance", "pending_deployment"):
            domain.status = DomainStatus.PENDING_SSL
        elif ownership_status == "pending":
            domain.status = DomainStatus.PENDING_VERIFICATION

        _record_event(
            db, domain, "verification_polled",
            f"cf={cf_hostname_status} ssl={ssl_status} ownership={ownership_status}",
        )
        db.commit()

        raise self.retry()

    except self.MaxRetriesExceededError:
        domain = db.query(CustomDomain).filter(CustomDomain.id == domain_id).first()
        if domain and domain.status not in (DomainStatus.ACTIVE, DomainStatus.REMOVED):
            domain.status = DomainStatus.FAILED
            domain.last_error = "Verification timed out after maximum polling attempts"
            _record_event(db, domain, "verification_timeout", "Max retries exceeded")
            db.commit()
        logger.error("Domain %s verification timed out", domain_id)
        return {"status": "timeout"}
    except Exception as exc:
        logger.error("Domain verification error for %s: %s", domain_id, exc)
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()


def _record_event(db, domain: CustomDomain, event_type: str, message: str) -> None:
    event = CustomDomainEvent(
        domain_id=domain.id,
        event_type=event_type,
        message=message,
    )
    db.add(event)
