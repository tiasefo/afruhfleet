from __future__ import annotations

import uuid

import pytest

from app.models.runner import RunnerNode
from app.models.tenant import DomainType, LaunchStatus, Tenant
from app.services.runner_selection import select_runner_for_tenant


def _make_runner(*, name: str, host: str, reserved_for_single_tenant: bool) -> RunnerNode:
    return RunnerNode(
        name=name,
        host=host,
        ssh_port=22,
        ssh_user='tester',
        fleetbase_root='/tmp/test-runners',
        is_active=True,
        reserved_for_single_tenant=reserved_for_single_tenant,
    )


def _make_tenant(*, slug: str, runner_id) -> Tenant:
    return Tenant(
        id=uuid.uuid4(),
        company_name=f'{slug} corp',
        slug=slug,
        contact_email=f'{slug}@example.com',
        plan_code='free_trial',
        requested_domain=f'{slug}.afruheritage.com',
        domain_type=DomainType.provider_subdomain,
        launch_status=LaunchStatus.active,
        runner_id=runner_id,
    )


def test_select_runner_prefers_occupied_shared_runner(db_session, monkeypatch):
    occupied_runner = _make_runner(name='shared-runner', host='10.0.0.10', reserved_for_single_tenant=False)
    free_runner = _make_runner(name='idle-runner', host='10.0.0.11', reserved_for_single_tenant=True)
    db_session.add_all([occupied_runner, free_runner])
    db_session.commit()

    db_session.add(_make_tenant(slug='occupied-tenant', runner_id=occupied_runner.id))
    db_session.commit()

    monkeypatch.setattr('app.services.runner_selection._runner_is_reachable', lambda runner: True)

    selected = select_runner_for_tenant(db_session)

    assert selected.id == occupied_runner.id


def test_select_runner_allows_explicit_occupied_shared_runner(db_session, monkeypatch):
    occupied_runner = _make_runner(name='explicit-runner', host='10.0.0.12', reserved_for_single_tenant=False)
    db_session.add(occupied_runner)
    db_session.commit()

    db_session.add(_make_tenant(slug='explicit-tenant', runner_id=occupied_runner.id))
    db_session.commit()

    monkeypatch.setattr('app.services.runner_selection._runner_is_reachable', lambda runner: True)

    selected = select_runner_for_tenant(db_session, explicit_runner_id=str(occupied_runner.id))

    assert selected.id == occupied_runner.id


def test_select_runner_skips_occupied_single_tenant_runner(db_session, monkeypatch):
    occupied_runner = _make_runner(name='dedicated-runner', host='10.0.0.16', reserved_for_single_tenant=True)
    free_runner = _make_runner(name='shared-runner', host='10.0.0.17', reserved_for_single_tenant=False)
    db_session.add_all([occupied_runner, free_runner])
    db_session.commit()

    db_session.add(_make_tenant(slug='dedicated-tenant', runner_id=occupied_runner.id))
    db_session.commit()

    monkeypatch.setattr('app.services.runner_selection._runner_is_reachable', lambda runner: True)

    selected = select_runner_for_tenant(db_session)

    assert selected.id == free_runner.id


def test_select_runner_rejects_explicit_occupied_single_tenant_runner(db_session, monkeypatch):
    occupied_runner = _make_runner(name='explicit-dedicated-runner', host='10.0.0.18', reserved_for_single_tenant=True)
    db_session.add(occupied_runner)
    db_session.commit()

    db_session.add(_make_tenant(slug='explicit-dedicated-tenant', runner_id=occupied_runner.id))
    db_session.commit()

    monkeypatch.setattr('app.services.runner_selection._runner_is_reachable', lambda runner: True)

    with pytest.raises(ValueError, match='already occupied'):
        select_runner_for_tenant(db_session, explicit_runner_id=str(occupied_runner.id))


def test_select_runner_skips_unreachable_runner(db_session, monkeypatch):
    unreachable_runner = _make_runner(name='dead-runner', host='10.0.0.13', reserved_for_single_tenant=True)
    reachable_runner = _make_runner(name='live-runner', host='10.0.0.14', reserved_for_single_tenant=True)
    db_session.add_all([unreachable_runner, reachable_runner])
    db_session.commit()

    monkeypatch.setattr(
        'app.services.runner_selection._runner_is_reachable',
        lambda runner: runner.id == reachable_runner.id,
    )

    selected = select_runner_for_tenant(db_session)

    assert selected.id == reachable_runner.id


def test_select_runner_rejects_explicit_unreachable_runner(db_session, monkeypatch):
    unreachable_runner = _make_runner(name='explicit-dead-runner', host='10.0.0.15', reserved_for_single_tenant=True)
    db_session.add(unreachable_runner)
    db_session.commit()

    monkeypatch.setattr('app.services.runner_selection._runner_is_reachable', lambda runner: False)

    with pytest.raises(ValueError, match='unreachable'):
        select_runner_for_tenant(db_session, explicit_runner_id=str(unreachable_runner.id))