"""add provisioning_alerts and platform_alert_settings tables

Revision ID: 20260707_04
Revises: 20260707_03
Create Date: 2026-07-08

Creates provisioning_alerts (records provisioning failures per tenant,
visible in Sentinel) and platform_alert_settings (single-row table for
configuring alert email recipients).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260707_04"
down_revision = "20260707_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "provisioning_alerts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False, index=True),
        sa.Column("failure_reason", sa.Text(), nullable=False),
        sa.Column("stage", sa.String(50), nullable=False),
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "platform_alert_settings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("provisioning_failure_emails", sa.Text(), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("platform_alert_settings")
    op.drop_table("provisioning_alerts")
