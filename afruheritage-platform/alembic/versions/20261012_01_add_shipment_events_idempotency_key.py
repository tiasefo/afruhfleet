"""add idempotency_key to shipment_events for concurrency-safe dedup

Revision ID: 20261012_01
Revises: 20260830_02
Create Date: 2026-10-12

Adds a nullable idempotency_key column plus a partial unique index on
(shipment_id, idempotency_key). Rows without a key (legacy events, internal
events that opt out) are exempt — NULLs never collide in a unique index.
"""
from alembic import op
import sqlalchemy as sa

revision = '20261012_01'
down_revision = '20260830_02'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('shipment_events', sa.Column('idempotency_key', sa.String(255), nullable=True))
    op.execute(
        "CREATE UNIQUE INDEX uq_shipment_events_idem_key "
        "ON shipment_events (shipment_id, idempotency_key) "
        "WHERE idempotency_key IS NOT NULL"
    )


def downgrade() -> None:
    op.drop_index('uq_shipment_events_idem_key', table_name='shipment_events')
    op.drop_column('shipment_events', 'idempotency_key')
