from __future__ import annotations
from app.core.config import settings

from typing import Any

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    tenant_scope: str | None = None
    tenant_slug: str | None = None
    model: str = "afruheritage-copilot:latest"
    page_url: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)


class AIChatResponse(BaseModel):
    answer: str
    sources: list[dict[str, Any]]


class AIWidgetConfigResponse(BaseModel):
    enabled: bool
    tenant_slug: str | None = None
    model: str = "afruheritage-copilot:latest"
    scope: str = "shared"
    welcome_message: str = "Welcome to Afruheritage Assistant. How can I help you today?"
    theme: str = "light"
    primary_color: str = "#0ea5e9"
    api_endpoint: str = "/api/v1/ai/chat"
