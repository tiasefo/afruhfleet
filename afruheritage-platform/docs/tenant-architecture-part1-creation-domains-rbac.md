# Tenant Architecture Part 1: Creation, Domains, and RBAC

**Document Status**: Complete Codebase Documentation  
**Last Updated**: 2026-07-05  
**Scope**: Tenant creation flow, subdomain/custom domain handling, RBAC inheritance

---

## Table of Contents

1. [Tenant Creation Models and Schemas](#tenant-creation-models-and-schemas)
2. [Subdomain and Custom Domain Handling](#subdomain-and-custom-domain-handling)
3. [RBAC Inheritance (Platform → Tenant → Customer)](#rbac-inheritance-platform--tenant--customer)
4. [Tenant Creation Service](#tenant-creation-service)
5. [Tenant Context Resolution](#tenant-context-resolution)

---

## Tenant Creation Models and Schemas

### Core Tenant Model

**File**: `app/models/tenant.py`

```python
class Tenant(Base):
    __tablename__ = 'tenants'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    company_name: Mapped[str] = mapped_column(String(255), unique=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    contact_email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    plan_code: Mapped[str] = mapped_column(String(80))
    requested_domain: Mapped[str] = mapped_column(String(255), unique=True)
    domain_type: Mapped[DomainType] = mapped_column(Enum(DomainType), default=DomainType.provider_subdomain)
    launch_status: Mapped[LaunchStatus] = mapped_column(Enum(LaunchStatus), default=LaunchStatus.pending_verification)
    verification_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    runner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('runner_nodes.id'), nullable=True)
    live_console_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    live_api_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    live_api_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    live_api_auth_scheme: Mapped[str | None] = mapped_column(String(32), nullable=True, default='bearer')
    fleetbase_install_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subdomain: Mapped[str | None] = mapped_column(String(120), unique=False, index=True, nullable=True)
    custom_domain: Mapped[str | None] = mapped_column(String(255), unique=False, nullable=True)
    custom_domain_verified: Mapped[bool] = mapped_column(default=False)
    
    # Fleetbase org provisioned for this tenant
    fleetbase_org_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    fleetbase_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    fleetbase_admin_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Gallery settings
    whatsapp_channel_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Template auto-fix tracking
    pending_endpoints: Mapped[str | None] = mapped_column(Text, nullable=True)
    pending_endpoints_notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

### Domain Types

```python
class DomainType(str, enum.Enum):
    provider_subdomain = 'provider_subdomain'  # tenant.afruheritage.com
    customer_domain = 'customer_domain'         # custom domain like mycompany.com
```

### Launch Status Flow

```python
class LaunchStatus(str, enum.Enum):
    draft = 'draft'
    pending_verification = 'pending_verification'
    approved = 'approved'
    queued = 'queued'
    provisioning = 'provisioning'
    active = 'active'
    failed = 'failed'
    suspended = 'suspended'
```

### Tenant Schemas

**File**: `app/schemas/tenant.py`

```python
class TenantCreate(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    contact_email: EmailStr
    plan_code: str = Field(min_length=2, max_length=80)
    requested_domain: str = Field(min_length=3, max_length=255)
    domain_type: str
    verification_notes: str | None = None

class TenantResponse(BaseModel):
    id: UUID
    company_name: str
    slug: str
    contact_email: EmailStr
    plan_code: str
    requested_domain: str
    domain_type: str
    launch_status: str
    live_console_url: str | None
    live_api_url: str | None
    fleetbase_install_path: str | None
    fleetbase_org_id: str | None
    fleetbase_api_key: str | None
    whatsapp_channel_url: str | None
    created_at: datetime

class TenantCreationRequest(BaseModel):
    company_name: str
    contact_email: EmailStr
    contact_name: str
    business_type: str
    country: str
    city: str
    address: str
    phone: str
    website: str | None = None
    plan: str = "free_trial"

class TenantCreationResponse(BaseModel):
    tenant_id: str
    subdomain: str
    company_name: str
    portal_url: str
    status: str
    message: str
```

### Tenant Branding Model

**File**: `app/models/tenant_branding.py`

```python
class TenantBranding(Base):
    __tablename__ = "tenant_branding"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    primary_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#0ea5e9")
    secondary_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#1e293b")
    accent_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#f59e0b")
    background_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#ffffff")

    legal_company_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    legal_footer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    terms_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    privacy_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    support_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    notification_from_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notification_from_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_signature_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    default_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    supported_languages: Mapped[str] = mapped_column(String(100), nullable=False, default="en,zh")

    # Feature flags
    maps_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    public_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    csv_import_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    group_members_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_group_members: Mapped[int] = mapped_column(nullable=False, default=5000)
    template_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    storefront_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    pseudo_email_domain: Mapped[str] = mapped_column(String(255), nullable=False, default="phone.afruheritage.com")
    
    # Additional feature flags
    bus_fleet_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    storage_fees_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fleetbase_integration_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    shipping_estimator_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_mock_tracking_data: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tracking_data_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
```

---

## Subdomain and Custom Domain Handling

### Custom Domain Model

**File**: `app/models/custom_domains.py`

```python
class DomainType(str, PyEnum):
    PROVIDER_SUBDOMAIN = "provider_subdomain"
    CUSTOMER_DOMAIN = "customer_domain"
    PLATFORM_SUBDOMAIN = "platform_subdomain"
    CUSTOMER_SUBDOMAIN = "customer_subdomain"
    APEX = "apex"

class DomainStatus(str, PyEnum):
    REQUESTED = "requested"
    PENDING_VERIFICATION = "pending_verification"
    PENDING_SSL = "pending_ssl"
    ACTIVE = "active"
    FAILED = "failed"
    DISABLED = "disabled"
    REMOVED = "removed"

class CustomDomain(Base):
    __tablename__ = "custom_domains"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    hostname: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    domain_type: Mapped[DomainType] = mapped_column(Enum(DomainType, values_callable=enum_values), nullable=False)
    status: Mapped[DomainStatus] = mapped_column(Enum(DomainStatus, values_callable=enum_values), nullable=False, default=DomainStatus.REQUESTED)
    provider: Mapped[DomainProvider] = mapped_column(Enum(DomainProvider, values_callable=enum_values), nullable=False, default=DomainProvider.CLOUDFLARE)

    verification_method: Mapped[VerificationMethod] = mapped_column(Enum(VerificationMethod, values_callable=enum_values), nullable=False, default=VerificationMethod.NONE)
    verification_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_value: Mapped[str | None] = mapped_column(Text, nullable=True)

    ssl_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    routing_target: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cloudflare_hostname_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    fallback_hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fallback_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    redirect_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    redirect_status: Mapped[int] = mapped_column(default=301)

    auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    renewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class TenantDomainSettings(Base):
    __tablename__ = "tenant_domain_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)

    platform_subdomain: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    active_primary_hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    fallback_hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    fallback_always_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
```

### Custom Domain Endpoints

**File**: `app/api/routes/custom_domains.py`

```python
@router.get('/resolve', response_model=dict)
def resolve_hostname(hostname: str = Query(..., description="Full hostname to resolve"), db: Session = Depends(get_db)):
    """Public endpoint — resolves any hostname (subdomain OR custom domain) to a tenant_id.
    Called by Next.js middleware on every request from unknown hostnames."""
    hostname = hostname.strip().lower()

    # 1. Check custom domain table for an active match
    domain = db.query(CustomDomain).filter(
        CustomDomain.hostname == hostname,
        CustomDomain.status == DomainStatus.ACTIVE,
    ).first()
    if domain:
        return {'tenant_id': str(domain.tenant_id), 'hostname': hostname, 'source': 'custom_domain'}

    # 2. Also allow pending-verification domains so companies can test before SSL is live
    domain = db.query(CustomDomain).filter(
        CustomDomain.hostname == hostname,
    ).first()
    if domain:
        return {'tenant_id': str(domain.tenant_id), 'hostname': hostname, 'source': 'custom_domain', 'status': domain.status.value}

    # 3. Try subdomain → tenant slug lookup via TenantDomainSettings
    settings_row = db.query(TenantDomainSettings).filter(
        TenantDomainSettings.platform_subdomain == hostname,
    ).first()
    if settings_row:
        return {'tenant_id': str(settings_row.tenant_id), 'hostname': hostname, 'source': 'platform_subdomain'}

    raise HTTPException(status_code=404, detail='Hostname not associated with any tenant.')

@router.post('/request', response_model=DomainResponse)
def request_domain(tenant_id: str, request: DomainRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    effective_tenant_id = current_user.tenant_id
    tenant_slug = str(effective_tenant_id)[:12].replace('-', '')
    try:
        domain = request_custom_domain(db=db, tenant_id=effective_tenant_id, hostname=request.hostname, domain_type=request.domain_type, tenant_slug=tenant_slug, created_by=request.created_by)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return DomainResponse(...)

@router.get('/tenant/{tenant_id}', response_model=list[DomainResponse])
def get_tenant_domains(tenant_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = list_tenant_domains(db, tenant_id)
    return [DomainResponse(...) for x in rows]
```

### Frontend Tenant Resolution

**File**: `frontend/lib/tenant.ts`

```typescript
const HOSTS_WITHOUT_TENANT = new Set([
  'localhost',
  '127.0.0.1',
  'afruheritage.com',
  'www.afruheritage.com',
  'app.afruheritage.com',
])

export function getTenantFromHostname(): string | null {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname.toLowerCase().trim()
  if (!host || HOSTS_WITHOUT_TENANT.has(host) || isIpAddressHost(host)) return null

  const parts = host.split('.')
  if (parts.length < 2) return null
  const subdomain = parts[0]?.trim()
  return subdomain || null
}

export function resolveTenantId(options?: { preferHost?: boolean }): string | null {
  const preferHost = options?.preferHost ?? false
  const stored = getStoredTenantId()
  const hostTenant = getTenantFromHostname()
  return preferHost ? (hostTenant || stored) : (stored || hostTenant)
}

export function getTenantFromMetaTag(): string | null {
  if (typeof document === 'undefined') return null
  const meta = document.querySelector('meta[name="x-tenant-id"]') as HTMLMetaElement | null
  return meta?.content?.trim() || null
}

export function resolvePublicTenantId(): string | null {
  return getQueryTenantId() || getTenantFromMetaTag() || resolveTenantId({ preferHost: true })
}
```

### Next.js Middleware Tenant Resolution

**File**: `frontend/middleware.ts`

```typescript
// 0. Check for storefront subdomains and redirect to their specific routes
const subdomain = isPlatformSubdomain(host)
if (subdomain && STOREFRONT_SUBDOMAINS[subdomain]) {
  const storefrontPath = STOREFRONT_SUBDOMAINS[subdomain]
  // Skip redirect for API requests - let them pass through to backend
  if (pathname.startsWith('/api/')) {
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', subdomain)
    return res
  }
  // If not already on the storefront path, redirect
  if (!pathname.startsWith(storefrontPath)) {
    const storefrontUrl = new URL(storefrontPath, req.url)
    const res = NextResponse.redirect(storefrontUrl)
    res.headers.set('x-tenant-slug', subdomain)
    return res
  }
  // Already on storefront path, inject tenant slug header
  const res = NextResponse.next()
  res.headers.set('x-tenant-slug', subdomain)
  return res
}
```

---

## RBAC Inheritance (Platform → Tenant → Customer)

### User Model

**File**: `app/models/user.py`

```python
class UserRole(str, enum.Enum):
    personal_shipper = "personal_shipper"
    delivery_driver  = "delivery_driver"
    company_admin    = "company_admin"
    platform_admin   = "platform_admin"
    dispatcher       = "dispatcher"
    warehouse        = "warehouse"
    customer         = "customer"
    vendor           = "vendor"
    support          = "support"
    accounting       = "accounting"

class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.personal_shipper, nullable=False)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('tenants.id'), nullable=True, index=True)
    is_tenant_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False, server_default='false')
    must_reset_password: Mapped[bool] = mapped_column(Boolean, default=False)
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # RBAC Relationships
    user_roles: Mapped[list[UserRBACRole]] = relationship(
        UserRBACRole,
        back_populates="user",
        foreign_keys=[UserRBACRole.user_id],
    )
    activity_logs: Mapped[list["UserActivityLog"]] = relationship("UserActivityLog", back_populates="user")
    sessions: Mapped[list["UserSession"]] = relationship("UserSession", back_populates="user")
```

### RBAC Models

**File**: `app/models/rbac.py`

```python
class PermissionType(str, PyEnum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"
    CREATE = "create"
    UPDATE = "update"
    VIEW = "view"
    MANAGE = "manage"

class ResourceType(str, PyEnum):
    TENANTS = "tenants"
    USERS = "users"
    BILLING = "billing"
    VENDORS = "vendors"
    RUNNERS = "runners"
    RUNTIMES = "runtimes"
    DOMAINS = "domains"
    KYC = "kyc"
    TRACKING = "tracking"
    TICKETS = "tickets"
    ANALYTICS = "analytics"
    SYSTEM = "system"
    CRM = "crm"
    REPORTS = "reports"
    SETTINGS = "settings"

class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    resource_type: Mapped[ResourceType] = mapped_column(String(50), nullable=False)
    permission_type: Mapped[PermissionType] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="permission")

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system_role: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="role")
    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="role")
    tenant: Mapped["Tenant"] = relationship("Tenant", foreign_keys=[tenant_id])

class RolePermission(Base):
    __tablename__ = "role_permissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    permission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("permissions.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    role: Mapped[Role] = relationship("Role", back_populates="role_permissions")
    permission: Mapped[Permission] = relationship("Permission", back_populates="role_permissions")

class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    assigned_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="user_roles", foreign_keys=[user_id])
    role: Mapped[Role] = relationship("Role", back_populates="user_roles")
    assigned_by_user: Mapped["User"] = relationship("User", foreign_keys=[assigned_by])
    tenant: Mapped["Tenant"] = relationship("Tenant", foreign_keys=[tenant_id])
```

### RBAC Hierarchy

**Platform Level**:
- `platform_admin` role (is_superuser = True)
- Full access to all tenants, system settings, billing
- Can create/modify/delete any tenant
- Can assign tenant-specific roles

**Tenant Level**:
- `company_admin` role (is_tenant_admin = True)
- Full access within their tenant
- Can manage tenant users
- Can assign tenant-specific roles to users
- Cannot access other tenants

**Customer Level**:
- `customer` role
- Limited access to their own data
- Can view shipments, tracking
- Cannot manage other users
- Scoped to specific tenant

### Tenant User Management Endpoints

**File**: `app/api/routes/tenants.py`

```python
@router.get("/{tenant_id}/users")
def list_tenant_users(tenant_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_superuser)):
    """List all users for a specific tenant."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    users = db.scalars(select(User).where(User.tenant_id == _resolve_uuid(tenant_id))).all()
    
    return {
        "tenant_id": tenant_id,
        "users": [
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "is_tenant_admin": user.is_tenant_admin,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }
            for user in users
        ]
    }

@router.post("/{tenant_id}/users")
def create_tenant_user(tenant_id: str, payload: TenantUserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_superuser)):
    """Create a new user for a specific tenant with a role."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Find or create the role
    role = db.scalar(
        select(Role).where(
            (Role.name == payload.role_name) & 
            ((Role.tenant_id == _resolve_uuid(tenant_id)) | (Role.tenant_id == None))
        )
    )
    if not role:
        # Create tenant-specific role if it doesn't exist
        role = Role(
            name=payload.role_name,
            display_name=payload.role_name.replace("_", " ").title(),
            description=f"Tenant-specific role for {tenant.company_name}",
            tenant_id=_resolve_uuid(tenant_id),
            is_system_role=False,
            is_public=True,
        )
        db.add(role)
        db.commit()
        db.refresh(role)
    
    # Create user
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        tenant_id=_resolve_uuid(tenant_id),
        is_tenant_admin=(payload.role_name == "tenant_admin"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Assign role
    user_role = UserRole(
        user_id=user.id,
        role_id=role.id,
        tenant_id=_resolve_uuid(tenant_id),
        assigned_by=current_user.id,
    )
    db.add(user_role)
    db.commit()
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": payload.role_name,
        "tenant_id": tenant_id,
    }

@router.patch("/{tenant_id}/users/{user_id}/role")
def update_tenant_user_role(tenant_id: str, user_id: str, payload: TenantUserRoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_superuser)):
    """Update a tenant user's role."""
    tenant = db.get(Tenant, _resolve_uuid(tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    user = db.get(User, _resolve_uuid(user_id))
    if not user or user.tenant_id != _resolve_uuid(tenant_id):
        raise HTTPException(status_code=404, detail="User not found in this tenant")
    
    # Find the role
    role = db.scalar(
        select(Role).where(
            (Role.name == payload.role_name) & 
            ((Role.tenant_id == _resolve_uuid(tenant_id)) | (Role.tenant_id == None))
        )
    )
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Deactivate existing role assignments
    existing_roles = db.scalars(
        select(UserRole).where(
            (UserRole.user_id == user.id) & 
            (UserRole.tenant_id == _resolve_uuid(tenant_id)) &
            (UserRole.is_active == True)
        )
    ).all()
    for ur in existing_roles:
        ur.is_active = False
    
    # Create new role assignment
    user_role = UserRole(
        user_id=user.id,
        role_id=role.id,
        tenant_id=_resolve_uuid(tenant_id),
        assigned_by=current_user.id,
    )
    db.add(user_role)
    
    # Update tenant admin flag if role is tenant_admin
    user.is_tenant_admin = (payload.role_name == "tenant_admin")
    
    db.commit()
    
    return {"detail": "User role updated successfully"}
```

---

## Tenant Creation Service

**File**: `app/services/tenant_creation_service.py`

```python
class TenantCreationService:
    """Complete tenant creation service with subdomain and branding setup"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_tenant_from_request(
        self,
        company_name: str,
        contact_email: str,
        contact_name: str,
        business_type: str,
        country: str,
        city: str,
        address: str,
        phone: str,
        website: str | None = None,
        plan: str = "free_trial",
        **kwargs
    ) -> Tenant:
        """Create a complete tenant with subdomain and initial setup"""
        
        try:
            # Generate unique slug/subdomain identifier
            slug = self._generate_slug(company_name)
            requested_domain = (kwargs.get("requested_domain") or f"{slug}.{settings.default_subdomain_base}").lower()
            domain_type = kwargs.get("domain_type") or DomainType.provider_subdomain
            if isinstance(domain_type, str):
                domain_type = DomainType(domain_type)

            if self.db.query(Tenant).filter((Tenant.slug == slug) | (Tenant.contact_email == contact_email.lower()) | (Tenant.requested_domain == requested_domain)).first():
                raise ValueError("Tenant already exists with same slug, email, or requested domain")

            # Create tenant record
            tenant = Tenant(
                company_name=company_name,
                slug=slug,
                contact_email=contact_email,
                plan_code=plan,
                requested_domain=requested_domain,
                domain_type=domain_type,
                verification_notes=kwargs.get("verification_notes"),
                launch_status=LaunchStatus.pending_verification,
                runner_id=None,
                fleetbase_install_path=None,
                live_console_url=None,
                live_api_url=None,
                live_api_token=None,
                live_api_auth_scheme='bearer',
                subdomain=slug,
                custom_domain=website.lower().replace("https://", "").replace("http://", "") if website else None,
                custom_domain_verified=False,
            )
            
            self.db.add(tenant)
            self.db.commit()
            self.db.refresh(tenant)

            if plan == "free_trial":
                create_trial_subscription(self.db, tenant_id=str(tenant.id))
                ensure_wallet(self.db, tenant_id=str(tenant.id))
            
            logger.info("Tenant created", extra={
                "tenant_id": str(tenant.id),
                "subdomain": slug,
                "company_name": company_name,
                "plan": plan,
                "contact_email": contact_email
            })

            business_logger.info("tenant.created", extra={"tenant_id": str(tenant.id), "company_name": company_name, "subdomain": slug, "plan": plan, "contact_email": contact_email})
            
            return tenant
            
        except Exception as e:
            logger.error("Failed to create tenant", extra={
                "company_name": company_name,
                "contact_email": contact_email,
                "error": str(e)
            })
            raise
    
    def _generate_slug(self, company_name: str) -> str:
        """Generate unique tenant slug from company name"""
        base = slugify(company_name)

        # Limit length
        if len(base) > 20:
            base = base[:20]
        
        # Ensure it starts with letter
        if base and base[0].isdigit():
            base = f"co{base}"
        
        # Add random suffix if too short
        if len(base) < 3:
            base = f"co{secrets.token_hex(2)}"
        
        # Check for uniqueness
        original = base
        counter = 1
        while self.db.query(Tenant).filter(Tenant.slug == base).first():
            base = f"{original}{counter}"
            counter += 1

        return base
    
    def setup_tenant_infrastructure(self, tenant: Tenant) -> dict[str, Any]:
        """Queue tenant infrastructure provisioning using the canonical async launch flow."""
        if tenant.launch_status != LaunchStatus.approved:
            raise ValueError("Tenant must be approved before infrastructure setup")

        job = self.queue_tenant_launch(tenant)

        return {
            "tenant_id": str(tenant.id),
            "subdomain": tenant.slug,
            "custom_domain": tenant.custom_domain,
            "runner_id": str(tenant.runner_id) if tenant.runner_id else None,
            "job_id": str(job.id),
            "task_id": job.task_id,
            "status": "queued",
            "message": "Tenant provisioning queued.",
        }

    def queue_tenant_launch(self, tenant: Tenant, runner_id: str | None = None) -> ProvisioningJob:
        """Queue tenant provisioning through the canonical async launch pipeline."""
        assert_tenant_launch_ready(self.db, str(tenant.id))

        runner = select_runner_for_tenant(self.db, explicit_runner_id=runner_id)
        tenant.runner_id = runner.id
        tenant.launch_status = LaunchStatus.queued

        job = ProvisioningJob(
            tenant_id=tenant.id,
            status=LaunchStatus.queued,
            details="Queued for Fleetbase deployment.",
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(tenant)
        self.db.refresh(job)

        sync_runtime_from_tenant(self.db, tenant, status=LaunchStatus.queued)

        ensure_tenant_ai_settings(
            self.db,
            tenant_id=str(tenant.id),
            tenant_slug=tenant.slug,
            company_name=tenant.company_name,
        )
        ensure_tenant_branding(
            self.db,
            tenant_id=str(tenant.id),
            company_name=tenant.company_name,
            contact_email=tenant.contact_email,
        )

        async_result = provision_tenant.delay(str(job.id))
        job.task_id = async_result.id
        self.db.commit()
        self.db.refresh(job)
        return job
```

---

## Tenant Context Resolution

**File**: `app/services/tenant_context_service.py`

```python
def resolve_tenant(db: Session, identifier: str) -> Optional[Tenant]:
    """Resolve a tenant by UUID, slug, subdomain, or custom domain."""
    tenant_uuid = _as_uuid(identifier)
    if tenant_uuid:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_uuid).first()
        if tenant:
            return tenant

    tenant = resolve_tenant_by_slug(db, identifier)
    if tenant:
        return tenant

    tenant = resolve_tenant_by_subdomain(db, identifier)
    if tenant:
        return tenant

    tenant = resolve_tenant_by_domain(db, identifier)
    if tenant:
        return tenant

    return None

def build_tenant_context(
    db: Session,
    tenant: Tenant,
    branding: Optional[TenantBranding] = None,
) -> TenantContextResponse:
    """Assemble a complete TenantContext from Tenant + Branding + Subscription."""

    if branding is None:
        branding = db.query(TenantBranding).filter(
            TenantBranding.tenant_id == tenant.id
        ).first()

    sub_info = _get_subscription_info(db, str(tenant.id))

    if branding:
        supported_langs = [
            lang.strip()
            for lang in (branding.supported_languages or "en").split(",")
            if lang.strip()
        ]

        theme = TenantTheme(
            primary_color=branding.primary_color,
            secondary_color=branding.secondary_color,
            accent_color=branding.accent_color,
            background_color=branding.background_color,
            foreground_color="#0f172a",
            success_color="#22c55e",
            warning_color="#f59e0b",
            danger_color="#ef4444",
            font_family="Inter, sans-serif",
            radius="0.625rem",
            logo_url=branding.logo_url,
            favicon_url=branding.favicon_url,
            og_image_url=None,
        )

        contact = TenantContact(
            support_email=branding.support_email,
            support_phone=branding.support_phone,
            support_url=branding.support_url,
            notification_from_name=branding.notification_from_name,
            notification_from_email=branding.notification_from_email,
        )

        legal = TenantLegal(
            legal_company_name=branding.legal_company_name,
            legal_footer_text=branding.legal_footer_text,
            terms_url=branding.terms_url,
            privacy_url=branding.privacy_url,
        )

        features = TenantFeatureFlags(
            maps_enabled=branding.maps_enabled,
            public_tracking_enabled=branding.public_tracking_enabled,
            csv_import_enabled=branding.csv_import_enabled,
            group_members_enabled=branding.group_members_enabled,
            max_group_members=branding.max_group_members,
            ai_enabled="ai_basic" in sub_info.features or "ai_advanced" in sub_info.features,
            marketplace_enabled="marketplace_basic" in sub_info.features or "marketplace_gps" in sub_info.features,
            custom_domains_enabled=tenant.custom_domain is not None,
        )

        seo = TenantSEO(
            title=f"{branding.company_name} | {branding.tagline or 'Logistics & Freight Forwarding'}",
            description=branding.tagline or f"{branding.company_name} — professional logistics and freight forwarding services.",
            keywords=["logistics", "freight forwarding", "shipping", "cargo"],
            og_title=f"{branding.company_name}",
            og_description=branding.tagline or f"{branding.company_name} — professional logistics and freight forwarding services.",
            twitter_card="summary_large_image",
            canonical_url=tenant.custom_domain or f"https://{tenant.subdomain}" if tenant.subdomain else None,
            robots="index, follow",
        )

        return TenantContextResponse(
            id=str(tenant.id),
            slug=tenant.slug,
            company_name=branding.company_name,
            tagline=branding.tagline,
            domain=tenant.requested_domain,
            subdomain=tenant.subdomain,
            custom_domain=tenant.custom_domain,
            whatsapp_channel_url=tenant.whatsapp_channel_url,
            default_language=branding.default_language,
            supported_languages=supported_langs,
            template_code=branding.template_code,
            storefront_config=branding.storefront_config,
            theme=theme,
            contact=contact,
            legal=legal,
            features=features,
            subscription=sub_info,
            seo=seo,
            created_at=branding.created_at,
            updated_at=branding.updated_at,
        )

    # Fallback: no branding row exists yet — return defaults with tenant data
    theme = TenantTheme()
    contact = TenantContact()
    legal = TenantLegal()
    features = TenantFeatureFlags(
        custom_domains_enabled=tenant.custom_domain is not None,
    )
    seo = TenantSEO(
        title=f"{tenant.company_name} | Logistics & Freight Forwarding",
        description=f"{tenant.company_name} — professional logistics and freight forwarding services.",
        keywords=["logistics", "freight forwarding", "shipping", "cargo"],
        og_title=tenant.company_name,
        og_description=f"{tenant.company_name} — professional logistics and freight forwarding services.",
        twitter_card="summary_large_image",
        robots="index, follow",
    )

    return TenantContextResponse(
        id=str(tenant.id),
        slug=tenant.slug,
        company_name=tenant.company_name,
        tagline=None,
        domain=tenant.requested_domain,
        subdomain=tenant.subdomain,
        custom_domain=tenant.custom_domain,
        whatsapp_channel_url=tenant.whatsapp_channel_url,
        default_language="en",
        supported_languages=["en"],
        template_code=None,
        storefront_config=None,
        theme=theme,
        contact=contact,
        legal=legal,
        features=features,
        subscription=sub_info,
        seo=seo,
    )
```

### Tenant Context Endpoints

**File**: `app/api/routes/tenant_context.py`

```python
@router.get("/{identifier}", response_model=TenantContextResponse)
def get_public_tenant_context(
    identifier: str,
    db: Session = Depends(get_db),
):
    """Public endpoint: fetch full tenant context by slug, subdomain, custom domain, or UUID.
    No authentication required — this is used by the storefront and public website."""
    context = get_tenant_context(db, identifier)
    if not context:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return context

@router.get("/resolve/host", response_model=TenantContextResponse)
def resolve_tenant_by_host(
    request: Request,
    db: Session = Depends(get_db),
):
    """Resolve tenant from the Host header (subdomain or custom domain).
    No authentication required."""
    host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
    host = host.split(":")[0].lower()

    if not host or host in ("localhost", "127.0.0.1", "0.0.0.0"):
        raise HTTPException(status_code=400, detail="Cannot resolve tenant from localhost")

    # Try custom domain first, then subdomain
    from app.models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.custom_domain == host).first()
    if not tenant:
        # Extract subdomain (e.g., "amooksco" from "amooksco.afruheritage.com")
        parts = host.split(".")
        if len(parts) >= 3:
            subdomain = parts[0]
            tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="No tenant found for host: " + host)

    from app.services.tenant_context_service import build_tenant_context
    return build_tenant_context(db, tenant)

@router.get("/subdomain/{subdomain}", response_model=TenantContextResponse)
def resolve_tenant_by_subdomain(
    subdomain: str,
    db: Session = Depends(get_db),
):
    """Resolve tenant by subdomain (e.g., amooksco for amooksco.afruheritage.com).
    No authentication required - used for storefront routing."""
    from app.models.tenant import Tenant
    from app.services.tenant_context_service import build_tenant_context
    
    tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"No tenant found for subdomain: {subdomain}")
    
    return build_tenant_context(db, tenant)
```

---

**End of Part 1**
