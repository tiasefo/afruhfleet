"""
Company (Freight Forwarding) Registration
==========================================
Separate from personal-shipper and driver registration.

Flow
----
1.  POST /api/v1/companies/register  (public, rate-limited)
2.  Creates a User (role=company_admin) + Tenant record in our DB
3.  Calls Fleetbase API to provision an Organisation for this company
4.  Stores the Fleetbase org credentials against the Tenant
5.  Returns the subdomain / portal URL immediately; Fleetbase org is ready

The company admin can then log in to their portal at:
    https://{slug}.{DEFAULT_SUBDOMAIN_BASE}
which is the same Next.js frontend loaded with that tenant's branding.
"""
from __future__ import annotations

import secrets
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, field_validator
from slugify import slugify
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import get_password_hash
from app.middleware.rate_limit import rate_limit
from app.models.tenant import DomainType, LaunchStatus, Tenant
from app.models.user import User, UserRole
from app.services.billing_service import create_trial_subscription, ensure_wallet
from app.services.fleetbase_api_client import fleetbase_client
from app.services.tenant_ai_service import ensure_tenant_ai_settings
from app.services.tenant_branding_service import ensure_tenant_branding
from app.services.dns_provisioning import provision_tenant_subdomain

logger = logging.getLogger("afruheritage.company_registration")
router = APIRouter(prefix="/companies", tags=["Company Registration"])


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

