"""add trial_ends_at and current_period_end to tenant_subscriptions

Revision ID: 20260707_01
Revises: 20260706_01
Create Date: 2026-07-07

Adds trial_ends_at and current_period_end to tenant_subscriptions so
that trial expiry can be tracked and a Celery task can auto-downgrade
expired trials to the Starter tier.
"""
from alembic import op
import sqlalchemy as sa

revision = "20260707_01"
down_revision = "20260706_01"


def upgrade() -> None:
    conn = op.get_bind()
    existing = {
        row[0]
        for row in conn.execute(
            sa.text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'tenant_subscriptions'"
            )
        )
    }
    if "trial_ends_at" not in existing:
        op.add_column(
            "tenant_subscriptions",
            sa.Column("trial_ends_at", sa.DateTime, nullable=True),
        )
    if "current_period_end" not in existing:
        op.add_column(
            "tenant_subscriptions",
            sa.Column("current_period_end", sa.DateTime, nullable=True),
        )


def downgrade() -> None:
    op.drop_column("tenant_subscriptions", "current_period_end")
    op.drop_column("tenant_subscriptions", "trial_ends_at")
