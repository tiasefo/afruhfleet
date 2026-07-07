-- Delete 6 fake templates
DELETE FROM storefront_templates WHERE template_code IN ('aws_console', 'azure_cloud', 'google_cloud', 'jira_work', 'okta_identity', 'servicenow');

-- Insert 7 real templates with manifests, features, import profiles, and storage fee flags
-- Template: freight (Meridian Freight)
INSERT INTO storefront_templates (id, template_code, name, description, preset, is_active)
VALUES (
    gen_random_uuid(),
    'freight',
    'Meridian Freight',
    'Ocean, air, and land freight forwarding storefront with live quote and tracking flows.',
    '{
      "primary_color": "#1f5d72",
      "secondary_color": "#3aa6b9",
      "accent_color": "#eef6f8",
      "background_color": "#ffffff",
      "font_family": "Inter, sans-serif",
      "header_style": "white",
      "footer_style": "dark",
      "card_style": "rounded",
      "theme_class": "theme-freight",
      "image": "/images/freight-hero.png",
      "swatches": ["#1f5d72", "#3aa6b9", "#eef6f8"],
      "tags": ["Freight", "Customs", "Tracking"],
      "storage_fees_enabled": true,
      "required_endpoints": [
        "GET /api/v1/shipments/{tenant_id}/track",
        "POST /api/v1/shipments/{tenant_id}/import/csv",
        "GET /api/v1/shipments/{tenant_id}/members",
        "GET /api/v1/ai/chat",
        "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}"
      ],
      "features": ["tracking", "bulk_import", "members", "ai_chat", "warehouse_notices", "customs_calculator", "storage_fees"],
      "fallbacks": {
        "tracking": "show_static_message",
        "ai_chat": "hide_widget",
        "warehouse_notices": "hide_section",
        "customs_calculator": "hide_section",
        "storage_fees": "hide_column"
      },
      "import_profile": {
        "accepted_files": ["xlsx", "csv"],
        "column_mapping": {
          "group_member_name": {"aliases": ["SHIPPIN MARK/CLIENT", "唛头/客户名"], "required": true, "strip_prefix": "AMOOKSCO"},
          "shipped_date": {"aliases": ["DATE OF RECEIPT", "送货日期"], "required": true},
          "loading_date": {"aliases": ["DATE OF LOADING", "装柜日期"], "required": false},
          "description": {"aliases": ["DESCRIPTION", "商品名"], "required": true},
          "package_count": {"aliases": ["CTNS", "件数"], "required": true, "type": "int"},
          "volume_cbm": {"aliases": ["CBM", "体积"], "required": false, "type": "float", "evaluate_formula": true},
          "tracking_number": {"aliases": ["SUPPLIER&TRACKING NO", "供应商/快递单号"], "required": true},
          "storage_days": {"aliases": ["DAYS", "天数"], "required": false, "type": "int"},
          "storage_rate": {"aliases": ["UNIT PRICE", "单价/天/方"], "required": false, "type": "float"},
          "storage_fee": {"aliases": ["STORAGE FEE", "舱租"], "required": false, "type": "float"},
          "notes": {"aliases": ["NOTES", "备注"], "required": false}
        },
        "skip_blank_rows": true,
        "member_matching": {"strategy": "shipping_mark_prefix", "create_if_missing": false}
      }
    }'::text,
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    preset = EXCLUDED.preset,
    is_active = true;

