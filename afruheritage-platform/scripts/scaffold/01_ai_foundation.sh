#!/usr/bin/env bash
set -euo pipefail

# Afruheritage AI Foundation Scaffold
# Run from repo root:
#   cd /home/afruheritage/fleetbase/afruhfleet/afruheritage-platform
#   bash scripts/scaffold/01_ai_foundation.sh

ROOT_DIR="$(pwd)"
APP_DIR="$ROOT_DIR/app"
SCRIPTS_DIR="$ROOT_DIR/scripts"
STATIC_DIR="$APP_DIR/static"
BACKUP_DIR="$ROOT_DIR/.scaffold_backups/01_ai_foundation_$(date +%Y%m%d_%H%M%S)"

require_file() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "ERROR: Expected path not found: $path"
    exit 1
  fi
}

echo "==> Validating repo root"
require_file "$ROOT_DIR/requirements.txt"
require_file "$ROOT_DIR/docker-compose.yml"
require_file "$APP_DIR"
require_file "$APP_DIR/main.py"

mkdir -p "$BACKUP_DIR"
mkdir -p "$APP_DIR/ai" "$APP_DIR/schemas" "$APP_DIR/api/routes" "$APP_DIR/services" "$STATIC_DIR/widget" "$ROOT_DIR/docs" "$ROOT_DIR/scripts"

backup_if_exists() {
  local path="$1"
  if [[ -e "$path" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "${path#$ROOT_DIR/}")"
    cp -a "$path" "$BACKUP_DIR/${path#$ROOT_DIR/}"
  fi
}

echo "==> Backing up files that may be changed"
backup_if_exists "$APP_DIR/main.py"
backup_if_exists "$ROOT_DIR/requirements.txt"
backup_if_exists "$ROOT_DIR/docker-compose.yml"

echo "==> Writing AI retriever"
cat > "$APP_DIR/ai/retriever.py" <<'PY'
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import httpx

REPO_ROOT = Path(__file__).resolve().parents[2]
INDEX_FILE = REPO_ROOT / "data" / "vectorstore" / "knowledge_index.json"
OLLAMA_BASE_URL = "http://host.docker.internal:11434"
EMBED_MODEL = "nomic-embed-text:latest"


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _embed(text: str) -> list[float]:
    with httpx.Client(timeout=120.0) as client:
        resp = client.post(
            f"{OLLAMA_BASE_URL}/api/embed",
            json={"model": EMBED_MODEL, "input": text},
        )
        resp.raise_for_status()
        data = resp.json()

    embeddings = data.get("embeddings") or data.get("embedding")
    if not embeddings:
        raise RuntimeError(f"No embedding returned: {data}")

    return embeddings[0] if isinstance(embeddings[0], list) else embeddings


def search_knowledge(query: str, scopes: list[str] | None = None, top_k: int = 5) -> list[dict[str, Any]]:
    if not INDEX_FILE.exists():
        return []

    index = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    entries = index.get("entries", [])
    query_embedding = _embed(query)

    scored: list[tuple[float, dict[str, Any]]] = []
    for entry in entries:
        entry_scope = entry.get("scope")
        if scopes and entry_scope not in scopes:
            continue
        score = _cosine_similarity(query_embedding, entry["embedding"])
        scored.append((score, entry))

    scored.sort(key=lambda x: x[0], reverse=True)

    return [
        {
            "score": score,
            "chunk_id": entry["chunk_id"],
            "title": entry["title"],
            "source_path": entry["source_path"],
            "content": entry["content"],
            "metadata": entry["metadata"],
        }
        for score, entry in scored[:top_k]
    ]
PY

echo "==> Writing Ollama client"
cat > "$APP_DIR/ai/ollama_client.py" <<'PY'
from __future__ import annotations

from typing import Any

import httpx

OLLAMA_BASE_URL = "http://host.docker.internal:11434"
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
PY

echo "==> Writing AI schemas"
cat > "$APP_DIR/schemas/ai.py" <<'PY'
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    tenant_scope: str | None = None
    tenant_slug: str | None = None
    model: str = "afruheritage-copilot:latest"
    page_url: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)


class AIChatResponse(BaseModel):
    answer: str
    sources: list[dict[str, Any]]


class AIWidgetConfigResponse(BaseModel):
    enabled: bool
    tenant_slug: str | None = None
    model: str = "afruheritage-copilot:latest"
    scope: str = "shared"
    welcome_message: str = "Welcome to Afruheritage Assistant. How can I help you today?"
    theme: str = "light"
    primary_color: str = "#0ea5e9"
    api_endpoint: str = "/api/v1/ai/chat"
PY

echo "==> Writing AI chat route"
cat > "$APP_DIR/api/routes/ai.py" <<'PY'
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ai.ollama_client import chat_with_ollama, resolve_chat_model
from app.ai.retriever import search_knowledge
from app.schemas.ai import AIChatRequest, AIChatResponse

