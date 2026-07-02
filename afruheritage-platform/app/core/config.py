from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_ignore_empty=True,
        extra='ignore', populate_by_name=True,
    )

    # Core app settings
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

    # Whitelabeled Fleet Engine fields
    runner_default_fleetbase_root: str = Field(alias='RUNNER_DEFAULT_FLEET_ENGINE_ROOT')
    runner_default_ssh_port: int = Field(default=22, alias='RUNNER_DEFAULT_SSH_PORT')
    runner_default_ssh_user: str = Field(alias='RUNNER_DEFAULT_SSH_USER')
    runner_default_ssh_key_path: str = Field(alias='RUNNER_DEFAULT_SSH_KEY_PATH')

    # Mapbox
    mapbox_access_token: str = Field(default='', alias='MAPBOX_ACCESS_TOKEN')

    # Google Maps
    google_maps_api_key: str = Field(default='', alias='GOOGLE_MAPS_API_KEY')

    # Geo provider settings
    geo_provider: str = Field(default='auto', alias='GEO_PROVIDER')  # auto, google, mapbox, nominatim
    geo_timeout_seconds: int = Field(default=10, alias='GEO_TIMEOUT_SECONDS')
    geo_cache_enabled: bool = Field(default=True, alias='GEO_CACHE_ENABLED')

    # Shipment GPS tracking
    tracking_max_stale_minutes: int = Field(default=30, alias='TRACKING_MAX_STALE_MINUTES')
    tracking_stale_timeout_minutes: int = Field(default=30, alias='TRACKING_STALE_TIMEOUT_MINUTES')
    tracking_stale_check_interval_minutes: int = Field(default=5, alias='TRACKING_STALE_CHECK_INTERVAL_MINUTES')
    booking_offer_ttl_minutes: int = Field(default=5, alias='BOOKING_OFFER_TTL_MINUTES')
    booking_reassignment_check_interval_minutes: int = Field(default=1, alias='BOOKING_REASSIGNMENT_CHECK_INTERVAL_MINUTES')

    # Storage
    s3_bucket: str = Field(default='', alias='S3_BUCKET')
    s3_region: str = Field(default='us-east-1', alias='S3_REGION')
    s3_endpoint_url: str = Field(default='', alias='S3_ENDPOINT_URL')
    local_storage_dir: str = Field(default='/srv/afruheritage/storage', alias='LOCAL_STORAGE_DIR')

    # SMTP
    smtp_host: str = Field(default='', alias='SMTP_HOST')
    smtp_port: int = Field(default=587, alias='SMTP_PORT')
    smtp_username: str = Field(default='', alias='SMTP_USERNAME')
    smtp_password: str = Field(default='', alias='SMTP_PASSWORD')
    smtp_use_tls: bool = Field(default=True, alias='SMTP_USE_TLS')
    smtp_from_email: str = Field(default='noreply@afruheritage.com', alias='SMTP_FROM_EMAIL')
    smtp_from_name: str = Field(default='Afruheritage', alias='SMTP_FROM_NAME')

    # Fleet Engine CLI + provisioning
    fleetbase_cli_package: str = Field(default='@fleetbase/cli', alias='FLEET_ENGINE_CLI_PACKAGE')
    fleetbase_install_environment: str = Field(default='production', alias='FLEET_ENGINE_INSTALL_ENVIRONMENT')
    fleetbase_default_install_host: str = Field(default='0.0.0.0', alias='FLEET_ENGINE_DEFAULT_INSTALL_HOST')
    provisioning_timeout_seconds: int = Field(default=3600, alias='PROVISIONING_TIMEOUT_SECONDS')
    fleetbase_runtime_api_token: str = Field(default='', alias='FLEETBASE_RUNTIME_API_TOKEN')
    fleetbase_api_token: str = Field(default='', alias='FLEETBASE_API_TOKEN')

    # Fleetbase internal API URL (reachable from inside this container)
    # When both stacks are on the same host, use the host-gateway or exposed port.
    fleetbase_internal_url: str = Field(default='http://fleetbase-httpd-1', alias='FLEETBASE_INTERNAL_URL')
    fleetbase_console_url: str = Field(default='https://fleet.afruheritage.com', alias='FLEETBASE_CONSOLE_URL')

    # Fleetbase provisioning retry/backoff
    fleetbase_provisioning_retries: int = Field(default=3, alias='FLEETBASE_PROVISIONING_RETRIES')
    fleetbase_provisioning_backoff_seconds: int = Field(default=2, alias='FLEETBASE_PROVISIONING_BACKOFF_SECONDS')

    # Rate limiting
    enable_rate_limiting: bool = Field(default=True, alias='ENABLE_RATE_LIMITING')
    rate_limit_storage_uri: str = Field(default='redis://localhost:6379', alias='RATE_LIMIT_STORAGE_URI')

    # Structured logging
    log_format: str = Field(default='json', alias='LOG_FORMAT')  # json or console
    log_level: str = Field(default='INFO', alias='LOG_LEVEL')
    enable_request_logging: bool = Field(default=True, alias='ENABLE_REQUEST_LOGGING')

    # WhatsApp Business API
    whatsapp_access_token: str = Field(default='', alias='WHATSAPP_ACCESS_TOKEN')
    whatsapp_phone_number_id: str = Field(default='', alias='WHATSAPP_PHONE_NUMBER_ID')

    # Public base URL
    base_url: str = Field(default='http://localhost:8100', alias='BASE_URL')

    # Payments
    paystack_public_key: str = Field(default='', alias='PAYSTACK_PUBLIC_KEY')
    paystack_secret_key: str = Field(default='', alias='PAYSTACK_SECRET_KEY')
    paystack_webhook_secret: str = Field(default='', alias='PAYSTACK_WEBHOOK_SECRET')
    payment_webhook_url: str = Field(default='', alias='PAYMENT_WEBHOOK_URL')
    payment_webhook_secret: str = Field(default='', alias='PAYMENT_WEBHOOK_SECRET')
    zuri_payment_webhook_secret: str = Field(default='', alias='ZURI_PAYMENT_WEBHOOK_SECRET')
    webhook_shared_secret: str = Field(default='', alias='WEBHOOK_SHARED_SECRET')

    # PayPal
    paypal_client_id: str = Field(default='', alias='PAYPAL_CLIENT_ID')
    paypal_client_secret: str = Field(default='', alias='PAYPAL_CLIENT_SECRET')
    paypal_webhook_id: str = Field(default='', alias='PAYPAL_WEBHOOK_ID')
    paypal_base_url: str = Field(default='https://api-m.sandbox.paypal.com', alias='PAYPAL_BASE_URL')

    # China payments
    alipay_app_id: str = Field(default='', alias='ALIPAY_APP_ID')
    alipay_private_key: str = Field(default='', alias='ALIPAY_PRIVATE_KEY')
    alipay_public_key: str = Field(default='', alias='ALIPAY_PUBLIC_KEY')
    wechat_app_id: str = Field(default='', alias='WECHAT_APP_ID')
    wechat_mch_id: str = Field(default='', alias='WECHAT_MCH_ID')
    wechat_api_key: str = Field(default='', alias='WECHAT_API_KEY')

    # Support ticketing / GLPI
    glpi_api_url: str = Field(default='', alias='GLPI_API_URL')
    glpi_base_url: str = Field(default='', alias='GLPI_BASE_URL')
    glpi_app_token: str = Field(default='', alias='GLPI_APP_TOKEN')
    glpi_user_token: str = Field(default='', alias='GLPI_USER_TOKEN')
    glpi_tenant_separation_mode: str = Field(default='shared_entities', alias='GLPI_TENANT_SEPARATION_MODE')

    # OAuth
    google_client_id: str = Field(default='', alias='GOOGLE_CLIENT_ID')
    google_client_secret: str = Field(default='', alias='GOOGLE_CLIENT_SECRET')
    google_redirect_uri: str = Field(default='', alias='GOOGLE_REDIRECT_URI')
    instagram_client_id: str = Field(default='', alias='INSTAGRAM_CLIENT_ID')
    instagram_client_secret: str = Field(default='', alias='INSTAGRAM_CLIENT_SECRET')
    instagram_redirect_uri: str = Field(default='', alias='INSTAGRAM_REDIRECT_URI')
    facebook_client_id: str = Field(default='', alias='FACEBOOK_CLIENT_ID')
    facebook_client_secret: str = Field(default='', alias='FACEBOOK_CLIENT_SECRET')
    facebook_redirect_uri: str = Field(default='', alias='FACEBOOK_REDIRECT_URI')
    tiktok_client_id: str = Field(default='', alias='TIKTOK_CLIENT_ID')
    tiktok_client_secret: str = Field(default='', alias='TIKTOK_CLIENT_SECRET')
    tiktok_redirect_uri: str = Field(default='', alias='TIKTOK_REDIRECT_URI')
    apple_client_id: str = Field(default='', alias='APPLE_CLIENT_ID')
    apple_team_id: str = Field(default='', alias='APPLE_TEAM_ID')
    apple_key_id: str = Field(default='', alias='APPLE_KEY_ID')
    apple_private_key: str = Field(default='', alias='APPLE_PRIVATE_KEY')
    apple_redirect_uri: str = Field(default='', alias='APPLE_REDIRECT_URI')


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