-- Template: fleet (Vanta Fleet)
INSERT INTO storefront_templates (id, template_code, name, description, preset, is_active)
VALUES (
    gen_random_uuid(),
    'fleet',
    'Vanta Fleet',
    'Logistics-grade storefront for fleet operators — vehicle leasing, dispatch, and route management.',
    '{
      "primary_color": "#26324d",
      "secondary_color": "#e8a13a",
      "accent_color": "#f4f5f8",
      "background_color": "#ffffff",
      "font_family": "Inter, sans-serif",
      "header_style": "dark",
      "footer_style": "dark",
      "card_style": "rounded",
      "theme_class": "theme-fleet",
      "image": "/images/fleet-hero.png",
      "swatches": ["#26324d", "#e8a13a", "#f4f5f8"],
      "tags": ["Logistics", "Leasing", "Dispatch"],
      "storage_fees_enabled": true,
      "required_endpoints": [
        "GET /api/v1/shipments/{tenant_id}/track",
        "POST /api/v1/shipments/{tenant_id}/import/csv",
        "GET /api/v1/shipments/{tenant_id}/members",
        "GET /api/v1/ai/chat",
        "GET /api/v1/vendors/marketplace"
      ],
      "features": ["tracking", "bulk_import", "members", "ai_chat", "maps", "vendor_marketplace", "bus_fleet", "storage_fees"],
      "fallbacks": {
        "tracking": "show_static_message",
        "ai_chat": "hide_widget",
        "maps": "hide_section",
        "vendor_marketplace": "hide_section",
        "bus_fleet": "hide_section",
        "storage_fees": "hide_column"
      },
      "import_profile": {
        "accepted_files": ["xlsx", "csv"],
        "column_mapping": {
          "group_member_name": {"aliases": ["SHIPPIN MARK/CLIENT", "唛头/客户名"], "required": true},
          "shipped_date": {"aliases": ["DATE OF RECEIPT", "送货日期"], "required": true},
          "description": {"aliases": ["DESCRIPTION", "商品名"], "required": true},
          "package_count": {"aliases": ["CTNS", "件数"], "required": true, "type": "int"},
          "volume_cbm": {"aliases": ["CBM", "体积"], "required": false, "type": "float", "evaluate_formula": true},
          "tracking_number": {"aliases": ["SUPPLIER&TRACKING NO", "供应商/快递单号"], "required": true},
          "notes": {"aliases": ["NOTES", "备注"], "required": false}
        },
        "skip_blank_rows": true,
        "member_matching": {"strategy": "name", "create_if_missing": false}
      }
    }'::text,
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    preset = EXCLUDED.preset,
    is_active = true;

-- Template: ecommerce (Verde Goods)
INSERT INTO storefront_templates (id, template_code, name, description, preset, is_active)
VALUES (
    gen_random_uuid(),
    'ecommerce',
    'Verde Goods',
    'Clean, conversion-focused product store with collections, cart, and editorial sections.',
    '{
      "primary_color": "#2f9e6b",
      "secondary_color": "#e7c14b",
      "accent_color": "#fbfaf4",
      "background_color": "#ffffff",
      "font_family": "Inter, sans-serif",
      "header_style": "white",
      "footer_style": "light",
      "card_style": "rounded",
      "theme_class": "theme-ecommerce",
      "image": "/images/ecommerce-hero.png",
      "swatches": ["#2f9e6b", "#e7c14b", "#fbfaf4"],
      "tags": ["Retail", "Cart", "Collections"],
      "storage_fees_enabled": false,
      "required_endpoints": [
        "GET /api/v1/ai/chat",
        "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}"
      ],
      "features": ["ai_chat", "tracking"],
      "fallbacks": {
        "ai_chat": "hide_widget",
        "tracking": "hide_section"
      },
      "import_profile": {
        "accepted_files": ["csv"],
        "column_mapping": {
          "tracking_number": {"aliases": ["tracking_number", "tracking"], "required": true},
          "receiver_name": {"aliases": ["receiver_name", "customer"], "required": true},
          "description": {"aliases": ["description", "product"], "required": false}
        },
        "skip_blank_rows": true,
        "member_matching": {"strategy": "name", "create_if_missing": false}
      }
    }'::text,
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    preset = EXCLUDED.preset,
    is_active = true;

-- Template: mall (Lumiere Mall)
INSERT INTO storefront_templates (id, template_code, name, description, preset, is_active)
VALUES (
    gen_random_uuid(),
    'mall',
    'Lumière Mall',
    'Premium multi-brand mall directory with stores, dining, events, and floor guide.',
    '{
      "primary_color": "#2b2722",
      "secondary_color": "#c79a4a",
      "accent_color": "#f5f1ea",
      "background_color": "#ffffff",
      "font_family": "Inter, sans-serif",
      "header_style": "dark",
      "footer_style": "dark",
      "card_style": "rounded",
      "theme_class": "theme-mall",
      "image": "/images/mall-hero.png",
      "swatches": ["#2b2722", "#c79a4a", "#f5f1ea"],
      "tags": ["Directory", "Brands", "Events"],
      "storage_fees_enabled": false,
      "required_endpoints": ["GET /api/v1/ai/chat"],
      "features": ["ai_chat"],
      "fallbacks": {"ai_chat": "hide_widget"},
      "import_profile": {
        "accepted_files": ["csv"],
        "column_mapping": {},
        "skip_blank_rows": true,
        "member_matching": {"strategy": "name", "create_if_missing": false}
      }
    }'::text,
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    preset = EXCLUDED.preset,
    is_active = true;

