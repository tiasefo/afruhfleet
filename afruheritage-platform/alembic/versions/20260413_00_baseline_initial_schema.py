"""baseline initial schema

Revision ID: 20260413_00
Revises:
Create Date: 2026-04-13

Creates the foundational tables and constraints required by the earliest
historical migrations (20260414_01 and onward). This baseline is derived
from the current SQLAlchemy models and is safe to run on an existing database
because it uses SQLAlchemy's create_all with checkfirst=True.
"""

from alembic import op

revision = "20260413_00"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    from app.db.session import Base

    # Import the model modules required for the foundational schema.
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
    import app.models.kyc  # noqa: F401
    import app.models.marketplace  # noqa: F401
    import app.models.storefront_template  # noqa: F401
    import app.models.saas_subscription  # noqa: F401

    # These tables are created by later explicit Alembic migrations.
    # The baseline only creates the foundational tables that those
    # migrations alter or reference.
    tables_created_by_later_migrations = {
        "capabilities",
        "plan_tier_configs",
        "platform_alert_settings",
        "platform_settings",
        "plugin_capabilities",
        "plugins",
        "provisioning_alerts",
        "template_capabilities",
        "tenant_plugin_installations",
        "tenant_template_installations",
    }
    tables_to_create = [
        t for t in Base.metadata.sorted_tables if t.name not in tables_created_by_later_migrations
    ]

    Base.metadata.create_all(op.get_bind(), tables=tables_to_create, checkfirst=True)


def downgrade() -> None:
    import app.models  # noqa: F401
    from app.db.session import Base

    Base.metadata.drop_all(op.get_bind(), checkfirst=True)
