from __future__ import annotations
from app.core.config import settings

import os
from typing import Any

import httpx

_raw_ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
# Remap localhost to host.docker.internal so the API container can reach the host
OLLAMA_BASE_URL = _raw_ollama_url.replace("localhost", "host.docker.internal")
DEFAULT_CHAT_MODEL = "afruheritage-copilot:latest"
ALLOWED_CHAT_MODELS = {
    "afruheritage-copilot:latest",
    "llama3:latest",
    "deepseek-coder:latest",
    "tinyllama",
    "tinyllama:latest",
}


def resolve_chat_model(requested_model: str | None) -> str:
    if requested_model and requested_model in ALLOWED_CHAT_MODELS:
        return requested_model
    return DEFAULT_CHAT_MODEL


def _try_model(messages: list[dict], model: str) -> str | None:
    """Attempt to chat with a specific model. Returns None on failure."""
    import httpx
    payload: dict = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3},
    }
    try:
        r = httpx.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload, timeout=120.0)
        r.raise_for_status()
        data = r.json()
        return data.get("message", {}).get("content", "").strip()
    except Exception:
        return None


def resolve_chat_model(requested_model: str | None) -> str:
    if requested_model and requested_model in ALLOWED_CHAT_MODELS:
        return requested_model
    return DEFAULT_CHAT_MODEL


def chat_with_ollama(messages: list[dict[str, str]], model: str | None = None) -> str:
    primary_model = resolve_chat_model(model)
    fallback_models = ["tinyllama:latest", "tinyllama"]

    # Try primary model first
    result = _try_model(messages, primary_model)
    if result:
        return result

    # Primary failed (likely OOM) - try fallbacks
    for fallback in fallback_models:
        if fallback != primary_model:
            result = _try_model(messages, fallback)
            if result:
                return result

    raise RuntimeError("All AI models failed to respond. Please try again later.")

# Create a singleton client object
class OllamaClient:
    def chat(self, messages: list[dict[str, str]], model: str | None = None) -> str:
        return chat_with_ollama(messages, model)


ollama_client = OllamaClient()
