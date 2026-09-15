"""add queried value to kycstatus enum

Revision ID: 20260830_02
Revises: 20260830_01
Create Date: 2026-08-30

Adds the 'queried' value to the kycstatus enum type, which is defined in the
ORM model (app/models/kyc.py:KYCStatus.queried) but was missing from the
deployed database enum. The 'queried' status represents an admin requesting
more information during KYC review.
"""
from alembic import op

revision = '20260830_02'
down_revision = '20260830_01'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE kycstatus ADD VALUE IF NOT EXISTS 'queried'")


def downgrade() -> None:
    # PostgreSQL does not support removing individual enum values.
    # To downgrade, the enum type would need to be recreated without 'queried'.
    op.execute(
        """
        CREATE TYPE kycstatus_old AS ENUM ('not_started', 'pending', 'approved', 'rejected', 'failed');
        ALTER TABLE kyc_submissions ALTER COLUMN status TYPE kycstatus_old USING status::text::kycstatus_old;
        DROP TYPE kycstatus;
        ALTER TYPE kycstatus_old RENAME TO kycstatus;
        """
    )
