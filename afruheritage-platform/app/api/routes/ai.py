from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_current_user, get_db, require_feature, require_active_subscription
from app.models.user import User
from app.services.billing_service import consume_wallet_credits, evaluate_subscription_state, feature_credit_cost, feature_enabled_for_plan

from app.ai.ollama_client import chat_with_ollama, resolve_chat_model
from app.ai.retriever import search_knowledge
from app.ai.platform_assistant import generate_platform_fallback_answer
from app.schemas.ai import AIChatRequest, AIChatResponse

router = APIRouter(prefix='/ai', tags=['AI'])

PLATFORM_SYSTEM_PROMPT = """You are the Afruheritage AI Assistant — a helpful, knowledgeable assistant for the Afruheritage freight-forwarding SaaS platform powered by Infotech.

You help users with:
- Understanding platform features (shipments, tracking, billing, vendors, KYC)
- Navigating the platform (how to create shipments, register as a vendor, upgrade plans)
- Answering questions about the Uber-like delivery vendor marketplace
- Explaining the WordPress-like multi-tenant provisioning system
- Billing, subscriptions, Paystack payments, and credit wallets
- Technical support and troubleshooting

You MUST:
- Always be helpful and professional
- Use the retrieved context to give accurate, platform-specific answers
- Speak in simple, clear language suitable for freight logistics professionals
- If asked about specific tenant data you don't have, acknowledge the limitation
- Support both English and Chinese questions

You MUST NOT:
- Invent URLs, credentials, or system states you don't have data for
- Reference competitor platforms
- Reveal internal system architecture details that are confidential
"""


def build_messages(user_message: str, retrieved_docs: list[dict], tenant_slug: str | None = None) -> list[dict]:
    context_blocks = []
    for doc in retrieved_docs:
        context_blocks.append(f"[Source: {doc['title']} | relevance={doc['score']:.2f}]\n{doc['content']}")
    context_text = '\n\n---\n\n'.join(context_blocks) if context_blocks else ''

    tenant_rule = (
        f"You are currently assisting a user from tenant '{tenant_slug}'."
        if tenant_slug
        else "You are assisting a general Afruheritage platform user."
    )

    system_content = f"{PLATFORM_SYSTEM_PROMPT}\n\n{tenant_rule}"
    if context_text:
        user_payload = f"Relevant platform knowledge:\n\n{context_text}\n\n---\n\nUser question: {user_message}"
    else:
        user_payload = f"User question: {user_message}"

    return [
        {'role': 'system', 'content': system_content},
        {'role': 'user', 'content': user_payload},
    ]


@router.post('/chat/public', response_model=AIChatResponse)
def ai_chat_public(payload: AIChatRequest) -> AIChatResponse:
    """Public AI chat endpoint — no auth required. Uses shared knowledge scope only."""
    scopes = ['shared']
    if payload.tenant_scope and payload.tenant_scope.startswith('tenant:'):
        scopes.insert(0, payload.tenant_scope)

    docs = search_knowledge(payload.message, scopes=scopes, top_k=8)
    messages = build_messages(payload.message, docs, tenant_slug=payload.tenant_slug)
    try:
        answer = chat_with_ollama(messages, model=resolve_chat_model(payload.model))
    except RuntimeError as exc:
        # Keep public assistant available even when model runtime is unavailable.
        answer = generate_platform_fallback_answer(payload.message, docs, payload.tenant_slug)
    except Exception as exc:
        answer = generate_platform_fallback_answer(payload.message, docs, payload.tenant_slug)
    return AIChatResponse(answer=answer, sources=docs)


@router.post('/chat', response_model=AIChatResponse)
def ai_chat(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature('ai_basic')),
) -> AIChatResponse:
    tenant_id = str(getattr(current_user, 'tenant_id', '') or '')

    scopes = ['shared']
    if payload.tenant_scope:
        scopes.insert(0, payload.tenant_scope)
    elif tenant_id:
        scopes.insert(0, tenant_id)

    docs = search_knowledge(payload.message, scopes=scopes, top_k=6)
    messages = build_messages(payload.message, docs, tenant_slug=payload.tenant_slug)
    try:
        answer = chat_with_ollama(messages, model=resolve_chat_model(payload.model))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=f'AI service unavailable: {exc}') from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'AI chat failed: {exc}') from exc

    if tenant_id:
        credit_cost = feature_credit_cost('ai_chat_message')
        if credit_cost > 0:
            try:
                consume_wallet_credits(
                    db,
                    tenant_id=tenant_id,
                    usage_type='ai_usage',
                    credits=credit_cost,
                    memo='AI chat message usage',
                )
            except ValueError as exc:
                raise HTTPException(status_code=402, detail=str(exc)) from exc

    return AIChatResponse(answer=answer, sources=docs)
