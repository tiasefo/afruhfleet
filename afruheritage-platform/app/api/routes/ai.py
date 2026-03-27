from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.ai.ollama_client import ollama_client
from app.ai.retriever import knowledge_retriever
from app.api.deps import get_current_user
from app.db.session import get_db
from app.middleware.rate_limit import rate_limit
from app.models.user import User
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
@rate_limit(category="auth", rule="ai_chat")
def ai_chat(
    request: AIChatRequest,
    db: Session = Depends(get_db),
) -> AIChatResponse:
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
