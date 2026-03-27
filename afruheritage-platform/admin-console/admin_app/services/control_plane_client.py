# ── KYC ─────────────────────────────────────────────────────

def list_kyc_submissions(cp_token: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/kyc/admin/list"), headers=_headers(cp_token))
        return _handle(resp)

def approve_kyc_submission(cp_token: str, kyc_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/kyc/admin/approve/{kyc_id}"), headers=_headers(cp_token))
        return _handle(resp)

def revoke_kyc_submission(cp_token: str, kyc_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/kyc/admin/revoke/{kyc_id}"), headers=_headers(cp_token))
        return _handle(resp)
from __future__ import annotations

import logging
from typing import Any

import httpx

from admin_app.core.config import admin_settings

logger = logging.getLogger("admin_console.cp_client")

_BASE = admin_settings.control_plane_base_url.rstrip("/")
_PREFIX = admin_settings.control_plane_api_prefix.rstrip("/")
_TIMEOUT = 30.0


class ControlPlaneError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"CP {status_code}: {detail}")


def _url(path: str) -> str:
    return f"{_BASE}{_PREFIX}{path}"


def _headers(cp_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {cp_token}", "Content-Type": "application/json"}


def _handle(resp: httpx.Response) -> dict[str, Any]:
    if resp.status_code >= 400:
        detail = resp.text[:500]
        try:
            detail = resp.json().get("detail", detail)
        except Exception:
            pass
        raise ControlPlaneError(resp.status_code, str(detail))
    return resp.json()


# ── Tenants ─────────────────────────────────────────────────────

def list_tenants(cp_token: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/tenants"), headers=_headers(cp_token))
        return _handle(resp)


def create_tenant(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/tenants"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def approve_tenant(cp_token: str, tenant_id: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/tenants/{tenant_id}/approve"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def launch_tenant(cp_token: str, tenant_id: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/tenants/{tenant_id}/launch"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def get_job(cp_token: str, job_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/tenants/jobs/{job_id}"), headers=_headers(cp_token))
        return _handle(resp)


# ── Runners ─────────────────────────────────────────────────────

def list_runners(cp_token: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/runners"), headers=_headers(cp_token))
        return _handle(resp)


def create_runner(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/runners"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


# ── Billing ─────────────────────────────────────────────────────

def list_plans(cp_token: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/billing/plans"), headers=_headers(cp_token))
        return _handle(resp)


def get_subscription(cp_token: str, tenant_id: str) -> dict | None:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/billing/subscriptions/{tenant_id}"), headers=_headers(cp_token))
        if resp.status_code == 200 and resp.text == "null":
            return None
        return _handle(resp)


def assign_plan(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/billing/admin/subscriptions/assign"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def adjust_credits(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/billing/admin/credits/adjust"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def set_read_only(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/billing/admin/read-only"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def get_wallet(cp_token: str, tenant_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/billing/wallets/{tenant_id}"), headers=_headers(cp_token))
        return _handle(resp)


# ── Vendors ────────────────────────────────────────────────────

def list_vendors(cp_token: str, params: dict | None = None) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/vendors/admin"), params=params or {}, headers=_headers(cp_token))
        return _handle(resp)


def get_vendor(cp_token: str, vendor_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/vendors/admin/{vendor_id}"), headers=_headers(cp_token))
        return _handle(resp)


def review_vendor(cp_token: str, vendor_id: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/vendors/admin/{vendor_id}/review"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def suspend_vendor(cp_token: str, vendor_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/vendors/admin/{vendor_id}/suspend"), headers=_headers(cp_token))
        return _handle(resp)


# ── Domains ─────────────────────────────────────────────────────

def list_tenant_domains(cp_token: str, tenant_id: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/domains/tenant/{tenant_id}"), headers=_headers(cp_token))
        return _handle(resp)


def activate_domain(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/domains/activate"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


# ── Runtime ─────────────────────────────────────────────────────

def deploy_runtime(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/fleetbase-runtime/deploy"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def get_tenant_runtime(cp_token: str, tenant_id: str) -> dict | None:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/fleetbase-runtime/tenant/{tenant_id}"), headers=_headers(cp_token))
        if resp.status_code == 200 and resp.text == "null":
            return None
        return _handle(resp)


def suspend_runtime(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/fleetbase-runtime/suspend"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def retry_runtime(cp_token: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/fleetbase-runtime/retry"), json=payload, headers=_headers(cp_token))
        return _handle(resp)
