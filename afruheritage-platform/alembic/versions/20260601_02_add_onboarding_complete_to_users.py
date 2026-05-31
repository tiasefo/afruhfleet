"""add_onboarding_complete_to_users

Revision ID: 20260601_02
Revises: 20260601_01
Create Date: 2026-06-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '20260601_02'
down_revision: Union[str, Sequence[str], None] = '20260601_01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'onboarding_complete',
            sa.Boolean(),
            nullable=False,
            server_default='false',
        ),
    )
    # Existing users who already have a tenant_id are considered onboarded
    op.execute(
        "UPDATE users SET onboarding_complete = true WHERE tenant_id IS NOT NULL OR is_superuser = true"
    )


def downgrade() -> None:
    op.drop_column('users', 'onboarding_complete')
