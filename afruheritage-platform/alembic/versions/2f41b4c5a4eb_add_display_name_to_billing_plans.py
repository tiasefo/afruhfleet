"""add_display_name_to_billing_plans

Revision ID: 2f41b4c5a4eb
Revises: 20260725_03
Create Date: 2026-08-12 03:43:01.737701

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f41b4c5a4eb'
down_revision: Union[str, Sequence[str], None] = '20260725_03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check if column already exists (baseline create_all may have created it
    # from the ORM model which includes display_name).
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='billing_plans' AND column_name='display_name'"
    ))
    if result.fetchone() is None:
        op.add_column('billing_plans', sa.Column('display_name', sa.String(120), nullable=False, server_default=''))
    op.execute("UPDATE billing_plans SET display_name = name WHERE display_name = ''")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('billing_plans', 'display_name')
