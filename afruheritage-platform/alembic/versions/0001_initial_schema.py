"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-19 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(320), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # --- runner_nodes ---
    op.create_table(
        'runner_nodes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('host', sa.String(255), nullable=False),
        sa.Column('ssh_port', sa.Integer(), nullable=False, server_default='22'),
        sa.Column('ssh_user', sa.String(120), nullable=False),
        sa.Column('fleetbase_root', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('reserved_for_single_tenant', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('host'),
    )
    op.create_index('ix_runner_nodes_name', 'runner_nodes', ['name'], unique=True)

    # --- tenants ---
    op.create_table(
        'tenants',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(120), nullable=False),
        sa.Column('contact_email', sa.String(320), nullable=False),
        sa.Column('plan_code', sa.String(80), nullable=False),
        sa.Column('requested_domain', sa.String(255), nullable=False),
        sa.Column(
            'domain_type',
            sa.Enum('provider_subdomain', 'customer_domain', name='domaintype'),
            nullable=False,
        ),
        sa.Column(
            'launch_status',
            sa.Enum(
                'draft', 'pending_verification', 'approved', 'queued',
                'provisioning', 'active', 'failed', 'suspended',
                name='launchstatus',
            ),
            nullable=False,
        ),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('runner_id', sa.UUID(), sa.ForeignKey('runner_nodes.id'), nullable=True),
        sa.Column('live_console_url', sa.String(255), nullable=True),
        sa.Column('live_api_url', sa.String(255), nullable=True),
        sa.Column('fleetbase_install_path', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_name'),
        sa.UniqueConstraint('contact_email'),
        sa.UniqueConstraint('requested_domain'),
    )
    op.create_index('ix_tenants_slug', 'tenants', ['slug'], unique=True)
    op.create_index('ix_tenants_contact_email', 'tenants', ['contact_email'], unique=True)

    # --- provisioning_jobs ---
    op.create_table(
        'provisioning_jobs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column(
            'status',
            sa.Enum(
                'draft', 'pending_verification', 'approved', 'queued',
                'provisioning', 'active', 'failed', 'suspended',
                name='launchstatus',
            ),
            nullable=False,
        ),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('task_id', sa.String(255), nullable=True),
        sa.Column('current_step', sa.String(120), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('log_excerpt', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_provisioning_jobs_tenant_id', 'provisioning_jobs', ['tenant_id'])

    # --- audit_events ---
    op.create_table(
        'audit_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('actor_email', sa.String(320), nullable=False),
        sa.Column('event_type', sa.String(120), nullable=False),
        sa.Column('entity_type', sa.String(120), nullable=False),
        sa.Column('entity_id', sa.String(120), nullable=False),
        sa.Column('details_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_events_event_type', 'audit_events', ['event_type'])


def downgrade() -> None:
    op.drop_table('audit_events')
    op.drop_index('ix_provisioning_jobs_tenant_id', table_name='provisioning_jobs')
    op.drop_table('provisioning_jobs')
    op.drop_index('ix_tenants_contact_email', table_name='tenants')
    op.drop_index('ix_tenants_slug', table_name='tenants')
    op.drop_table('tenants')
    op.drop_index('ix_runner_nodes_name', table_name='runner_nodes')
    op.drop_table('runner_nodes')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    # Drop enum types (PostgreSQL specific)
    op.execute('DROP TYPE IF EXISTS launchstatus')
    op.execute('DROP TYPE IF EXISTS domaintype')
