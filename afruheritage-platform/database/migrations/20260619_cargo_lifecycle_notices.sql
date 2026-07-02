CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE cargo_records
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS estimated_arrival_date DATE,
ADD COLUMN IF NOT EXISTS actual_arrival_date DATE,
ADD COLUMN IF NOT EXISTS last_location TEXT,
ADD COLUMN IF NOT EXISTS public_notes TEXT;

CREATE TABLE IF NOT EXISTS cargo_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    cargo_record_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    location TEXT,
    notes TEXT,
    changed_by TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cargo_status_history_cargo
ON cargo_status_history(cargo_record_id, created_at DESC);

CREATE TABLE IF NOT EXISTS warehouse_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    notice_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    media_url TEXT,
    media_type TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_notices_tenant
ON warehouse_notices(tenant_id, notice_type, is_active);

INSERT INTO cargo_status_history (
    tenant_id, cargo_record_id, old_status, new_status, location, notes, changed_by
)
SELECT
    tenant_id,
    id,
    NULL,
    status,
    COALESCE(last_location, 'China Warehouse'),
    'Initial status imported from cargo manifest',
    'system'
FROM cargo_records c
WHERE NOT EXISTS (
    SELECT 1 FROM cargo_status_history h WHERE h.cargo_record_id = c.id
);
