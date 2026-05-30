from __future__ import annotations
from app.core.config import settings

import os

import httpx


class CloudflareDomainClient:
    def __init__(self) -> None:
        self.api_token = os.getenv("CLOUDFLARE_API_TOKEN", "")
        self.zone_id = os.getenv("CLOUDFLARE_ZONE_ID", "")
        self.base_url = "https://api.cloudflare.com/client/v4"

    def enabled(self) -> bool:
        return bool(self.api_token and self.zone_id)

    def _headers(self) -> dict[str, str]:
        if not self.enabled():
            raise RuntimeError("Cloudflare domain config is not complete")
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

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
