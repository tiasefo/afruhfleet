import requests
from fastapi import HTTPException

def proxy_fleetbase_api(api_url: str, endpoint: str, token: str = None, params: dict = None):
    url = f"{api_url.rstrip('/')}/{endpoint.lstrip('/')}"
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Fleetbase API error: {str(e)}")
