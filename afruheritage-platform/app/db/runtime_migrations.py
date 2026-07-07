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
                try:
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
