from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser
from app.db.session import get_db
from app.models.support_crm import CRMAccount, CRMContact, Opportunity, Quote, SupportTicket, SupportTicketMessage
from app.models.user import User
from app.schemas.support_crm import (
    CRMAccountCreateRequest,
    CRMAccountResponse,
    CRMContactCreateRequest,
    CRMContactResponse,
    OpportunityCreateRequest,
    OpportunityResponse,
    PublicTicketCreateRequest,
    QuoteCreateRequest,
    QuoteResponse,
    SupportTicketMessageResponse,
    SupportTicketResponse,
    TicketReplyRequest,
)
from app.services.support_crm_service import (
    add_ticket_message,
    create_crm_account,
    create_crm_contact,
    create_opportunity,
    create_public_ticket,
    create_quote,
    sync_ticket_to_glpi,
)
from app.middleware.rate_limit import rate_limit

router = APIRouter(prefix="/support-crm", tags=["Support & CRM"])


@router.post("/accounts", response_model=CRMAccountResponse)
def create_account(
    request: CRMAccountCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = create_crm_account(db, **request.model_dump())
    return CRMAccountResponse(
        id=str(obj.id),
        tenant_id=str(obj.tenant_id),
        account_type=obj.account_type.value,
        company_name=obj.company_name,
        email=obj.email,
        phone=obj.phone,
    )


@router.post("/contacts", response_model=CRMContactResponse)
def create_contact(
    request: CRMContactCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = create_crm_contact(db, **request.model_dump())
    return CRMContactResponse(
        id=str(obj.id),
        tenant_id=str(obj.tenant_id),
        account_id=str(obj.account_id),
        first_name=obj.first_name,
        last_name=obj.last_name,
        email=obj.email,
        phone=obj.phone,
    )


@router.post("/opportunities", response_model=OpportunityResponse)
def create_opportunity_route(
    request: OpportunityCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = create_opportunity(db, **request.model_dump())
    return OpportunityResponse(
        id=str(obj.id),
        tenant_id=str(obj.tenant_id),
        title=obj.title,
        stage=obj.stage.value,
        currency=obj.currency,
        estimated_value=float(obj.estimated_value) if obj.estimated_value is not None else None,
    )


@router.post("/quotes", response_model=QuoteResponse)
def create_quote_route(
    request: QuoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = create_quote(db, **request.model_dump())
    return QuoteResponse(
        id=str(obj.id),
        tenant_id=str(obj.tenant_id),
        quote_number=obj.quote_number,
        status=obj.status.value,
        currency=obj.currency,
        total_amount=float(obj.total_amount),
    )


@router.post("/public/tickets", response_model=SupportTicketResponse)
@rate_limit(category="public", rule="support_create")
def create_public_ticket_route(
    request: PublicTicketCreateRequest,
    db: Session = Depends(get_db),
):
    obj = create_public_ticket(db, **request.model_dump())
    obj = sync_ticket_to_glpi(db, obj, entity_id=None)
    return SupportTicketResponse(
        id=str(obj.id),
        tenant_id=str(obj.tenant_id),
        public_token=obj.public_token,
        subject=obj.subject,
        description=obj.description,
        category=obj.category,
        priority=obj.priority.value,
        status=obj.status.value,
        shipment_reference=obj.shipment_reference,
        tracking_reference=obj.tracking_reference,
        glpi_ticket_id=obj.glpi_ticket_id,
    )


@router.get("/public/tickets/{public_token}", response_model=SupportTicketResponse)
def get_public_ticket(
    public_token: str,
    db: Session = Depends(get_db),
):
    obj = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return SupportTicketResponse(
        id=str(obj.id),
        tenant_id=str(obj.tenant_id),
        public_token=obj.public_token,
        subject=obj.subject,
        description=obj.description,
        category=obj.category,
        priority=obj.priority.value,
        status=obj.status.value,
        shipment_reference=obj.shipment_reference,
        tracking_reference=obj.tracking_reference,
        glpi_ticket_id=obj.glpi_ticket_id,
    )


@router.get("/public/tickets/{public_token}/messages", response_model=list[SupportTicketMessageResponse])
def get_public_ticket_messages(
    public_token: str,
    db: Session = Depends(get_db),
):
    ticket = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    rows = (
        db.query(SupportTicketMessage)
        .filter(SupportTicketMessage.ticket_id == ticket.id, SupportTicketMessage.visible_to_public == True)  # noqa: E712
        .order_by(SupportTicketMessage.created_at.asc())
        .all()
    )
    return [
        SupportTicketMessageResponse(
            id=str(x.id),
            ticket_id=str(x.ticket_id),
            author_type=x.author_type,
            author_name=x.author_name,
            body=x.body,
            visible_to_public=x.visible_to_public,
        )
        for x in rows
    ]


@router.post("/public/tickets/{public_token}/reply", response_model=SupportTicketMessageResponse)
def reply_public_ticket(
    public_token: str,
    request: TicketReplyRequest,
    db: Session = Depends(get_db),
):
    ticket = db.query(SupportTicket).filter(SupportTicket.public_token == public_token).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msg = add_ticket_message(
        db=db,
        ticket_id=str(ticket.id),
        body=request.body,
        author_type=request.author_type,
        author_name=request.author_name,
        visible_to_public=request.visible_to_public,
    )
    return SupportTicketMessageResponse(
        id=str(msg.id),
        ticket_id=str(msg.ticket_id),
        author_type=msg.author_type,
        author_name=msg.author_name,
        body=msg.body,
        visible_to_public=msg.visible_to_public,
    )
