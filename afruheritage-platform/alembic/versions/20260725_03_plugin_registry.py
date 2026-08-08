"""add plugin catalog and capability mapping

Revision ID: 20260725_03
Revises: 20260725_02
Create Date: 2026-07-25

Adds the plugins catalog table and the plugin_capabilities association table
so plugins can declare the capabilities they provide.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260725_03"
down_revision = "20260725_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "plugins",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("plugin_code", sa.String(80), nullable=False, unique=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("version", sa.String(20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(80), nullable=True),
        sa.Column("manifest", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_plugins_plugin_code", "plugins", ["plugin_code"], unique=True)

    op.create_table(
        "plugin_capabilities",
        sa.Column(
            "plugin_id",
            UUID(as_uuid=True),
            sa.ForeignKey("plugins.id"),
            primary_key=True,
        ),
        sa.Column(
            "capability_id",
            UUID(as_uuid=True),
            sa.ForeignKey("capabilities.id"),
            primary_key=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("plugin_capabilities")
    op.drop_table("plugins")
