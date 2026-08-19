from __future__ import annotations

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StorefrontTemplateResponse(BaseModel):
    id: UUID
    template_code: str
    name: str
    description: str | None
    preset: dict
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StorefrontTemplateCatalogResponse(BaseModel):
    id: UUID | None = None
    template_code: str
    name: str
    description: str | None = None
    preset: dict
    is_active: bool
    status: str | None = None
    version: str | None = None
    renderer_key: str | None = None
    minimum_platform_version: str | None = None
    business_type: str | None = None
    required_capabilities: list[str] = []
    optional_capabilities: list[str] = []
    compatible_plugins: list[str] = []
    incompatible_plugins: list[str] = []
    preview_route: str | None = None
    preview_image: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TenantTemplateSelectionRequest(BaseModel):
    template_code: str
    tenant_id: str | None = None
