"""add missing columns to custom_domains

Revision ID: 20260706_01
Revises: 20260701_01
Create Date: 2026-07-06

Adds redirect_to, redirect_status, auto_renew, expires_at, renewed_at
to the custom_domains table. These columns were present in the SQLAlchemy
model but missing from the database, causing 500 errors on all queries.
"""
from alembic import op
import sqlalchemy as sa

revision = "20260706_01"
down_revision = "20260701_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    existing = {row[0] for row in conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name = 'custom_domains'"))}
    if "redirect_to" not in existing:
        op.add_column("custom_domains", sa.Column("redirect_to", sa.String(255), nullable=True))
    if "redirect_status" not in existing:
        op.add_column("custom_domains", sa.Column("redirect_status", sa.Integer, server_default="301"))
    if "auto_renew" not in existing:
        op.add_column("custom_domains", sa.Column("auto_renew", sa.Boolean, nullable=False, server_default=sa.text("true")))
    if "expires_at" not in existing:
        op.add_column("custom_domains", sa.Column("expires_at", sa.DateTime, nullable=True))
    if "renewed_at" not in existing:
        op.add_column("custom_domains", sa.Column("renewed_at", sa.DateTime, nullable=True))


def downgrade() -> None:
    op.drop_column("custom_domains", "renewed_at")
    op.drop_column("custom_domains", "expires_at")
    op.drop_column("custom_domains", "auto_renew")
    op.drop_column("custom_domains", "redirect_status")
    op.drop_column("custom_domains", "redirect_to")
