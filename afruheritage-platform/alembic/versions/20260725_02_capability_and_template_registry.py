"""add capability registry and template registry columns

Revision ID: 20260725_02
Revises: 20260725_01
Create Date: 2026-07-25

Adds the capabilities table and the template_capabilities association table,
then extends storefront_templates with lifecycle and registry fields required
by the Template Registry.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260725_02"
down_revision = "20260725_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Capability registry ---
    op.create_table(
        "capabilities",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("code", sa.String(80), nullable=False, unique=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(80), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_capabilities_code", "capabilities", ["code"], unique=True)

    op.create_table(
        "template_capabilities",
        sa.Column(
            "template_id",
            UUID(as_uuid=True),
            sa.ForeignKey("storefront_templates.id"),
            primary_key=True,
        ),
        sa.Column(
            "capability_id",
            UUID(as_uuid=True),
            sa.ForeignKey("capabilities.id"),
            primary_key=True,
        ),
        sa.Column(
            "relationship",
            sa.String(20),
            nullable=False,
        ),
    )

    # --- Template registry columns ---
    conn = op.get_bind()
    existing_sf = {row[0] for row in conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name = 'storefront_templates'"))}
    if "status" not in existing_sf:
        op.add_column(
            "storefront_templates",
            sa.Column("status", sa.String(30), nullable=True),
        )
    if "version" not in existing_sf:
        op.add_column(
            "storefront_templates",
            sa.Column("version", sa.String(20), nullable=True),
        )
    if "renderer_key" not in existing_sf:
        op.add_column(
            "storefront_templates",
            sa.Column("renderer_key", sa.String(80), nullable=True),
        )
    if "minimum_platform_version" not in existing_sf:
        op.add_column(
            "storefront_templates",
            sa.Column("minimum_platform_version", sa.String(20), nullable=True),
        )

    # Backfill existing templates so the new NOT NULL columns have values.
    op.execute(
        """
        UPDATE storefront_templates
        SET status = 'production_ready',
            version = '1.0.0',
            renderer_key = template_code
        """
    )

    # Enforce NOT NULL for the lifecycle fields.
    op.alter_column("storefront_templates", "status", nullable=False)
    op.alter_column("storefront_templates", "version", nullable=False)


def downgrade() -> None:
    op.drop_column("storefront_templates", "minimum_platform_version")
    op.drop_column("storefront_templates", "renderer_key")
    op.drop_column("storefront_templates", "version")
    op.drop_column("storefront_templates", "status")
    op.drop_table("template_capabilities")
    op.drop_table("capabilities")
