"""
Fleetbase API client — replaces the SSH-based provisioner.

Fleetbase is running on the SAME server (fleetbase-httpd container, port 8004 on
the host / port 80 on the fleetbase_default Docker network).

Each freight-forwarding company that signs up gets their own Fleetbase
*Organisation* inside the shared Fleetbase instance.  This gives them full
feature isolation (drivers, orders, fleet, dispatch, GPS, etc.) at low overhead.

Network note
------------
The `afruheritage-api` container is on the `afruheritage-platform_default`
network; Fleetbase is on `fleetbase_default`.  They share the same HOST.
We reach Fleetbase via FLEETBASE_INTERNAL_URL which defaults to
`http://fleetbase-httpd` — the compose service name.  For that to resolve,
the afruheritage stack must be joined to the `fleetbase_default` network
(see docker-compose.yml `networks:` section added by this sprint).
As a fallback, the URL can be set to `http://host-gateway:8004` in .env.
"""
from __future__ import annotations

import logging
import secrets
from dataclasses import dataclass
from typing import Any
import time

import httpx

from app.core.config import settings

logger = logging.getLogger("afruheritage.fleetbase_client")

_SIGN_UP_PATH   = "/int/v1/auth/sign-up"
_LOGIN_PATH     = "/int/v1/auth/login"
_CREATE_ORG_PATH = "/int/v1/auth/create-organization"


@dataclass
class FleetbaseOrg:
    """Everything returned from Fleetbase after successful org creation."""
    org_id: str          # Fleetbase's public_id / uuid for the company
    admin_user_id: str   # The org-owner user's id in Fleetbase
    api_key: str         # An API key scoped to this org (for runtime calls)
    admin_token: str     # Session token of the org-admin (for management calls)
    console_url: str     # URL to the Fleetbase console for this org


