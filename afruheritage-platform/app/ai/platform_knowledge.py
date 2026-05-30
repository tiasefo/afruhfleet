from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

INCLUDE_GLOBS = [
    "README*.md",
    "docs/**/*.md",
    "knowledge/**/*.md",
    "app/api/routes/**/*.py",
    "app/services/**/*.py",
    "app/models/**/*.py",
    "app/schemas/**/*.py",
    "frontend/app/**/*.tsx",
    "frontend/components/**/*.tsx",
]

EXCLUDE_PARTS = {
    "node_modules",
    ".next",
    "__pycache__",
    "logs",
    "dist",
    "build",
    "venv",
    ".venv",
}

MAX_FILE_SIZE_BYTES = 512_000
MAX_FILES = 500
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 160


@dataclass
class KnowledgeChunk:
    chunk_id: str
    source_path: str
    title: str
    content: str
    metadata: dict[str, Any]


_CACHED_CHUNKS: list[KnowledgeChunk] | None = None


def _should_skip(path: Path) -> bool:
    return any(part in EXCLUDE_PARTS for part in path.parts)


def _clean_text(text: str) -> str:
    # Keep plain source context but normalize extreme whitespace.
    text = text.replace("\r\n", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9_]{3,}", text.lower()))


def _chunk_text(text: str, source_path: str) -> list[KnowledgeChunk]:
    chunks: list[KnowledgeChunk] = []
    start = 0
    idx = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + CHUNK_SIZE, text_len)
        snippet = text[start:end].strip()
        if snippet:
            chunk_id = f"{source_path}::chunk-{idx}"
            chunks.append(
                KnowledgeChunk(
                    chunk_id=chunk_id,
                    source_path=source_path,
                    title=Path(source_path).name,
                    content=snippet,
                    metadata={"start": start, "end": end},
                )
            )
            idx += 1
        if end >= text_len:
            break
        start = max(0, end - CHUNK_OVERLAP)

    return chunks


def build_runtime_corpus(force: bool = False) -> list[KnowledgeChunk]:
    global _CACHED_CHUNKS

    if _CACHED_CHUNKS is not None and not force:
        return _CACHED_CHUNKS

    files: list[Path] = []
    for pattern in INCLUDE_GLOBS:
        files.extend(REPO_ROOT.glob(pattern))

    unique_files: list[Path] = []
    seen: set[Path] = set()
    for file_path in files:
        resolved = file_path.resolve()
        if resolved in seen:
            continue
        if not resolved.is_file() or _should_skip(resolved):
            continue
        if resolved.stat().st_size > MAX_FILE_SIZE_BYTES:
            continue
        seen.add(resolved)
        unique_files.append(resolved)
        if len(unique_files) >= MAX_FILES:
            break

    chunks: list[KnowledgeChunk] = []
    for file_path in unique_files:
        try:
            raw = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        cleaned = _clean_text(raw)
        if not cleaned:
            continue
        rel = str(file_path.relative_to(REPO_ROOT))
        chunks.extend(_chunk_text(cleaned, rel))

    _CACHED_CHUNKS = chunks
    return chunks


def search_runtime_corpus(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    chunks = build_runtime_corpus()
    scored: list[tuple[float, KnowledgeChunk]] = []

    for chunk in chunks:
        content_tokens = _tokenize(chunk.content)
        if not content_tokens:
            continue
        overlap = query_tokens.intersection(content_tokens)
        if not overlap:
            continue

        overlap_score = len(overlap) / max(1, len(query_tokens))
        density_score = len(overlap) / max(1, len(content_tokens))
        phrase_bonus = 0.2 if query.lower() in chunk.content.lower() else 0.0
        score = overlap_score + density_score + phrase_bonus
        scored.append((score, chunk))

    scored.sort(key=lambda item: item[0], reverse=True)

    return [
        {
            "score": float(score),
            "chunk_id": chunk.chunk_id,
            "title": chunk.title,
            "source_path": chunk.source_path,
            "content": chunk.content,
            "metadata": chunk.metadata,
        }
        for score, chunk in scored[:top_k]
    ]
