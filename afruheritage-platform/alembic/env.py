from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.config import settings
from app.db.session import Base

import app.models.tenant  # noqa: F401
import app.models.user  # noqa: F401
import app.models.runner  # noqa: F401
import app.models.audit  # noqa: F401
import app.models.billing  # noqa: F401
import app.models.custom_domains  # noqa: F401
import app.models.fleetbase_runtime  # noqa: F401
import app.models.support_crm  # noqa: F401
import app.models.tenant_ai_settings  # noqa: F401
import app.models.shipment  # noqa: F401
import app.models.tenant_branding  # noqa: F401
import app.models.vendor  # noqa: F401

config = context.config

config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
