from __future__ import annotations
from app.core.config import settings

import os
from typing import Any

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_CHAT_MODEL = "afruheritage-copilot:latest"
ALLOWED_CHAT_MODELS = {
    "afruheritage-copilot:latest",
    "llama3:latest",
    "deepseek-coder:latest",
}


def resolve_chat_model(requested_model: str | None) -> str:
    if requested_model and requested_model in ALLOWED_CHAT_MODELS:
        return requested_model
    return DEFAULT_CHAT_MODEL


def chat_with_ollama(messages: list[dict[str, str]], model: str | None = None) -> str:
    payload: dict[str, Any] = {
        "model": resolve_chat_model(model),
        "messages": messages,
        "stream": False,
        "keep_alive": "10m",
    }

    with httpx.Client(timeout=180.0) as client:
        resp = client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()

    return data.get("message", {}).get("content", "").strip()

# Create a singleton client object
class OllamaClient:
    def chat(self, messages: list[dict[str, str]], model: str | None = None) -> str:
        return chat_with_ollama(messages, model)


ollama_client = OllamaClient()
