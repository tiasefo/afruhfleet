# Tenant Architecture Part 2: Storefront, Templates, and Fleetbase Integration

**Document Status**: Complete Codebase Documentation  
**Last Updated**: 2026-07-05  
**Scope**: Storefront acquisition, template handling, Fleetbase integration

---

## Table of Contents

1. [Storefront Template System](#storefront-template-system)
2. [Template Selection and Application](#template-selection-and-application)
3. [Fleetbase Integration](#fleetbase-integration)
4. [Storefront Configuration](#storefront-configuration)
5. [Template Auto-Fix System](#template-auto-fix-system)

---

## Storefront Template System

### Storefront Template Model

**File**: `app/models/storefront_template.py`

```python
class StorefrontTemplate(Base):
    __tablename__ = "storefront_templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    template_code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    preset: Mapped[str] = mapped_column(Text, nullable=False, default="{}")  # JSON string of color/layout preset
    image: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Hero image path
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### Default Templates

**File**: `app/api/routes/storefront_templates.py`

```python
DEFAULT_TEMPLATES = [
    {
        "template_code": "amooksco",
        "name": "Amooksco Logistics",
        "description": "Specialized China-Ghana logistics storefront with tracking, shipping estimator, and WhatsApp integration.",
        "preset": {
            "primary_color": "#1f5d72",
            "secondary_color": "#3aa6b9",
            "accent_color": "#eef6f8",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "white",
            "footer_style": "dark",
            "card_style": "rounded",
            "theme_class": "theme-amooksco",
            "image": "/images/amooksco-hero.png",
            "swatches": ["#1f5d72", "#3aa6b9", "#eef6f8"],
            "tags": ["Freight", "China-Ghana", "Tracking", "WhatsApp"],
            "storage_fees_enabled": True,
            "required_endpoints": [
                "GET /api/v1/fleetbase-proxy/drivers",
                "GET /api/v1/fleetbase-proxy/vehicles",
                "GET /api/v1/fleetbase-proxy/fleets",
                "GET /api/v1/fleetbase-proxy/orders",
                "GET /api/v1/shipments/{tenant_id}/track",
                "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}",
                "POST /api/v1/shipments/{tenant_id}/import/csv",
                "GET /api/v1/ai/chat",
            ],
            "features": ["tracking", "bulk_import", "ai_chat", "fleetbase_integration", "shipping_estimator"],
            "fallbacks": {
                "tracking": "show_mock_data",
                "fleetbase_integration": "show_static_message",
                "ai_chat": "hide_widget",
                "shipping_estimator": "use_default_rates",
            },
        },
    },
    {
        "template_code": "freight",
        "name": "Meridian Freight",
        "description": "Ocean, air, and land freight forwarding storefront with live quote and tracking flows.",
        "preset": {
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
            "storage_fees_enabled": True,
            "required_endpoints": [
                "GET /api/v1/shipments/{tenant_id}/track",
                "POST /api/v1/shipments/{tenant_id}/import/csv",
                "GET /api/v1/shipments/{tenant_id}/members",
                "GET /api/v1/ai/chat",
                "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}",
            ],
            "features": ["tracking", "bulk_import", "members", "ai_chat", "warehouse_notices", "customs_calculator", "storage_fees"],
            "fallbacks": {
                "tracking": "show_static_message",
                "ai_chat": "hide_widget",
                "warehouse_notices": "hide_section",
                "customs_calculator": "hide_section",
                "storage_fees": "hide_column",
            },
        },
    },
    {
        "template_code": "fleet",
        "name": "Vanta Fleet",
        "description": "Logistics-grade storefront for fleet operators — vehicle leasing, dispatch, and route management.",
        "preset": {
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
            "storage_fees_enabled": True,
            "required_endpoints": [
                "GET /api/v1/shipments/{tenant_id}/track",
                "POST /api/v1/shipments/{tenant_id}/import/csv",
                "GET /api/v1/shipments/{tenant_id}/members",
                "GET /api/v1/ai/chat",
                "GET /api/v1/vendors/marketplace",
            ],
            "features": ["tracking", "bulk_import", "members", "ai_chat", "maps", "vendor_marketplace", "bus_fleet", "storage_fees"],
            "fallbacks": {
                "tracking": "show_static_message",
                "ai_chat": "hide_widget",
                "maps": "hide_section",
                "vendor_marketplace": "hide_section",
                "bus_fleet": "hide_section",
                "storage_fees": "hide_column",
            },
        },
    },
    {
        "template_code": "ecommerce",
        "name": "Verde Goods",
        "description": "Clean, conversion-focused product store with collections, cart, and editorial sections.",
        "preset": {
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
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat", "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}"],
            "features": ["ai_chat", "tracking"],
            "fallbacks": {"ai_chat": "hide_widget", "tracking": "hide_section"},
        },
    },
    {
        "template_code": "mall",
        "name": "Lumière Mall",
        "description": "Premium multi-brand mall directory with stores, dining, events, and floor guide.",
        "preset": {
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
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat"],
            "features": ["ai_chat"],
            "fallbacks": {"ai_chat": "hide_widget"},
        },
    },
    {
        "template_code": "bookings",
        "name": "Skyline Travel",
        "description": "Multi-modal booking storefront for flights, buses, and event tickets with a search engine.",
        "preset": {
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
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat", "GET /api/v1/shipments/{tenant_id}/track"],
            "features": ["ai_chat", "tracking"],
            "fallbacks": {"ai_chat": "hide_widget", "tracking": "hide_section"},
        },
    },
    {
        "template_code": "restaurant",
        "name": "Ember & Oak",
        "description": "Atmospheric dining storefront with menu, reservations, and online ordering.",
        "preset": {
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
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat"],
            "features": ["ai_chat"],
            "fallbacks": {"ai_chat": "hide_widget"},
        },
    },
    {
        "template_code": "realestate",
        "name": "Haven Estates",
        "description": "Refined property listing storefront with search, featured homes, and agent profiles.",
        "preset": {
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
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat"],
            "features": ["ai_chat"],
            "fallbacks": {"ai_chat": "hide_widget"},
        },
    },
]
```

### Template Endpoints

**File**: `app/api/routes/storefront_templates.py`

```python
@router.get('', response_model=list[StorefrontTemplateResponse])
def list_templates(db: Session = Depends(get_db), _: User = Depends(require_tenant_admin)):
    # Try to get from cache first
    cache_key = "storefront_templates:list"
    cached_templates = cache_get(cache_key)
    if cached_templates:
        return cached_templates

    # Cache miss - query database
    seed_default_templates(db)
    templates = db.scalars(select(StorefrontTemplate).where(StorefrontTemplate.is_active.is_(True))).all()
    
    result = [
        StorefrontTemplateResponse(
            id=t.id,
            template_code=t.template_code,
            name=t.name,
            description=t.description,
            preset=json.loads(t.preset),
            is_active=t.is_active,
            created_at=t.created_at,
        )
        for t in templates
    ]
    
    # Cache the result for 1 hour
    cache_set(cache_key, result, ttl=3600)
    
    return result

@router.post('/select', response_model=dict)
def select_template(
    request: TenantTemplateSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict:
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail='User has no tenant')

    template = db.scalar(
        select(StorefrontTemplate).where(
            StorefrontTemplate.template_code == request.template_code,
            StorefrontTemplate.is_active.is_(True),
        )
    )
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')

    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')

    preset = json.loads(template.preset)

    # Apply template preset to tenant branding
    from app.services.tenant_branding_service import ensure_tenant_branding
    branding = ensure_tenant_branding(db, str(tenant.id), tenant.company_name, tenant.contact_email)
    branding.primary_color = preset.get("primary_color", branding.primary_color)
    branding.secondary_color = preset.get("secondary_color", branding.secondary_color)
    branding.accent_color = preset.get("accent_color", branding.accent_color)
    branding.background_color = preset.get("background_color", branding.background_color)
    branding.template_code = template.template_code
    db.add(branding)
    db.commit()

    # Run auto-fix plugins for the selected template
    from app.services.template_manifest_service import auto_fix_template_endpoints
    fix_results = auto_fix_template_endpoints(str(tenant.id), template.template_code, db)

    # Track failed endpoints for business liability
    failed_plugins = [item["plugin"] for item in fix_results.get("auto_fixed", []) if not item.get("success", False)]
    still_failing = fix_results.get("still_failing", [])
    all_failed = list(set(failed_plugins + still_failing))
    
    if all_failed:
        from datetime import datetime, timezone
        from app.models.audit import AuditEvent
        from app.services.notification_service import get_notification_service

        tenant.pending_endpoints = json.dumps(all_failed)
        tenant.pending_endpoints_notified_at = None
        db.add(tenant)

        # Create admin notification (audit event)
        audit_event = AuditEvent(
            actor_email=current_user.email,
            event_type="template_auto_fix_failed",
            entity_type="tenant",
            entity_id=str(tenant.id),
            details_json=json.dumps({
                "template_code": template.template_code,
                "template_name": template.name,
                "failed_endpoints": all_failed,
                "message": f"Tenant {tenant.company_name} switched to template {template.name} — endpoints could not be auto-fixed: {', '.join(all_failed)}"
            })
        )
        db.add(audit_event)

        # Send tenant notification about 72-hour warning
        try:
            notification_service = get_notification_service()
            subject = f"Template Change: Some features may not work for 72 hours"
            body = f"""
            <html>
                <body>
                    <p>Dear {tenant.company_name},</p>
                    <p>You have successfully switched to the <strong>{template.name}</strong> template.</p>
                    <p>However, some features could not be automatically configured:</p>
                    <ul>
                        {"".join(f"<li>{ep}</li>" for ep in all_failed)}
                    </ul>
                    <p>These features may not work for up to 72 hours while our team resolves the configuration. Your storefront will continue to function with graceful degradation for these features.</p>
                    <p>Our team has been notified and is working to resolve this. You will receive another notification when all features are fully operational.</p>
                    <p>Thank you for your patience.<br>The Afruheritage Team</p>
                </body>
            </html>
            """
            notification_service.send_email(to_email=tenant.contact_email, subject=subject, html_content=body)
            tenant.pending_endpoints_notified_at = datetime.now(timezone.utc)
            db.add(tenant)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send tenant notification for failed auto-fix: {e}")

        db.commit()
    else:
        # Clear pending endpoints if all succeeded
        tenant.pending_endpoints = None
        tenant.pending_endpoints_notified_at = None
        db.add(tenant)
        db.commit()

    return {
        "status": "success",
        "tenant_id": str(tenant.id),
        "template_code": template.template_code,
        "template_name": template.name,
        "auto_fix": fix_results,
        "failed_endpoints": all_failed if all_failed else None,
        "graceful_degradation": len(all_failed) > 0,
    }

# Admin-only template management endpoints

@router.post('/admin', response_model=StorefrontTemplateResponse)
def create_template(
    request: TemplateCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> StorefrontTemplateResponse:
    """Create a new template (admin only)."""
    existing = db.scalar(
        select(StorefrontTemplate).where(StorefrontTemplate.template_code == request.template_code)
    )
    if existing:
        raise HTTPException(status_code=400, detail='Template code already exists')
    
    template = StorefrontTemplate(
        template_code=request.template_code,
        name=request.name,
        description=request.description,
        preset=json.dumps(request.preset),
        is_active=True,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    # Invalidate cache
    cache_delete_pattern("storefront_templates:*")
    
    return StorefrontTemplateResponse(
        id=template.id,
        template_code=template.template_code,
        name=template.name,
        description=template.description,
        preset=json.loads(template.preset),
        is_active=template.is_active,
        created_at=template.created_at,
    )

@router.patch('/admin/{template_id}', response_model=StorefrontTemplateResponse)
def update_template(
    template_id: str,
    request: TemplateUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> StorefrontTemplateResponse:
    """Update an existing template (admin only)."""
    template = db.get(StorefrontTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')
    
    if request.name is not None:
        template.name = request.name
    if request.description is not None:
        template.description = request.description
    if request.preset is not None:
        template.preset = json.dumps(request.preset)
    if request.is_active is not None:
        template.is_active = request.is_active
    
    db.commit()
    db.refresh(template)
    
    # Invalidate cache
    cache_delete_pattern("storefront_templates:*")
    
    return StorefrontTemplateResponse(
        id=template.id,
        template_code=template.template_code,
        name=template.name,
        description=template.description,
        preset=json.loads(template.preset),
        is_active=template.is_active,
        created_at=template.created_at,
    )

@router.delete('/admin/{template_id}')
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> dict:
    """Delete a template (admin only)."""
    template = db.scalar(select(StorefrontTemplate).where(StorefrontTemplate.id == template_id))
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')
    
    db.delete(template)
    db.commit()
    
    # Invalidate cache
    cache_delete_pattern("storefront_templates:*")
    
    return {"message": "Template deleted successfully"}

@router.get('/admin/all', response_model=list[StorefrontTemplateResponse])
def list_all_templates(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> list[StorefrontTemplateResponse]:
    """List all templates including inactive ones (admin only)."""
    templates = db.scalars(select(StorefrontTemplate).order_by(StorefrontTemplate.created_at.desc())).all()
    return [
        StorefrontTemplateResponse(
            id=t.id,
            template_code=t.template_code,
            name=t.name,
            description=t.description,
            preset=json.loads(t.preset),
            is_active=t.is_active,
            created_at=t.created_at,
        )
        for t in templates
    ]
```

---

## Template Selection and Application

### Admin Console Template Selection

**File**: `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx`

```typescript
// Template selection drawer
{showTemplateDrawer && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Select Storefront Template</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setShowTemplateDrawer(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map(t => (
            <div
              key={t.id}
              className={`rounded-lg border p-4 cursor-pointer transition-all hover:border-primary ${selectedTemplate === t.template_code ? 'border-primary bg-primary/5' : ''}`}
              onClick={async () => {
                setSelectingTemplate(t.template_code)
                try {
                  await api.post('/admin/templates/select', { template_code: t.template_code })
                  setSelectedTemplate(t.template_code)
                  setShowTemplateDrawer(false)
                  toast.success(`Template "${t.name}" applied to tenant`)
                } catch (e: any) {
                  toast.error('Failed to select template: ' + e.message)
                } finally {
                  setSelectingTemplate(null)
                }}
              }
            >
              <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3 flex items-center justify-center">
                {t.preview_image ? (
                  <img src={t.preview_image} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.template_code}</p>
                </div>
                {selectedTemplate === t.template_code && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              {t.preset && (
                <div className="flex gap-1 mt-2">
                  {['primary_color', 'secondary_color', 'accent_color'].map(key => (
                    <div key={key} className="h-4 w-4 rounded border" style={{ backgroundColor: t.preset?.[key] || '#ccc' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)}

// Storefront configuration section
<TabsContent value="storefront" className="space-y-4">
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Storefront Template
        </CardTitle>
        <Button size="sm" onClick={() => setShowTemplateDrawer(true)}>
          <Palette className="h-4 w-4 mr-1" />
          {selectedTemplate ? 'Change Template' : 'Select Template'}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {selectedTemplate ? (
        <div className="flex items-center gap-4">
          {(() => {
            const t = templates.find(t => t.template_code === selectedTemplate)
            if (!t) return <span className="text-sm text-muted-foreground">{selectedTemplate}</span>
            return (
              <>
                <div className="flex gap-1">
                  {['primary_color', 'secondary_color', 'accent_color'].map(key => (
                    <div key={key} className="h-8 w-8 rounded border" style={{ backgroundColor: t.preset?.[key] || '#ccc' }} />
                  ))}
                </div>
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.template_code}</p>
                </div>
              </>
            )
          })()}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No storefront template selected for this tenant.</p>
          <Button className="mt-3" size="sm" onClick={() => setShowTemplateDrawer(true)}>
            <Palette className="h-4 w-4 mr-1" /> Choose a Template
          </Button>
        </div>
      )}
    </CardContent>
  </Card>

  {/* Storefront Configuration Drawers */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        Storefront Configuration
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">
        Configure your storefront appearance, content, and branding settings.
      </p>
      <div className="flex flex-wrap gap-3">
        <BrandingDrawer tenantId={id} />
        <NewArrivalsDrawer tenantId={id} />
        <GalleryDrawer tenantId={id} />
      </div>
    </CardContent>
  </Card>

  {/* Import Settings */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        Import Settings
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pseudo-Email Domain</label>
        <p className="text-xs text-muted-foreground mb-2">
          Domain suffix used when generating login emails for CSV-imported members without an email address.
          Format: <code className="bg-gray-100 px-1 rounded">phone@domain</code>
        </p>
        <input
          type="text"
          value={pseudoEmailDomain}
          onChange={(e) => setPseudoEmailDomain(e.target.value)}
          placeholder="phone.afruheritage.com"
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={async () => {
            setBrandingSaving(true)
            try {
              await api.patch(`/admin/templates/branding/${id}`, {
                pseudo_email_domain: pseudoEmailDomain,
              })
              toast.success('Import settings saved')
            } catch (e: any) {
              toast.error('Failed to save: ' + e.message)
            } finally {
              setBrandingSaving(false)
            }
          }}
          disabled={brandingSaving}
        >
          {brandingSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Import Settings
        </Button>
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

---

## Fleetbase Integration

### Fleetbase API Client

**File**: `app/services/fleetbase_api_client.py`

```python
"""
Fleetbase API client — replaces the SSH-based provisioner.

Fleetbase is running on the SAME server (fleetbase-httpd container, port 8004 on
the host / port 80 on the fleetbase_default Docker network).

Each freight-forwarding company that signs up gets their own Fleetbase
*Organisation* inside the shared Fleetbase instance.  This gives them full
feature isolation (drivers, orders, fleet, dispatch, GPS, etc.) at low overhead.

Network note
------------
The `afruheritage-api` container is on the `afruheritage-platform_default`
network; Fleetbase is on `fleetbase_default`.  They share the same HOST.
We reach Fleetbase via FLEETBASE_INTERNAL_URL which defaults to
`http://fleetbase-httpd` — the compose service name.  For that to resolve,
the afruheritage stack must be joined to the `fleetbase_default` network
(see docker-compose.yml `networks:` section added by this sprint).
As a fallback, the URL can be set to `http://host-gateway:8004` in .env.
"""

@dataclass
class FleetbaseOrg:
    """Everything returned from Fleetbase after successful org creation."""
    org_id: str          # Fleetbase's public_id / uuid for the company
    admin_user_id: str   # The org-owner user's id in Fleetbase
    api_key: str         # An API key scoped to this org (for runtime calls)
    admin_token: str     # Session token of the org-admin (for management calls)
    console_url: str     # URL to the Fleetbase console for this org

class FleetbaseAPIClient:
    """
    Thin wrapper around Fleetbase's internal auth + org management API.

    Usage::

        client = FleetbaseAPIClient()
        org = client.provision_org(
            company_name="Acme Cargo Ltd",
            admin_email="admin@acmecargo.com",
            admin_password="generated-or-provided",
            phone="+233201234567",
        )
        # org.org_id, org.api_key, org.admin_token are ready to store in Tenant
    """

    def __init__(self, base_url: str | None = None, timeout: int = 30) -> None:
        self._base = (base_url or settings.fleetbase_internal_url).rstrip("/")
        self._timeout = timeout
        # Retry/backoff settings for provisioning
        self._retries = getattr(settings, "fleetbase_provisioning_retries", 3)
        self._backoff = getattr(settings, "fleetbase_provisioning_backoff_seconds", 2)

    def provision_org(
        self,
        company_name: str,
        admin_email: str,
        admin_password: str,
        phone: str = "",
    ) -> FleetbaseOrg:
        """
        Create a brand-new Fleetbase user + organisation, then issue an API key.
        Returns a FleetbaseOrg with all credentials needed by our platform.
        """
        payload = {
            "user": {
                "name": company_name,
                "email": admin_email,
                "password": admin_password,
                "password_confirmation": admin_password,
                "phone": phone or "",
            },
            "company": {
                "name": company_name,
            },
        }

        last_exc: Exception | None = None
        for attempt in range(max(1, int(self._retries))):
            try:
                data = self._post(_SIGN_UP_PATH, payload)

                # sign-up returns {"token": "..."} — call bootstrap to get user+org details
                token = data.get("token") or self._extract(data, "token")
                bootstrap = self._get("/int/v1/auth/bootstrap", token=token)

                session = bootstrap.get("session", {})
                user_id = session.get("user") or ""
                organizations = bootstrap.get("organizations", [])
                org = organizations[0] if organizations else {}
                org_id = org.get("uuid") or org.get("public_id") or ""

                api_key = self._issue_api_key(token, org_id)
                console_url = self._build_console_url()

                logger.info(
                    "Fleetbase org provisioned",
                    extra={"company": company_name, "email": admin_email, "org_id": org_id},
                )
                return FleetbaseOrg(
                    org_id=str(org_id),
                    admin_user_id=str(user_id),
                    api_key=api_key,
                    admin_token=token,
                    console_url=console_url,
                )
            except Exception as exc:
                last_exc = exc
                # if not last attempt, wait with exponential backoff and retry
                if attempt < max(0, int(self._retries) - 1):
                    sleep_for = int(self._backoff) * (2 ** attempt)
                    logger.warning(
                        "Fleetbase provisioning attempt %d failed, retrying in %ds: %s",
                        attempt + 1,
                        sleep_for,
                        exc,
                    )
                    time.sleep(sleep_for)
                    continue
                # final failure — re-raise
                raise

    def login(self, email: str, password: str) -> str:
        """Return a session token for an existing Fleetbase user."""
        data = self._post(_LOGIN_PATH, {"email": email, "password": password, "identity": email})
        return self._extract(data, "token")

    def create_org_for_existing_user(
        self, token: str, org_name: str
    ) -> dict[str, Any]:
        """Create an additional org for a user that already has a Fleetbase account."""
        return self._post(_CREATE_ORG_PATH, {"name": org_name}, token=token)

    def _issue_api_key(self, token: str, org_id: str) -> str:
        """
        Attempt to create an API key via Fleetbase's key management API.
        Return ONLY a usable key/token string. If Fleetbase returns a credential
        object without a visible key, fall back to the admin session token.
        """
        def find_key(obj):
            if isinstance(obj, str) and len(obj) > 20:
                return obj
            if isinstance(obj, dict):
                preferred = [
                    "key",
                    "api_key",
                    "apiKey",
                    "token",
                    "access_token",
                    "secret",
                    "_key",
                ]
                for k in preferred:
                    v = obj.get(k)
                    if isinstance(v, str) and len(v) > 20 and v.lower() != "none":
                        return v

                for v in obj.values():
                    found = find_key(v)
                    if found:
                        return found

            if isinstance(obj, list):
                for item in obj:
                    found = find_key(item)
                    if found:
                        return found

            return None

        try:
            data = self._post(
                "/int/v1/api-credentials",
                {"name": "afruheritage-platform", "company_uuid": org_id},
                token=token,
            )
            key = find_key(data)
            if key:
                return key

            logger.warning(
                "Fleetbase API credential response had no visible key; using admin token fallback",
                extra={"org_id": org_id, "response_type": type(data).__name__},
            )
            return token
        except Exception as exc:
            logger.warning("Could not issue Fleetbase API key — using admin token as fallback: %s", exc)
            return token

    def _build_console_url(self) -> str:
        """
        Public Fleetbase console URL for users. Do not derive this from the
        internal API URL because the internal URL may be api.afruheritage.com:4203
        or 10.x.x.x.
        """
        return (getattr(settings, "fleetbase_console_url", "") or "https://fleet.afruheritage.com").rstrip("/")

# Module-level singleton — import this everywhere
fleetbase_client = FleetbaseAPIClient()
```

### Fleetbase Provisioning Endpoint

**File**: `app/api/routes/tenants.py`

```python
@router.post('/{tenant_id}/provision', response_model=TenantResponse)
def provision_tenant_fleetbase(tenant_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_superuser)) -> Tenant:
    """Manually trigger Fleetbase org provisioning for a tenant."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    if tenant.fleetbase_org_id:
        raise HTTPException(status_code=409, detail='Tenant already has a Fleetbase org')
    from app.services.fleetbase_api_client import fleetbase_client
    try:
        org = fleetbase_client.provision_org(
            company_name=tenant.company_name,
            admin_email=tenant.contact_email,
            admin_password=secrets.token_urlsafe(16),
            phone='',
        )
        tenant.fleetbase_org_id = org.org_id
        tenant.fleetbase_api_key = org.api_key
        tenant.fleetbase_admin_token = org.admin_token
        tenant.live_api_token = org.api_key
        tenant.live_console_url = org.console_url
        tenant.live_api_url = settings.fleetbase_internal_url.rstrip("/")
        tenant.launch_status = LaunchStatus.active
        db.commit()
        db.refresh(tenant)
        record_audit_event(db, current_user, 'tenant.provisioned.fleetbase', 'tenant', str(tenant.id), {'fleetbase_org_id': org.org_id})
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Fleetbase provisioning failed: {exc}') from exc
    return tenant
```

### Fleetbase Proxy Endpoints

**File**: `app/api/routes/storefront.py`

```python
from app.services.fleetbase_proxy import proxy_fleetbase_api, resolve_fleetbase_token

router = APIRouter()

@router.get("/storefront/{tenant_id}/orders")
def get_storefront_orders(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch order list for Storefront module for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    orders = proxy_fleetbase_api(tenant.live_api_url, "orders", token=resolve_fleetbase_token(tenant.live_api_token), auth_scheme=tenant.live_api_auth_scheme)
    return {"orders": orders, "tenant_id": tenant_id}

@router.get("/storefront/{tenant_id}/customers")
def get_storefront_customers(tenant_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetch customer list for Storefront module for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.live_api_url:
        raise HTTPException(status_code=404, detail="Tenant or Fleetbase API not found")
    customers = proxy_fleetbase_api(tenant.live_api_url, "customers", token=resolve_fleetbase_token(tenant.live_api_token), auth_scheme=tenant.live_api_auth_scheme)
    return {"customers": customers, "tenant_id": tenant_id}
```

---

## Storefront Configuration

### Tenant Branding Service

**File**: `app/services/tenant_branding_service.py` (inferred from usage)

```python
def ensure_tenant_branding(
    db: Session,
    tenant_id: str,
    company_name: str,
    contact_email: str,
) -> TenantBranding:
    """Ensure tenant branding record exists, creating if necessary."""
    branding = db.query(TenantBranding).filter(
        TenantBranding.tenant_id == tenant_id
    ).first()
    
    if not branding:
        branding = TenantBranding(
            tenant_id=tenant_id,
            company_name=company_name,
            contact_email=contact_email,
            primary_color="#0ea5e9",
            secondary_color="#1e293b",
            accent_color="#f59e0b",
            background_color="#ffffff",
            default_language="en",
            supported_languages="en,zh",
            maps_enabled=True,
            public_tracking_enabled=True,
            csv_import_enabled=True,
            group_members_enabled=True,
            max_group_members=5000,
            pseudo_email_domain="phone.afruheritage.com",
        )
        db.add(branding)
        db.commit()
        db.refresh(branding)
    
    return branding
```

### Frontend Tenant Context

**File**: `frontend/lib/tenant-context.ts`

```typescript
export interface TenantContext {
  id: string
  slug: string
  company_name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  default_currency: string
  default_language: 'en' | 'zh'
  supported_languages: string[]
  maps_enabled: boolean
  public_tracking_enabled: boolean
  csv_import_enabled: boolean
  group_members_enabled: boolean
  max_group_members: number
  support_email: string
  support_phone: string
  legal_footer_text: string
  legal_company_name: string
  theme_code: string
}

const DEFAULT_TENANT_CONTEXT: TenantContext = {
  id: 'platform',
  slug: 'platform',
  company_name: 'Afruheritage',
  logo_url: null,
  favicon_url: '/favicon.ico',
  primary_color: '#0ea5e9',
  secondary_color: '#64748b',
  accent_color: '#f59e0b',
  background_color: '#ffffff',
  text_color: '#0f172a',
  default_currency: 'GHS',
  default_language: 'en',
  supported_languages: ['en', 'zh'],
  maps_enabled: true,
  public_tracking_enabled: true,
  csv_import_enabled: true,
  group_members_enabled: true,
  max_group_members: 50,
  support_email: 'support@afruheritage.com',
  support_phone: '+233 30 123 4567',
  legal_footer_text: '© 2024 Afruheritage. All rights reserved.',
  legal_company_name: 'Afruheritage Logistics Ltd',
  theme_code: 'default',
}

export async function fetchTenantContextServer(slug: string): Promise<TenantContext | null> {
  // Emergency fix: Return Amooksco context without API call
  if (slug === 'amooskco' || slug.includes('amooskco')) {
    return {
      ...DEFAULT_TENANT_CONTEXT,
      id: 'amooskco',
      slug: 'amooskco',
      company_name: 'Amooksco Logistics',
      theme_code: 'amooksco',
    }
  }
  
  // Skip API calls during build time
  if (process.env.NEXT_PUBLIC_BUILD_TIME === 'true') {
    return DEFAULT_TENANT_CONTEXT
  }
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'
    const response = await fetch(`${baseUrl}/api/v1/tenant-context/${slug}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch tenant context:', error)
    return null
  }
}

export function applyTenantTheme(context: TenantContext): void {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  root.style.setProperty('--color-primary', context.primary_color)
  root.style.setProperty('--color-secondary', context.secondary_color)
  root.style.setProperty('--color-accent', context.accent_color)
  root.style.setProperty('--color-background', context.background_color)
  root.style.setProperty('--color-text', context.text_color)
  
  // Update favicon
  let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
  if (!favicon) {
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    document.head.appendChild(favicon)
  }
  if (context.favicon_url) {
    favicon.href = context.favicon_url
  }
  
  // Update page title
  if (context.id !== 'platform') {
    document.title = `${context.company_name}`
  }
}
```

---

## Template Auto-Fix System

### Template Manifest Service

**File**: `app/services/template_manifest_service.py` (inferred from usage)

```python
def auto_fix_template_endpoints(tenant_id: str, template_code: str, db: Session) -> dict:
    """
    Automatically configure required endpoints for a template.
    Returns a dict with auto_fixed results and still_failing endpoints.
    """
    from app.models.storefront_template import StorefrontTemplate
    
    template = db.query(StorefrontTemplate).filter(
        StorefrontTemplate.template_code == template_code
    ).first()
    
    if not template:
        return {"auto_fixed": [], "still_failing": []}
    
    preset = json.loads(template.preset)
    required_endpoints = preset.get("required_endpoints", [])
    fallbacks = preset.get("fallbacks", {})
    
    auto_fixed = []
    still_failing = []
    
    for endpoint in required_endpoints:
        # Try to auto-configure the endpoint
        success = _configure_endpoint(tenant_id, endpoint, db)
        
        if success:
            auto_fixed.append({
                "endpoint": endpoint,
                "plugin": _extract_plugin_name(endpoint),
                "success": True,
            })
        else:
            still_failing.append(endpoint)
            auto_fixed.append({
                "endpoint": endpoint,
                "plugin": _extract_plugin_name(endpoint),
                "success": False,
                "fallback": fallbacks.get(_extract_plugin_name(endpoint), "hide_section"),
            })
    
    return {
        "auto_fixed": auto_fixed,
        "still_failing": still_failing,
    }

def _configure_endpoint(tenant_id: str, endpoint: str, db: Session) -> bool:
    """Attempt to configure a single endpoint for a tenant."""
    # Implementation would check if the endpoint exists and configure it
    # This is a placeholder for the actual implementation
    return True

def _extract_plugin_name(endpoint: str) -> str:
    """Extract plugin name from endpoint path."""
    # Extract feature name from endpoint
    # e.g., "GET /api/v1/ai/chat" -> "ai_chat"
    parts = endpoint.split("/")
    if "ai" in parts:
        return "ai_chat"
    if "fleetbase" in parts:
        return "fleetbase_integration"
    if "shipments" in parts and "track" in parts:
        return "tracking"
    if "import" in parts and "csv" in parts:
        return "bulk_import"
    return "unknown"

def get_endpoint_health_all_tenants(db: Session) -> list[dict]:
    """Get endpoint health for all tenants (admin only)."""
    from app.models.tenant import Tenant
    
    tenants = db.query(Tenant).filter(Tenant.launch_status == LaunchStatus.active).all()
    
    results = []
    for tenant in tenants:
        if tenant.pending_endpoints:
            results.append({
                "tenant_id": str(tenant.id),
                "company_name": tenant.company_name,
                "subdomain": tenant.slug,
                "pending_endpoints": json.loads(tenant.pending_endpoints),
                "notified_at": tenant.pending_endpoints_notified_at,
            })
    
    return results
```

### Template Health Monitoring

**File**: `app/api/routes/storefront_templates.py`

```python
@router.get('/admin/endpoint-health')
def get_endpoint_health(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> list[dict]:
    """Get endpoint health for all tenants (admin only)."""
    from app.services.template_manifest_service import get_endpoint_health_all_tenants
    return get_endpoint_health_all_tenants(db)

@router.get('/admin/{template_code}/manifest')
def get_template_manifest(
    template_code: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> dict:
    """Get the full manifest for a template (admin only)."""
    template = db.scalar(
        select(StorefrontTemplate).where(StorefrontTemplate.template_code == template_code)
    )
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')
    preset = json.loads(template.preset)
    return {
        "template_code": template.template_code,
        "name": template.name,
        "description": template.description,
        "manifest": preset,
    }
```

---

**End of Part 2**
