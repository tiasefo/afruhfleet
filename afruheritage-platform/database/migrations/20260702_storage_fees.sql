-- Add storage fee fields to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS loading_date TIMESTAMP;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS storage_days INTEGER;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS storage_rate NUMERIC(10, 2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS storage_fee NUMERIC(12, 2);
