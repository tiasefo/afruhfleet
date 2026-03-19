from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_ignore_empty=True, extra='ignore')

    app_name: str = Field(default='Afruheritage Control Plane', alias='APP_NAME')
    app_env: str = Field(default='production', alias='APP_ENV')
    api_v1_prefix: str = Field(default='/api/v1', alias='API_V1_PREFIX')
    secret_key: str = Field(alias='SECRET_KEY')
    access_token_expire_minutes: int = Field(default=480, alias='ACCESS_TOKEN_EXPIRE_MINUTES')
    database_url: str = Field(alias='DATABASE_URL')
    celery_broker_url: str = Field(alias='CELERY_BROKER_URL')
    celery_result_backend: str = Field(alias='CELERY_RESULT_BACKEND')
    redis_url: str = Field(alias='REDIS_URL')
    cors_origins: List[str] = Field(default_factory=list, alias='CORS_ORIGINS')
    enable_bootstrap_admin: bool = Field(default=True, alias='ENABLE_BOOTSTRAP_ADMIN')

    default_subdomain_base: str = Field(alias='DEFAULT_SUBDOMAIN_BASE')
    runner_default_fleetbase_root: str = Field(alias='RUNNER_DEFAULT_FLEETBASE_ROOT')
    runner_default_ssh_port: int = Field(default=22, alias='RUNNER_DEFAULT_SSH_PORT')
    runner_default_ssh_user: str = Field(alias='RUNNER_DEFAULT_SSH_USER')
    runner_default_ssh_key_path: str = Field(alias='RUNNER_DEFAULT_SSH_KEY_PATH')

    fleetbase_cli_package: str = Field(default='@fleetbase/cli', alias='FLEETBASE_CLI_PACKAGE')
    fleetbase_install_environment: str = Field(default='production', alias='FLEETBASE_INSTALL_ENVIRONMENT')
    fleetbase_default_install_host: str = Field(default='0.0.0.0', alias='FLEETBASE_DEFAULT_INSTALL_HOST')
    provisioning_timeout_seconds: int = Field(default=3600, alias='PROVISIONING_TIMEOUT_SECONDS')


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
