from __future__ import annotations

import secrets

from slugify import slugify
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.structured_logging import get_logger
from app.models.tenant import DomainType, LaunchStatus, Tenant
from app.models.user import User
from app.services.billing_service import create_trial_subscription, ensure_wallet, grant_subscription_allowance, normalize_plan_code
from app.services.tenant_ai_service import ensure_tenant_ai_settings
from app.services.tenant_branding_service import ensure_tenant_branding
from app.services.dns_provisioning import provision_tenant_subdomain

logger = get_logger("afruheritage.signup_onboarding")


class SignupOnboardingService:
    """Provision SaaS tenant identity for newly registered users."""

    def __init__(self, db: Session):
        self.db = db

    def ensure_user_tenant(
        self,
        user: User,
        company_name: str | None = None,
        plan_code: str = "free_trial",
    ) -> Tenant:
        if user.is_superuser:
            raise ValueError("Superusers are not auto-provisioned into tenant workspaces")

        if user.tenant_id:
            existing = self.db.get(Tenant, user.tenant_id)
            if existing:
                return existing

        normalized_company_name = self._resolve_company_name(user, company_name)
        unique_company_name = self._unique_company_name(normalized_company_name)
        slug = self._unique_slug(unique_company_name)
        requested_domain = self._unique_requested_domain(slug)

        resolved_plan = normalize_plan_code(plan_code)

        tenant = Tenant(
            company_name=unique_company_name,
            slug=slug,
            contact_email=user.email.lower(),
            plan_code=resolved_plan.value,
            requested_domain=requested_domain,
            domain_type=DomainType.provider_subdomain,
            launch_status=LaunchStatus.draft,
            verification_notes="Auto-provisioned from user signup",
            subdomain=slug,
            custom_domain=None,
            custom_domain_verified=False,
        )

        self.db.add(tenant)
        self.db.flush()

        user.tenant_id = tenant.id
        user.is_tenant_admin = True
        self.db.commit()
        self.db.refresh(tenant)
        self.db.refresh(user)

        self._initialize_tenant_defaults(tenant, resolved_plan.value)

        # Async-safe: DNS provisioning is fire-and-forget (never blocks registration)
        try:
            provision_tenant_subdomain(tenant.slug)
        except Exception as exc:
            logger.warning("dns_provisioning_failed", extra={"slug": tenant.slug, "error": str(exc)})

        logger.info(
            "signup_tenant_provisioned",
            extra={
                "tenant_id": str(tenant.id),
                "tenant_slug": tenant.slug,
                "user_id": str(user.id),
                "user_email": user.email,
            },
        )
        return tenant

    def _initialize_tenant_defaults(self, tenant: Tenant, plan_code: str) -> None:
        tenant_id = str(tenant.id)
        try:
            ensure_tenant_ai_settings(
                self.db,
                tenant_id=tenant_id,
                tenant_slug=tenant.slug,
                company_name=tenant.company_name,
            )
        except Exception as exc:
            logger.warning("tenant_ai_defaults_failed", extra={"tenant_id": tenant_id, "error": str(exc)})

        try:
            ensure_tenant_branding(
                self.db,
                tenant_id=tenant_id,
                company_name=tenant.company_name,
                contact_email=tenant.contact_email,
            )
        except Exception as exc:
            logger.warning("tenant_branding_defaults_failed", extra={"tenant_id": tenant_id, "error": str(exc)})

        # Do NOT auto-create trial subscriptions or grant allowances here.
        # Trials and subscription selection must be chosen explicitly by
        # customers during the signup/checkout flow so billing state and
        # consent are explicit. Wallets and allowances will be created when
        # a subscription is initialized (through the billing endpoints
        # /payments/init and the payment webhook flow).

    def _resolve_company_name(self, user: User, company_name: str | None) -> str:
        value = (company_name or "").strip()
        if value:
            return value

        full_name = (user.full_name or "").strip()
        if full_name:
            return f"{full_name} Workspace"

        email_prefix = user.email.split("@", 1)[0].strip()
        if email_prefix:
            return f"{email_prefix} Workspace"

        return f"tenant-{secrets.token_hex(3)}"

    def _unique_company_name(self, base_name: str) -> str:
        candidate = base_name[:255]
        suffix = 1
        while self.db.query(Tenant).filter(Tenant.company_name == candidate).first():
            candidate = f"{base_name} {suffix}"[:255]
            suffix += 1
        return candidate

    def _unique_slug(self, company_name: str) -> str:
        base = slugify(company_name)[:50]
        if not base:
            base = f"tenant-{secrets.token_hex(3)}"
        if base[0].isdigit():
            base = f"t{base}"

        candidate = base
        suffix = 1
        while self.db.query(Tenant).filter(Tenant.slug == candidate).first():
            candidate = f"{base}-{suffix}"[:120]
            suffix += 1
        return candidate

    def _unique_requested_domain(self, slug: str) -> str:
        base_domain = f"{slug}.{settings.default_subdomain_base}".lower()
        candidate = base_domain
        suffix = 1
        while self.db.query(Tenant).filter(Tenant.requested_domain == candidate).first():
            candidate = f"{slug}-{suffix}.{settings.default_subdomain_base}".lower()
            suffix += 1
        return candidate


def ensure_user_tenant_context(
    db: Session,
    user: User,
    company_name: str | None = None,
    plan_code: str = "free_trial",
) -> User:
    if user.is_superuser or user.tenant_id:
        return user

    service = SignupOnboardingService(db)
    service.ensure_user_tenant(user=user, company_name=company_name, plan_code=plan_code)
    return user
