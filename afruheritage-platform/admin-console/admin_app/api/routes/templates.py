from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from admin_app.api.deps import get_current_admin
from admin_app.models.admin_user import AdminUser
from admin_app.services.control_plane_client import (
    ControlPlaneError,
    list_storefront_templates,
    list_all_storefront_templates,
    create_storefront_template,
    update_storefront_template,
    delete_storefront_template,
    select_storefront_template,
    get_tenant_branding,
    update_tenant_branding,
)

router = APIRouter(prefix="/templates", tags=["Storefront Templates"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("")
def list_templates(request: Request, _: AdminUser = Depends(get_current_admin)):
    try:
        return list_storefront_templates(_get_cp_token(request))
    except ControlPlaneError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/admin/all")
def list_all_templates(request: Request, _: AdminUser = Depends(get_current_admin)):
    try:
        return list_all_storefront_templates(_get_cp_token(request))
    except ControlPlaneError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


class TemplateCreateBody(BaseModel):
    template_code: str
    name: str
    description: Optional[str] = None
    preset: dict


@router.post("/admin")
def create_template(request: Request, body: TemplateCreateBody, _: AdminUser = Depends(get_current_admin)):
    try:
        return create_storefront_template(_get_cp_token(request), body.model_dump())
    except ControlPlaneError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


class TemplateUpdateBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    preset: Optional[dict] = None
    is_active: Optional[bool] = None


@router.patch("/admin/{template_id}")
def update_template(request: Request, template_id: str, body: TemplateUpdateBody, _: AdminUser = Depends(get_current_admin)):
    try:
        return update_storefront_template(_get_cp_token(request), template_id, body.model_dump(exclude_unset=True))
    except ControlPlaneError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.delete("/admin/{template_id}")
def delete_template(request: Request, template_id: str, _: AdminUser = Depends(get_current_admin)):
    try:
        return delete_storefront_template(_get_cp_token(request), template_id)
    except ControlPlaneError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


class TemplateSelectBody(BaseModel):
    template_code: str


@router.post("/select")
def select_template(request: Request, body: TemplateSelectBody, _: AdminUser = Depends(get_current_admin)):
    try:
        return select_storefront_template(_get_cp_token(request), body.template_code)
    except ControlPlaneError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ── Tenant Branding ───────────────────────────────────────────────────────────

@router.get("/branding/{tenant_id}")
def get_branding(request: Request, tenant_id: str, _: AdminUser = Depends(get_current_admin)):
    try:
        return get_tenant_branding(_get_cp_token(request), tenant_id)
    except ControlPlaneError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


class BrandingUpdateBody(BaseModel):
    pseudo_email_domain: Optional[str] = None
    template_code: Optional[str] = None
    company_name: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None


@router.patch("/branding/{tenant_id}")
def update_branding(request: Request, tenant_id: str, body: BrandingUpdateBody, _: AdminUser = Depends(get_current_admin)):
    try:
        return update_tenant_branding(_get_cp_token(request), tenant_id, body.model_dump(exclude_unset=True))
    except ControlPlaneError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
