"""Sprint 1 tests: renderer_key registration, tenant isolation, rollback.

Covers the Product Owner acceptance criteria:
- All seven production templates carry a valid renderer_key
- seed_default_templates backfills renderer_key on existing rows
- Template selection only affects the selecting tenant
- Rollback restores the previous template
- Installation history is preserved
"""
from __future__ import annotations

import json
import uuid

from sqlalchemy import select

from app.api.routes.storefront_templates import (
    DEFAULT_TEMPLATES,
    seed_default_templates,
)
from app.models.storefront_template import StorefrontTemplate
from app.models.tenant import Tenant
from app.models.tenant_branding import TenantBranding
from app.models.tenant_template_installation import TenantTemplateInstallation
from app.models.user import User
from app.services.marketplace_service import MarketplaceService


_MAKE_TENANT_SEQ = 0


def _next_id() -> str:
    return uuid.uuid4().hex[:12]


def _make_tenant(db) -> Tenant:
    global _MAKE_TENANT_SEQ
    _MAKE_TENANT_SEQ += 1
    uid = _next_id()
    tenant = Tenant(
        company_name=f"Isolation Co {uid}",
        slug=f"iso-{uid}",
        contact_email=f"iso-{uid}@test.local",
        plan_code="freight",
        requested_domain=f"iso-{uid}.afruheritage.com",
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


def _make_user(db, tenant_id: uuid.UUID | None = None) -> User:
    uid = _next_id()
    user = User(
        email=f"iso-user-{uid}@test.local",
        full_name="Isolation User",
        hashed_password="x",
        tenant_id=tenant_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_template(db, template_code: str = "freight") -> StorefrontTemplate:
    preset = {
        "primary_color": "#1f5d72",
        "secondary_color": "#3aa6b9",
        "accent_color": "#eef6f8",
        "background_color": "#ffffff",
        "features": [],
        "preview_route": f"/templates/{template_code}",
    }
    template = StorefrontTemplate(
        template_code=template_code,
        name=f"Test {template_code}",
        description="A test template",
        preset=json.dumps(preset),
        renderer_key=template_code,
        is_active=True,
        status="production_ready",
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


class TestRendererKeyRegistration:
    def test_all_default_templates_have_renderer_keys(self):
        """Every production template ships with a non-null renderer_key."""
        for item in DEFAULT_TEMPLATES:
            assert item.get("renderer_key"), (
                f"Template {item['template_code']} missing renderer_key"
            )
            assert item["preset"].get("preview_route"), (
                f"Template {item['template_code']} missing preview_route in preset"
            )

    def test_seed_backfills_renderer_key_on_existing_rows(self, db_session):
        """Existing template rows without renderer_key get backfilled."""
        # Insert a row with no renderer_key
        legacy = StorefrontTemplate(
            template_code="freight",
            name="Legacy Freight",
            description="old",
            preset=json.dumps({"primary_color": "#000"}),
            renderer_key=None,
            is_active=True,
            status="draft",
        )
        db_session.add(legacy)
        db_session.commit()

        seed_default_templates(db_session)

        refreshed = db_session.scalar(
            select(StorefrontTemplate).where(
                StorefrontTemplate.template_code == "freight"
            )
        )
        assert refreshed is not None
        assert refreshed.renderer_key == "freight"
        assert refreshed.status == "production_ready"
        preset = json.loads(refreshed.preset)
        assert preset.get("preview_route") == "/templates/freight"

    def test_seed_creates_missing_templates_with_renderer_key(self, db_session):
        """Seeding a fresh DB creates all seven templates with renderer keys."""
        seed_default_templates(db_session)

        rows = db_session.scalars(select(StorefrontTemplate)).all()
        codes = {r.template_code for r in rows}
        assert codes == {
            "freight", "fleet", "ecommerce", "mall",
            "bookings", "restaurant", "realestate",
        }
        for r in rows:
            assert r.renderer_key is not None
            assert r.status == "production_ready"


class TestTenantIsolation:
    def test_select_template_only_affects_selecting_tenant(self, db_session):
        """Selecting a template on tenant A must not change tenant B."""
        tenant_a = _make_tenant(db_session)
        tenant_b = _make_tenant(db_session)
        _make_user(db_session, tenant_id=tenant_a.id)
        _make_user(db_session, tenant_id=tenant_b.id)
        _make_template(db_session, "freight")
        _make_template(db_session, "fleet")

        service = MarketplaceService(db_session)
        result_a = service.select_template(
            str(tenant_a.id), "freight",
            requested_by_email=tenant_a.contact_email,
        )
        assert result_a["status"] == "success"

        branding_a = db_session.scalar(
            select(TenantBranding).where(TenantBranding.tenant_id == tenant_a.id)
        )
        branding_b = db_session.scalar(
            select(TenantBranding).where(TenantBranding.tenant_id == tenant_b.id)
        )

        assert branding_a.template_code == "freight"
        # Tenant B must not have a template_code set by tenant A's action
        assert branding_b is None or branding_b.template_code != "freight"

    def test_rollback_restores_previous_template(self, db_session):
        """Rollback restores the prior template_code on branding."""
        tenant = _make_tenant(db_session)
        _make_user(db_session, tenant_id=tenant.id)
        _make_template(db_session, "freight")
        _make_template(db_session, "fleet")

        service = MarketplaceService(db_session)
        # First install freight
        service.select_template(
            str(tenant.id), "freight",
            requested_by_email=tenant.contact_email,
        )
        branding = db_session.scalar(
            select(TenantBranding).where(TenantBranding.tenant_id == tenant.id)
        )
        assert branding.template_code == "freight"

        # Switch to fleet, then rollback to freight
        service.select_template(
            str(tenant.id), "fleet",
            requested_by_email=tenant.contact_email,
        )
        branding = db_session.scalar(
            select(TenantBranding).where(TenantBranding.tenant_id == tenant.id)
        )
        assert branding.template_code == "fleet"

        result = service.rollback_template(
            str(tenant.id), requested_by_email=tenant.contact_email,
        )
        assert result["status"] == "success"
        # Rollback restores the previous template (freight)
        assert result["template_code"] == "freight"

        branding = db_session.scalar(
            select(TenantBranding).where(TenantBranding.tenant_id == tenant.id)
        )
        assert branding.template_code == "freight"

    def test_installation_history_preserved(self, db_session):
        """Multiple installations create a traceable history."""
        tenant = _make_tenant(db_session)
        _make_user(db_session, tenant_id=tenant.id)
        _make_template(db_session, "freight")
        _make_template(db_session, "fleet")

        service = MarketplaceService(db_session)
        service.select_template(
            str(tenant.id), "freight",
            requested_by_email=tenant.contact_email,
        )
        service.select_template(
            str(tenant.id), "fleet",
            requested_by_email=tenant.contact_email,
        )

        installations = db_session.scalars(
            select(TenantTemplateInstallation)
            .where(TenantTemplateInstallation.tenant_id == tenant.id)
        ).all()
        assert len(installations) == 2
        codes = {i.template_code for i in installations}
        assert codes == {"freight", "fleet"}
        # The fleet installation should record freight as previous
        fleet_inst = next(i for i in installations if i.template_code == "fleet")
        assert fleet_inst.previous_template_code == "freight"
        assert fleet_inst.status == "completed"
        assert fleet_inst.rollback_data is not None
