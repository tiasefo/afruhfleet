"""Regression tests for Fleetbase feature-inheritance gating (P1.4)."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.services.fleetbase_entitlements import (
    FLEETBASE_FEATURE_GATES,
    check_fleetbase_access,
    resolve_feature_gate,
)


# --- resolve_feature_gate: path -> plan attribute -----------------------------

@pytest.mark.parametrize(
    "path,expected",
    [
        ("service-rates", "service_rates_enabled"),
        ("service-rates/123", "service_rates_enabled"),
        ("/int/v1/service-rates", "service_rates_enabled"),
        ("int/v1/webhook-endpoints?limit=5", "webhooks_enabled"),
        ("routes", "route_planning_enabled"),
        ("optimize/route", "route_optimization_enabled"),
        ("vrp", "vrp_enabled"),
        # Core features must NOT be gated:
        ("drivers", None),
        ("vehicles/abc", None),
        ("orders", None),
        ("fleets", None),
        ("tracking-statuses", None),
        ("", None),
    ],
)
def test_resolve_feature_gate(path, expected):
    assert resolve_feature_gate(path) == expected


# --- check_fleetbase_access: plan enforcement ---------------------------------

class _FakePlan:
    def __init__(self, **flags):
        # default every known gate flag to False, then apply overrides
        for attr in set(FLEETBASE_FEATURE_GATES.values()):
            setattr(self, attr, False)
        for k, v in flags.items():
            setattr(self, k, v)


class _FakeQuery:
    def __init__(self, plan):
        self._plan = plan

    def filter(self, *a, **k):
        return self

    def first(self):
        return self._plan


class _FakeDB:
    """Minimal stand-in: seed_default_plans is a no-op query, plan lookup returns
    the configured plan."""
    def __init__(self, plan):
        self._plan = plan

    def query(self, model):
        return _FakeQuery(self._plan)


class _FakeTenant:
    def __init__(self, plan_code):
        self.id = "tenant-1"
        self.plan_code = plan_code


def test_core_feature_always_allowed(monkeypatch):
    # Even with no plan, a core (unmapped) path must pass through.
    monkeypatch.setattr(
        "app.services.fleetbase_entitlements.seed_default_plans", lambda db: None
    )
    db = _FakeDB(plan=None)
    check_fleetbase_access(db, _FakeTenant("free_trial"), "drivers")  # no raise


def test_paid_feature_denied_on_free_plan(monkeypatch):
    monkeypatch.setattr(
        "app.services.fleetbase_entitlements.seed_default_plans", lambda db: None
    )
    db = _FakeDB(plan=_FakePlan(service_rates_enabled=False))
    with pytest.raises(HTTPException) as exc:
        check_fleetbase_access(db, _FakeTenant("free_trial"), "service-rates")
    assert exc.value.status_code == 402
    assert exc.value.detail["required_feature"] == "service_rates_enabled"


def test_paid_feature_allowed_when_plan_enables_it(monkeypatch):
    monkeypatch.setattr(
        "app.services.fleetbase_entitlements.seed_default_plans", lambda db: None
    )
    db = _FakeDB(plan=_FakePlan(service_rates_enabled=True))
    check_fleetbase_access(db, _FakeTenant("professional"), "service-rates")  # no raise


def test_missing_plan_denies_paid_feature(monkeypatch):
    monkeypatch.setattr(
        "app.services.fleetbase_entitlements.seed_default_plans", lambda db: None
    )
    db = _FakeDB(plan=None)
    with pytest.raises(HTTPException) as exc:
        check_fleetbase_access(db, _FakeTenant("free_trial"), "webhooks")
    assert exc.value.status_code == 402
