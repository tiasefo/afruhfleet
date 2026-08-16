from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.storefront_template import StorefrontTemplate
from app.services.capability_resolver import MarketplaceCompatibilityValidator


class CompatibilityValidator:
    """Wrapper that provides a simple validate(tenant_id, template_code) interface."""

    def __init__(self, db: Session):
        self.db = db

    def validate(self, tenant_id: str | uuid.UUID, template_code: str) -> dict:
        template = self.db.scalar(
            select(StorefrontTemplate).where(
                StorefrontTemplate.template_code == template_code,
                StorefrontTemplate.is_active.is_(True),
            )
        )
        if not template:
            return {
                "compatible": False,
                "blocking_issues": [f"Template '{template_code}' not found"],
                "warnings": [],
            }

        validator = MarketplaceCompatibilityValidator(self.db, str(tenant_id))
        result = validator.validate_template(template)
        errors = result.get("errors", [])
        return {
            "compatible": result.get("valid", False),
            "blocking_issues": errors,
            "warnings": result.get("warnings", []),
            "renderer_key": result.get("renderer_key"),
        }
