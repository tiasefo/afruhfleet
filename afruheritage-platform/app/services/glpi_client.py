from __future__ import annotations
from app.core.config import settings

import httpx


class GLPIClient:
    def __init__(self) -> None:
        self.base_url = (settings.glpi_api_url or settings.glpi_base_url or "").rstrip("/")
        self.app_token = settings.glpi_app_token or ""
        self.user_token = settings.glpi_user_token or ""
        self.entity_mode = settings.glpi_tenant_separation_mode or "shared_entities"

    def enabled(self) -> bool:
        return bool(self.base_url and self.app_token and self.user_token)

    def _headers(self, session_token: str | None = None) -> dict[str, str]:
        headers = {
            "App-Token": self.app_token,
            "Content-Type": "application/json",
        }
        if session_token:
            headers["Session-Token"] = session_token
        else:
            headers["Authorization"] = f"user_token {self.user_token}"
        return headers

    def init_session(self) -> str:
        if not self.enabled():
            raise RuntimeError("GLPI is not configured")
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(f"{self.base_url}/initSession", headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
            return data["session_token"]

    def kill_session(self, session_token: str) -> None:
        with httpx.Client(timeout=60.0) as client:
            client.get(f"{self.base_url}/killSession", headers=self._headers(session_token))

    def create_ticket(self, *, title: str, content: str, entity_id: str | None = None) -> dict:
        session_token = self.init_session()
        try:
            payload = {
                "input": {
                    "name": title,
                    "content": content,
                }
            }
            if entity_id:
                payload["input"]["entities_id"] = entity_id

            with httpx.Client(timeout=60.0) as client:
                resp = client.post(
                    f"{self.base_url}/Ticket",
                    headers=self._headers(session_token),
                    json=payload,
                )
                resp.raise_for_status()
                return resp.json()
        finally:
            self.kill_session(session_token)
