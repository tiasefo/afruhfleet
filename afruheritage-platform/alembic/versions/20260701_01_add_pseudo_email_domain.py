"""add pseudo_email_domain to tenant_branding

Revision ID: 20260701_01
Revises: 20260601_03
Create Date: 2026-07-01

Adds a non-null VARCHAR column `pseudo_email_domain` to the tenant_branding
table with a default of 'phone.afruheritage.com'. This allows each tenant to
configure the domain suffix used when generating pseudo-emails for members
imported via CSV who have a phone number but no email address.
"""
from alembic import op
import sqlalchemy as sa

revision = "20260701_01"
down_revision = "20260601_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tenant_branding",
        sa.Column(
            "pseudo_email_domain",
            sa.String(255),
            nullable=False,
            server_default="phone.afruheritage.com",
        ),
    )


def downgrade() -> None:
    op.drop_column("tenant_branding", "pseudo_email_domain")