router = APIRouter(prefix="/ai", tags=["AI"])


def build_messages(user_message: str, retrieved_docs: list[dict], tenant_slug: str | None = None) -> list[dict]:
    context_blocks = []
    for doc in retrieved_docs:
        context_blocks.append(
            f"[Source: {doc['source_path']} | score={doc['score']:.4f}]\n{doc['content']}"
        )

    context_text = "\n\n".join(context_blocks) if context_blocks else "No retrieval context found."

    tenant_rule = (
        f"You are answering for tenant '{tenant_slug}'. Do not reference other tenants."
        if tenant_slug
        else "You are answering for the Afruheritage platform."
    )

    system_message = (
        "Use the provided retrieval context when relevant. "
        "Do not invent tenant data, deployment results, URLs, or credentials. "
        "If live system state is required and missing, say exactly what is missing. "
        f"{tenant_rule}"
    )

    user_payload = (
        f"Retrieved context:\n{context_text}\n\n"
        f"User question:\n{user_message}\n\n"
        "Answer using Afruheritage platform language."
    )

    return [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_payload},
    ]


@router.post("/chat", response_model=AIChatResponse)
def ai_chat(request: AIChatRequest) -> AIChatResponse:
    scopes = ["shared"]
    if request.tenant_scope:
        scopes.insert(0, request.tenant_scope)

    docs = search_knowledge(request.message, scopes=scopes, top_k=5)
    messages = build_messages(request.message, docs, tenant_slug=request.tenant_slug)

    try:
        answer = chat_with_ollama(messages, model=resolve_chat_model(request.model))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {exc}") from exc

    return AIChatResponse(answer=answer, sources=docs)
PY

echo "==> Writing tenant AI service"
cat > "$APP_DIR/services/tenant_ai_service.py" <<'PY'
from __future__ import annotations

from typing import Any


def build_default_tenant_ai_settings(tenant: Any) -> dict[str, str | bool]:
    return {
        "widget_enabled": True,
        "chat_model": "afruheritage-copilot:latest",
        "retrieval_scope": f"tenant:{getattr(tenant, 'slug', 'unknown')}",
        "welcome_message": f"Welcome to {getattr(tenant, 'company_name', 'your workspace')} Assistant. How can I help you today?",
        "theme": "light",
        "primary_color": "#0ea5e9",
        "allowed_hostnames": f"{getattr(tenant, 'slug', 'unknown')}.afruheritage.com",
    }
PY

echo "==> Writing AI widget config route"
cat > "$APP_DIR/api/routes/ai_widget.py" <<'PY'
from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.ai import AIWidgetConfigResponse

router = APIRouter(prefix="/ai/widget", tags=["AI Widget"])


@router.get("/config", response_model=AIWidgetConfigResponse)
def get_widget_config(host: str = Query(...)) -> AIWidgetConfigResponse:
    mother_hosts = {
        "afruheritage.com",
        "www.afruheritage.com",
        "app.afruheritage.com",
        "localhost",
        "127.0.0.1",
    }

    if host in mother_hosts:
        return AIWidgetConfigResponse(
            enabled=True,
            tenant_slug=None,
            model="afruheritage-copilot:latest",
            scope="shared",
            welcome_message="Welcome to Afruheritage Assistant. How can I help you today?",
            theme="light",
            primary_color="#0ea5e9",
            api_endpoint="/api/v1/ai/chat",
        )

    tenant_slug = host.split(".")[0] if "." in host else host
    return AIWidgetConfigResponse(
        enabled=True,
        tenant_slug=tenant_slug,
        model="afruheritage-copilot:latest",
        scope=f"tenant:{tenant_slug}",
        welcome_message=f"Welcome to {tenant_slug} Assistant. How can I help you today?",
        theme="light",
        primary_color="#0ea5e9",
        api_endpoint="/api/v1/ai/chat",
    )
PY

