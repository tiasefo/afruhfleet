# CONTRACT: Template Migration + Admin Operations + Bulk Goods Upload

**Agreed: Jul 2, 2026**

---

## 1. STOREFRONT TEMPLATE SYSTEM (WordPress-inspired)

### How WordPress Does It (Research Findings)

WordPress uses **three mechanisms** for theme/feature management:

1. **`theme.json`** — Declares theme settings: color palette, typography, spacing, layout. Each block inherits these settings unless overridden. This is the **declarative manifest** — the theme says "I support these colors, these font sizes, these spacing options."

2. **`add_theme_support()`** in `functions.php` — Declares feature support: post-thumbnails, custom-logo, editor-styles, etc. Themes tell WordPress "I can render these features."

3. **`Requires Plugins` header** (plugin dependencies) — A comma-separated list of required plugin slugs in the plugin file header. If a dependency is missing:
   - WordPress **blocks activation** of the plugin
   - Shows an **admin notice** (banner at top of dashboard) telling the admin what's missing
   - Does **NOT auto-install** or auto-activate dependencies
   - No version control — uses current version from repository
   - Only for **required** dependencies, not recommended ones

**Key WordPress principle:** The system declares what it needs, checks if those needs are met, and **notifies the admin** if they're not.

**Our enhancement beyond WordPress:** We add **auto-fix plugins** that attempt to resolve missing dependencies automatically — WordPress only notifies, we also try to fix.

### Our Equivalent Design

#### 1.1 Template Manifest (like `theme.json`)

Each storefront template declares a **manifest** stored in the `preset` JSON column of `storefront_templates`:

```json
{
  "primary_color": "#1f5d72",
  "secondary_color": "#3aa6b9",
  "accent_color": "#eef6f8",
  "background_color": "#ffffff",
  "font_family": "Inter, sans-serif",
  "header_style": "white",
  "footer_style": "dark",
  "card_style": "rounded",
  "required_endpoints": [
    "GET /api/v1/shipments/{tenant_id}/track",
    "POST /api/v1/shipments/{tenant_id}/import/csv",
    "GET /api/v1/shipments/{tenant_id}/members",
    "GET /api/v1/ai/chat",
    "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}"
  ],
  "features": [
    "tracking",
    "bulk_import",
    "members",
    "ai_chat",
    "warehouse_notices"
  ],
  "fallbacks": {
    "tracking": "show_static_message",
    "ai_chat": "hide_widget",
    "warehouse_notices": "hide_section"
  }
}
```

#### 1.2 Template Selection Flow (like WordPress dependency check)

When a tenant selects a new template:

1. **System checks** all `required_endpoints` — pings each one to verify it exists and responds
2. **If all pass:** Template is applied, branding is updated, storefront renders with new template
3. **If some fail — AUTO-FIX first (automatic, no admin approval):**
   - System runs `auto_fix()` on each failed plugin **automatically**
   - Auto-fix can: enable feature flags on TenantBranding, ensure DB tables exist, mount routes
   - If `auto_fix()` succeeds → endpoint is now available, no notification needed, template applied cleanly
4. **If auto-fix fails for some endpoints:**
   - Template is **still applied** (graceful degradation)
   - **Admin console notification** is created: "Tenant X switched to template Y — endpoints Z could not be auto-fixed"
   - **Tenant account is tagged** with a `pending_endpoints` flag visible in admin console
   - **Tenant receives notification:** "Some features may not work for 72 hours after template change. Our team has been notified."
   - **Storefront renders with fallbacks** for missing features
5. **Admin fixes missing endpoints** → system re-checks → clears the tag → tenant notification updated

#### 1.3 Template Preview Pages

- The 7 template pages (`/templates/freight`, `/templates/fleet`, etc.) serve as **preview-only demos**
- Tenants browse these before selecting
- After selection, the actual storefront is rendered using the tenant's branding + the selected template's theme/layout
- Preview pages are **not** the live storefront — they're the showroom

