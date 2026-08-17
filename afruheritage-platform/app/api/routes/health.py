from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
import redis
import httpx
import logging

router = APIRouter(tags=['health'])
logger = logging.getLogger("afruheritage.health")


@router.get('/health')
def healthcheck() -> dict:
    return {'status': 'ok'}


@router.get('/health/detailed')
def detailed_healthcheck() -> dict:
    """Detailed health check covering DB, Redis, and Fleetbase connectivity."""
    components = {}

    # Database check
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        components['database'] = {'status': 'ok'}
    except Exception as e:
        components['database'] = {'status': 'error', 'detail': str(e)}

    # Redis check
    try:
        r = redis.from_url(settings.redis_url, socket_timeout=3)
        r.ping()
        components['redis'] = {'status': 'ok'}
    except Exception as e:
        components['redis'] = {'status': 'error', 'detail': str(e)}

    # Fleetbase connectivity check
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{settings.fleetbase_internal_url.rstrip('/')}/health")
            if resp.status_code < 500:
                components['fleetbase'] = {'status': 'ok', 'http_status': resp.status_code}
            else:
                components['fleetbase'] = {'status': 'error', 'http_status': resp.status_code}
    except Exception as e:
        components['fleetbase'] = {'status': 'error', 'detail': str(e)}

    # Paystack config check (without exposing secrets)
    components['paystack'] = {
        'status': 'ok' if settings.paystack_secret_key else 'not_configured',
    }

    # SMTP config check
    components['smtp'] = {
        'status': 'ok' if getattr(settings, 'smtp_host', '') else 'not_configured',
    }

    all_ok = all(c.get('status') == 'ok' or c.get('status') == 'not_configured' for c in components.values())
    return {
        'status': 'ok' if all_ok else 'degraded',
        'components': components,
    }


@router.get('/health/ready')
def readiness_check(db: Session = Depends(get_db)) -> dict:
    """Kubernetes-style readiness probe — checks DB only."""
    try:
        db.execute(text("SELECT 1"))
        return {'status': 'ready'}
    except Exception as e:
        logger.error("Readiness check failed: %s", e)
        raise HTTPException(status_code=503, detail='Database not ready')