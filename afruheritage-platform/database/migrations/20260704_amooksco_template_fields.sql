-- Add Amooksco template-specific fields to tenant_branding table
-- Migration for Amooksco template plugin support

ALTER TABLE tenant_branding 
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS fleetbase_integration_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS shipping_estimator_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS has_mock_tracking_data BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS tracking_data_source VARCHAR(50);

COMMENT ON COLUMN tenant_branding.tracking_enabled IS 'Enable tracking feature for Amooksco template';
COMMENT ON COLUMN tenant_branding.fleetbase_integration_enabled IS 'Enable Fleetbase API integration for logistics management';
COMMENT ON COLUMN tenant_branding.shipping_estimator_enabled IS 'Enable shipping cost estimator feature';
COMMENT ON COLUMN tenant_branding.has_mock_tracking_data IS 'Flag indicating if template uses mock tracking data';
COMMENT ON COLUMN tenant_branding.tracking_data_source IS 'Source of tracking data: mock or live';