---

## 2. ADMIN CONSOLE: SOFTWARE OPERATIONS CENTER

### Concept

A new section in the admin console (`/dashboard/operations`) that gives platform admins **click-and-configure control** over backend operations for each tenant — no SSH, no manual env editing.

### 2.1 Operations Dashboard Sections

#### A. Tenant Feature Management
- Toggle features on/off per tenant: tracking, bulk_import, members, ai_chat, warehouse_notices, customs_calculator, maps, vendor_marketplace
- Each toggle maps to a `TenantBranding` feature flag
- Changes take effect immediately (no rebuild needed)

#### B. Environment Variables Manager
- View all env vars per tenant (read-only for system vars, editable for tenant-specific vars)
- Add/edit/delete tenant-specific env vars (stored in DB, not .env files)
- Examples: `TENANT_AI_MODEL`, `TENANT_CURRENCY`, `TENANT_TIMEZONE`, `TENANT_SMS_PROVIDER`
- Click "Add Variable" → key/value form → saved to `tenant_settings` table

#### C. Template Operations
- View all 7 templates with their manifests
- See which tenants are using which template
- View endpoint health per template (green/red indicators)
- Force re-check endpoints for a tenant
- View/clear `pending_endpoints` tags

#### D. Endpoint Health Monitor
- Dashboard showing all API endpoints with health status
- Filter by tenant, by template, by endpoint category
- Auto-refresh every 60 seconds
- Click endpoint → see last 10 response times, error rate, last error message

#### E. Bulk Import Monitor
- See all CSV/XLSX imports across all tenants
- Status: pending, processing, completed, failed
- Click import → see rows processed, errors, which members were tagged
- Re-run failed imports
- Download original file

#### F. Tenant Change Log
- Immutable audit trail of all tenant configuration changes
- Who changed what, when, old value → new value
- Filter by tenant, by admin user, by change type

---

## 3. BULK GOODS UPLOAD (Second Uploader)

### 3.1 Amooskco XLSX File Analysis

Found **9 XLSX files** in `data/tenants/amooksco/imports/manifests/`. Two formats:

**Format A — "CURRENT SEA GOODS" (no loading date):**
| Column (EN) | Column (ZH) | Maps to |
|---|---|---|
| SHIPPIN MARK/CLIENT | 唛头/客户名 | `group_member_name` (shipping mark = client name) |
| DATE OF RECEIPT | 送货日期 | `shipped_date` |
| DESCRIPTION | 商品名 | `description` / `cargo_type` |
| CTNS | 件数 | `package_count` |
| CBM | 体积 | `volume_cbm` (formula like `=0.55*0.25*0.54`) |
| SUPPLIER&TRACKING NO | 供应商/快递单号 | `tracking_number` |
| DAYS | 天数 | (calculated: storage days) |
| UNIT PRICE | 单价/天/方 | (storage rate) |
| STORAGE FEE | 舱租 | (calculated storage fee) |
| NOTES | 备注 | `notes` |

**Format B — "LOADING" files (with loading date):**
| Column (EN) | Column (ZH) | Maps to |
|---|---|---|
| SHIPPIN MARK/CLIENT | 唛头/客户名 | `group_member_name` |
| DATE OF RECEIPT | 送货日期 | `shipped_date` |
| DATE OF LOADING | 装柜日期 | `estimated_arrival` (container loading date) |
| DESCRIPTION | 商品名 | `description` / `cargo_type` |
| CTNS | 件数 | `package_count` |
| CBM | 体积 | `volume_cbm` |
| SUPPLIER&TRACKING NO | 供应商/快递单号 | `tracking_number` |
| NOTES | 备注 | `notes` |

