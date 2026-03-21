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

    mapbox_access_token: str = Field(default='', alias='MAPBOX_ACCESS_TOKEN')
    
    # Google Maps
    google_maps_api_key: str = Field(default='', alias='GOOGLE_MAPS_API_KEY')
    
    # Geo provider settings
    geo_provider: str = Field(default='auto', alias='GEO_PROVIDER')  # auto, google, mapbox, nominatim
    geo_timeout_seconds: int = Field(default=10, alias='GEO_TIMEOUT_SECONDS')
    geo_cache_enabled: bool = Field(default=True, alias='GEO_CACHE_ENABLED')

    s3_bucket: str = Field(default='', alias='S3_BUCKET')
    s3_region: str = Field(default='us-east-1', alias='S3_REGION')
    s3_endpoint_url: str = Field(default='', alias='S3_ENDPOINT_URL')
    local_storage_dir: str = Field(default='/srv/afruheritage/storage', alias='LOCAL_STORAGE_DIR')

    smtp_host: str = Field(default='', alias='SMTP_HOST')
    smtp_port: int = Field(default=587, alias='SMTP_PORT')
    smtp_username: str = Field(default='', alias='SMTP_USERNAME')
    smtp_password: str = Field(default='', alias='SMTP_PASSWORD')
    smtp_use_tls: bool = Field(default=True, alias='SMTP_USE_TLS')
    smtp_from_email: str = Field(default='noreply@afruheritage.com', alias='SMTP_FROM_EMAIL')
    smtp_from_name: str = Field(default='Afruheritage', alias='SMTP_FROM_NAME')

    fleetbase_cli_package: str = Field(default='@fleetbase/cli', alias='FLEETBASE_CLI_PACKAGE')
    fleetbase_install_environment: str = Field(default='production', alias='FLEETBASE_INSTALL_ENVIRONMENT')
    fleetbase_default_install_host: str = Field(default='0.0.0.0', alias='FLEETBASE_DEFAULT_INSTALL_HOST')
    provisioning_timeout_seconds: int = Field(default=3600, alias='PROVISIONING_TIMEOUT_SECONDS')
    
    # Rate limiting
    enable_rate_limiting: bool = Field(default=True, alias='ENABLE_RATE_LIMITING')
    rate_limit_storage_uri: str = Field(default='redis://localhost:6379', alias='RATE_LIMIT_STORAGE_URI')
    
    # Structured logging
    log_format: str = Field(default='json', alias='LOG_FORMAT')  # json or console
    log_level: str = Field(default='INFO', alias='LOG_LEVEL')
    enable_request_logging: bool = Field(default=True, alias='ENABLE_REQUEST_LOGGING')


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
