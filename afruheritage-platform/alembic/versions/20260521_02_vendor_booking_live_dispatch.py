"""Add live dispatch fields to vendor bookings

Revision ID: 20260521_02
Revises: 20260521_01
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260521_02"
down_revision = "20260521_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vendor_service_bookings", sa.Column("driver_name", sa.String(length=255), nullable=True))
    op.add_column("vendor_service_bookings", sa.Column("driver_phone", sa.String(length=50), nullable=True))
    op.add_column("vendor_service_bookings", sa.Column("current_location", sa.String(length=255), nullable=True))
    op.add_column("vendor_service_bookings", sa.Column("current_latitude", sa.Numeric(10, 7), nullable=True))
    op.add_column("vendor_service_bookings", sa.Column("current_longitude", sa.Numeric(10, 7), nullable=True))
    op.add_column("vendor_service_bookings", sa.Column("last_location_at", sa.DateTime(), nullable=True))
    op.add_column("vendor_service_bookings", sa.Column("live_tracking_provider", sa.String(length=50), nullable=True))
    op.add_column("vendor_service_bookings", sa.Column("started_at", sa.DateTime(), nullable=True))
    op.add_column("vendor_service_bookings", sa.Column("canceled_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("vendor_service_bookings", "canceled_at")
    op.drop_column("vendor_service_bookings", "started_at")
    op.drop_column("vendor_service_bookings", "live_tracking_provider")
    op.drop_column("vendor_service_bookings", "last_location_at")
    op.drop_column("vendor_service_bookings", "current_longitude")
    op.drop_column("vendor_service_bookings", "current_latitude")
    op.drop_column("vendor_service_bookings", "current_location")
    op.drop_column("vendor_service_bookings", "driver_phone")
    op.drop_column("vendor_service_bookings", "driver_name")
