from __future__ import annotations
from app.core.config import settings

import os

import httpx


class CloudflareDomainClient:
    def __init__(self) -> None:
        self.api_token = os.getenv("CLOUDFLARE_API_TOKEN", "")
        self.api_key = os.getenv("CLOUDFLARE_API_KEY", "")
        self.api_email = os.getenv("CLOUDFLARE_API_EMAIL", "")
        self.zone_id = os.getenv("CLOUDFLARE_ZONE_ID", "")
        self.base_url = "https://api.cloudflare.com/client/v4"

    def enabled(self) -> bool:
        return bool(self.zone_id and (self.api_token or (self.api_key and self.api_email)))

    def _headers(self) -> dict[str, str]:
        if not self.enabled():
            raise RuntimeError("Cloudflare domain config is not complete")
        
        headers = {"Content-Type": "application/json"}
        
        # Prefer Global API key + email for full access (cache purge requires Zone Edit permissions)
        if self.api_key and self.api_email:
            headers["X-Auth-Email"] = self.api_email
            headers["X-Auth-Key"] = self.api_key
        # Fall back to API token
        elif self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"
        
        return headers

    def create_custom_hostname(self, hostname: str, fallback_origin: str) -> dict:
        payload = {
            "hostname": hostname,
            "ssl": {"method": "txt", "type": "dv"},
            "custom_origin_server": fallback_origin,
        }
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                f"{self.base_url}/zones/{self.zone_id}/custom_hostnames",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    def get_custom_hostname(self, hostname_id: str) -> dict:
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(
                f"{self.base_url}/zones/{self.zone_id}/custom_hostnames/{hostname_id}",
                headers=self._headers(),
            )
            resp.raise_for_status()
            return resp.json()

    def purge_cache(self, urls: list[str] | None = None) -> dict:
        """Purge Cloudflare cache for specific URLs or entire zone"""
        payload = {}
        if urls:
            payload["files"] = urls
        else:
            payload["purge_everything"] = True

        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                f"{self.base_url}/zones/{self.zone_id}/purge_cache",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    def get_page_rules(self) -> dict:
        """Get all page rules for the zone"""
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(
                f"{self.base_url}/zones/{self.zone_id}/pagerules",
                headers=self._headers(),
            )
            resp.raise_for_status()
            return resp.json()

    def get_rulesets(self) -> dict:
        """Get all rulesets for the zone"""
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(
                f"{self.base_url}/zones/{self.zone_id}/rulesets",
                headers=self._headers(),
            )
            resp.raise_for_status()
            return resp.json()

    def create_bypass_cache_rule(self) -> dict:
        """Create a Page Rule to bypass cache for the homepage (deprecated but works on free plans)"""
        payload = {
            "targets": [
                {
                    "target": "url",
                    "constraint": {
                        "operator": "matches",
                        "value": "*afruheritage.com/*"
                    }
                }
            ],
            "actions": [
                {
                    "id": "cache_level",
                    "value": "bypass"
                }
            ],
            "status": "active",
            "priority": 1
        }

        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                f"{self.base_url}/zones/{self.zone_id}/pagerules",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()


_client: CloudflareDomainClient | None = None


def _get_client() -> CloudflareDomainClient:
    global _client
    if _client is None:
        _client = CloudflareDomainClient()
    return _client


def get_custom_hostname_status(hostname_id: str) -> dict | None:
    """Module-level convenience: fetch Cloudflare custom hostname result dict."""
    client = _get_client()
    if not client.enabled():
        return None
    try:
        resp = client.get_custom_hostname(hostname_id)
        return resp.get("result")
    except Exception:
        return None
