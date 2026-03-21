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

knowledge_retriever = None
