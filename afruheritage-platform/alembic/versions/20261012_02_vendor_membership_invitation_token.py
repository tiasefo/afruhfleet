"""add invitation token columns to vendor_memberships (Gate A-2)

Revision ID: 20261012_02
Revises: 20261012_01
Create Date: 2026-10-12

Single-use, expiring, membership-bound invitation tokens: the token lives
on the membership row so it can only ever activate that one membership,
and clearing it on accept makes replay impossible.
"""
from alembic import op
import sqlalchemy as sa

revision = '20261012_02'
down_revision = '20261012_01'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vendor_memberships", sa.Column("invitation_token", sa.String(255), nullable=True))
    op.add_column("vendor_memberships", sa.Column("invitation_expires_at", sa.DateTime(), nullable=True))
    op.create_index("ix_vendor_memberships_invitation_token", "vendor_memberships", ["invitation_token"])


def downgrade() -> None:
    op.drop_index("ix_vendor_memberships_invitation_token", table_name="vendor_memberships")
    op.drop_column("vendor_memberships", "invitation_expires_at")
    op.drop_column("vendor_memberships", "invitation_token")
