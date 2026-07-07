"""Tests for subscription tier feature gating and trial expiry."""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.services.entitlements import (
    TIER_FEATURES,
    TRIAL_DURATION_DAYS,
    create_trial_subscription,
    downgrade_expired_trial,
    normalize_tier_code,
    tenant_has_feature,
    seed_default_plans,
)
from app.models.saas_subscription import SaaSPlan, TenantSubscription


class TestTierFeatureMapping:
    def test_free_trial_has_pro_features(self):
        features = TIER_FEATURES["free_trial"]
        assert "ai_basic" in features
        assert "ai_advanced" in features
        assert "marketplace_gps" in features
        assert "shipping_estimator" in features
        assert "custom_domain_preview" in features

    def test_starter_is_limited(self):
        features = TIER_FEATURES["starter"]
        assert "tracking" in features
        assert "whatsapp_channel" in features
        assert "ai_basic" not in features
        assert "marketplace_basic" not in features
        assert "custom_domain" not in features
        assert "shipping_estimator" not in features

    def test_pro_has_core_paid_features(self):
        features = TIER_FEATURES["pro"]
        assert "ai_basic" in features
        assert "custom_domain" in features
        assert "shipping_estimator" in features
        assert "marketplace_basic" in features
        assert "ai_advanced" not in features
        assert "bus_fleet" not in features

    def test_enterprise_has_everything(self):
        features = TIER_FEATURES["enterprise"]
        assert "ai_advanced" in features
        assert "bus_fleet" in features
        assert "marketplace_gps" in features
        assert "custom_domain" in features

    def test_normalize_aliases(self):
        assert normalize_tier_code("professional") == "pro"
        assert normalize_tier_code("business") == "pro"
        assert normalize_tier_code("vendor_driver") == "pro"
        assert normalize_tier_code("delivery_services") == "enterprise"
        assert normalize_tier_code("free") == "free_trial"
        assert normalize_tier_code(None) == "free_trial"
        assert normalize_tier_code("") == "free_trial"


class TestTenantHasFeature:
    def test_no_subscription_returns_false(self, db_session):
        assert tenant_has_feature(db_session, "nonexistent-tenant", "ai_basic") is False

    def test_trial_subscription_has_pro_features(self, db_session):
        seed_default_plans(db_session)
        create_trial_subscription(db_session, "test-tenant-1", "free_trial")
        assert tenant_has_feature(db_session, "test-tenant-1", "ai_basic") is True
        assert tenant_has_feature(db_session, "test-tenant-1", "marketplace_gps") is True

    def test_starter_lacks_ai(self, db_session):
        seed_default_plans(db_session)
        sub = TenantSubscription(
            tenant_id="test-tenant-starter",
            plan_code="starter",
            status="active",
            trial=False,
            credits_balance=200,
        )
        db_session.add(sub)
        db_session.commit()

        assert tenant_has_feature(db_session, "test-tenant-starter", "tracking") is True
        assert tenant_has_feature(db_session, "test-tenant-starter", "ai_basic") is False
        assert tenant_has_feature(db_session, "test-tenant-starter", "custom_domain") is False

    def test_suspended_subscription_blocks_features(self, db_session):
        seed_default_plans(db_session)
        sub = TenantSubscription(
            tenant_id="test-tenant-suspended",
            plan_code="pro",
            status="suspended",
            trial=False,
            credits_balance=0,
        )
        db_session.add(sub)
        db_session.commit()

        assert tenant_has_feature(db_session, "test-tenant-suspended", "ai_basic") is False


class TestTrialExpiry:
    def test_trial_not_expired_no_downgrade(self, db_session):
        seed_default_plans(db_session)
        sub = create_trial_subscription(db_session, "trial-tenant-1", "free_trial")
        result = downgrade_expired_trial(db_session, sub)
        assert result is False
        assert sub.plan_code == "free_trial"
        assert sub.trial is True
        assert sub.status == "trial"

    def test_expired_trial_downgrades_to_starter(self, db_session):
        seed_default_plans(db_session)
        sub = create_trial_subscription(db_session, "trial-tenant-2", "free_trial")
        sub.trial_ends_at = datetime.utcnow() - timedelta(days=1)
        db_session.add(sub)
        db_session.commit()

        result = downgrade_expired_trial(db_session, sub)
        assert result is True
        assert sub.plan_code == "starter"
        assert sub.trial is False
        assert sub.status == "active"

    def test_non_trial_not_downgraded(self, db_session):
        seed_default_plans(db_session)
        sub = TenantSubscription(
            tenant_id="non-trial-tenant",
            plan_code="pro",
            status="active",
            trial=False,
            credits_balance=1000,
        )
        db_session.add(sub)
        db_session.commit()

        result = downgrade_expired_trial(db_session, sub)
        assert result is False
        assert sub.plan_code == "pro"

    def test_trial_duration_is_14_days(self):
        assert TRIAL_DURATION_DAYS == 14

    def test_create_trial_sets_trial_ends_at(self, db_session):
        seed_default_plans(db_session)
        before = datetime.utcnow()
        sub = create_trial_subscription(db_session, "trial-tenant-3", "free_trial")
        after = datetime.utcnow()

        assert sub.trial is True
        assert sub.status == "trial"
        assert sub.trial_ends_at is not None
        delta = sub.trial_ends_at - before
        assert timedelta(days=13, hours=23) < delta < timedelta(days=14, seconds=30)
