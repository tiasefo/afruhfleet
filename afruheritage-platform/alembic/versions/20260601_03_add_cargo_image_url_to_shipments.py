"""add cargo_image_url to shipments

Revision ID: 20260601_03
Revises: 20260601_02
Create Date: 2026-06-01

Adds a nullable TEXT column `cargo_image_url` to the shipments table so that
freight forwarders can attach a photo of the cargo when creating a shipment.
The image is displayed on the bidding dashboard so prospective bidders can
see what they are quoting on.
"""
from alembic import op
import sqlalchemy as sa

revision = "20260601_03"
down_revision = "20260601_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "shipments",
        sa.Column("cargo_image_url", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("shipments", "cargo_image_url")
