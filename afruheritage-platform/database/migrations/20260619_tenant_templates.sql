CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenant_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    business_model TEXT NOT NULL,
    default_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_branding JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_import_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_template_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES tenant_templates(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (tenant_id, template_id)
);

INSERT INTO tenant_templates (
    code,
    name,
    description,
    business_model,
    default_features,
    default_branding,
    default_import_profile
)
VALUES (
    'freight_forwarding_china_ghana',
    'China Ghana Freight Forwarding',
    'Template for freight forwarders handling China warehouse receiving, Ghana delivery, XLSX cargo manifests, shipping mark customers, arrival notices, and unidentified goods.',
    'freight_forwarding',
    '{
      "xlsx_manifest_import": true,
      "auto_customer_from_shipping_mark": true,
      "customer_tracking_portal": true,
      "track_by_afru_number": true,
      "track_by_supplier_number": true,
      "search_by_shipping_mark": true,
      "unidentified_goods_gallery": true,
      "arrival_notices": true,
      "warehouse_updates": true,
      "whatsapp_support": true,
      "fleetbase_workspace": true
    }'::jsonb,
    '{
      "primary_color": "#082f63",
      "secondary_color": "#b91c1c",
      "accent_color": "#facc15",
      "portal_label": "Customer Cargo Portal"
    }'::jsonb,
    '{
      "accepted_files": ["xlsx", "csv"],
      "manifest_folder": "imports/manifests",
      "customer_folder": "imports/customers",
      "shipping_mark_columns": ["SHIPPIN MARK/CLIENT", "唛头/客户名"],
      "tracking_columns": ["SUPPLIER&TRACKING NO", "供应商/快递单号"],
      "cbm_columns": ["CBM", "体积"],
      "description_columns": ["DESCRIPTION", "商品名"],
      "receipt_date_columns": ["DATE OF RECEIPT", "送货日期"],
      "loading_date_columns": ["DATE OF LOADING", "装柜日期"]
    }'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    business_model = EXCLUDED.business_model,
    default_features = EXCLUDED.default_features,
    default_branding = EXCLUDED.default_branding,
    default_import_profile = EXCLUDED.default_import_profile,
    is_active = true;
