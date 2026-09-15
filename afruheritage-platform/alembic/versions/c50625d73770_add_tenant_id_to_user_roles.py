"""add_tenant_id_to_user_roles

Revision ID: c50625d73770
Revises: 14abf366b22f
Create Date: 2026-08-26 16:43:34.034967

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c50625d73770"
down_revision: Union[str, Sequence[str], None] = "14abf366b22f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tenant_id column to user_roles for tenant-scoped role assignments."""
    conn = op.get_bind()
    # Check if column already exists (baseline create_all may have created it).
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='user_roles' AND column_name='tenant_id'"
    ))
    if result.fetchone() is None:
        op.add_column(
            "user_roles",
            sa.Column("tenant_id", sa.UUID(as_uuid=True), nullable=True),
        )
        op.create_foreign_key(
            "user_roles_tenant_id_fkey",
            "user_roles",
            "tenants",
            ["tenant_id"],
            ["id"],
        )


def downgrade() -> None:
    """Remove tenant_id column from user_roles."""
    op.drop_constraint("user_roles_tenant_id_fkey", "user_roles", type_="foreignkey")
    op.drop_column("user_roles", "tenant_id")
