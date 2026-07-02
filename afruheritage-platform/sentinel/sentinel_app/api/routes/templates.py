from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from sentinel_app.api.deps import get_current_admin
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.services.control_plane_client import (
    ControlPlaneError,
    list_storefront_templates,
    list_all_storefront_templates,
    create_storefront_template,
    update_storefront_template,
    delete_storefront_template,
    select_storefront_template,
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
