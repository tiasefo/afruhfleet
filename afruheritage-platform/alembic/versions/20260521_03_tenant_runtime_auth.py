"""Add tenant runtime auth fields

Revision ID: 20260521_03
Revises: 20260521_02
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260521_03"
down_revision = "20260521_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    existing = {row[0] for row in conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants'"))}
    if "live_api_token" not in existing:
        op.add_column("tenants", sa.Column("live_api_token", sa.Text(), nullable=True))
    if "live_api_auth_scheme" not in existing:
        op.add_column("tenants", sa.Column("live_api_auth_scheme", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("tenants", "live_api_auth_scheme")
    op.drop_column("tenants", "live_api_token")