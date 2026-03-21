from __future__ import annotations

import json
import secrets
from sqlalchemy.orm import Session

from app.models.support_crm import (
    CRMAccount,
    CRMAccountType,
    CRMContact,
    Opportunity,
    OpportunityStage,
    Quote,
    QuoteStatus,
    SupportSyncLog,
    SupportTicket,
    SupportTicketMessage,
    SupportTicketPriority,
)
from app.models.tenant import Tenant
from app.services.glpi_client import GLPIClient
from app.services.notification_service import notification_service


def create_crm_account(db: Session, **kwargs) -> CRMAccount:
    obj = CRMAccount(
        tenant_id=kwargs["tenant_id"],
        account_type=CRMAccountType(kwargs.get("account_type", "customer")),
        company_name=kwargs["company_name"],
        email=kwargs.get("email"),
        phone=kwargs.get("phone"),
        country=kwargs.get("country"),
        city=kwargs.get("city"),
        billing_address=kwargs.get("billing_address"),
        notes=kwargs.get("notes"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_crm_contact(db: Session, **kwargs) -> CRMContact:
    obj = CRMContact(
        tenant_id=kwargs["tenant_id"],
        account_id=kwargs["account_id"],
        first_name=kwargs["first_name"],
        last_name=kwargs.get("last_name"),
        email=kwargs.get("email"),
        phone=kwargs.get("phone"),
        role_title=kwargs.get("role_title"),
        is_primary=kwargs.get("is_primary", False),
        notes=kwargs.get("notes"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_opportunity(db: Session, **kwargs) -> Opportunity:
    obj = Opportunity(
        tenant_id=kwargs["tenant_id"],
        account_id=kwargs.get("account_id"),
        title=kwargs["title"],
        stage=OpportunityStage(kwargs.get("stage", "new")),
        currency=kwargs.get("currency", "GHS"),
        estimated_value=kwargs.get("estimated_value"),
        notes=kwargs.get("notes"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_quote(db: Session, **kwargs) -> Quote:
    obj = Quote(
        tenant_id=kwargs["tenant_id"],
        account_id=kwargs.get("account_id"),
        opportunity_id=kwargs.get("opportunity_id"),
        quote_number=kwargs["quote_number"],
        status=QuoteStatus.DRAFT,
        currency=kwargs.get("currency", "GHS"),
        total_amount=kwargs.get("total_amount", 0),
        notes=kwargs.get("notes"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_public_ticket(db: Session, **kwargs) -> SupportTicket:
    obj = SupportTicket(
        tenant_id=kwargs["tenant_id"],
        account_id=kwargs.get("account_id"),
        contact_id=kwargs.get("contact_id"),
        public_token=secrets.token_urlsafe(24),
        subject=kwargs["subject"],
        description=kwargs["description"],
        category=kwargs.get("category"),
        priority=SupportTicketPriority(kwargs.get("priority", "medium")),
        shipment_reference=kwargs.get("shipment_reference"),
        tracking_reference=kwargs.get("tracking_reference"),
        public_submitter_name=kwargs.get("public_submitter_name"),
        public_submitter_email=kwargs.get("public_submitter_email"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)

    msg = SupportTicketMessage(
        ticket_id=obj.id,
        author_type="public",
        author_name=obj.public_submitter_name,
        body=obj.description,
        visible_to_public=True,
    )
    db.add(msg)
    db.commit()
    
    # Send ticket creation notification
    try:
        tenant = db.query(Tenant).filter(Tenant.id == obj.tenant_id).first()
        if tenant and obj.public_submitter_email:
            notification_service.send_ticket_created_email(
                to=obj.public_submitter_email,
                ticket_id=str(obj.id)[:8],  # Short ticket ID
                subject_line=obj.subject,
                company_name=tenant.company_name
            )
    except Exception as e:
        import logging
        logging.getLogger("afruheritage.notifications").error("Failed to send ticket creation email: %s", e)

    return obj


def add_ticket_message(db: Session, ticket_id: str, body: str, author_type: str = "public", author_name: str | None = None, visible_to_public: bool = True) -> SupportTicketMessage:
    msg = SupportTicketMessage(
        ticket_id=ticket_id,
        author_type=author_type,
        author_name=author_name,
        body=body,
        visible_to_public=visible_to_public,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    
    # Send reply notification for internal replies
    if author_type == "internal" and visible_to_public:
        try:
            ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
            tenant = db.query(Tenant).filter(Tenant.id == ticket.tenant_id).first()
            if ticket and tenant and ticket.public_submitter_email:
                notification_service.send_ticket_reply_email(
                    to=ticket.public_submitter_email,
                    ticket_id=str(ticket.id)[:8],
                    reply_content=body,
                    company_name=tenant.company_name
                )
        except Exception as e:
            import logging
            logging.getLogger("afruheritage.notifications").error("Failed to send ticket reply email: %s", e)
    
    return msg


def sync_ticket_to_glpi(db: Session, ticket: SupportTicket, entity_id: str | None = None) -> SupportTicket:
    client = GLPIClient()
    if not client.enabled():
        log = SupportSyncLog(
            tenant_id=ticket.tenant_id,
            ticket_id=ticket.id,
            direction="outbound",
            provider="glpi",
            status="skipped",
            payload_json=json.dumps({"reason": "GLPI not configured"}),
        )
        db.add(log)
        db.commit()
        return ticket

    content = (
        f"Tenant ticket ID: {ticket.id}\n"
        f"Public submitter: {ticket.public_submitter_name or 'Unknown'}\n"
        f"Email: {ticket.public_submitter_email or 'N/A'}\n"
        f"Category: {ticket.category or 'N/A'}\n"
        f"Priority: {ticket.priority.value}\n"
        f"Shipment ref: {ticket.shipment_reference or 'N/A'}\n"
        f"Tracking ref: {ticket.tracking_reference or 'N/A'}\n\n"
        f"{ticket.description}"
    )

    try:
        result = client.create_ticket(
            title=ticket.subject,
            content=content,
            entity_id=entity_id,
        )
        ticket.glpi_ticket_id = str(result.get("id") or result.get("ID") or "")
        ticket.glpi_entity_id = entity_id
        db.add(ticket)

        log = SupportSyncLog(
            tenant_id=ticket.tenant_id,
            ticket_id=ticket.id,
            direction="outbound",
            provider="glpi",
            status="success",
            payload_json=json.dumps(result),
        )
        db.add(log)
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception as exc:
        log = SupportSyncLog(
            tenant_id=ticket.tenant_id,
            ticket_id=ticket.id,
            direction="outbound",
            provider="glpi",
            status="failed",
            error_message=str(exc),
        )
        db.add(log)
        db.commit()
        return ticket
