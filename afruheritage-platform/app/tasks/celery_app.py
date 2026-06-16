from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    'afruheritage',
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.task_track_started = True
celery_app.conf.task_serializer = 'json'
celery_app.conf.result_serializer = 'json'
celery_app.conf.accept_content = ['json']
celery_app.conf.imports = (
    'app.tasks.provisioning',
    'app.tasks.domain_verification',
    'app.tasks.tracking_monitor',
    'app.tasks.booking_reassignment',
    'app.tasks.subscription_checks',
)
celery_app.conf.beat_schedule = {
    'tracking-stale-monitor': {
        'task': 'app.tasks.tracking_monitor.mark_stale_tracking',
        'schedule': crontab(minute=f'*/{max(1, settings.tracking_stale_check_interval_minutes)}'),
    },
    'booking-offer-reassignment-monitor': {
        'task': 'app.tasks.booking_reassignment.reassign_expired_offers',
        'schedule': crontab(minute=f'*/{max(1, settings.booking_reassignment_check_interval_minutes)}'),
    },
    'subscription-expiry-check': {
        'task': 'app.tasks.subscription_checks.check_expiring_subscriptions',
        'schedule': crontab(hour='3', minute='0'),  # Daily at 3 AM UTC
    },
}
