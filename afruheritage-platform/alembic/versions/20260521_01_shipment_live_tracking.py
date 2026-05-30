"""Add shipment live tracking fields

Revision ID: 20260521_01
Revises: 20260414_01
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260521_01"
down_revision = "20260414_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("shipments", sa.Column("current_location", sa.String(length=255), nullable=True))
    op.add_column("shipments", sa.Column("current_latitude", sa.Numeric(10, 7), nullable=True))
    op.add_column("shipments", sa.Column("current_longitude", sa.Numeric(10, 7), nullable=True))
    op.add_column("shipments", sa.Column("last_location_at", sa.DateTime(), nullable=True))
    op.add_column("shipments", sa.Column("live_tracking_provider", sa.String(length=50), nullable=True))

    op.add_column("shipment_events", sa.Column("latitude", sa.Numeric(10, 7), nullable=True))
    op.add_column("shipment_events", sa.Column("longitude", sa.Numeric(10, 7), nullable=True))


def downgrade() -> None:
    op.drop_column("shipment_events", "longitude")
    op.drop_column("shipment_events", "latitude")

    op.drop_column("shipments", "live_tracking_provider")
    op.drop_column("shipments", "last_location_at")
    op.drop_column("shipments", "current_longitude")
    op.drop_column("shipments", "current_latitude")
    op.drop_column("shipments", "current_location")