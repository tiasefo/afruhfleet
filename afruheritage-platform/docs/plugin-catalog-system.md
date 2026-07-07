# Plugin Catalog System Documentation

## Overview

The Plugin Catalog System is a WordPress-style plugin management system that allows tenants to browse, install, and manage plugins for their storefronts with explicit consent flows for legal compliance. The system includes automatic page generation for templates that don't include all required platform pages.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Plugin Catalog UI](#plugin-catalog-ui)
3. [Consent Flow](#consent-flow)
4. [Page Generation System](#page-generation-system)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Plugin Development](#plugin-development)
8. [Installation and Usage](#installation-and-usage)

## System Architecture

### Components

1. **Backend API** (`app/api/routes/plugins.py`)
   - Plugin catalog endpoints
   - Installation with consent validation
   - Audit logging for compliance

2. **Frontend UI** (`frontend/app/plugins/page.tsx`)
   - Tenant-facing plugin catalog
   - Consent dialog with risk warnings
   - Installation status feedback

3. **Plugin System** (`app/plugins/__init__.py`)
   - Base plugin class with mock data replacement
   - Plugin registry and auto-discovery
   - Health checking and auto-fix capabilities

4. **Page Generator** (`app/services/page_generator_service.py`)
   - Automatic page generation for missing template pages
   - Branding-aware content generation
   - Template page manifest management

### Data Flow

```
Tenant → Plugin Catalog UI → API Endpoints → Plugin System → Database
                      ↓                 ↓
                Consent Dialog    Audit Logging
                      ↓
            Page Generation (if needed)
```

## Plugin Catalog UI

### Location
- **URL:** `/plugins` (tenant storefront)
- **File:** `frontend/app/plugins/page.tsx`

### Features

1. **Plugin Browsing**
   - Grid layout with plugin cards
   - Displays plugin name, description, required endpoints, and feature flags
   - Risk warnings for each plugin

2. **Consent Dialog**
   - Explicit consent checkboxes for:
     - UI changes
     - Business type changes
     - Data impact
   - Risk acknowledgment checkboxes
   - Legal compliance notice
   - Installation can only proceed with all consents

3. **Installation Flow**
   - Click "Install Plugin" → Opens consent dialog
   - Review plugin details and risks
   - Provide explicit consent for all categories
   - Acknowledge specific risks
   - Install with audit logging

### UI Components

```typescript
// Main components used:
- Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
- Button, Badge, Switch, Dialog
- Icons: Puzzle, CheckCircle, AlertTriangle, Loader2, Shield, Zap, Info
```

## Consent Flow

### Consent Categories

1. **UI Change Consent**
   - Warning: "This plugin may change your storefront appearance and layout"
   - Required for all plugins that modify UI

2. **Business Type Change Consent**
   - Warning: "This plugin may change your industry or business type classification"
   - Required for plugins that affect business categorization

3. **Data Impact Consent**
   - Warning: "This plugin may modify or replace existing data in your system"
   - Required for plugins that handle data operations

### Risk Acknowledgment

Users must acknowledge specific risks:
- UI change
- Business type change
- Data impact

### Legal Compliance

- All consent actions are logged to `audit_events` table
- Includes: actor_email, plugin_name, tenant_id, consent flags, acknowledged risks
- Timestamped for compliance records

### API Implementation

```python
@router.post("/install")
def install_plugin_with_consent(
    request: PluginInstallRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
):
    # Validate all consents are provided
    required_consents = []
    if not request.consent_ui_change:
        required_consents.append("ui_change")
    if not request.consent_business_type_change:
        required_consents.append("business_type_change")
    if not request.consent_data_impact:
        required_consents.append("data_impact")
    
    if required_consents:
        raise HTTPException(status_code=400, detail=f"Missing required consents: {', '.join(required_consents)}")
    
    # Run plugin auto-fix
    success, message = plugin.auto_fix(str(current_user.tenant_id), db)
    
    # Replace mock data if applicable
    if plugin.has_mock_data:
        mock_success, mock_message = plugin.replace_mock_data(str(current_user.tenant_id), db)
    
    # Create audit event for legal compliance
    audit_event = AuditEvent(
        actor_email=current_user.email,
        event_type="plugin.installed",
        entity_type="plugin",
        entity_id=plugin.name,
        details_json=json.dumps({...})
    )
    db.add(audit_event)
    db.commit()
```

## Page Generation System

### Purpose

Automatically generates missing pages for templates that don't include all required platform pages, using the template's branding and styling to ensure consistency.

### Required Pages

| Page Key | Title | Required | Content Type |
|----------|-------|----------|--------------|
| home | Home | Yes | hero_sections |
| about | About Us | Yes | text_content |
| services | Services | Yes | service_cards |
| contact | Contact | Yes | contact_form |
| tracking | Track Shipment | No | tracking_form |
| pricing | Pricing | No | pricing_table |
| faq | FAQ | No | faq_accordion |
| privacy | Privacy Policy | Yes | legal_content |
| terms | Terms of Service | Yes | legal_content |

### Template Page Manifests

```python
template_page_manifests = {
    "amooksco": ["home", "about", "services", "contact", "tracking"],
    "freight": ["home", "about", "services", "contact", "tracking", "pricing"],
    "basic": ["home", "about", "contact"],
}
```

### Page Generation Process

1. **Identify Missing Pages**
   - Compare template pages with required pages
   - Flag required pages that are missing

2. **Generate Page Content**
   - Apply template branding (colors, fonts, theme)
   - Use tenant company information
   - Generate appropriate sections based on page type

3. **Store Generated Pages**
   - Save to `tenant_branding.storefront_config`
   - Include page metadata and content structure
   - Mark as generated for tracking

### API Endpoints

```python
# Get page status for current tenant
GET /api/v1/page-generator/status

# Generate missing pages for current tenant
POST /api/v1/page-generator/generate

# Get pages available in a specific template
GET /api/v1/page-generator/templates/{template_code}/pages

# Get all required pages for the platform
GET /api/v1/page-generator/required-pages
```

### Generated Page Structure

```json
{
  "page_key": "about",
  "title": "About Us",
  "description": "Company information page",
  "content_type": "text_content",
  "branding": {
    "primary_color": "#1f5d72",
    "secondary_color": "#3aa6b9",
    "accent_color": "#eef6f8",
    "font_family": "Inter, sans-serif",
    "theme_class": "theme-amooksco"
  },
  "company_info": {
    "name": "Amooksco Logistics",
    "tagline": "Quality Services Delivered",
    "contact_email": "admin@amooksco.com"
  },
  "sections": [...]
}
```

## API Endpoints

### Plugin Catalog Endpoints

#### List Plugin Catalog
```http
GET /api/v1/plugins/catalog
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "name": "amooksco_template",
    "feature_name": "Amooksco Logistics Template",
    "description": "Auto-fix plugin for Amooksco Logistics Template",
    "required_endpoints": ["GET /api/v1/fleetbase-proxy/drivers", ...],
    "feature_flags": ["tracking", "bulk_import", "ai_chat", ...],
    "risks": {
      "ui_change": "This plugin may change your storefront appearance and layout",
      "business_type_change": "This plugin may change your industry or business type classification",
      "data_impact": "This plugin may modify or replace existing data in your system"
    }
  }
]
```

#### Get Plugin Details
```http
GET /api/v1/plugins/catalog/{plugin_name}
Authorization: Bearer {token}
```

#### Install Plugin with Consent
```http
POST /api/v1/plugins/install
Authorization: Bearer {token}
Content-Type: application/json

{
  "plugin_name": "amooksco_template",
  "consent_ui_change": true,
  "consent_business_type_change": true,
  "consent_data_impact": true,
  "acknowledged_risks": ["UI change", "Business type change", "Data impact"]
}
```

**Response:**
```json
{
  "plugin_name": "amooksco_template",
  "feature_name": "Amooksco Logistics Template",
  "tenant_id": "e379f093-758e-4e5a-a313-842baadb2680",
  "success": true,
  "message": "Enabled features: tracking_enabled, fleetbase_integration_enabled, shipping_estimator_enabled",
  "health": {...},
  "consent_recorded": true,
  "mock_data_replaced": true
}
```

### Admin Plugin Management Endpoints

#### List All Plugins (Admin)
```http
GET /api/v1/plugins
Authorization: Bearer {admin_token}
```

#### Get Plugin Health for Tenant (Admin)
```http
POST /api/v1/plugins/{plugin_name}/check/{tenant_id}
Authorization: Bearer {admin_token}
```

#### Auto-Fix Plugin for Tenant (Admin)
```http
POST /api/v1/plugins/{plugin_name}/auto-fix/{tenant_id}
Authorization: Bearer {admin_token}
```

## Database Schema

### Tenant Branding Additions

Added fields to `tenant_branding` table for plugin and template support:

```sql
ALTER TABLE tenant_branding 
ADD COLUMN tracking_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN fleetbase_integration_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN shipping_estimator_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN has_mock_tracking_data BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN tracking_data_source VARCHAR(50);
```

### Audit Events

Plugin installations are logged to `audit_events` table:

```json
{
  "actor_email": "admin@amooksco.com",
  "event_type": "plugin.installed",
  "entity_type": "plugin",
  "entity_id": "amooksco_template",
  "details_json": {
    "plugin_name": "amooksco_template",
    "feature_name": "Amooksco Logistics Template",
    "tenant_id": "e379f093-758e-4e5a-a313-842baadb2680",
    "consent_ui_change": true,
    "consent_business_type_change": true,
    "consent_data_impact": true,
    "acknowledged_risks": ["UI change", "Business type change", "Data impact"],
    "auto_fix_success": true,
    "auto_fix_message": "Enabled features: tracking_enabled, fleetbase_integration_enabled, shipping_estimator_enabled"
  }
}
```

## Plugin Development

### Base Plugin Class

```python
class BasePlugin(ABC):
    name: str = ""
    feature_name: str = ""
    required_endpoints: list[str] = []
    feature_flags: list[str] = []
    has_mock_data: bool = False  # Whether this plugin handles mock data replacement

    @abstractmethod
    def check(self, tenant_id: str, db: Session) -> bool:
        """Return True if the feature is healthy and all endpoints are available."""
        ...

    @abstractmethod
    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        """Attempt to auto-fix missing dependencies."""
        ...

    @abstractmethod
    def get_health(self, tenant_id: str, db: Session) -> dict[str, Any]:
        """Return a health status dict with keys: healthy, endpoints, details, auto_fixed."""
        ...

    def replace_mock_data(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        """Replace mock data with real tenant data (optional)."""
        if not self.has_mock_data:
            return True, "No mock data to replace for this plugin"
        return False, "Mock data replacement not implemented for this plugin"
```

### Example Plugin

```python
class AmookscoTemplatePlugin(BasePlugin):
    name = "amooksco_template"
    feature_name = "Amooksco Logistics Template"
    required_endpoints = [
        "GET /api/v1/fleetbase-proxy/drivers",
        "GET /api/v1/fleetbase-proxy/vehicles",
        # ... more endpoints
    ]
    feature_flags = ["tracking", "bulk_import", "ai_chat", "fleetbase_integration", "shipping_estimator"]
    has_mock_data = True
    
    def check(self, tenant_id: str, db: Session) -> bool:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        has_tracking = getattr(branding, "tracking_enabled", False)
        has_fleetbase = getattr(branding, "fleetbase_integration_enabled", False)
        return has_tracking and has_fleetbase
    
    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        branding.tracking_enabled = True
        branding.fleetbase_integration_enabled = True
        branding.primary_color = "#1f5d72"
        branding.theme_class = "theme-amooksco"
        db.add(branding)
        db.commit()
        return True, "Enabled features: tracking_enabled, fleetbase_integration_enabled"
    
    def get_health(self, tenant_id: str, db: Session) -> dict[str, any]:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        return {
            "healthy": self.check(tenant_id, db),
            "endpoints": self.required_endpoints,
            "features": self.feature_flags,
            "details": {
                "tracking_enabled": getattr(branding, "tracking_enabled", False),
                "fleetbase_integration_enabled": getattr(branding, "fleetbase_integration_enabled", False),
            },
            "auto_fixed": False,
        }
    
    def replace_mock_data(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        branding.has_mock_tracking_data = False
        branding.tracking_data_source = "live"
        db.add(branding)
        db.commit()
        return True, "Mock tracking data replaced with live data"

# Plugin instance for auto-discovery
PLUGIN = AmookscoTemplatePlugin()
```

### Plugin Registration

Plugins are auto-discovered from `app/plugins/` directory. Create a new plugin file and export a `PLUGIN` instance:

```python
# app/plugins/my_plugin.py
from app.plugins import BasePlugin

class MyPlugin(BasePlugin):
    name = "my_plugin"
    feature_name = "My Feature"
    # ... implementation

PLUGIN = MyPlugin()
```

## Installation and Usage

### For Tenants

1. **Access Plugin Catalog**
   - Navigate to `/plugins` in your storefront
   - Browse available plugins with descriptions and risk warnings

2. **Install a Plugin**
   - Click "Install Plugin" on desired plugin
   - Review plugin details and risks in consent dialog
   - Check all consent checkboxes (UI change, business type change, data impact)
   - Acknowledge specific risks
   - Click "Install Plugin"
   - Wait for installation confirmation

3. **Monitor Installation**
   - View success/failure message
   - Check which features were enabled
   - Review health status

### For Administrators

1. **Monitor Plugin Health**
   - Access `/dashboard/plugins` in admin console
   - Enter tenant ID to check plugin status
   - View health indicators and endpoint status

2. **Manual Auto-Fix**
   - Use "Auto-Fix" button for specific plugins
   - Review auto-fix results
   - Check feature enablement status

### For Developers

1. **Create New Plugin**
   - Create file in `app/plugins/`
   - Extend `BasePlugin` class
   - Implement required methods
   - Export `PLUGIN` instance
   - Plugin auto-discovers on next restart

2. **Add Template Support**
   - Update `template_page_manifests` in `page_generator_service.py`
   - Add template-specific page requirements
   - Test page generation with new template

3. **Add Required Endpoints**
   - Implement API endpoints for plugin features
   - Add to plugin's `required_endpoints` list
   - Test endpoint availability

## Security and Compliance

### Consent Requirements

- All three consent categories must be explicitly provided
- Risk acknowledgment checkboxes must be checked
- Audit trail maintained for all installations
- Timestamped records for compliance

### Access Control

- Plugin catalog: Requires tenant authentication
- Plugin installation: Requires tenant admin role
- Admin plugin management: Requires superuser role
- Page generation: Requires tenant admin role

### Data Protection

- Plugin actions logged with actor identification
- Consent data stored in audit events
- Mock data replacement tracked
- Tenant isolation maintained

## Troubleshooting

### Plugin Installation Fails

1. Check if all consents are provided
2. Verify tenant admin role
3. Check plugin health status
4. Review audit logs for errors

### Page Generation Issues

1. Verify template code is set in tenant branding
2. Check template page manifest
3. Review branding configuration
4. Check required pages list

### Plugin Not Showing in Catalog

1. Verify plugin file exists in `app/plugins/`
2. Check `PLUGIN` instance is exported
3. Restart API server for auto-discovery
4. Check for import errors in logs

## Future Enhancements

1. **Plugin Marketplace**
   - Third-party plugin support
   - Plugin ratings and reviews
   - Plugin versioning

2. **Advanced Page Generation**
   - Custom page templates
   - AI-powered content generation
   - Multi-language support

3. **Plugin Dependencies**
   - Plugin dependency management
   - Conflict resolution
   - Rollback capabilities

4. **Analytics**
   - Plugin usage statistics
   - Installation success rates
   - Performance monitoring

## Support

For issues or questions about the Plugin Catalog System:
- Check this documentation first
- Review audit logs for installation issues
- Contact platform administrators for template-specific issues
- Check API health endpoints for system status