-- Template: bookings (Skyline Travel)
INSERT INTO storefront_templates (id, template_code, name, description, preset, is_active)
VALUES (
    gen_random_uuid(),
    'bookings',
    'Skyline Travel',
    'Multi-modal booking storefront for flights, buses, and event tickets with a search engine.',
    '{
      "primary_color": "#2f6fd1",
      "secondary_color": "#f08a32",
      "accent_color": "#eef4fd",
      "background_color": "#ffffff",
      "font_family": "Inter, sans-serif",
      "header_style": "white",
      "footer_style": "light",
      "card_style": "rounded",
      "theme_class": "theme-bookings",
      "image": "/images/bookings-hero.png",
      "swatches": ["#2f6fd1", "#f08a32", "#eef4fd"],
      "tags": ["Flights", "Buses", "Tickets"],
      "storage_fees_enabled": false,
      "required_endpoints": ["GET /api/v1/ai/chat", "GET /api/v1/shipments/{tenant_id}/track"],
      "features": ["ai_chat", "tracking"],
      "fallbacks": {"ai_chat": "hide_widget", "tracking": "hide_section"},
      "import_profile": {
        "accepted_files": ["csv"],
        "column_mapping": {},
        "skip_blank_rows": true,
        "member_matching": {"strategy": "name", "create_if_missing": false}
      }
    }'::text,
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    preset = EXCLUDED.preset,
    is_active = true;

-- Template: restaurant (Ember & Oak)
INSERT INTO storefront_templates (id, template_code, name, description, preset, is_active)
VALUES (
    gen_random_uuid(),
    'restaurant',
    'Ember & Oak',
    'Atmospheric dining storefront with menu, reservations, and online ordering.',
    '{
      "primary_color": "#c0432b",
      "secondary_color": "#e0a23c",
      "accent_color": "#241d18",
      "background_color": "#ffffff",
      "font_family": "Inter, sans-serif",
      "header_style": "dark",
      "footer_style": "dark",
      "card_style": "rounded",
      "theme_class": "theme-restaurant",
      "image": "/images/restaurant-hero.png",
      "swatches": ["#c0432b", "#e0a23c", "#241d18"],
      "tags": ["Menu", "Reservations", "Ordering"],
      "storage_fees_enabled": false,
      "required_endpoints": ["GET /api/v1/ai/chat"],
      "features": ["ai_chat"],
      "fallbacks": {"ai_chat": "hide_widget"},
      "import_profile": {
        "accepted_files": ["csv"],
        "column_mapping": {},
        "skip_blank_rows": true,
        "member_matching": {"strategy": "name", "create_if_missing": false}
      }
    }'::text,
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    preset = EXCLUDED.preset,
    is_active = true;

-- Template: realestate (Haven Estates)
INSERT INTO storefront_templates (id, template_code, name, description, preset, is_active)
VALUES (
    gen_random_uuid(),
    'realestate',
    'Haven Estates',
    'Refined property listing storefront with search, featured homes, and agent profiles.',
    '{
      "primary_color": "#2f5d45",
      "secondary_color": "#b69a5e",
      "accent_color": "#faf8f2",
      "background_color": "#ffffff",
      "font_family": "Inter, sans-serif",
      "header_style": "white",
      "footer_style": "light",
      "card_style": "rounded",
      "theme_class": "theme-realestate",
      "image": "/images/realestate-hero.png",
      "swatches": ["#2f5d45", "#b69a5e", "#faf8f2"],
      "tags": ["Listings", "Search", "Agents"],
      "storage_fees_enabled": false,
      "required_endpoints": ["GET /api/v1/ai/chat"],
      "features": ["ai_chat"],
      "fallbacks": {"ai_chat": "hide_widget"},
      "import_profile": {
        "accepted_files": ["csv"],
        "column_mapping": {},
        "skip_blank_rows": true,
        "member_matching": {"strategy": "name", "create_if_missing": false}
      }
    }'::text,
    true
)
ON CONFLICT (template_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    preset = EXCLUDED.preset,
    is_active = true;
