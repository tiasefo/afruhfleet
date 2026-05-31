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

        data = self._post(_SIGN_UP_PATH, payload)

        # sign-up returns {"token": "..."} — call bootstrap to get user+org details
        token = data.get("token") or self._extract(data, "token")
        bootstrap = self._get("/int/v1/auth/bootstrap", token=token)

        session      = bootstrap.get("session", {})
        user_id      = session.get("user") or ""  # session.user is a UUID string
        organizations = bootstrap.get("organizations", [])
        org          = organizations[0] if organizations else {}
        org_id       = org.get("uuid") or org.get("public_id") or ""
        api_key      = self._issue_api_key(token, org_id)
        console_url  = self._build_console_url()

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
        Falls back to a placeholder if the endpoint is unavailable or the org
        schema isn't set up yet (e.g. brand-new instance with empty DB).
        """
        try:
            data = self._post(
                "/int/v1/api-credentials",
                {"name": "afruheritage-platform", "company_uuid": org_id},
                token=token,
            )
            key = self._extract(data, "key", "api_key", "apiKey")
            if key:
                return key
        except Exception as exc:
            logger.warning("Could not issue Fleetbase API key — using token as key: %s", exc)
        # Fall back: the admin token itself can act as a bearer for management calls
        return token

    def _build_console_url(self) -> str:
        """Return the URL where the freight company's Fleetbase console lives."""
        # The shared Fleetbase console is at port 4203; orgs are selected after login.
        host = settings.base_url.replace("http://", "").replace("https://", "").split(":")[0]
        return f"http://{host}:4203"

    @staticmethod
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
