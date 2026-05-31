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

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.middleware.rate_limit import rate_limit
from app.models.tenant import DomainType, LaunchStatus, Tenant
from app.models.user import User, UserRole
from app.services.billing_service import create_trial_subscription, ensure_wallet
from app.services.fleetbase_api_client import fleetbase_client
from app.services.tenant_ai_service import ensure_tenant_ai_settings
from app.services.tenant_branding_service import ensure_tenant_branding

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

    # --- Provision Fleetbase org -----------------------------------------
    fleetbase_console_url = f"http://{settings.base_url.split('://')[1].split(':')[0]}:4203"
    try:
        fb_org = fleetbase_client.provision_org(
            company_name=payload.company_name,
            admin_email=payload.admin_email.lower(),
            admin_password=payload.admin_password,
            phone=payload.phone or "",
        )
        tenant.fleetbase_org_id = fb_org.org_id
        tenant.fleetbase_api_key = fb_org.api_key
        tenant.fleetbase_admin_token = fb_org.admin_token
        tenant.live_api_url = f"{settings.fleetbase_internal_url}/api"
        tenant.live_api_token = fb_org.api_key
        tenant.live_console_url = fb_org.console_url
        tenant.launch_status = LaunchStatus.active
        fleetbase_console_url = fb_org.console_url
        logger.info(
            "Fleetbase org provisioned for company",
            extra={"company": payload.company_name, "org_id": fb_org.org_id},
        )
    except Exception as exc:
        # Fleetbase provisioning is non-blocking — the tenant is still created.
        # An admin can retry provisioning later from the admin console.
        tenant.launch_status = LaunchStatus.pending_verification
        tenant.verification_notes = f"Fleetbase org provisioning deferred: {exc}"
        logger.warning(
            "Fleetbase org provisioning failed — tenant created without Fleetbase org",
            extra={"company": payload.company_name, "error": str(exc)},
        )

    # --- Billing / wallet / branding / AI --------------------------------
    try:
        create_trial_subscription(db, str(tenant.id))
    except Exception:
        pass  # Non-fatal; can be seeded later

    try:
        ensure_wallet(db, str(tenant.id))
    except Exception:
        pass

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