**Key observations:**
- Shipping mark starts with "AMOOKSCO " followed by client name → this is how to match to members
- CBM contains Excel formulas (e.g., `=0.55*0.25*0.54`) → need to evaluate or extract raw value
- Tracking numbers are supplier tracking numbers (e.g., "货拉拉0009276", "S66465244687")
- Description is in Chinese (e.g., "日用品" = daily goods, "空调" = air conditioner, "服装" = clothing)
- Some rows are blank (separator rows) → need to skip
- Files have 945-1305 rows each → large imports

### 3.2 XLSX + CSV Import Requirements

- **Accept BOTH .xlsx and .csv** — backend must support both formats natively (not frontend conversion)
- **Bilingual column mapping** — auto-detect both EN and ZH column names
- **CBM formula evaluation** — parse Excel formulas like `=0.55*0.25*0.54` to get numeric value
- **Shipping mark parsing** — extract client name from "AMOOKSCO {CLIENT_NAME}" pattern (configurable prefix per tenant)
- **Member auto-matching** — match `group_member_name` to existing GroupMember by full_name
- **Skip blank rows** — rows where all cells are None/empty
- **Preview before import** — show parsed rows, matched members, any errors
- **Chinese text support** — all descriptions, notes in Chinese must be preserved
- **Storage fees** — parse and store DAYS, UNIT PRICE, STORAGE FEE columns (see Section 3.4)

### 3.3 Import Profile — Per Template, Tenant-Configurable

- Each template ships with a **default import profile** stored in `storefront_templates.preset.import_profile`
- Tenants can **customize** their import profile from the admin/settings UI
- Customizations stored on `TenantBranding.import_profile_overrides` (JSON, nullable)
- Merge logic: default profile ← tenant overrides (tenant overrides take precedence)
- Admin console can reset to template default

### 3.4 Storage Fees — Configurable Per Tenant

**New fields on `Shipment` model:**
- `storage_days` (int, nullable) — number of days in warehouse
- `storage_rate` (Numeric, nullable) — unit price per day per CBM
- `storage_fee` (Numeric, nullable) — calculated storage fee (days × rate × CBM)
- `loading_date` (DateTime, nullable) — date goods were loaded into container

**Configurability:**
- Templates that include storage fees (freight, fleet) have `storage_fees_enabled: true` in their manifest
- Templates that don't (ecommerce, mall, restaurant, realestate, bookings) have `storage_fees_enabled: false`
- Tenants can toggle storage fees on/off from their settings (overrides template default)
- When enabled, the bulk import parses DAYS, UNIT PRICE, STORAGE FEE columns
- When disabled, those columns are ignored during import
- Storage fee calculation: `storage_fee = storage_days × storage_rate × volume_cbm`
- Admin console shows storage fee revenue per tenant

### 3.5 Frontend Pages Needed

1. **`/shipments/import`** — Bulk goods upload page (XLSX/CSV)
   - Step 1: Upload file
   - Step 2: Preview parsed rows (show: shipping mark, client name, tracking number, description, CBM, matched member)
   - Step 3: Confirm import → backend processes
   - Step 4: Results (created, updated, errors, members tagged)

2. **Wire the dead "Import" button** on `/shipments` page → link to `/shipments/import`

---

## 4. MEMBER CREDENTIALS DISPLAY

### 4.1 Members List Table — Add Credentials Columns

Current columns: Name, Email, Phone, Goods Description, Company, Status, Shipments, Joined

**Add:**
- **Username** — the login email (pseudo-email for CSV-imported members, e.g., `233532591559@phone.afruheritage.com`)
- **Temp Password** — the temporal password generated during bulk import

### 4.2 Data Source

- `GroupMember` has `user_id` FK to `User` table
- `User` table has `email` (the login username) and `source` field (`bulk_member_import`)
- Temp password is generated during import and stored in `User.metadata` or needs to be added to the model
- Need to check: does the bulk member import currently store the temp password anywhere?

### 4.3 Member Profile Page

