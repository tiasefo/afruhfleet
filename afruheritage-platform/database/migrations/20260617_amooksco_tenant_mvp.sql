CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenant_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    display_name TEXT,
    normalized_name TEXT,
    phone TEXT,
    normalized_phone TEXT,
    email TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    source_ref TEXT,
    is_whatsapp_admin BOOLEAN NOT NULL DEFAULT false,
    is_whatsapp_super_admin BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_customers_phone
ON tenant_customers(tenant_id, normalized_phone)
WHERE normalized_phone IS NOT NULL AND normalized_phone <> '';

CREATE INDEX IF NOT EXISTS idx_tenant_customers_tenant
ON tenant_customers(tenant_id);

CREATE TABLE IF NOT EXISTS customer_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID,
    channel TEXT NOT NULL CHECK (channel IN ('email','phone')),
    destination TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'login',
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_otps_lookup
ON customer_otps(tenant_id, channel, destination, created_at DESC);

CREATE TABLE IF NOT EXISTS cargo_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    filename TEXT NOT NULL,
    source_type TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    imported_rows INTEGER NOT NULL DEFAULT 0,
    matched_rows INTEGER NOT NULL DEFAULT 0,
    unmatched_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cargo_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID,
    import_batch_id UUID REFERENCES cargo_import_batches(id),
    afru_tracking_number TEXT UNIQUE NOT NULL,
    external_tracking_number TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    normalized_phone TEXT,
    description TEXT,
    cbm NUMERIC(12,3),
    quantity TEXT,
    receipt_date TEXT,
    loading_date TEXT,
    status TEXT NOT NULL DEFAULT 'received_at_warehouse',
    match_confidence TEXT NOT NULL DEFAULT 'unmatched',
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cargo_records_tenant
ON cargo_records(tenant_id);

CREATE INDEX IF NOT EXISTS idx_cargo_records_customer
ON cargo_records(customer_id);

CREATE INDEX IF NOT EXISTS idx_cargo_records_tracking
ON cargo_records(afru_tracking_number);

CREATE TABLE IF NOT EXISTS cargo_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    cargo_record_id UUID NOT NULL REFERENCES cargo_records(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    message TEXT,
    event_location TEXT,
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_order_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID,
    afru_tracking_number TEXT UNIQUE NOT NULL,
    store_name TEXT,
    supplier_name TEXT,
    supplier_order_number TEXT,
    product_description TEXT,
    quantity TEXT,
    expected_warehouse_delivery TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
