from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit import AuditEvent
from app.models.storefront_template import StorefrontTemplate
from app.models.tenant import Tenant
from app.models.tenant_branding import TenantBranding
from app.models.tenant_template_installation import TenantTemplateInstallation
from app.models.user import User
from app.services.notification_service import get_notification_service
from app.services.tenant_branding_service import ensure_tenant_branding

logger = logging.getLogger(__name__)


class MarketplaceService:
    """Orchestrates tenant-scoped template and plugin changes.

    All marketplace state transitions and side effects should flow through
    this service so that business rules are not duplicated across API
    endpoints, UI handlers, or background tasks.
    """

    def __init__(self, db: Session):
        self.db = db

    def select_template(
        self,
        tenant_id: str,
        template_code: str,
        requested_by: str | None = None,
        requested_by_email: str | None = None,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        """Select and apply a template to a tenant through the supported lifecycle.

        Returns a result dict suitable for the storefront-templates select
        endpoint. Raises ValueError for validation failures so the endpoint
        can translate to the appropriate HTTP response.
        """
        correlation_id = correlation_id or str(uuid.uuid4())
        tenant_uuid = uuid.UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id

        tenant = self.db.get(Tenant, tenant_uuid)
        if not tenant:
            raise ValueError("Tenant not found")

        # Snapshot configuration before changes
        branding = ensure_tenant_branding(
            self.db, str(tenant_uuid), tenant.company_name, tenant.contact_email
        )
        previous_template_code = branding.template_code
        configuration_before = {
            "template_code": previous_template_code,
            "primary_color": branding.primary_color,
            "secondary_color": branding.secondary_color,
            "accent_color": branding.accent_color,
            "background_color": branding.background_color,
            "storefront_config": branding.storefront_config,
        }

        installation = TenantTemplateInstallation(
            tenant_id=tenant.id,
            template_code=template_code,
            template_version="1.0.0",
            previous_template_code=previous_template_code,
            previous_template_version=None,
            status="pending",
            requested_by=uuid.UUID(requested_by) if requested_by else None,
            requested_at=datetime.now(timezone.utc),
            configuration_before=configuration_before,
            correlation_id=correlation_id,
        )
        self.db.add(installation)
        self.db.flush()

        try:
            installation.status = "validating"
            self.db.add(installation)
            self.db.flush()

            template = self.db.scalar(
                select(StorefrontTemplate).where(
                    StorefrontTemplate.template_code == template_code,
                    StorefrontTemplate.is_active.is_(True),
                )
            )
            if not template:
                raise ValueError("Template not found")

            # Compatibility validation — block installation when required
            # capabilities are missing from the tenant's enabled plugins.
            from app.services.compatibility_validator import CompatibilityValidator

            validator = CompatibilityValidator(self.db)
            compat = validator.validate(str(tenant_uuid), template_code)
            if not compat["compatible"]:
                blocking = "; ".join(compat.get("blocking_issues") or [])
                installation.status = "failed"
                installation.failed_at = datetime.now(timezone.utc)
                installation.failure_reason = f"Compatibility check failed: {blocking}"
                self.db.add(installation)
                self.db.commit()
                raise ValueError(f"Compatibility check failed: {blocking}")

            installation.status = "installing"
            self.db.add(installation)
            self.db.flush()

            # Apply template presentation preset to tenant branding only.
            preset = json.loads(template.preset) if isinstance(template.preset, str) else template.preset
            branding.primary_color = preset.get("primary_color", branding.primary_color)
            branding.secondary_color = preset.get("secondary_color", branding.secondary_color)
            branding.accent_color = preset.get("accent_color", branding.accent_color)
            branding.background_color = preset.get("background_color", branding.background_color)
            branding.template_code = template.template_code
            if preset.get("storefront_config") is not None:
                branding.storefront_config = preset.get("storefront_config")
            self.db.add(branding)
            self.db.flush()

            installation.status = "configuring"
            self.db.add(installation)
            self.db.flush()

            configuration_after = {
                "template_code": branding.template_code,
                "primary_color": branding.primary_color,
                "secondary_color": branding.secondary_color,
                "accent_color": branding.accent_color,
                "background_color": branding.background_color,
                "storefront_config": branding.storefront_config,
            }

            installation.status = "completed"
            installation.completed_at = datetime.now(timezone.utc)
            installation.configuration_after = configuration_after
            installation.rollback_data = configuration_before
            self.db.add(installation)
            self.db.commit()

            self._record_audit(
                actor_email=requested_by_email or "system@afruheritage.com",
                tenant_id=str(tenant_uuid),
                event_type="template_selected",
                details={
                    "template_code": template.template_code,
                    "template_name": template.name,
                    "installation_id": str(installation.id),
                    "correlation_id": correlation_id,
                },
            )

            return {
                "status": "success",
                "tenant_id": str(tenant_uuid),
                "template_code": template.template_code,
                "template_name": template.name,
                "installation_id": str(installation.id),
                "auto_fix": None,
                "failed_endpoints": None,
                "graceful_degradation": False,
            }

        except Exception as exc:
            if branding and installation.configuration_before:
                before = installation.configuration_before
                branding.primary_color = before["primary_color"]
                branding.secondary_color = before["secondary_color"]
                branding.accent_color = before["accent_color"]
                branding.background_color = before["background_color"]
                branding.template_code = before["template_code"]
                self.db.add(branding)
            installation.status = "failed"
            installation.failed_at = datetime.now(timezone.utc)
            installation.failure_reason = str(exc)
            self.db.add(installation)
            self.db.commit()
            raise

    def rollback_template(
        self,
        tenant_id: str,
        requested_by_email: str | None = None,
    ) -> dict[str, Any]:
        """Rollback the most recent completed template installation."""
        tenant_uuid = uuid.UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
        tenant = self.db.get(Tenant, tenant_uuid)
        if not tenant:
            raise ValueError("Tenant not found")

        from sqlalchemy import desc

        installation = self.db.scalar(
            select(TenantTemplateInstallation)
            .where(
                TenantTemplateInstallation.tenant_id == tenant.id,
                TenantTemplateInstallation.status.in_({"completed", "rolled_back"}),
            )
            .order_by(
                desc(TenantTemplateInstallation.created_at),
                desc(TenantTemplateInstallation.requested_at),
            )
            .limit(1)
        )
        if not installation:
            raise ValueError("No installation to rollback")
        if installation.status == "rolled_back":
            raise ValueError("Installation already rolled back")
        if not installation.rollback_data:
            raise ValueError("No rollback data available")

        branding = ensure_tenant_branding(
            self.db, str(tenant_uuid), tenant.company_name, tenant.contact_email
        )
        before = installation.rollback_data
        branding.template_code = before.get("template_code")
        branding.primary_color = before.get("primary_color", branding.primary_color)
        branding.secondary_color = before.get("secondary_color", branding.secondary_color)
        branding.accent_color = before.get("accent_color", branding.accent_color)
        branding.background_color = before.get("background_color", branding.background_color)
        branding.storefront_config = before.get("storefront_config", branding.storefront_config)
        self.db.add(branding)

        installation.status = "rolled_back"
        installation.completed_at = datetime.now(timezone.utc)
        self.db.add(installation)
        self.db.commit()

        self._record_audit(
            actor_email=requested_by_email or "system@afruheritage.com",
            tenant_id=str(tenant_uuid),
            event_type="template_rolled_back",
            details={
                "template_code": installation.template_code,
                "restored_template_code": branding.template_code,
                "installation_id": str(installation.id),
                "correlation_id": installation.correlation_id,
            },
        )

        return {
            "status": "success",
            "tenant_id": str(tenant_uuid),
            "template_code": branding.template_code,
            "previous_template_code": installation.template_code,
            "installation_id": str(installation.id),
        }

    def _handle_failed_endpoints(
        self,
        tenant: Tenant,
        template: StorefrontTemplate,
        all_failed: list[str],
        requested_by: str | None = None,
        requested_by_email: str | None = None,
    ) -> None:
        if not all_failed:
            tenant.pending_endpoints = None
            tenant.pending_endpoints_notified_at = None
            self.db.add(tenant)
            return

        tenant.pending_endpoints = json.dumps(all_failed)
        tenant.pending_endpoints_notified_at = None
        self.db.add(tenant)

        actor_email = requested_by_email or "system@afruheritage.com"
        audit_event = AuditEvent(
            actor_email=actor_email,
            event_type="template_auto_fix_failed",
            entity_type="tenant",
            entity_id=str(tenant.id),
            details_json=json.dumps({
                "template_code": template.template_code,
                "template_name": template.name,
                "failed_endpoints": all_failed,
                "message": f"Tenant {tenant.company_name} switched to template {template.name} — endpoints could not be auto-fixed: {', '.join(all_failed)}",
            }),
        )
        self.db.add(audit_event)

        try:
            notification_service = get_notification_service()
            subject = "Template Change: Some features may not work for 72 hours"
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
            notification_service.send_generic_email(to=tenant.contact_email, subject=subject, html_body=body)
            tenant.pending_endpoints_notified_at = datetime.now(timezone.utc)
            self.db.add(tenant)
        except Exception as e:
            logger.error("Failed to send tenant notification for failed auto-fix: %s", e)

    def _record_audit(
        self,
        actor_email: str | None,
        tenant_id: str,
        event_type: str,
        details: dict[str, Any],
    ) -> None:
        audit_event = AuditEvent(
            actor_email=actor_email,
            event_type=event_type,
            entity_type="tenant",
            entity_id=tenant_id,
            details_json=json.dumps(details),
        )
        self.db.add(audit_event)
        self.db.commit()
