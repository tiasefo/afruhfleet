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