Per existing CONTRACT (Jul 1, 2026):
- Full profile detail: name, email, phone, company, notes, preferred_language, goods_description
- Shipment history table: tracking number, origin, destination, status, ETA
- Documents section
- Activity timeline
- Pull in existing platform features: tracking, tax/duty calculator
- Login prompt for member access (member logs in with username + temporal password)

---

## 5. AUTO-FIX PLUGINS

### 5.1 Automatic, No Admin Approval

Plugins auto-fix **automatically** when a tenant switches templates:
- Enable feature flags on TenantBranding (e.g., `maps_enabled=True`)
- Ensure DB tables exist (run migration if needed)
- Mount routes if not already mounted
- No admin approval needed — this is the whole point of plugins
- Admin console shows a log of what was auto-fixed (for visibility, not approval)
- If auto-fix fails (e.g., external dependency missing), THEN admin is notified

### 5.2 Plugin Registry

```
app/plugins/
├── __init__.py              # Plugin registry + auto-discovery
├── base_plugin.py           # Abstract base class
├── tracking_plugin.py       # Shipment tracking endpoints
├── bulk_import_plugin.py    # CSV/XLSX import endpoints
├── ai_chat_plugin.py        # AI chat widget endpoint
├── warehouse_plugin.py      # Warehouse notice endpoints
├── customs_plugin.py        # Customs calculator endpoint
├── maps_plugin.py           # Map/fleet visualization endpoints
├── vendor_marketplace_plugin.py  # Vendor marketplace endpoints
├── storage_fees_plugin.py   # Storage fee calculation endpoints
└── bus_fleet_plugin.py      # Bus fleet management endpoints (for fleet template customers)
```

Each plugin:
```python
class BasePlugin:
    name: str
    required_endpoints: list[str]
    feature_flags: list[str]  # TenantBranding fields to enable
    
    def check(self, tenant_id, db) -> bool: ...
    def auto_fix(self, tenant_id, db) -> tuple[bool, str]: ...
    def get_health(self, tenant_id, db) -> dict: ...
```

### 5.3 Bus Fleet Customer Note

The fleet template (`Vanta Fleet`) targets fleet operators including bus fleet companies.
The `bus_fleet_plugin.py` handles:
- Bus route management endpoints
- Vehicle tracking endpoints
- Driver assignment endpoints
- Fleet scheduling endpoints
- These are distinct from freight forwarding features

---

## 6. IMPLEMENTATION PRIORITY

1. **B1: Fix members page internal error** (quick — tenant_id resolution fix)
2. **B4: Create shipments import page** (medium — XLSX+CSV upload with preview, storage fees)
3. **A2: Replace 6 fake DB templates with 7 real ones** (medium — DB migration + manifests + import profiles)
4. **A1: Copy template preview pages + images to frontend** (medium — file copy + wire routes)
5. **A3: Template manifest + plugin auto-fix system** (large — new backend + plugin framework)
6. **A4: Admin console UI from zip (replace mock data)** (large — wire to real APIs)
7. **B2+B3: Member profile page + credentials column** (medium — frontend page + API)
8. **Section 2: Admin Console Software Operations Center** (large — new admin console section)

---

## 7. REFERENCES

- Amooskco XLSX files: `data/tenants/amooksco/imports/manifests/`
- Existing import profile (column mapping): `database/migrations/20260619_tenant_templates.sql:58-68`
- Backend shipment CSV import: `app/api/routes/shipments.py:747` + `app/services/shipment_service.py:974`
- Backend member bulk import: `app/api/routes/users.py:393`
- Frontend members import page: `frontend/app/members/import/page.tsx`
- Frontend shipments page (dead import button): `frontend/app/shipments/page.tsx:236-239`
- Template zip: `docs/Afruheritage-Tenants-templates.zip`
- Extracted: `/tmp/tenant-templates-extracted/`
- TODO tracker: `TODO_TEMPLATE_MIGRATION.md`
