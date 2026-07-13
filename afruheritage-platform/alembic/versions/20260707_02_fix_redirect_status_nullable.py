"""fix redirect_status nullable in custom_domains

Revision ID: 20260707_02
Revises: 20260707_01
Create Date: 2026-07-07
"""
from alembic import op
import sqlalchemy as sa

revision = "20260707_02"
down_revision = "20260707_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "custom_domains",
        "redirect_status",
        existing_type=sa.Integer(),
        nullable=False,
        server_default="301",
    )


def downgrade() -> None:
    op.alter_column(
        "custom_domains",
        "redirect_status",
        existing_type=sa.Integer(),
        nullable=True,
        server_default=None,
    )
