from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.billing_service import consume_wallet_credits, evaluate_subscription_state, feature_credit_cost, feature_enabled_for_plan

from app.ai.ollama_client import chat_with_ollama, resolve_chat_model
from app.ai.retriever import search_knowledge
from app.schemas.ai import AIChatRequest, AIChatResponse

router = APIRouter(prefix='/ai', tags=['AI'])

def build_messages(user_message: str, retrieved_docs: list[dict], tenant_slug: str | None=None) -> list[dict]:
    context_blocks = []
    for doc in retrieved_docs:
        context_blocks.append(f"[Source: {doc['source_path']} | score={doc['score']:.4f}]\n{doc['content']}")
    context_text = '\n\n'.join(context_blocks) if context_blocks else 'No retrieval context found.'
    tenant_rule = f"You are answering for tenant '{tenant_slug}'. Do not reference other tenants." if tenant_slug else 'You are answering for the Afruheritage platform.'
    system_message = f'Use the provided retrieval context when relevant. Do not invent tenant data, deployment results, URLs, or credentials. If live system state is required and missing, say exactly what is missing. {tenant_rule}'
    user_payload = f'Retrieved context:\n{context_text}\n\nUser question:\n{user_message}\n\nAnswer using Afruheritage platform language.'
    return [{'role': 'system', 'content': system_message}, {'role': 'user', 'content': user_payload}]

@router.post('/chat', response_model=AIChatResponse)
def ai_chat(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AIChatResponse:
    tenant_id = str(getattr(current_user, 'tenant_id', '') or '')
    if not tenant_id:
        raise HTTPException(status_code=400, detail='Tenant context required for AI usage')

    sub = evaluate_subscription_state(db, tenant_id)
    if not sub:
        raise HTTPException(status_code=402, detail='No active subscription found for tenant')
    if not feature_enabled_for_plan(sub.plan_code.value, 'ai_assistant'):
        raise HTTPException(status_code=403, detail='Current plan does not include AI Assistant')

    scopes = ['shared']
    if payload.tenant_scope:
        scopes.insert(0, payload.tenant_scope)
    docs = search_knowledge(payload.message, scopes=scopes, top_k=6)
    messages = build_messages(payload.message, docs, tenant_slug=payload.tenant_slug)
    try:
        answer = chat_with_ollama(messages, model=resolve_chat_model(payload.model))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'AI chat failed: {exc}') from exc

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
