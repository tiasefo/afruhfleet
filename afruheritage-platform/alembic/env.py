import os
from logging.config import fileConfig

from sqlalchemy import create_engine, pool

from alembic import context

# Load app models so autogenerate can detect them
import app.models  # noqa: F401
from app.db.session import Base

# Alembic Config object
config = context.config

# Set up loggers from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata


def _get_url() -> str:
    """Resolve database URL from environment, falling back to alembic.ini."""
    url = os.environ.get('DATABASE_URL')
    if url:
        return url
    url = config.get_main_option('sqlalchemy.url')
    if not url:
        raise RuntimeError(
            'No database URL found. Set DATABASE_URL env var or sqlalchemy.url in alembic.ini'
        )
    return url


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection (generates SQL)."""
    context.configure(
        url=_get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={'paramstyle': 'named'},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB connection."""
    connectable = create_engine(_get_url(), poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
