from __future__ import annotations

import secrets
import uuid
from typing import Any

from sqlalchemy.orm import Session
from slugify import slugify

from app.core.config import settings
from app.core.structured_logging import get_logger, business_logger
from app.models.tenant import DomainType, LaunchStatus, ProvisioningJob, Tenant
from app.services.fleetbase_runtime_service import sync_runtime_from_tenant
from app.services.billing_service import assert_tenant_launch_ready
from app.services.billing_service import create_trial_subscription, ensure_wallet
from app.services.runner_selection import select_runner_for_tenant
from app.services.tenant_ai_service import ensure_tenant_ai_settings
from app.services.tenant_branding_service import ensure_tenant_branding
from app.tasks.provisioning import provision_tenant

logger = get_logger("afruheritage.tenant_creation")
business_logger = get_logger("afruheritage.business")


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
                runner_id=None,  # Will be assigned during provisioning
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

            # Log business event
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

        try:
            if tenant.launch_status != LaunchStatus.approved:
                raise ValueError("Tenant must be approved before infrastructure setup")

            job = self.queue_tenant_launch(tenant)

            logger.info("Tenant infrastructure queued", extra={
                "tenant_id": str(tenant.id),
                "subdomain": tenant.slug,
                "runner_id": str(tenant.runner_id) if tenant.runner_id else None,
                "job_id": str(job.id),
            })

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
            
        except Exception as e:
            logger.error("Failed to setup tenant infrastructure", extra={
                "tenant_id": str(tenant.id),
                "error": str(e)
            })
            raise

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
    
    def get_tenant_portal_url(self, tenant: Tenant) -> str:
        """Get the portal URL for a tenant"""
        if tenant.custom_domain and tenant.custom_domain_verified:
            return f"https://{tenant.custom_domain}"
        return f"https://{tenant.requested_domain}"
    
    def get_tenant_status(self, tenant_id: str) -> dict[str, Any]:
        """Get comprehensive tenant status"""
        tenant_pk = tenant_id
        try:
            tenant_pk = uuid.UUID(str(tenant_id))
        except (TypeError, ValueError):
            pass
        tenant = self.db.get(Tenant, tenant_pk)
        if not tenant:
            raise ValueError("Tenant not found")
        
        return {
            "tenant_id": str(tenant.id),
            "subdomain": tenant.slug,
            "company_name": tenant.company_name,
            "status": "active" if tenant.launch_status == LaunchStatus.active else "pending",
            "launch_status": tenant.launch_status.value,
            "plan": tenant.plan_code,
            "portal_url": self.get_tenant_portal_url(tenant),
            "console_url": tenant.live_console_url,
            "api_url": tenant.live_api_url,
            "custom_domain": tenant.custom_domain,
            "created_at": tenant.created_at.isoformat(),
            "updated_at": tenant.created_at.isoformat()
        }