class CompanyRegisterRequest(BaseModel):
    # Company info
    company_name: str
    country: str = "GH"
    city: str = ""
    address: str = ""
    phone: str = ""
    website: str | None = None

    # Admin user that will own this company portal
    admin_full_name: str
    admin_email: EmailStr
    admin_password: str
    admin_password_confirm: str

    # Optional — if provided, they want their own domain later
    desired_subdomain: str | None = None

    @field_validator("admin_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("admin_password_confirm")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "admin_password" in info.data and v != info.data["admin_password"]:
            raise ValueError("Passwords do not match")
        return v


class CompanyRegisterResponse(BaseModel):
    tenant_id: str
    company_name: str
    subdomain: str
    portal_url: str
    fleetbase_console_url: str
    message: str
    requires_subscription: bool = True


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/register", response_model=CompanyRegisterResponse)
@rate_limit(category="public", rule="vendor_register")   # 2/hour — same bucket as vendor reg
async def register_company(request: Request, db: Session = Depends(get_db)):
    """
    Public endpoint — freight forwarding company self-service signup.
    Creates their Afruheritage tenant + Fleetbase org in one call.
    """
    body = await request.json()
    try:
        payload = CompanyRegisterRequest(**body)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # --- Slug / subdomain ------------------------------------------------
    raw_slug = payload.desired_subdomain or payload.company_name
    slug = slugify(raw_slug, max_length=60, word_boundary=True)
    if not slug:
        raise HTTPException(status_code=422, detail="Company name could not be converted to a valid subdomain.")

    requested_domain = f"{slug}.{settings.default_subdomain_base}"

    # --- Duplicate check --------------------------------------------------
    existing = db.query(Tenant).filter(
        (Tenant.slug == slug) | (Tenant.contact_email == payload.admin_email.lower())
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="A company with this name or email already exists.",
        )

    existing_user = db.query(User).filter(User.email == payload.admin_email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    # --- Create Tenant record (pending_verification until Fleetbase is done) --
    tenant = Tenant(
        company_name=payload.company_name,
        slug=slug,
        contact_email=payload.admin_email.lower(),
        plan_code="free_trial",
        requested_domain=requested_domain,
        domain_type=DomainType.provider_subdomain,
        launch_status=LaunchStatus.pending_verification,
        subdomain=slug,
        custom_domain=(
            payload.website.lower()
            .replace("https://", "").replace("http://", "")
            if payload.website else None
        ),
    )
    db.add(tenant)
    db.flush()   # Get tenant.id without committing yet

    # --- Create admin User -----------------------------------------------
    admin_user = User(
        email=payload.admin_email.lower(),
        full_name=payload.admin_full_name,
        hashed_password=get_password_hash(payload.admin_password),
        role=UserRole.company_admin,
        tenant_id=tenant.id,
        is_tenant_admin=True,
        is_active=True,
        onboarding_complete=True,  # Registration IS the onboarding for company admins
    )
    db.add(admin_user)
    db.flush()

    # --- Do NOT provision Fleetbase immediately here. ---
    # Provisioning will be triggered after the tenant selects a subscription
    # and completes payment (handled via the billing/payment flow). Keep the
    # tenant in pending_verification so the frontend can present the
    # subscription selection/checkout UI.
    fleetbase_console_url = ""
    tenant.launch_status = LaunchStatus.pending_verification

    # --- Billing / wallet / branding / AI --------------------------------
    # NOTE: Do NOT auto-create a trial subscription here. Subscription
    # selection must occur immediately after registration on the frontend
    # (popup) and payment must complete before provisioning is queued.

    try:
        ensure_tenant_branding(db, tenant_id=str(tenant.id), company_name=tenant.company_name, contact_email=tenant.contact_email)
    except Exception:
        pass

    try:
        ensure_tenant_ai_settings(db, tenant_id=str(tenant.id), tenant_slug=slug, company_name=tenant.company_name)
    except Exception:
        pass

    # --- Commit ----------------------------------------------------------
    try:
        db.commit()
        db.refresh(tenant)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate entry — company or email already registered.") from exc

    portal_url = f"https://{requested_domain}"

    # Provision DNS record (fire-and-forget, never blocks registration)
    try:
        provision_tenant_subdomain(slug)
    except Exception as dns_exc:
        logger.warning("dns_provisioning_failed: %s — %s", slug, dns_exc)

    logger.info(
        "Company registered",
        extra={
            "tenant_id": str(tenant.id),
            "company": tenant.company_name,
            "slug": slug,
            "admin": payload.admin_email,
        },
    )

    return CompanyRegisterResponse(
        tenant_id=str(tenant.id),
        company_name=tenant.company_name,
        subdomain=slug,
        portal_url=portal_url,
        fleetbase_console_url=fleetbase_console_url,
        message=(
            "Your freight portal has been created! "
            f"Access it at {portal_url}. "
            "Log in with your email and password to complete setup and start customising your branding."
        ),
    )


@router.post('/retry-provisioning/{tenant_id}')
def retry_fleetbase_provisioning(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: retry Fleetbase org provisioning for a pending tenant."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Superuser required')

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')

    if tenant.fleetbase_org_id:
        return {'status': 'already_provisioned', 'org_id': str(tenant.fleetbase_org_id)}

    try:
        # find the admin user for this tenant
        admin_user = db.query(User).filter(
            User.tenant_id == tenant_id,
            User.role.in_(['company_admin', 'platform_admin'])
        ).order_by(User.created_at).first()
        admin_email = (admin_user.email if admin_user else tenant.contact_email) or ''
        admin_name = (admin_user.full_name if admin_user else tenant.company_name + ' Admin') or tenant.company_name

        fb_org = fleetbase_client.provision_org(
            company_name=tenant.company_name,
            admin_email=admin_email,
            admin_password=secrets.token_urlsafe(16),
        )
        tenant.fleetbase_org_id = fb_org.org_id
        tenant.fleetbase_api_key = fb_org.api_key
        tenant.fleetbase_admin_token = fb_org.admin_token
        tenant.live_api_token = fb_org.api_key
        tenant.live_console_url = fb_org.console_url
        tenant.launch_status = 'active'
        tenant.verification_notes = 'Provisioned via retry'
        db.commit()
        return {'status': 'provisioned', 'org_id': str(fb_org.org_id), 'console_url': fb_org.console_url}
    except Exception as exc:
        tenant.verification_notes = f'Retry failed: {exc}'
        db.commit()
        raise HTTPException(status_code=502, detail=f'Provisioning failed: {exc}') from exc
