"""Invitation-only pilot access control.

While PILOT_INVITE_ONLY is on, self-serve registration requires the
registrant's email to be admitted. Ops admits participants without a
restart via Redis:

    redis-cli -a <pass> SADD pilot:allowed_emails user@example.com
    redis-cli -a <pass> SADD pilot:allowed_domains example.org

PILOT_ALLOWED_EMAILS (comma-separated emails or @domain entries) is an
env fallback. Token-based invitation acceptance routes are unaffected —
they are already invitations. The gate fails closed: if the allowlist
store is unreachable while pilot mode is on, registration is denied.
"""
import logging

from app.core.config import settings
from app.core.redis_client import get_redis_client

logger = logging.getLogger("afruheritage.pilot")

PILOT_EMAILS_KEY = "pilot:allowed_emails"
PILOT_DOMAINS_KEY = "pilot:allowed_domains"

PILOT_DENIED_DETAIL = (
    "Afruheritage is currently running an invitation-only pilot. "
    "Please use the invitation you were sent, or contact support to request access."
)


def _env_allowlist() -> set[str]:
    return {
        e.strip().lower()
        for e in (settings.pilot_allowed_emails or "").split(",")
        if e.strip()
    }


def _listed(email: str, entries: set[str]) -> bool:
    domain = email.split("@")[-1]
    return email in entries or domain in entries or f"@{domain}" in entries


def pilot_registration_allowed(email: str) -> bool:
    if not settings.pilot_invite_only:
        return True
    email = (email or "").strip().lower()
    if not email:
        return False
    if _listed(email, _env_allowlist()):
        return True
    try:
        r = get_redis_client()
        domain = email.split("@")[-1]
        return bool(
            r.sismember(PILOT_EMAILS_KEY, email)
            or r.sismember(PILOT_DOMAINS_KEY, domain)
        )
    except Exception:
        logger.error("Pilot allowlist check failed; denying registration (fail-closed)")
        return False
