from app.core.config import settings
import requests
from fastapi import HTTPException


def resolve_fleetbase_token(tenant_token: str | None = None) -> str | None:
    return tenant_token or settings.fleetbase_runtime_api_token or None

def request_fleetbase_api(
    api_url: str,
    method: str,
    endpoint: str,
    token: str = None,
    auth_scheme: str | None = None,
    params: dict = None,
    json_body: dict | list | None = None,
    *,
    suppress_errors: bool = False,
):
    url = f"{api_url.rstrip('/')}/{endpoint.lstrip('/')}"
    headers = {"Accept": "application/json"}
    if token:
        scheme = (auth_scheme or 'bearer').strip().lower()
        if scheme == 'bearer':
            headers["Authorization"] = f"Bearer {token}"
        else:
            headers["Authorization"] = token
    try:
        response = requests.request(method.upper(), url, headers=headers, params=params, json=json_body, timeout=10)
        response.raise_for_status()
        if not response.content:
            return {}
        return response.json()
    except (requests.RequestException, ValueError) as e:
        if suppress_errors:
            return None
        raise HTTPException(status_code=502, detail=f"Fleetbase API error: {str(e)}")


def proxy_fleetbase_api(
    api_url: str,
    endpoint: str,
    token: str = None,
    auth_scheme: str | None = None,
    params: dict = None,
    *,
    suppress_errors: bool = False,
):
    return request_fleetbase_api(
        api_url,
        "GET",
        endpoint,
        token=token,
        auth_scheme=auth_scheme,
        params=params,
        suppress_errors=suppress_errors,
    )
