from __future__ import annotations
from app.core.config import settings

import json
import math
import os
from pathlib import Path
from typing import Any

import httpx
from app.ai.platform_knowledge import search_runtime_corpus

REPO_ROOT = Path(__file__).resolve().parents[2]
INDEX_FILE = REPO_ROOT / "data" / "vectorstore" / "knowledge_index.json"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
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
        return search_runtime_corpus(query, top_k=top_k)

    try:
        index = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    except Exception:
        return search_runtime_corpus(query, top_k=top_k)

    entries = index.get("entries", [])
    try:
        query_embedding = _embed(query)
    except Exception:
        # Fall back to lexical retrieval when embeddings are unavailable.
        return search_runtime_corpus(query, top_k=top_k)

    scored: list[tuple[float, dict[str, Any]]] = []
    for entry in entries:
        entry_scope = entry.get("scope")
        if scopes and entry_scope not in scopes:
            continue
        score = _cosine_similarity(query_embedding, entry["embedding"])
        scored.append((score, entry))

    scored.sort(key=lambda x: x[0], reverse=True)

    # Keep vector hits, but prioritize runtime code/docs chunks for platform-aware answers.
    vector_top_k = max(1, top_k // 3)
    vector_results = [
        {
            "score": score,
            "chunk_id": entry["chunk_id"],
            "title": entry["title"],
            "source_path": entry["source_path"],
            "content": entry["content"],
            "metadata": entry["metadata"],
        }
        for score, entry in scored[:vector_top_k]
    ]

    lexical_results = search_runtime_corpus(query, top_k=top_k)
    if not vector_results:
        return lexical_results

    merged: list[dict[str, Any]] = []
    seen_chunk_ids: set[str] = set()

    for result in vector_results + lexical_results:
        chunk_id = result.get("chunk_id")
        if chunk_id in seen_chunk_ids:
            continue
        seen_chunk_ids.add(chunk_id)
        merged.append(result)
        if len(merged) >= top_k:
            break

    return merged

knowledge_retriever = None
