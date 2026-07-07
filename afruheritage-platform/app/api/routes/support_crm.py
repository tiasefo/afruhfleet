from __future__ import annotations
from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from uuid import UUID
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, require_superuser, require_active_subscription
from app.db.session import get_db
from app.models.support_crm import CRMAccount, CRMContact, Opportunity, Quote, SupportTicket, SupportTicketMessage
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.support_crm import CRMAccountCreateRequest, CRMAccountResponse, CRMContactCreateRequest, CRMContactResponse, OpportunityCreateRequest, OpportunityResponse, PublicTicketCreateRequest, QuoteCreateRequest, QuoteResponse, SupportTicketMessageResponse, SupportTicketResponse, TicketReplyRequest
from app.services.support_crm_service import add_ticket_message, create_crm_account, create_crm_contact, create_opportunity, create_public_ticket, create_quote, sync_ticket_to_glpi
from app.middleware.rate_limit import rate_limit
router = APIRouter(prefix='/support-crm', tags=['Support & CRM'])

def _resolve_tenant_uuid(db: Session, tenant_identifier: str) -> str:
    try:
        return str(UUID(str(tenant_identifier)))
    except (ValueError, TypeError):
        tenant = db.query(Tenant).filter((Tenant.slug == tenant_identifier) | (Tenant.subdomain == tenant_identifier)).first()
        if tenant:
            return str(tenant.id)
        raise HTTPException(status_code=422, detail='Invalid tenant_id. Provide a valid tenant UUID or known tenant slug.')

