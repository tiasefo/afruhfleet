"""Add user tenant ownership fields

Revision ID: 20260414_01
Revises:
Create Date: 2026-04-14
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260414_01"
down_revision = "20260413_00"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;")
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_tenant_admin BOOLEAN NOT NULL DEFAULT false;"
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_tenant_id ON users (tenant_id);")
    op.execute(
        """
        DO $$ BEGIN
            ALTER TABLE users
            ADD CONSTRAINT fk_users_tenant_id_tenants
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_tenant_id_tenants", "users", type_="foreignkey")
    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_column("users", "is_tenant_admin")
    op.drop_column("users", "tenant_id")
