from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any

import httpx

REPO_ROOT = Path(__file__).resolve().parent.parent
KNOWLEDGE_ROOT = REPO_ROOT / "knowledge"
VECTORSTORE_DIR = REPO_ROOT / "data" / "vectorstore"
VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

OLLAMA_BASE_URL = "http://localhost:11434"
EMBED_MODEL = "nomic-embed-text:latest"
OUTPUT_FILE = VECTORSTORE_DIR / "knowledge_index.json"


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    if not text.startswith("---"):
        return {}, text.strip()

    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text.strip()

    raw_meta = parts[1].strip()
    body = parts[2].strip()
    meta: dict[str, Any] = {}
    current_key = None

    for line in raw_meta.splitlines():
        if not line.strip():
            continue
        if re.match(r"^[A-Za-z0-9_-]+:", line):
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            current_key = key
            meta[key] = value if value else []
        elif line.strip().startswith("- ") and current_key:
            if not isinstance(meta.get(current_key), list):
                meta[current_key] = []
            meta[current_key].append(line.strip()[2:].strip())

    return meta, body


def chunk_text(text: str, chunk_size: int = 900, overlap: int = 150) -> list[str]:
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return []

    paragraphs = text.split("\n\n")
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        candidate = f"{current}\n\n{para}".strip() if current else para
        if len(candidate) <= chunk_size:
            current = candidate
            continue

        if current:
            chunks.append(current)

        if len(para) <= chunk_size:
            current = para
        else:
            start = 0
            while start < len(para):
                end = start + chunk_size
                chunks.append(para[start:end])
                start += max(1, chunk_size - overlap)
            current = ""

    if current:
        chunks.append(current)

    return chunks


def get_embedding(text: str) -> list[float]:
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


def collect_markdown_files(root: Path) -> list[Path]:
    return sorted(root.rglob("*.md"))


def build_index() -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    md_files = collect_markdown_files(KNOWLEDGE_ROOT)

    for path in md_files:
        raw = path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)
        rel = path.relative_to(REPO_ROOT).as_posix()
        scope = str(meta.get("scope", "shared"))
        title = str(meta.get("title", path.stem))

        for idx, content in enumerate(chunk_text(body), start=1):
            embedding = get_embedding(content)
            entries.append(
                {
                    "chunk_id": f"{path.stem}-{idx}",
                    "scope": scope,
                    "source_path": rel,
                    "title": title,
                    "content": content,
                    "metadata": meta,
                    "embedding": embedding,
                }
            )
            print(f"indexed {rel} chunk {idx}")

    return {"model": EMBED_MODEL, "entries": entries}


def main() -> None:
    index = build_index()
    OUTPUT_FILE.write_text(json.dumps(index), encoding="utf-8")
    print(f"saved index to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
