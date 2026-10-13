from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.core.structured_logging import get_logger

logger = get_logger("afruheritage.runtime_migrations")


def run_runtime_migrations(engine: Engine) -> None:
    """Apply lightweight in-place schema upgrades needed by runtime startup."""

    inspector = inspect(engine)
    if not inspector.has_table("users") or not inspector.has_table("tenants"):
        return

    existing_columns = {col["name"] for col in inspector.get_columns("users")}
    existing_tenants_columns = {col["name"] for col in inspector.get_columns("tenants")} if inspector.has_table("tenants") else set()
    existing_group_members_columns = {col["name"] for col in inspector.get_columns("group_members")} if inspector.has_table("group_members") else set()

    dialect_name = engine.dialect.name

    with engine.begin() as conn:
        if "tenant_id" not in existing_columns:
            tenant_id_type = "UUID" if dialect_name == "postgresql" else "VARCHAR(36)"
            conn.execute(text(f"ALTER TABLE users ADD COLUMN tenant_id {tenant_id_type} NULL"))
            logger.info("runtime_migration_added_users_tenant_id")

        if "is_tenant_admin" not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_tenant_admin BOOLEAN NOT NULL DEFAULT FALSE"))
            logger.info("runtime_migration_added_users_is_tenant_admin")

        if "must_reset_password" not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN must_reset_password BOOLEAN NOT NULL DEFAULT FALSE"))
            logger.info("runtime_migration_added_users_must_reset_password")

        if "password_reset_token" not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL"))
            logger.info("runtime_migration_added_users_password_reset_token")

        if "password_reset_expires_at" not in existing_columns:
            password_reset_expires_type = "TIMESTAMPTZ" if dialect_name == "postgresql" else "DATETIME"
            conn.execute(text(f"ALTER TABLE users ADD COLUMN password_reset_expires_at {password_reset_expires_type} NULL"))
            logger.info("runtime_migration_added_users_password_reset_expires_at")

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_tenant_id ON users (tenant_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token)"))

        # Tenants whatsapp_channel_url column migration
        if "whatsapp_channel_url" not in existing_tenants_columns:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN whatsapp_channel_url VARCHAR(500) NULL"))
            logger.info("runtime_migration_added_tenants_whatsapp_channel_url")

        # Group members table migrations
        if inspector.has_table("group_members"):
            existing_group_members_columns = [c['name'] for c in inspector.get_columns("group_members")]
            
            # Fix is_tenant_admin based on GroupMember role for existing users
            if "user_id" in existing_group_members_columns and "role" in existing_group_members_columns:
                # Update users.is_tenant_admin to match group_members.role
                # Users with GroupMember role 'admin' should have is_tenant_admin=True
                # Users with GroupMember role 'customer' should have is_tenant_admin=False
                # Savepoint: concurrent API workers can deadlock on this UPDATE;
                # without a nested transaction the aborted outer transaction
                # would fail every subsequent migration and crash startup.
                try:
                    with conn.begin_nested():
                        conn.execute(text("""
                            UPDATE users
                            SET is_tenant_admin = TRUE
                            WHERE id IN (
                                SELECT DISTINCT user_id
                                FROM group_members
                                WHERE role = 'admin'
                            )
                        """))
                        conn.execute(text("""
                            UPDATE users
                            SET is_tenant_admin = FALSE
                            WHERE id IN (
                                SELECT DISTINCT user_id
                                FROM group_members
                                WHERE role = 'customer'
                            )
                        """))
                    logger.info("runtime_migration_fixed_is_tenant_admin_from_group_members")
                except Exception as e:
                    logger.warning(f"runtime_migration_fix_is_tenant_admin_failed: {e}")

        # Gift cards table migration
        if not inspector.has_table("gift_cards"):
            gift_cards_id_type = "UUID" if dialect_name == "postgresql" else "VARCHAR(36)"
            expires_at_type = "TIMESTAMPTZ" if dialect_name == "postgresql" else "DATETIME"
            conn.execute(text(f"""
                CREATE TABLE gift_cards (
                    id {gift_cards_id_type} PRIMARY KEY,
                    code VARCHAR(100) UNIQUE NOT NULL,
                    credits INTEGER NOT NULL DEFAULT 0,
                    max_uses INTEGER NOT NULL DEFAULT 1,
                    remaining_uses INTEGER NOT NULL DEFAULT 1,
                    expires_at {expires_at_type} NULL,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at {expires_at_type} NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_gift_cards_code ON gift_cards (code)"))
            logger.info("runtime_migration_created_gift_cards_table")

        if dialect_name == "postgresql":
            conn.execute(
                text(
                    """
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.table_constraints
                            WHERE constraint_name = 'fk_users_tenant_id_tenants'
                              AND table_name = 'users'
                        ) THEN
                            ALTER TABLE users
                            ADD CONSTRAINT fk_users_tenant_id_tenants
                            FOREIGN KEY (tenant_id)
                            REFERENCES tenants(id)
                            ON DELETE SET NULL;
                        END IF;
                    END $$;
                    """
                )
            )

        if not inspector.has_table("shipment_tracking_points"):
            if dialect_name == "postgresql":
                conn.execute(
                    text(
                        """
                        CREATE TABLE shipment_tracking_points (
                            id UUID PRIMARY KEY,
                            shipment_id UUID NOT NULL,
                            tenant_id UUID NOT NULL,
                            latitude NUMERIC(10,7) NOT NULL,
                            longitude NUMERIC(10,7) NOT NULL,
                            speed_kph NUMERIC(7,2),
                            heading NUMERIC(6,2),
                            accuracy_m NUMERIC(7,2),
                            source VARCHAR(40) NOT NULL,
                            captured_at TIMESTAMPTZ NOT NULL,
                            received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        )
                        """
                    )
                )
            else:
                conn.execute(
                    text(
                        """
                        CREATE TABLE shipment_tracking_points (
                            id VARCHAR(36) PRIMARY KEY,
                            shipment_id VARCHAR(36) NOT NULL,
                            tenant_id VARCHAR(36) NOT NULL,
                            latitude NUMERIC(10,7) NOT NULL,
                            longitude NUMERIC(10,7) NOT NULL,
                            speed_kph NUMERIC(7,2),
                            heading NUMERIC(6,2),
                            accuracy_m NUMERIC(7,2),
                            source VARCHAR(40) NOT NULL,
                            captured_at DATETIME NOT NULL,
                            received_at DATETIME NOT NULL
                        )
                        """
                    )
                )

            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_tracking_points_tenant_shipment_captured ON shipment_tracking_points (tenant_id, shipment_id, captured_at)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_tracking_points_shipment_captured ON shipment_tracking_points (shipment_id, captured_at)"
                )
            )
            logger.info("runtime_migration_added_shipment_tracking_points")

        if inspector.has_table("delivery_vendors"):
            datetime_type = "TIMESTAMPTZ" if dialect_name == "postgresql" else "DATETIME"
            vendor_columns = {col["name"] for col in inspector.get_columns("delivery_vendors")}
            if "availability_status" not in vendor_columns:
                conn.execute(text("ALTER TABLE delivery_vendors ADD COLUMN availability_status VARCHAR(30) NOT NULL DEFAULT 'offline'"))
                logger.info("runtime_migration_added_delivery_vendors_availability_status")
            if "availability_updated_at" not in vendor_columns:
                conn.execute(text(f"ALTER TABLE delivery_vendors ADD COLUMN availability_updated_at {datetime_type} NULL"))
                logger.info("runtime_migration_added_delivery_vendors_availability_updated_at")
            if "last_known_location" not in vendor_columns:
                conn.execute(text("ALTER TABLE delivery_vendors ADD COLUMN last_known_location VARCHAR(255) NULL"))
                logger.info("runtime_migration_added_delivery_vendors_last_known_location")
            if "last_known_latitude" not in vendor_columns:
                conn.execute(text("ALTER TABLE delivery_vendors ADD COLUMN last_known_latitude NUMERIC(10,7) NULL"))
                logger.info("runtime_migration_added_delivery_vendors_last_known_latitude")
            if "last_known_longitude" not in vendor_columns:
                conn.execute(text("ALTER TABLE delivery_vendors ADD COLUMN last_known_longitude NUMERIC(10,7) NULL"))
                logger.info("runtime_migration_added_delivery_vendors_last_known_longitude")
            if "last_seen_at" not in vendor_columns:
                conn.execute(text(f"ALTER TABLE delivery_vendors ADD COLUMN last_seen_at {datetime_type} NULL"))
                logger.info("runtime_migration_added_delivery_vendors_last_seen_at")
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_delivery_vendors_availability_status ON delivery_vendors (availability_status)"))

        if inspector.has_table("vendor_service_bookings"):
            datetime_type = "TIMESTAMPTZ" if dialect_name == "postgresql" else "DATETIME"
            booking_columns = {col["name"] for col in inspector.get_columns("vendor_service_bookings")}
            if "offered_at" not in booking_columns:
                conn.execute(text(f"ALTER TABLE vendor_service_bookings ADD COLUMN offered_at {datetime_type} NULL"))
                logger.info("runtime_migration_added_vendor_service_bookings_offered_at")
            if "offer_expires_at" not in booking_columns:
                conn.execute(text(f"ALTER TABLE vendor_service_bookings ADD COLUMN offer_expires_at {datetime_type} NULL"))
                logger.info("runtime_migration_added_vendor_service_bookings_offer_expires_at")
            if "responded_at" not in booking_columns:
                conn.execute(text(f"ALTER TABLE vendor_service_bookings ADD COLUMN responded_at {datetime_type} NULL"))
                logger.info("runtime_migration_added_vendor_service_bookings_responded_at")
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_vendor_service_bookings_offer_expires_at ON vendor_service_bookings (offer_expires_at)"))

        if inspector.has_table("group_members"):
            member_columns = {col["name"] for col in inspector.get_columns("group_members")}
            if "role" not in member_columns:
                conn.execute(text("ALTER TABLE group_members ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer'"))
                logger.info("runtime_migration_added_group_members_role")

        if inspector.has_table("shipments"):
            shipment_columns = {col["name"] for col in inspector.get_columns("shipments")}
            for col_name, col_type in (
                ("driver_public_id", "VARCHAR(100)"),
                ("driver_name", "VARCHAR(255)"),
                ("vehicle_public_id", "VARCHAR(100)"),
                ("vehicle_name", "VARCHAR(255)"),
                ("receiver_email", "VARCHAR(255)"),
            ):
                if col_name not in shipment_columns:
                    conn.execute(text(f"ALTER TABLE shipments ADD COLUMN {col_name} {col_type} NULL"))
                    logger.info(f"runtime_migration_added_shipments_{col_name}")

        # Storefront templates table migration
        if inspector.has_table("storefront_templates"):
            template_columns = {col["name"] for col in inspector.get_columns("storefront_templates")}
            if "image" not in template_columns:
                conn.execute(text("ALTER TABLE storefront_templates ADD COLUMN image VARCHAR(255) NULL"))
                logger.info("runtime_migration_added_storefront_templates_image")

        # Tenant auto-fix tracking columns
        if inspector.has_table("tenants"):
            tenant_columns = {col["name"] for col in inspector.get_columns("tenants")}
            if "pending_endpoints" not in tenant_columns:
                conn.execute(text("ALTER TABLE tenants ADD COLUMN pending_endpoints TEXT NULL"))
                logger.info("runtime_migration_added_tenants_pending_endpoints")
            if "pending_endpoints_notified_at" not in tenant_columns:
                datetime_type = "TIMESTAMPTZ" if dialect_name == "postgresql" else "DATETIME"
                conn.execute(text(f"ALTER TABLE tenants ADD COLUMN pending_endpoints_notified_at {datetime_type} NULL"))
                logger.info("runtime_migration_added_tenants_pending_endpoints_notified_at")

        # Gallery posts table migration
        if not inspector.has_table("gallery_posts"):
            gallery_id_type = "UUID" if dialect_name == "postgresql" else "VARCHAR(36)"
            datetime_type = "TIMESTAMPTZ" if dialect_name == "postgresql" else "DATETIME"
            conn.execute(text(f"""
                CREATE TABLE gallery_posts (
                    id {gallery_id_type} PRIMARY KEY,
                    tenant_id {gallery_id_type} NOT NULL,
                    media_url VARCHAR(500) NOT NULL,
                    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
                    caption TEXT NULL,
                    order INTEGER NOT NULL DEFAULT 0,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at {datetime_type} NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at {datetime_type} NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_gallery_posts_tenant_id ON gallery_posts (tenant_id)"))
            if dialect_name == "postgresql":
                conn.execute(text("ALTER TABLE gallery_posts ADD CONSTRAINT fk_gallery_posts_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE"))
            logger.info("runtime_migration_created_gallery_posts_table")

        # CRM quotes: scope quote_number uniqueness per tenant (was global —
        # cross-tenant collisions returned 500 and violated isolation).
        if inspector.has_table("crm_quotes") and dialect_name == "postgresql":
            has_global_unique = conn.execute(text("""
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_name = 'crm_quotes' AND constraint_name = 'crm_quotes_quote_number_key'
            """)).fetchone()
            if has_global_unique:
                conn.execute(text("ALTER TABLE crm_quotes DROP CONSTRAINT crm_quotes_quote_number_key"))
                logger.info("runtime_migration_dropped_crm_quotes_global_unique")
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_quotes_tenant_number
                ON crm_quotes (tenant_id, quote_number)
            """))

        # Admin audit immutability (G-05 hardening / PO T2): audit rows must be
        # append-only at the database layer, not merely unreachable through the
        # API. Two controls:
        #   1. Ownership moved to a dedicated `afruheritage_audit` role; the app
        #      role keeps SELECT+INSERT only (privilege-level enforcement for
        #      any non-superuser role).
        #   2. BEFORE UPDATE/DELETE/TRUNCATE triggers that raise — enforced for
        #      every role including the table owner/superuser, since triggers
        #      are code, not privileges. Removing them requires DDL, which is
        #      itself an auditable ops action.
        if inspector.has_table("admin_audit_logs") and dialect_name == "postgresql":
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'afruheritage_audit') THEN
                        CREATE ROLE afruheritage_audit NOLOGIN;
                    END IF;
                END $$;
            """))
            conn.execute(text("ALTER TABLE admin_audit_logs OWNER TO afruheritage_audit"))
            conn.execute(text("REVOKE ALL ON admin_audit_logs FROM afruheritage"))
            conn.execute(text("GRANT SELECT, INSERT ON admin_audit_logs TO afruheritage"))
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION immutable_admin_audit() RETURNS trigger AS $func$
                BEGIN
                    RAISE EXCEPTION 'admin_audit_logs is append-only: % not permitted', TG_OP;
                END;
                $func$ LANGUAGE plpgsql;
            """))
            conn.execute(text("DROP TRIGGER IF EXISTS admin_audit_logs_immutable ON admin_audit_logs"))
            conn.execute(text("""
                CREATE TRIGGER admin_audit_logs_immutable
                BEFORE UPDATE OR DELETE ON admin_audit_logs
                FOR EACH ROW EXECUTE FUNCTION immutable_admin_audit()
            """))
            conn.execute(text("DROP TRIGGER IF EXISTS admin_audit_logs_no_truncate ON admin_audit_logs"))
            conn.execute(text("""
                CREATE TRIGGER admin_audit_logs_no_truncate
                BEFORE TRUNCATE ON admin_audit_logs
                FOR EACH STATEMENT EXECUTE FUNCTION immutable_admin_audit()
            """))
            logger.info("runtime_migration_hardened_admin_audit_logs_immutability")

        # Vendor memberships (D-01): explicit vendor↔identity association.
        # The table is created EMPTY — memberships are never backfilled from
        # matching email addresses (PO ruling); only explicit Sentinel admin
        # linkage creates them.
        if not inspector.has_table("vendor_memberships"):
            mid_type = "UUID" if dialect_name == "postgresql" else "VARCHAR(36)"
            dt_type = "TIMESTAMPTZ" if dialect_name == "postgresql" else "DATETIME"
            conn.execute(text(f"""
                CREATE TABLE vendor_memberships (
                    id {mid_type} PRIMARY KEY,
                    vendor_id {mid_type} NOT NULL,
                    user_id {mid_type} NOT NULL,
                    role VARCHAR(20) NOT NULL DEFAULT 'owner',
                    status VARCHAR(20) NOT NULL DEFAULT 'invited',
                    linked_by VARCHAR(255) NULL,
                    created_at {dt_type} NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at {dt_type} NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_vendor_membership UNIQUE (vendor_id, user_id)
                )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_vendor_memberships_vendor ON vendor_memberships (vendor_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_vendor_memberships_user ON vendor_memberships (user_id)"))
            if dialect_name == "postgresql":
                conn.execute(text("ALTER TABLE vendor_memberships ADD CONSTRAINT fk_vendor_memberships_vendor FOREIGN KEY (vendor_id) REFERENCES delivery_vendors(id) ON DELETE CASCADE"))
                conn.execute(text("ALTER TABLE vendor_memberships ADD CONSTRAINT fk_vendor_memberships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"))
            logger.info("runtime_migration_created_vendor_memberships")

        # Platform support tenant (D-04): central Afruheritage support intake
        # needs a scope for tickets filed from the apex domain where no tenant
        # subdomain resolves. This is a real ops workspace record, not a
        # customer tenant — support tickets with tenant scope 'platform' are
        # attached here and administered from Sentinel.
        if inspector.has_table("tenants") and dialect_name == "postgresql":
            conn.execute(text("""
                INSERT INTO tenants (id, company_name, slug, contact_email, plan_code,
                                     requested_domain, domain_type, launch_status,
                                     custom_domain_verified)
                SELECT gen_random_uuid(), 'Afruheritage Platform Support', 'afruheritage-platform',
                       'support@afruheritage.com', 'platform', 'afruheritage.com',
                       'customer_domain', 'active', true
                WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'afruheritage-platform')
            """))
            logger.info("runtime_migration_ensured_platform_support_tenant")

        # CRM customers tenant scoping (D-08): crm_customers was previously a
        # global table — every subscribed tenant could read every other
        # tenant's records. Rows without a tenant_id are orphaned legacy test
        # data and become invisible under scoped queries.
        if inspector.has_table("crm_customers"):
            crm_cols = {c["name"] for c in inspector.get_columns("crm_customers")}
            if "tenant_id" not in crm_cols:
                mid_type = "UUID" if dialect_name == "postgresql" else "VARCHAR(36)"
                conn.execute(text(f"ALTER TABLE crm_customers ADD COLUMN tenant_id {mid_type}"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_crm_customers_tenant ON crm_customers (tenant_id)"))
                logger.info("runtime_migration_added_crm_customers_tenant_id")

        # payment_records.status enum collision (P1): the legacy PaymentStatus
        # enum (pending/completed/...) and the billing PaymentStatus enum
        # (UNPAID/PAID/...) both map to Postgres type "paymentstatus", which
        # holds billing values. Every payment_records INSERT failed with
        # invalid enum input. Give payment_records its own enum type.
        if dialect_name == "postgresql" and inspector.has_table("payment_records"):
            try:
                with conn.begin_nested():
                    conn.execute(text("""
                        DO $$
                        BEGIN
                            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_record_status') THEN
                                CREATE TYPE payment_record_status AS ENUM
                                    ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','REFUNDED');
                            END IF;
                        END $$;
                    """))
                    conn.execute(text("""
                        ALTER TABLE payment_records
                        ALTER COLUMN status TYPE payment_record_status
                        USING CASE status::text
                            WHEN 'PAID' THEN 'COMPLETED'
                            WHEN 'OVERDUE' THEN 'FAILED'
                            WHEN 'REFUNDED' THEN 'REFUNDED'
                            WHEN 'PARTIALLY_PAID' THEN 'PROCESSING'
                            ELSE 'PENDING' END::payment_record_status
                    """))
                    conn.execute(text(
                        "ALTER TABLE payment_records ALTER COLUMN status SET DEFAULT 'PENDING'::payment_record_status"
                    ))
                logger.info("runtime_migration_split_payment_records_status_enum")
            except Exception as e:
                logger.warning(f"runtime_migration_payment_records_enum_failed: {e}")
