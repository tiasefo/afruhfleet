from __future__ import annotations

import re
from typing import Any


def _sentence_split(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]


def _top_sentences(docs: list[dict[str, Any]], limit: int = 3) -> list[str]:
    sentences: list[str] = []
    for doc in docs:
        content = str(doc.get("content") or "").strip()
        if not content:
            continue
        for sentence in _sentence_split(content):
            if len(sentence) < 30:
                continue
            sentences.append(sentence)
            if len(sentences) >= limit:
                return sentences
    return sentences


def _source_paths(docs: list[dict[str, Any]], limit: int = 3) -> list[str]:
    paths: list[str] = []
    for doc in docs:
        source_path = str(doc.get("source_path") or "").strip()
        if not source_path:
            continue
        if source_path not in paths:
            paths.append(source_path)
        if len(paths) >= limit:
            break
    return paths


def generate_platform_fallback_answer(
    question: str,
    docs: list[dict[str, Any]],
    tenant_slug: str | None = None,
) -> str:
    tenant_context = (
        f"for tenant '{tenant_slug}'" if tenant_slug else "for the Afruheritage platform"
    )

    sentences = _top_sentences(docs, limit=3)
    sources = _source_paths(docs, limit=3)

    if sentences:
        summary = "\n".join(f"- {sentence}" for sentence in sentences)
        source_note = (
            f"\n\nReference files: {', '.join(sources)}" if sources else ""
        )
        return (
            f"I could not reach the live AI model right now, but I can still answer from platform documentation and source knowledge {tenant_context}.\n\n"
            f"What I found:\n{summary}"
            f"\n\nIf you want, ask a narrower follow-up (for example: 'how do I configure tenant billing?' or 'where is vendor approval handled?') and I will return a more focused answer."
            f"{source_note}"
        )

    return (
        f"I could not reach the live AI model right now. I also did not find enough indexed platform context to answer your question reliably {tenant_context}. "
        "Please try again in a moment, or rephrase your question with specific keywords such as shipment tracking, vendor onboarding, tenant setup, billing, KYC, or support."
    )
