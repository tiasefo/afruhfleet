"""add marketplace installation tables

Revision ID: 20260725_01
Revises: 20260707_04
Create Date: 2026-07-25

Creates tenant_template_installations and tenant_plugin_installations
tables to support the marketplace lifecycle model.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260725_01"
down_revision = "20260707_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenant_template_installations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False, index=True),
        sa.Column("template_code", sa.String(80), nullable=False, index=True),
        sa.Column("template_version", sa.String(20), nullable=False, server_default="1.0.0"),
        sa.Column("previous_template_code", sa.String(80), nullable=True),
        sa.Column("previous_template_version", sa.String(20), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("requested_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("configuration_before", sa.JSON(), nullable=True),
        sa.Column("configuration_after", sa.JSON(), nullable=True),
        sa.Column("required_plugins", sa.JSON(), nullable=True),
        sa.Column("rollback_data", sa.JSON(), nullable=True),
        sa.Column("correlation_id", sa.String(80), nullable=True, index=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "tenant_plugin_installations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False, index=True),
        sa.Column("plugin_code", sa.String(80), nullable=False, index=True),
        sa.Column("plugin_version", sa.String(20), nullable=False, server_default="1.0.0"),
        sa.Column("status", sa.String(30), nullable=False, server_default="available"),
        sa.Column("configuration", sa.JSON(), nullable=True),
        sa.Column("installed_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("installed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("enabled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("disabled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("uninstalled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("health_status", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("tenant_plugin_installations")
    op.drop_table("tenant_template_installations")
