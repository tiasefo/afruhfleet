from __future__ import annotations

import logging
import secrets
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.structured_logging import get_logger, business_logger
from app.models.tenant import LaunchStatus, Tenant
from app.models.user import User
# from app.services.custom_domains import CustomDomainService  # Will create when needed
from app.services.fleetbase_provisioner import FleetbaseProvisioner
from app.services.notification_service import get_notification_service

logger = get_logger("afruheritage.tenant_creation")
business_logger = get_logger("afruheritage.business")


class TenantCreationService:
    """Complete tenant creation service with subdomain and branding setup"""
    
    def __init__(self, db: Session):
        self.db = db
        # self.custom_domain_service = CustomDomainService()  # Will create when needed
        self.notification_service = get_notification_service(db)
    
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
            # Generate unique subdomain
            subdomain = self._generate_subdomain(company_name)
            
            # Create tenant record
            tenant = Tenant(
                subdomain=subdomain,
                company_name=company_name,
                contact_email=contact_email,
                contact_name=contact_name,
                business_type=business_type,
                country=country,
                city=city,
                address=address,
                phone=phone,
                website=website,
                plan=plan,
                status="active",
                launch_status=LaunchStatus.pending_setup,
                runner_id=None,  # Will be assigned during provisioning
                fleetbase_install_path=None,
                live_console_url=None,
                live_api_url=None,
                custom_domain=None,
                branding_config={
                    "primary_color": "#6366f1",
                    "secondary_color": "#8b5cf6",
                    "logo_url": None,
                    "company_name": company_name,
                    "contact_email": contact_email,
                    "phone": phone,
                    "address": address,
                }
            )
            
            self.db.add(tenant)
            self.db.commit()
            self.db.refresh(tenant)
            
            logger.info("Tenant created", extra={
                "tenant_id": str(tenant.id),
                "subdomain": subdomain,
                "company_name": company_name,
                "plan": plan,
                "contact_email": contact_email
            })
            
            # Create admin user for tenant
            admin_user = self._create_tenant_admin(tenant, contact_email, contact_name)
            
            # Send welcome notifications
            self._send_welcome_notifications(tenant, admin_user)
            
            # Log business event
            business_logger.log_tenant_created(
                tenant_id=str(tenant.id),
                company_name=company_name,
                subdomain=subdomain,
                plan=plan,
                contact_email=contact_email
            )
            
            return tenant
            
        except Exception as e:
            logger.error("Failed to create tenant", extra={
                "company_name": company_name,
                "contact_email": contact_email,
                "error": str(e)
            })
            raise
    
    def _generate_subdomain(self, company_name: str) -> str:
        """Generate unique subdomain from company name"""
        import re
        
        # Clean company name
        base = re.sub(r'[^a-zA-Z0-9]', '', company_name).lower()
        
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
        while self.db.query(Tenant).filter(Tenant.subdomain == base).first():
            base = f"{original}{counter}"
            counter += 1
        
        return base
    
    def _create_tenant_admin(self, tenant: Tenant, email: str, name: str) -> User:
        """Create admin user for the tenant"""
        from app.core.security import get_password_hash
        
        # Generate temporary password
        temp_password = secrets.token_urlsafe(12)
        
        admin_user = User(
            email=email,
            full_name=name,
            hashed_password=get_password_hash(temp_password),
            is_active=True,
            is_superuser=False,  # Not platform superuser
            is_tenant_admin=True,
            tenant_id=str(tenant.id)
        )
        
        self.db.add(admin_user)
        self.db.commit()
        self.db.refresh(admin_user)
        
        logger.info("Tenant admin user created", extra={
            "tenant_id": str(tenant.id),
            "user_id": str(admin_user.id),
            "email": email
        })
        
        # Store temp password for notification (don't log it)
        admin_user._temp_password = temp_password
        
        return admin_user
    
    def _send_welcome_notifications(self, tenant: Tenant, admin_user: User):
        """Send welcome notifications to new tenant"""
        try:
            # Send welcome email with login credentials
            self.notification_service.send_tenant_welcome_email(
                to=admin_user.email,
                company_name=tenant.company_name,
                subdomain=tenant.subdomain,
                login_url=f"https://{tenant.subdomain}.{settings.default_subdomain_base}/login",
                temp_password=getattr(admin_user, '_temp_password', 'SET_PASSWORD'),
                contact_name=admin_user.full_name
            )
            
            # Send internal notification to platform admin
            self.notification_service.send_internal_tenant_created_notification(
                to="admin@afruheritage.com",
                tenant_id=str(tenant.id),
                company_name=tenant.company_name,
                subdomain=tenant.subdomain,
                contact_email=tenant.contact_email,
                plan=tenant.plan
            )
            
            logger.info("Welcome notifications sent", extra={
                "tenant_id": str(tenant.id),
                "contact_email": tenant.contact_email
            })
            
        except Exception as e:
            logger.error("Failed to send welcome notifications", extra={
                "tenant_id": str(tenant.id),
                "error": str(e)
            })
    
    def setup_tenant_infrastructure(self, tenant: Tenant) -> dict[str, Any]:
        """Setup complete infrastructure for tenant (Fleetbase + domain)"""
        
        try:
            # 1. Assign runner node
            runner = self._assign_runner(tenant)
            
            # 2. Provision Fleetbase instance
            provisioner = FleetbaseProvisioner(runner)
            fleetbase_result = provisioner.provision(tenant)
            
            # 3. Setup custom domain (if Business plan)
            domain_result = None
            if tenant.plan == "business":
                domain_result = self._setup_custom_domain(tenant)
            
            # 4. Update tenant with infrastructure details
            tenant.runner_id = str(runner.id) if runner else None
            tenant.fleetbase_install_path = fleetbase_result.install_path
            tenant.live_console_url = fleetbase_result.console_url
            tenant.live_api_url = fleetbase_result.api_url
            tenant.launch_status = LaunchStatus.active
            
            self.db.commit()
            
            # 5. Send launch notifications
            self._send_launch_notifications(tenant)
            
            logger.info("Tenant infrastructure setup complete", extra={
                "tenant_id": str(tenant.id),
                "subdomain": tenant.subdomain,
                "console_url": fleetbase_result.console_url,
                "api_url": fleetbase_result.api_url
            })
            
            return {
                "tenant_id": str(tenant.id),
                "subdomain": tenant.subdomain,
                "console_url": fleetbase_result.console_url,
                "api_url": fleetbase_result.api_url,
                "custom_domain": domain_result,
                "status": "active"
            }
            
        except Exception as e:
            logger.error("Failed to setup tenant infrastructure", extra={
                "tenant_id": str(tenant.id),
                "error": str(e)
            })
            tenant.launch_status = LaunchStatus.failed
            self.db.commit()
            raise
    
    def _assign_runner(self, tenant: Tenant) -> Any:
        """Assign appropriate runner node for tenant"""
        # For now, return None - will implement when runner model is ready
        logger.info("Runner assignment skipped - runner model not yet implemented", extra={
            "tenant_id": str(tenant.id)
        })
        return None
    
    def _setup_custom_domain(self, tenant: Tenant) -> dict[str, Any]:
        """Setup custom domain for Business tier tenants"""
        # For now, return suggestion - will implement full custom domain service later
        suggested_domain = f"{tenant.subdomain}.com"
        
        domain_result = {
            "suggested_domain": suggested_domain,
            "status": "suggested",
            "dns_instructions": {
                "A_record": {
                    "host": "@",
                    "value": "SERVER_IP_HERE",  # Would be actual server IP
                    "ttl": 300
                },
                "CNAME_record": {
                    "host": "www",
                    "value": f"{tenant.subdomain}.{settings.default_subdomain_base}",
                    "ttl": 300
                }
            }
        }
        
        logger.info("Custom domain setup initiated", extra={
            "tenant_id": str(tenant.id),
            "suggested_domain": suggested_domain
        })
        
        return domain_result
    
    def _send_launch_notifications(self, tenant: Tenant):
        """Send launch notifications to tenant"""
        try:
            self.notification_service.send_tenant_launched_email(
                to=tenant.contact_email,
                company_name=tenant.company_name,
                console_url=tenant.live_console_url
            )
            
            logger.info("Launch notifications sent", extra={
                "tenant_id": str(tenant.id),
                "contact_email": tenant.contact_email
            })
            
        except Exception as e:
            logger.error("Failed to send launch notifications", extra={
                "tenant_id": str(tenant.id),
                "error": str(e)
            })
    
    def get_tenant_portal_url(self, tenant: Tenant) -> str:
        """Get the portal URL for a tenant"""
        if tenant.custom_domain and tenant.custom_domain_verified:
            return f"https://{tenant.custom_domain}"
        else:
            return f"https://{tenant.subdomain}.{settings.default_subdomain_base}"
    
    def get_tenant_status(self, tenant_id: str) -> dict[str, Any]:
        """Get comprehensive tenant status"""
        tenant = self.db.get(Tenant, tenant_id)
        if not tenant:
            raise ValueError("Tenant not found")
        
        return {
            "tenant_id": str(tenant.id),
            "subdomain": tenant.subdomain,
            "company_name": tenant.company_name,
            "status": tenant.status,
            "launch_status": tenant.launch_status.value,
            "plan": tenant.plan,
            "portal_url": self.get_tenant_portal_url(tenant),
            "console_url": tenant.live_console_url,
            "api_url": tenant.live_api_url,
            "custom_domain": tenant.custom_domain,
            "created_at": tenant.created_at.isoformat(),
            "updated_at": tenant.updated_at.isoformat()
        }
