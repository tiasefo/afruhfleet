from __future__ import annotations
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

import logging
from typing import Any

import httpx

from sentinel_app.core.config import admin_settings

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


def login_control_plane(username: str, password: str) -> str:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(
            _url("/auth/login"),
            json={"username": username, "password": password},
            headers={"Content-Type": "application/json"},
        )
    data = _handle(resp)
    token = data.get("access_token")
    if not token:
        raise ControlPlaneError(502, "Control plane login did not return access token")
    return token


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


def list_tenant_requests(cp_token: str, status: str | None = None, page: int = 1, page_size: int = 20) -> dict:
    params: dict[str, Any] = {"page": page, "page_size": page_size}
    if status:
        params["status"] = status
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/tenants/register-requests"), params=params, headers=_headers(cp_token))
        return _handle(resp)


def review_tenant_request(cp_token: str, request_id: str, payload: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.patch(_url(f"/tenants/register-requests/{request_id}"), json=payload, headers=_headers(cp_token))
        return _handle(resp)


def auto_provision_tenant_request(cp_token: str, request_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/tenants/auto-provision"), params={"request_id": request_id}, headers=_headers(cp_token))
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


# ── Analytics ───────────────────────────────────────────────────

def get_admin_analytics_summary(cp_token: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/analytics/admin/summary"), headers=_headers(cp_token))
        return _handle(resp)


# ── Support Tickets (Admin) ─────────────────────────────────────

def list_admin_tickets(cp_token: str, params: dict | None = None) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/support-crm/admin/tickets"), params=params or {}, headers=_headers(cp_token))
        return _handle(resp)


def update_admin_ticket_status(cp_token: str, ticket_id: str, status: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.patch(_url(f"/support-crm/admin/tickets/{ticket_id}/status"), params={"status": status}, headers=_headers(cp_token))
        return _handle(resp)


# ── Tracking ─────────────────────────────────────────────────────

def track_public_shipment(cp_token: str, tenant_id: str, tracking_number: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/shipments/public/track/{tenant_id}/{tracking_number}"), headers=_headers(cp_token))
        return _handle(resp)


# ── Tenant support helpers ─────────────────────────────────────────────────────────────────

def lookup_tenant(cp_token: str, email: str | None = None, slug: str | None = None) -> dict:
    """Find a tenant by contact email or slug."""
    params = {}
    if email:
        params["email"] = email
    if slug:
        params["slug"] = slug
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/tenants/lookup"), params=params, headers=_headers(cp_token))
        return _handle(resp)


def resend_portal_url(cp_token: str, tenant_id: str) -> dict:
    """Re-send the portal URL email to the tenant admin and return the URL."""
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/tenants/{tenant_id}/resend-portal-url"), headers=_headers(cp_token))
        return _handle(resp)


def suspend_tenant(cp_token: str, tenant_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/tenants/{tenant_id}/suspend"), headers=_headers(cp_token))
        return _handle(resp)


def activate_tenant(cp_token: str, tenant_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/tenants/{tenant_id}/activate"), headers=_headers(cp_token))
        return _handle(resp)


def delete_tenant(cp_token: str, tenant_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.delete(_url(f"/tenants/{tenant_id}"), headers=_headers(cp_token))
        return _handle(resp)


def provision_tenant_fleetbase(cp_token: str, tenant_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url(f"/tenants/{tenant_id}/provision"), headers=_headers(cp_token))
        return _handle(resp)


# ── Tenant Preview (products, fleetbase) ─────────────────────────────────────

def list_tenant_products(cp_token: str, tenant_id: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/admin/tenants/{tenant_id}/products"), headers=_headers(cp_token))
        return _handle(resp)


def list_tenant_product_categories(cp_token: str, tenant_id: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/admin/tenants/{tenant_id}/products/categories"), headers=_headers(cp_token))
        return _handle(resp)


def preview_tenant_fleetbase(cp_token: str, tenant_id: str, resource: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url(f"/admin/tenants/{tenant_id}/fleetbase/{resource}"), headers=_headers(cp_token))
        return _handle(resp)


# ── Storefront Templates ─────────────────────────────────────────────────────

def list_storefront_templates(cp_token: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/storefront-templates"), headers=_headers(cp_token))
        return _handle(resp)


def list_all_storefront_templates(cp_token: str) -> list[dict]:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.get(_url("/storefront-templates/admin/all"), headers=_headers(cp_token))
        return _handle(resp)


def create_storefront_template(cp_token: str, data: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/storefront-templates/admin"), headers=_headers(cp_token), json=data)
        return _handle(resp)


def update_storefront_template(cp_token: str, template_id: str, data: dict) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.patch(_url(f"/storefront-templates/admin/{template_id}"), headers=_headers(cp_token), json=data)
        return _handle(resp)


def delete_storefront_template(cp_token: str, template_id: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.delete(_url(f"/storefront-templates/admin/{template_id}"), headers=_headers(cp_token))
        return _handle(resp)


def select_storefront_template(cp_token: str, template_code: str) -> dict:
    with httpx.Client(timeout=_TIMEOUT) as c:
        resp = c.post(_url("/storefront-templates/select"), headers=_headers(cp_token), json={"template_code": template_code})
        return _handle(resp)
