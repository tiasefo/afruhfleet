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


class TenantTemplateSelectionRequest(BaseModel):
    template_code: str
