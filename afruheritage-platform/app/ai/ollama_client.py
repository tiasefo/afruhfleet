from __future__ import annotations
from app.core.config import settings

import os
from typing import Any

import httpx

_raw_ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
# Remap localhost to host.docker.internal so the API container can reach the host
OLLAMA_BASE_URL = _raw_ollama_url.replace("localhost", "host.docker.internal")

# Models currently available on the Ollama host reachable from the API container.
# These are the only models the platform should advertise/allow.
DEFAULT_CHAT_MODEL = "llama3.2:latest"
ALLOWED_CHAT_MODELS = {
    "llama3.2:latest",
    "qwen2.5-coder:7b",
}


def resolve_chat_model(requested_model: str | None) -> str:
    if requested_model and requested_model in ALLOWED_CHAT_MODELS:
        return requested_model
    return DEFAULT_CHAT_MODEL


def _try_model(messages: list[dict], model: str, timeout_s: float = 120.0) -> str | None:
    """Attempt to chat with a specific model. Returns None on failure."""
    import httpx
    payload: dict = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3},
    }
    try:
        r = httpx.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload, timeout=timeout_s)
        r.raise_for_status()
        data = r.json()
        return data.get("message", {}).get("content", "").strip()
    except Exception:
        return None


def chat_with_ollama(messages: list[dict[str, str]], model: str | None = None, timeout_s: float = 120.0, deadline_s: float | None = None) -> str:
    import time
    started = time.monotonic()
    primary_model = resolve_chat_model(model)
    fallback_models = list(ALLOWED_CHAT_MODELS)

    # Try primary model first
    result = _try_model(messages, primary_model, timeout_s=timeout_s)
    if result:
        return result

    # Primary failed (likely OOM) - try fallbacks within the deadline
    for fallback in fallback_models:
        if fallback != primary_model:
            if deadline_s is not None and time.monotonic() - started >= deadline_s:
                break
            result = _try_model(messages, fallback, timeout_s=timeout_s)
            if result:
                return result

    raise RuntimeError("All AI models failed to respond. Please try again later.")

# Create a singleton client object
class OllamaClient:
    def chat(self, messages: list[dict[str, str]], model: str | None = None) -> str:
        return chat_with_ollama(messages, model)


ollama_client = OllamaClient()
