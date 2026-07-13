"""add platform_settings and plan_tier_configs tables

Revision ID: 20260707_03
Revises: 20260707_02
Create Date: 2026-07-07

Creates platform_settings (single-row, admin-editable global config) and
plan_tier_configs (per-tier pricing/feature config). Seeds with current
real values so the switchover doesn't reset anyone's trial length or pricing.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import json

revision = "20260707_03"
down_revision = "20260707_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "platform_settings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("default_trial_days", sa.Integer(), nullable=False, server_default="14"),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )

    op.create_table(
        "plan_tier_configs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tier_code", sa.String(50), unique=True, nullable=False),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("price_monthly", sa.Integer(), nullable=False),
        sa.Column("max_group_members", sa.Integer(), nullable=False),
        sa.Column("features_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.execute("INSERT INTO platform_settings (default_trial_days) VALUES (14)")

    tiers = [
        ("free_trial", "Free Trial", 0, 100, json.dumps([
            "tracking", "csv_import", "maps", "group_members",
            "fleetbase_full", "ai_basic", "ai_advanced",
            "custom_domain_preview", "shipping_estimator",
            "storage_fees", "bus_fleet",
            "marketplace_basic", "marketplace_gps", "whatsapp_channel",
        ])),
        ("starter", "Starter", 1000, 1000, json.dumps([
            "tracking", "csv_import", "maps", "group_members",
            "whatsapp_channel",
        ])),
        ("pro", "Professional", 3000, 5000, json.dumps([
            "tracking", "csv_import", "maps", "group_members",
            "whatsapp_channel", "ai_basic", "custom_domain",
            "shipping_estimator", "marketplace_basic",
        ])),
        ("enterprise", "Enterprise", 10000, 10000, json.dumps([
            "tracking", "csv_import", "maps", "group_members",
            "whatsapp_channel", "ai_basic", "ai_advanced", "custom_domain",
            "shipping_estimator", "marketplace_basic", "marketplace_gps",
            "bus_fleet", "storage_fees", "priority_support",
        ])),
    ]

    for tier_code, display_name, price, max_members, features in tiers:
        op.execute(
            sa.text(
                "INSERT INTO plan_tier_configs (tier_code, display_name, price_monthly, max_group_members, features_json, is_active) "
                "VALUES (:tier_code, :display_name, :price_monthly, :max_group_members, :features_json, true)"
            ).bindparams(
                tier_code=tier_code,
                display_name=display_name,
                price_monthly=price,
                max_group_members=max_members,
                features_json=features,
            )
        )


def downgrade() -> None:
    op.drop_table("plan_tier_configs")
    op.drop_table("platform_settings")
