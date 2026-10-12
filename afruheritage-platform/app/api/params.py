from __future__ import annotations

import uuid as _uuid

from fastapi import HTTPException


def uuid_or_400(value, name: str = "identifier") -> str:
    """Parse a request-supplied identifier as a UUID or raise a controlled 400.

    Unguarded ``uuid.UUID(...)`` calls on path/body parameters used to surface
    as HTTP 500. Use this wherever the value originates from the request.
    Returns the canonical UUID string.
    """
    try:
        return str(_uuid.UUID(str(value)))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=400, detail=f"Invalid {name}: expected a UUID")
