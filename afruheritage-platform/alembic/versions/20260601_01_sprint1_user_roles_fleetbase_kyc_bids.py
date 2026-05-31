"""
Sprint 1: User roles, Tenant Fleetbase org fields, KYC enhancements,
          Marketplace tracking number + ShipmentBid table.

Revision ID: 20260601_01
Revises:     20260521_03
Created at:  2026-06-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260601_01"
down_revision = "20260521_03"
branch_labels = None
depends_on = None


def upgrade() -> None:

    # -------------------------------------------------------------------------
    # 1. users — add role column (if not already present)
    # -------------------------------------------------------------------------
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM
                ('personal_shipper', 'delivery_driver', 'company_admin', 'platform_admin');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        """
    )
    op.execute(
        """
        DO $$ BEGIN
            ALTER TABLE users ADD COLUMN role userrole NOT NULL DEFAULT 'personal_shipper';
        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
        """
    )

    # -------------------------------------------------------------------------
    # 2. tenants — add Fleetbase org fields (if not already present)
    # -------------------------------------------------------------------------
    op.execute("DO $$ BEGIN ALTER TABLE tenants ADD COLUMN fleetbase_org_id VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE tenants ADD COLUMN fleetbase_api_key TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE tenants ADD COLUMN fleetbase_admin_token TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;")

    # -------------------------------------------------------------------------
    # 3. kyc_submissions — add enriched columns (skip any that exist)
    # -------------------------------------------------------------------------
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE kycidtype AS ENUM
                ('ghana_card', 'passport', 'voter_id', 'drivers_license');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        """
    )
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN id_type kycidtype; EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN id_number VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN full_name VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN id_front_url VARCHAR(1024); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN id_back_url VARCHAR(1024); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN liveness_photo_url VARCHAR(1024); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN liveness_video_url VARCHAR(1024); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN mrz_data TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN parsed_info TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN admin_note TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN reviewed_by UUID REFERENCES users(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute("DO $$ BEGIN ALTER TABLE kyc_submissions ADD COLUMN reviewed_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END $$;")

    # -------------------------------------------------------------------------
    # 4. marketplace_shipments — tracking number + created_by_user_id
    # -------------------------------------------------------------------------
    op.execute("DO $$ BEGIN ALTER TABLE marketplace_shipments ADD COLUMN tracking_number VARCHAR(40); EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute(
        """
        DO $$ BEGIN
            CREATE UNIQUE INDEX ix_marketplace_shipments_tracking_number
                ON marketplace_shipments (tracking_number);
        EXCEPTION WHEN duplicate_table THEN NULL; END $$;
        """
    )
    op.execute("DO $$ BEGIN ALTER TABLE marketplace_shipments ADD COLUMN created_by_user_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END $$;")
    op.execute(
        """
        DO $$ BEGIN
            CREATE INDEX ix_marketplace_shipments_created_by_user_id
                ON marketplace_shipments (created_by_user_id);
        EXCEPTION WHEN duplicate_table THEN NULL; END $$;
        """
    )

    # -------------------------------------------------------------------------
    # 5. shipment_bids — create only if not exists
    # -------------------------------------------------------------------------
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE shipmentbidstatus AS ENUM
                ('pending', 'accepted', 'rejected', 'countered', 'expired');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS shipment_bids (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shipment_id UUID NOT NULL REFERENCES marketplace_shipments(id),
            driver_user_id UUID NOT NULL,
            driver_name VARCHAR(255),
            proposed_price FLOAT NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'GHS',
            message TEXT,
            status shipmentbidstatus NOT NULL DEFAULT 'pending',
            counter_price FLOAT,
            counter_message TEXT,
            counter_response VARCHAR(40),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT uq_bid_shipment_driver UNIQUE (shipment_id, driver_user_id)
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_shipment_bids_shipment_id ON shipment_bids (shipment_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_shipment_bids_driver_user_id ON shipment_bids (driver_user_id);")


def downgrade() -> None:
    op.drop_table("shipment_bids")
    op.execute("DROP TYPE IF EXISTS shipmentbidstatus")

    op.drop_index("ix_marketplace_shipments_created_by_user_id", table_name="marketplace_shipments")
    op.drop_index("ix_marketplace_shipments_tracking_number", table_name="marketplace_shipments")
    op.drop_column("marketplace_shipments", "created_by_user_id")
    op.drop_column("marketplace_shipments", "tracking_number")

    for col in ["reviewed_at", "reviewed_by", "admin_note", "parsed_info", "mrz_data",
                "liveness_video_url", "liveness_photo_url", "id_back_url", "id_front_url",
                "full_name", "id_number", "id_type"]:
        op.drop_column("kyc_submissions", col)
    op.execute("DROP TYPE IF EXISTS kycidtype")

    op.drop_column("tenants", "fleetbase_admin_token")
    op.drop_column("tenants", "fleetbase_api_key")
    op.drop_column("tenants", "fleetbase_org_id")

    op.drop_column("users", "role")
    op.execute("DROP TYPE IF EXISTS userrole")
