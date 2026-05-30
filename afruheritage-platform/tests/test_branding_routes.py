from uuid import uuid4


def test_public_branding_falls_back_to_defaults(client):
    tenant_id = str(uuid4())

    response = client.get(f"/api/v1/branding/public/{tenant_id}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["tenant_id"] == tenant_id
    assert payload["company_name"] == "Afruheritage"
    assert payload["primary_color"] == "#0ea5e9"
    assert payload["maps_enabled"] is True