@router.post('/accounts', response_model=CRMAccountResponse)
def create_account(tenant_id: str, request: CRMAccountCreateRequest, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context. Please complete onboarding.')
    data = request.model_dump()
    data['tenant_id'] = str(current_user.tenant_id)
    obj = create_crm_account(db, **data)
    return CRMAccountResponse(id=str(obj.id), tenant_id=str(obj.tenant_id), account_type=obj.account_type.value, company_name=obj.company_name, email=obj.email, phone=obj.phone)

@router.get('/accounts', response_model=list[CRMAccountResponse])
def list_accounts(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context. Please complete onboarding.')
    accounts = db.query(CRMAccount).filter(CRMAccount.tenant_id == str(current_user.tenant_id)).order_by(CRMAccount.created_at.desc()).all()
    return [
        CRMAccountResponse(
            id=str(acc.id), 
            tenant_id=str(acc.tenant_id), 
            account_type=acc.account_type.value, 
            company_name=acc.company_name, 
            email=acc.email, 
            phone=acc.phone
        ) 
        for acc in accounts
    ]

@router.get('/contacts', response_model=list[CRMContactResponse])
def list_contacts(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context. Please complete onboarding.')
    contacts = db.query(CRMContact).filter(CRMContact.tenant_id == str(current_user.tenant_id)).order_by(CRMContact.created_at.desc()).all()
    return [
        CRMContactResponse(
            id=str(contact.id), 
            tenant_id=str(contact.tenant_id), 
            account_id=str(contact.account_id), 
            first_name=contact.first_name, 
            last_name=contact.last_name, 
            email=contact.email, 
            phone=contact.phone
        ) 
        for contact in contacts
    ]

@router.post('/contacts', response_model=CRMContactResponse)
def create_contact(tenant_id: str, request: CRMContactCreateRequest, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context. Please complete onboarding.')
    data = request.model_dump()
    data['tenant_id'] = str(current_user.tenant_id)
    obj = create_crm_contact(db, **data)
    return CRMContactResponse(id=str(obj.id), tenant_id=str(obj.tenant_id), account_id=str(obj.account_id), first_name=obj.first_name, last_name=obj.last_name, email=obj.email, phone=obj.phone)

@router.get('/opportunities', response_model=list[OpportunityResponse])
def list_opportunities(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context. Please complete onboarding.')
    opportunities = db.query(Opportunity).filter(Opportunity.tenant_id == str(current_user.tenant_id)).order_by(Opportunity.created_at.desc()).all()
    return [
        OpportunityResponse(
            id=str(opp.id), 
            tenant_id=str(opp.tenant_id), 
            title=opp.title, 
            stage=opp.stage.value, 
            currency=opp.currency, 
            estimated_value=float(opp.estimated_value) if opp.estimated_value is not None else None
        ) 
        for opp in opportunities
    ]

@router.post('/opportunities', response_model=OpportunityResponse)
def create_opportunity_route(tenant_id: str, request: OpportunityCreateRequest, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context. Please complete onboarding.')
    data = request.model_dump()
    data['tenant_id'] = str(current_user.tenant_id)
    obj = create_opportunity(db, **data)
    return OpportunityResponse(id=str(obj.id), tenant_id=str(obj.tenant_id), title=obj.title, stage=obj.stage.value, currency=obj.currency, estimated_value=float(obj.estimated_value) if obj.estimated_value is not None else None)

@router.get('/quotes', response_model=list[QuoteResponse])
def list_quotes(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context. Please complete onboarding.')
    quotes = db.query(Quote).filter(Quote.tenant_id == str(current_user.tenant_id)).order_by(Quote.created_at.desc()).all()
    return [
        QuoteResponse(
            id=str(quote.id), 
            tenant_id=str(quote.tenant_id), 
            quote_number=quote.quote_number, 
            status=quote.status.value, 
            currency=quote.currency, 
            total_amount=float(quote.total_amount)
        ) 
        for quote in quotes
    ]

@router.post('/quotes', response_model=QuoteResponse)
def create_quote_route(tenant_id: str, request: QuoteCreateRequest, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context. Please complete onboarding.')
    data = request.model_dump()
    data['tenant_id'] = str(current_user.tenant_id)
    obj = create_quote(db, **data)
    return QuoteResponse(id=str(obj.id), tenant_id=str(obj.tenant_id), quote_number=obj.quote_number, status=obj.status.value, currency=obj.currency, total_amount=float(obj.total_amount))

@router.post('/public/tickets', response_model=SupportTicketResponse)
def create_public_ticket_route(tenant_id: str, request: Request, payload: PublicTicketCreateRequest, db: Session=Depends(get_db)):
    data = payload.model_dump()
    data['tenant_id'] = _resolve_tenant_uuid(db, data.get('tenant_id') or tenant_id)
    obj = create_public_ticket(db, **data)
    obj = sync_ticket_to_glpi(db, obj, entity_id=None)
    return SupportTicketResponse(id=str(obj.id), tenant_id=str(obj.tenant_id), public_token=obj.public_token, subject=obj.subject, description=obj.description, category=obj.category, priority=obj.priority.value, status=obj.status.value, shipment_reference=obj.shipment_reference, tracking_reference=obj.tracking_reference, glpi_ticket_id=obj.glpi_ticket_id)

@router.get('/public/tickets/{public_token}', response_model=SupportTicketResponse)
def get_public_ticket(tenant_id: str, public_token: str, db: Session=Depends(get_db)):
    obj = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
    if not obj:
        raise HTTPException(status_code=404, detail='Ticket not found')
    return SupportTicketResponse(id=str(obj.id), tenant_id=str(obj.tenant_id), public_token=obj.public_token, subject=obj.subject, description=obj.description, category=obj.category, priority=obj.priority.value, status=obj.status.value, shipment_reference=obj.shipment_reference, tracking_reference=obj.tracking_reference, glpi_ticket_id=obj.glpi_ticket_id)

@router.get('/public/tickets/{public_token}/messages', response_model=list[SupportTicketMessageResponse])
def get_public_ticket_messages(tenant_id: str, public_token: str, db: Session=Depends(get_db)):
    ticket = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    rows = db.query(SupportTicketMessage).filter(SupportTicketMessage.ticket_id == ticket.id, SupportTicketMessage.visible_to_public == True).order_by(SupportTicketMessage.created_at.asc()).all()
    return [SupportTicketMessageResponse(id=str(x.id), ticket_id=str(x.ticket_id), author_type=x.author_type, author_name=x.author_name, body=x.body, visible_to_public=x.visible_to_public) for x in rows]

@router.post('/public/tickets/{public_token}/reply', response_model=SupportTicketMessageResponse)
def reply_public_ticket(tenant_id: str, public_token: str, request: TicketReplyRequest, db: Session=Depends(get_db)):
    ticket = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    msg = add_ticket_message(db=db, ticket_id=str(ticket.id), body=request.body, author_type=request.author_type, author_name=request.author_name, visible_to_public=request.visible_to_public)
    return SupportTicketMessageResponse(id=str(msg.id), ticket_id=str(msg.ticket_id), author_type=msg.author_type, author_name=msg.author_name, body=msg.body, visible_to_public=msg.visible_to_public)


@router.get('/admin/tickets', response_model=dict)
def list_admin_tickets(status: str | None=None, tenant_id: str | None=None, q: str | None=None, page: int=Query(1, ge=1), page_size: int=Query(20, ge=1, le=100), db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    rows = db.query(SupportTicket)
    if status:
        rows = rows.filter(SupportTicket.status == status)
    if tenant_id:
        try:
            rows = rows.filter(SupportTicket.tenant_id == UUID(tenant_id))
        except ValueError:
            rows = rows.filter(SupportTicket.tenant_id == tenant_id)
    if q:
        needle = f"%{q}%"
        rows = rows.filter((SupportTicket.subject.ilike(needle)) | (SupportTicket.description.ilike(needle)) | (SupportTicket.public_submitter_email.ilike(needle)) | (SupportTicket.public_submitter_name.ilike(needle)))
    total = rows.count()
    items = rows.order_by(SupportTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        'items': [
            {
                'id': str(x.id),
                'tenant_id': str(x.tenant_id),
                'public_token': x.public_token,
                'subject': x.subject,
                'description': x.description,
                'category': x.category,
                'priority': x.priority.value,
                'status': x.status.value,
                'shipment_reference': x.shipment_reference,
                'tracking_reference': x.tracking_reference,
                'public_submitter_name': x.public_submitter_name,
                'public_submitter_email': x.public_submitter_email,
                'created_at': x.created_at.isoformat() if x.created_at else None,
                'updated_at': x.updated_at.isoformat() if x.updated_at else None,
            }
            for x in items
        ],
        'total': total,
        'page': page,
        'page_size': page_size,
        'pages': pages,
    }


# ---------------------------------------------------------------------------
# Tenant-scoped tickets (for logged-in tenant users to manage their own tickets)
# ---------------------------------------------------------------------------
@router.get('/tickets', response_model=dict)
def list_tenant_tickets(
    status: str | None=None,
    q: str | None=None,
    page: int=Query(1, ge=1),
    page_size: int=Query(20, ge=1, le=100),
    db: Session=Depends(get_db),
    current_user: User=Depends(require_active_subscription),
):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context.')
    rows = db.query(SupportTicket).filter(SupportTicket.tenant_id == str(current_user.tenant_id))
    if status:
        rows = rows.filter(SupportTicket.status == status)
    if q:
        needle = f"%{q}%"
        rows = rows.filter((SupportTicket.subject.ilike(needle)) | (SupportTicket.description.ilike(needle)) | (SupportTicket.public_submitter_email.ilike(needle)) | (SupportTicket.public_submitter_name.ilike(needle)))
    total = rows.count()
    items = rows.order_by(SupportTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        'items': [
            {
                'id': str(x.id),
                'tenant_id': str(x.tenant_id),
                'public_token': x.public_token,
                'subject': x.subject,
                'description': x.description,
                'category': x.category,
                'priority': x.priority.value,
                'status': x.status.value,
                'shipment_reference': x.shipment_reference,
                'tracking_reference': x.tracking_reference,
                'public_submitter_name': x.public_submitter_name,
                'public_submitter_email': x.public_submitter_email,
                'created_at': x.created_at.isoformat() if x.created_at else None,
                'updated_at': x.updated_at.isoformat() if x.updated_at else None,
            }
            for x in items
        ],
        'total': total,
        'page': page,
        'page_size': page_size,
        'pages': pages,
    }


@router.get('/tickets/{ticket_id}/messages', response_model=list[SupportTicketMessageResponse])
def list_tenant_ticket_messages(ticket_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context.')
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id, SupportTicket.tenant_id == str(current_user.tenant_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    rows = db.query(SupportTicketMessage).filter(SupportTicketMessage.ticket_id == ticket.id).order_by(SupportTicketMessage.created_at.asc()).all()
    return [SupportTicketMessageResponse(id=str(x.id), ticket_id=str(x.ticket_id), author_type=x.author_type, author_name=x.author_name, body=x.body, visible_to_public=x.visible_to_public) for x in rows]


@router.post('/tickets/{ticket_id}/reply', response_model=SupportTicketMessageResponse)
def reply_tenant_ticket(ticket_id: str, request: TicketReplyRequest, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context.')
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id, SupportTicket.tenant_id == str(current_user.tenant_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    msg = add_ticket_message(db=db, ticket_id=str(ticket.id), body=request.body, author_type=request.author_type or 'staff', author_name=request.author_name or current_user.full_name or 'Staff', visible_to_public=request.visible_to_public)
    # Update ticket status to waiting_customer if staff replied
    if ticket.status == SupportTicketStatus.OPEN:
        ticket.status = SupportTicketStatus.WAITING_CUSTOMER
        db.commit()
    return SupportTicketMessageResponse(id=str(msg.id), ticket_id=str(msg.ticket_id), author_type=msg.author_type, author_name=msg.author_name, body=msg.body, visible_to_public=msg.visible_to_public)


@router.patch('/tickets/{ticket_id}/status', response_model=dict)
def update_tenant_ticket_status(ticket_id: str, status: str, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context.')
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id, SupportTicket.tenant_id == str(current_user.tenant_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    try:
        ticket.status = SupportTicketStatus(status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Unsupported ticket status') from exc
    db.commit()
    db.refresh(ticket)
    return {'id': str(ticket.id), 'status': ticket.status.value}


@router.patch('/admin/tickets/{ticket_id}/status', response_model=dict)
def update_admin_ticket_status(ticket_id: str, status: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    try:
        ticket.status = ticket.status.__class__(status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Unsupported ticket status') from exc
    db.commit()
    db.refresh(ticket)
    return {'id': str(ticket.id), 'status': ticket.status.value}
