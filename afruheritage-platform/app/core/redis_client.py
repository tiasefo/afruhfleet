import json
from typing import Optional, Any
import redis
from app.core.config import settings

# Redis client singleton
_redis_client: Optional[redis.Redis] = None

def get_redis_client() -> redis.Redis:
    """Get or create Redis client singleton."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5
        )
    return _redis_client

def cache_get(key: str) -> Optional[Any]:
    """Get value from cache."""
    try:
        client = get_redis_client()
        value = client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception:
        return None

def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    """Set value in cache with TTL (default 1 hour)."""
    try:
        client = get_redis_client()
        client.setex(key, ttl, json.dumps(value))
        return True
    except Exception:
        return False

def cache_delete(key: str) -> bool:
    """Delete value from cache."""
    try:
        client = get_redis_client()
        client.delete(key)
        return True
    except Exception:
        return False

def cache_delete_pattern(pattern: str) -> bool:
    """Delete all keys matching pattern."""
    try:
        client = get_redis_client()
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
        return True
    except Exception:
        return False
