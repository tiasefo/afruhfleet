"""add tenant_id to roles table

Revision ID: 20260830_01
Revises: c50625d73770
Create Date: 2026-08-30

Adds the tenant_id column to the roles table, which is defined in the ORM
model (app/models/rbac.py:Role.tenant_id) but was missing from the deployed
database schema. This column allows tenant-specific roles to be created
alongside system roles.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20260830_01'
down_revision = 'c50625d73770'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # Check if column already exists (baseline create_all may have created it
    # from the ORM model which includes tenant_id).
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='roles' AND column_name='tenant_id'"
    ))
    if result.fetchone() is None:
        op.add_column(
            'roles',
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=True),
        )
        op.create_index('ix_roles_tenant_id', 'roles', ['tenant_id'])


def downgrade() -> None:
    op.drop_index('ix_roles_tenant_id', table_name='roles')
    op.drop_column('roles', 'tenant_id')
