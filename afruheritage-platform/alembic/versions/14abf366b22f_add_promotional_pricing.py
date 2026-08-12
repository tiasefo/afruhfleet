"""add_promotional_pricing

Revision ID: 14abf366b22f
Revises: 2f41b4c5a4eb
Create Date: 2026-08-12 03:49:10.696399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14abf366b22f'
down_revision: Union[str, Sequence[str], None] = '2f41b4c5a4eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'billing_promotions',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('promotion_type', sa.Enum('PERCENTAGE', 'FIXED_AMOUNT', name='promotiontype'), nullable=False),
        sa.Column('value', sa.Numeric(18, 2), nullable=False),
        sa.Column('applicable_plan_codes', sa.String(500), nullable=False, server_default='all'),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'))
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('billing_promotions')