class FleetbaseAPIClient:
    """
    Thin wrapper around Fleetbase's internal auth + org management API.

    Usage::

        client = FleetbaseAPIClient()
        org = client.provision_org(
            company_name="Acme Cargo Ltd",
            admin_email="admin@acmecargo.com",
            admin_password="generated-or-provided",
            phone="+233201234567",
        )
        # org.org_id, org.api_key, org.admin_token are ready to store in Tenant
    """

    def __init__(self, base_url: str | None = None, timeout: int = 30) -> None:
        self._base = (base_url or settings.fleetbase_internal_url).rstrip("/")
        self._timeout = timeout
        # Retry/backoff settings for provisioning
        self._retries = getattr(settings, "fleetbase_provisioning_retries", 3)
        self._backoff = getattr(settings, "fleetbase_provisioning_backoff_seconds", 2)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def provision_org(
        self,
        company_name: str,
        admin_email: str,
        admin_password: str,
        phone: str = "",
    ) -> FleetbaseOrg:
        """
        Create a brand-new Fleetbase user + organisation, then issue an API key.
        Returns a FleetbaseOrg with all credentials needed by our platform.
        """
        payload = {
            "user": {
                "name": company_name,
                "email": admin_email,
                "password": admin_password,
                "password_confirmation": admin_password,
                "phone": phone or "",
            },
            "company": {
                "name": company_name,
            },
        }

        last_exc: Exception | None = None
        for attempt in range(max(1, int(self._retries))):
            try:
                data = self._post(_SIGN_UP_PATH, payload)

                # sign-up returns {"token": "..."} — call bootstrap to get user+org details
                token = data.get("token") or self._extract(data, "token")
                bootstrap = self._get("/int/v1/auth/bootstrap", token=token)

                session = bootstrap.get("session", {})
                user_id = session.get("user") or ""  # session.user is a UUID string
                organizations = bootstrap.get("organizations", [])
                org = organizations[0] if organizations else {}
                org_id = org.get("uuid") or org.get("public_id") or ""

                api_key = self._issue_api_key(token, org_id)
                console_url = self._build_console_url()

                logger.info(
                    "Fleetbase org provisioned",
                    extra={"company": company_name, "email": admin_email, "org_id": org_id},
                )
                return FleetbaseOrg(
                    org_id=str(org_id),
                    admin_user_id=str(user_id),
                    api_key=api_key,
                    admin_token=token,
                    console_url=console_url,
                )
            except Exception as exc:
                last_exc = exc
                # if not last attempt, wait with exponential backoff and retry
                if attempt < max(0, int(self._retries) - 1):
                    sleep_for = int(self._backoff) * (2 ** attempt)
                    logger.warning(
                        "Fleetbase provisioning attempt %d failed, retrying in %ds: %s",
                        attempt + 1,
                        sleep_for,
                        exc,
                    )
                    time.sleep(sleep_for)
                    continue
                # final failure — re-raise
                raise

    def login(self, email: str, password: str) -> str:
        """Return a session token for an existing Fleetbase user."""
        data = self._post(_LOGIN_PATH, {"email": email, "password": password, "identity": email})
        return self._extract(data, "token")

    def create_org_for_existing_user(
        self, token: str, org_name: str
    ) -> dict[str, Any]:
        """Create an additional org for a user that already has a Fleetbase account."""
        return self._post(_CREATE_ORG_PATH, {"name": org_name}, token=token)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _post(self, path: str, body: dict, token: str | None = None) -> dict:
        headers: dict[str, str] = {"Content-Type": "application/json", "Accept": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"{self._base}{path}"
        try:
            resp = httpx.post(url, json=body, headers=headers, timeout=self._timeout)
        except httpx.RequestError as exc:
            raise RuntimeError(
                f"Cannot reach Fleetbase at {self._base}. "
                f"Check FLEETBASE_INTERNAL_URL in .env. Error: {exc}"
            ) from exc

        if resp.status_code >= 400:
            detail = ""
            try:
                detail = resp.json()
            except Exception:
                detail = resp.text[:300]
            raise RuntimeError(
                f"Fleetbase API returned {resp.status_code} for {path}: {detail}"
            )
        return resp.json()

    def _get(self, path: str, token: str | None = None) -> dict:
        headers: dict[str, str] = {"Accept": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        url = f"{self._base}{path}"
        try:
            resp = httpx.get(url, headers=headers, timeout=self._timeout)
        except httpx.RequestError as exc:
            raise RuntimeError(f"Cannot reach Fleetbase at {self._base}. Error: {exc}") from exc
        if resp.status_code >= 400:
            return {}
        return resp.json()

    def _issue_api_key(self, token: str, org_id: str) -> str:
        """
        Attempt to create an API key via Fleetbase's key management API.
        Return ONLY a usable key/token string. If Fleetbase returns a credential
        object without a visible key, fall back to the admin session token.
        """
        def find_key(obj):
            if isinstance(obj, str) and len(obj) > 20:
                return obj
            if isinstance(obj, dict):
                preferred = [
                    "key",
                    "api_key",
                    "apiKey",
                    "token",
                    "access_token",
                    "secret",
                    "_key",
                ]
                for k in preferred:
                    v = obj.get(k)
                    if isinstance(v, str) and len(v) > 20 and v.lower() != "none":
                        return v

                for v in obj.values():
                    found = find_key(v)
                    if found:
                        return found

            if isinstance(obj, list):
                for item in obj:
                    found = find_key(item)
                    if found:
                        return found

            return None

        try:
            data = self._post(
                "/int/v1/api-credentials",
                {"name": "afruheritage-platform", "company_uuid": org_id},
                token=token,
            )
            key = find_key(data)
            if key and isinstance(key, str) and not key.startswith("{"):
                return key

            logger.warning(
                "Fleetbase API credential response had no usable string key; using admin token fallback",
                extra={"org_id": org_id, "response_type": type(data).__name__},
            )
            return token
        except Exception as exc:
            logger.warning("Could not issue Fleetbase API key — using admin token as fallback: %s", exc)
            return token

    def _build_console_url(self) -> str:
        """
        Public Fleetbase console URL for users. Do not derive this from the
        internal API URL because the internal URL may be api.afruheritage.com:4203
        or 10.x.x.x.
        """
        return (getattr(settings, "fleetbase_console_url", "") or "https://fleet.afruheritage.com").rstrip("/")

    def _extract(data: dict, *paths: str) -> str:
        """
        Try each dotted path in order, return the first non-falsy value.
        Raises RuntimeError if nothing is found.
        """
        for path in paths:
            value = data
            try:
                for key in path.split("."):
                    value = value[key]
                if value:
                    return str(value)
            except (KeyError, TypeError):
                continue
        raise RuntimeError(
            f"Could not find any of {paths} in Fleetbase response: {list(data.keys())}"
        )


# ---------------------------------------------------------------------------
# Module-level singleton — import this everywhere
# ---------------------------------------------------------------------------
fleetbase_client = FleetbaseAPIClient()