echo "==> Writing floating widget"
cat > "$STATIC_DIR/widget/embed.js" <<'JS'
(function () {
  const existing = document.getElementById("afruheritage-ai-widget");
  if (existing) return;

  const script = document.currentScript;
  const apiBase = script?.dataset?.apiBase || window.location.origin;
  const host = window.location.hostname;

  async function fetchConfig() {
    const res = await fetch(`${apiBase}/api/v1/ai/widget/config?host=${encodeURIComponent(host)}`);
    if (!res.ok) throw new Error("Failed to load widget config");
    return res.json();
  }

  function createWidgetShell(config) {
    const root = document.createElement("div");
    root.id = "afruheritage-ai-widget";
    root.innerHTML = `
      <style>
        #afruheritage-ai-widget * { box-sizing: border-box; font-family: Arial, sans-serif; }
        #afruheritage-ai-toggle {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: ${config.primary_color || "#0ea5e9"};
          color: white;
          font-size: 24px;
          z-index: 999999;
          box-shadow: 0 8px 20px rgba(0,0,0,.2);
        }
        #afruheritage-ai-panel {
          position: fixed;
          right: 20px;
          bottom: 90px;
          width: 360px;
          max-width: calc(100vw - 40px);
          height: 520px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,.2);
          display: none;
          flex-direction: column;
          z-index: 999999;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        #afruheritage-ai-header {
          background: ${config.primary_color || "#0ea5e9"};
          color: white;
          padding: 14px 16px;
          font-weight: bold;
        }
        #afruheritage-ai-messages {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          background: #f8fafc;
        }
        .afruheritage-ai-msg {
          margin-bottom: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          max-width: 90%;
          white-space: pre-wrap;
        }
        .afruheritage-ai-bot {
          background: white;
          border: 1px solid #e5e7eb;
        }
        .afruheritage-ai-user {
          background: ${config.primary_color || "#0ea5e9"};
          color: white;
          margin-left: auto;
        }
        #afruheritage-ai-input-wrap {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }
        #afruheritage-ai-input {
          flex: 1;
          resize: none;
          min-height: 44px;
          max-height: 120px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
        }
        #afruheritage-ai-send {
          background: ${config.primary_color || "#0ea5e9"};
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0 16px;
          cursor: pointer;
        }
      </style>
      <button id="afruheritage-ai-toggle">💬</button>
      <div id="afruheritage-ai-panel">
        <div id="afruheritage-ai-header">Assistant</div>
        <div id="afruheritage-ai-messages"></div>
        <div id="afruheritage-ai-input-wrap">
          <textarea id="afruheritage-ai-input" placeholder="Ask a question..."></textarea>
          <button id="afruheritage-ai-send">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const toggle = document.getElementById("afruheritage-ai-toggle");
    const panel = document.getElementById("afruheritage-ai-panel");
    const messages = document.getElementById("afruheritage-ai-messages");
    const input = document.getElementById("afruheritage-ai-input");
    const send = document.getElementById("afruheritage-ai-send");

    function addMessage(text, cls) {
      const div = document.createElement("div");
      div.className = `afruheritage-ai-msg ${cls}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage() {
      const value = input.value.trim();
      if (!value) return;

      addMessage(value, "afruheritage-ai-user");
      input.value = "";

      try {
        const res = await fetch(`${apiBase}${config.api_endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: value,
            tenant_scope: config.scope,
            tenant_slug: config.tenant_slug,
            model: config.model,
            page_url: window.location.href
          })
        });

        const data = await res.json();
        addMessage(data.answer || "No response returned.", "afruheritage-ai-bot");
      } catch (err) {
        addMessage("The assistant is temporarily unavailable.", "afruheritage-ai-bot");
      }
    }

    toggle.addEventListener("click", () => {
      panel.style.display = panel.style.display === "flex" ? "none" : "flex";
      if (panel.style.display === "flex" && messages.children.length === 0) {
        addMessage(config.welcome_message || "How can I help you today?", "afruheritage-ai-bot");
      }
    });

    send.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  fetchConfig()
    .then((config) => {
      if (!config.enabled) return;
      createWidgetShell(config);
    })
    .catch(() => {});
})();
JS

echo "==> Writing AI integration guide"
cat > "$ROOT_DIR/docs/AI_WIDGET_INTEGRATION.md" <<'MD'
# AI Widget Integration Guide

## Purpose
This document explains how the Afruheritage floating AI widget is integrated into both the control plane and tenant runtimes.

## Architecture
- chat endpoint: `/api/v1/ai/chat`
- widget config endpoint: `/api/v1/ai/widget/config`
- widget script: `/static/widget/embed.js`

## Model Rules
- default chat model: `afruheritage-copilot:latest`
- optional fallback: `llama3:latest`
- optional dev model: `deepseek-coder:latest`
- embedding model: `nomic-embed-text:latest`

## Control Plane Integration
Insert the widget script into the shared base layout before `</body>`.

## Tenant Integration
Widget must be injected automatically for every tenant page through the tenant frontend template or Nginx HTML injection.

## New Tenant Provisioning Requirement
When a tenant is created or approved, create matching AI settings in the tenant lifecycle workflow.
Suggested defaults:
- widget enabled = true
- model = `afruheritage-copilot:latest`
- scope = `tenant:<tenant-slug>`
- allowed hostnames = `<tenant-slug>.afruheritage.com`

## Security
- tenant widget must only use allowed hostnames
- chat route must not expose other tenant knowledge
- model must come from trusted server-side config
- do not allow arbitrary public model selection in production
MD

echo "==> Patching requirements.txt"
python3 - <<'PY'
from pathlib import Path

path = Path("requirements.txt")
text = path.read_text(encoding="utf-8")
required = ["httpx", "numpy"]
lines = text.splitlines()

for pkg in required:
    if not any(line.strip().lower() == pkg for line in lines):
        lines.append(pkg)

path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
print("requirements.txt updated")
PY

echo "==> Patching docker-compose.yml with host.docker.internal mapping if needed"
python3 - <<'PY'
from pathlib import Path

path = Path("docker-compose.yml")
text = path.read_text(encoding="utf-8")

def patch_service_block(text: str, service_name: str) -> str:
    marker = f"\n  {service_name}:\n"
    idx = text.find(marker)
    if idx == -1:
        return text

    next_service = text.find("\n  ", idx + len(marker))
    if next_service == -1:
        block = text[idx:]
        block_end = len(text)
    else:
        block = text[idx:next_service]
        block_end = next_service

    if 'host.docker.internal:host-gateway' in block:
        return text

    lines = block.splitlines()
    insert_idx = None
    for i, line in enumerate(lines):
        if line.startswith("    env_file:") or line.startswith("    depends_on:") or line.startswith("    ports:"):
            insert_idx = i
            break

    extra = [
        "    extra_hosts:",
        '      - "host.docker.internal:host-gateway"',
    ]

    if insert_idx is None:
        lines.extend(extra)
    else:
        lines[insert_idx:insert_idx] = extra

    new_block = "\n".join(lines)
    return text[:idx] + new_block + text[block_end:]

patched = text
for svc in ("api", "worker"):
    patched = patch_service_block(patched, svc)

path.write_text(patched, encoding="utf-8")
print("docker-compose.yml updated")
PY

echo "==> Patching main.py"
python3 - <<'PY'
from pathlib import Path

path = Path("app/main.py")
text = path.read_text(encoding="utf-8")

imports_to_add = [
    "from fastapi.staticfiles import StaticFiles",
    "from app.api.routes.ai import router as ai_router",
    "from app.api.routes.ai_widget import router as ai_widget_router",
]

for imp in imports_to_add:
    if imp not in text:
        text = imp + "\n" + text

if 'app.mount("/static", StaticFiles(directory="app/static"), name="static")' not in text:
    if "app = FastAPI(" in text:
        text = text.replace(
            "app = FastAPI(",
            'app = FastAPI(',
            1,
        )
        insert_after = text.find("\n", text.find("app = FastAPI("))
        text = (
            text[:insert_after + 1]
            + 'app.mount("/static", StaticFiles(directory="app/static"), name="static")\n'
            + text[insert_after + 1:]
        )
    elif "app = FastAPI()" in text:
        text = text.replace(
            "app = FastAPI()",
            'app = FastAPI()\napp.mount("/static", StaticFiles(directory="app/static"), name="static")',
            1,
        )

route_lines = [
    'app.include_router(ai_router, prefix="/api/v1")',
    'app.include_router(ai_widget_router, prefix="/api/v1")',
]

for route_line in route_lines:
    if route_line not in text:
        insertion_point = text.rfind("app.include_router(")
        if insertion_point != -1:
            line_end = text.find("\n", insertion_point)
            text = text[:line_end + 1] + route_line + "\n" + text[line_end + 1:]
        else:
            text += "\n" + route_line + "\n"

path.write_text(text, encoding="utf-8")
print("app/main.py updated")
PY

echo "==> Ensuring package init files exist"
touch "$APP_DIR/ai/__init__.py"
touch "$APP_DIR/schemas/__init__.py"

echo
echo "Scaffold complete."
echo
echo "Saved backups under:"
echo "  $BACKUP_DIR"
echo
echo "Next steps:"
echo "  1) Review app/main.py"
echo "  2) Rebuild containers:"
echo "       sudo docker compose down"
echo "       sudo docker compose up -d --build"
echo "  3) Test Ollama from API container:"
echo "       sudo docker compose exec -T api python - <<'PY'"
echo "       import httpx"
echo "       r = httpx.get('http://host.docker.internal:11434/api/tags', timeout=20.0)"
echo "       print(r.status_code)"
echo "       print(r.text[:300])"
echo "       PY"
echo "  4) Test AI route:"
echo "       curl -X POST http://localhost:8000/api/v1/ai/chat \\"
echo "         -H 'Content-Type: application/json' \\"
echo "         -d '{\"message\":\"What does queued_for_deploy mean in Afruheritage?\",\"tenant_scope\":\"shared\"}'"
echo
echo "Manual follow-up still needed:"
echo "  - Integrate tenant AI settings into the tenant create/approve lifecycle"
echo "  - Inject widget script into control-plane base template and tenant pages"
