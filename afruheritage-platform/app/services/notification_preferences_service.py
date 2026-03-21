from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.notification_preferences import (
    NotificationChannel,
    NotificationPreference,
    NotificationType,
)


def ensure_default_preferences(db: Session, tenant_id: str) -> None:
    """Create default notification preferences for a new tenant"""
    existing = db.query(NotificationPreference).filter(
        NotificationPreference.tenant_id == tenant_id
    ).count()
    
    if existing > 0:
        return  # Preferences already exist
    
    # Create email preferences
    for notification_type, enabled in NotificationPreference.DEFAULT_EMAIL_PREFERENCES.items():
        pref = NotificationPreference(
            tenant_id=tenant_id,
            notification_type=notification_type,
            channel=NotificationChannel.EMAIL,
            enabled=enabled,
        )
        db.add(pref)
    
    # Create SMS preferences
    for notification_type, enabled in NotificationPreference.DEFAULT_SMS_PREFERENCES.items():
        pref = NotificationPreference(
            tenant_id=tenant_id,
            notification_type=notification_type,
            channel=NotificationChannel.SMS,
            enabled=enabled,
        )
        db.add(pref)
    
    db.commit()


def is_notification_enabled(
    db: Session,
    tenant_id: str,
    notification_type: NotificationType,
    channel: NotificationChannel,
) -> bool:
    """Check if a notification type is enabled for a tenant"""
    pref = db.query(NotificationPreference).filter(
        NotificationPreference.tenant_id == tenant_id,
        NotificationPreference.notification_type == notification_type,
        NotificationPreference.channel == channel,
    ).first()
    
    # If no preference exists, use default
    if not pref:
        if channel == NotificationChannel.EMAIL:
            return NotificationPreference.DEFAULT_EMAIL_PREFERENCES.get(notification_type, True)
        else:  # SMS
            return NotificationPreference.DEFAULT_SMS_PREFERENCES.get(notification_type, False)
    
    return pref.enabled


def update_preference(
    db: Session,
    tenant_id: str,
    notification_type: NotificationType,
    channel: NotificationChannel,
    enabled: bool,
) -> NotificationPreference:
    """Update a notification preference"""
    pref = db.query(NotificationPreference).filter(
        NotificationPreference.tenant_id == tenant_id,
        NotificationPreference.notification_type == notification_type,
        NotificationPreference.channel == channel,
    ).first()
    
    if not pref:
        # Create if doesn't exist
        pref = NotificationPreference(
            tenant_id=tenant_id,
            notification_type=notification_type,
            channel=channel,
            enabled=enabled,
        )
        db.add(pref)
    else:
        pref.enabled = enabled
    
    db.commit()
    db.refresh(pref)
    return pref


def get_all_preferences(db: Session, tenant_id: str) -> dict:
    """Get all notification preferences for a tenant"""
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.tenant_id == tenant_id
    ).all()
    
    result = {}
    for pref in prefs:
        key = f"{pref.notification_type.value}_{pref.channel.value}"
        result[key] = pref.enabled
    
    return result
