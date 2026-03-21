from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ai import AIWidgetConfigResponse
from app.services.tenant_ai_service import get_tenant_ai_settings_by_hostname

router = APIRouter(prefix="/ai/widget", tags=["AI Widget"])

MOTHER_HOSTS = {
    "afruheritage.com",
    "www.afruheritage.com",
    "app.afruheritage.com",
    "localhost",
    "127.0.0.1",
}


@router.get("/config", response_model=AIWidgetConfigResponse)
def get_widget_config(
    host: str = Query(...),
    db: Session = Depends(get_db),
) -> AIWidgetConfigResponse:
    if host in MOTHER_HOSTS:
        return AIWidgetConfigResponse(
            enabled=True,
            tenant_slug=None,
            model="afruheritage-copilot:latest",
            scope="shared",
            welcome_message="Welcome to Afruheritage Assistant. How can I help you today?",
            theme="light",
            primary_color="#0ea5e9",
            api_endpoint="/api/v1/ai/chat",
        )

    settings = get_tenant_ai_settings_by_hostname(db, host)
    if settings:
        tenant_slug = settings.retrieval_scope.replace("tenant:", "") if settings.retrieval_scope.startswith("tenant:") else None
        return AIWidgetConfigResponse(
            enabled=settings.widget_enabled,
            tenant_slug=tenant_slug,
            model=settings.chat_model,
            scope=settings.retrieval_scope,
            welcome_message=settings.welcome_message,
            theme=settings.theme,
            primary_color=settings.primary_color,
            api_endpoint="/api/v1/ai/chat",
        )

    tenant_slug = host.split(".")[0] if "." in host else host
    return AIWidgetConfigResponse(
        enabled=True,
        tenant_slug=tenant_slug,
        model="afruheritage-copilot:latest",
        scope=f"tenant:{tenant_slug}",
        welcome_message=f"Welcome to {tenant_slug} Assistant. How can I help you today?",
        theme="light",
        primary_color="#0ea5e9",
        api_endpoint="/api/v1/ai/chat",
    )
