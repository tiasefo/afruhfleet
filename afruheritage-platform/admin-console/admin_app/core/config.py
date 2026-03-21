from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AdminSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    app_name: str = Field(default="Afruheritage Admin Console", alias="ADMIN_APP_NAME")
    app_env: str = Field(default="production", alias="ADMIN_APP_ENV")
    secret_key: str = Field(alias="ADMIN_SECRET_KEY")
    access_token_expire_minutes: int = Field(default=120, alias="ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES")
    database_url: str = Field(alias="ADMIN_DATABASE_URL")
    cors_origins: List[str] = Field(default_factory=list, alias="ADMIN_CORS_ORIGINS")

    control_plane_base_url: str = Field(default="http://api:8000", alias="CONTROL_PLANE_BASE_URL")
    control_plane_api_prefix: str = Field(default="/api/v1", alias="CONTROL_PLANE_API_PREFIX")


@lru_cache
def get_admin_settings() -> AdminSettings:
    return AdminSettings()


admin_settings = get_admin_settings()
