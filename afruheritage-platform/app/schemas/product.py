from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductCategoryCreate(BaseModel):
    name: str
    description: str | None = None
    sort_order: int = 0


class ProductCategoryResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    sort_order: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    short_description: str | None = None
    price: float = Field(..., ge=0)
    compare_at_price: float | None = None
    currency: str = "GHS"
    images: list[str] = Field(default_factory=list)
    videos: list[str] = Field(default_factory=list)
    sku: str | None = None
    stock_quantity: int = 0
    is_available: bool = True
    is_featured: bool = False
    category_id: UUID | None = None
    tags: str | None = None
    sort_order: int = 0


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    short_description: str | None = None
    price: float | None = Field(default=None, ge=0)
    compare_at_price: float | None = None
    currency: str | None = None
    images: list[str] | None = None
    videos: list[str] | None = None
    sku: str | None = None
    stock_quantity: int | None = None
    is_available: bool | None = None
    is_featured: bool | None = None
    category_id: UUID | None = None
    tags: str | None = None
    sort_order: int | None = None


class ProductResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    category_id: UUID | None = None
    name: str
    description: str | None = None
    short_description: str | None = None
    price: float
    compare_at_price: float | None = None
    currency: str
    images: list[str]
    videos: list[str]
    sku: str | None = None
    stock_quantity: int
    is_available: bool
    is_featured: bool
    tags: str | None = None
    sort_order: int
    created_at: datetime
    updated_at: datetime

    @field_validator('images', mode='before')
    @classmethod
    def _parse_images(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
        return v or []

    @field_validator('videos', mode='before')
    @classmethod
    def _parse_videos(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
        return v or []

    model_config = ConfigDict(from_attributes=True)
