from __future__ import annotations

import os
from email.message import EmailMessage

import httpx
import jinja2

# Choose provider based on environment
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "sendgrid").lower()

# SendGrid implementation
def _sendgrid_headers() -> dict[str, str]:
    api_key = os.getenv("SENDGRID_API_KEY", "")
    if not api_key:
        raise RuntimeError("SENDGRID_API_KEY is not set")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

def _send_via_sendgrid(to_email: str, subject: str, html_content: str, from_email: str | None = None) -> dict:
    from_email = from_email or os.getenv("FROM_EMAIL", "noreply@afruheritage.com")
    from_name = os.getenv("FROM_NAME", "Afruheritage")
    
    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": from_email, "name": from_name},
        "subject": subject,
        "content": [{"type": "text/html", "value": html_content}],
    }
    
    with httpx.Client(timeout=60.0) as client:
        resp = client.post("https://api.sendgrid.net/v3/mail/send", headers=_sendgrid_headers(), json=payload)
        resp.raise_for_status()
        return {"message_id": resp.headers.get("X-Message-Id"), "provider": "sendgrid"}

# AWS SES implementation
def _ses_headers() -> dict[str, str]:
    import boto3
    access_key = os.getenv("AWS_ACCESS_KEY_ID", "")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    region = os.getenv("AWS_REGION", "us-east-1")
    
    if not access_key or not secret_key:
        raise RuntimeError("AWS credentials are not set")
    
    return boto3.client("ses", region_name=region, aws_access_key_id=access_key, aws_secret_access_key=secret_key)

def _send_via_ses(to_email: str, subject: str, html_content: str, from_email: str | None = None) -> dict:
    from_email = from_email or os.getenv("FROM_EMAIL", "noreply@afruheritage.com")
    
    ses = _ses_headers()
    
    try:
        response = ses.send_email(
            Source=from_email,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_content, "Charset": "UTF-8"}},
            },
        )
        return {"message_id": response["MessageId"], "provider": "ses"}
    except Exception as e:
        raise RuntimeError(f"SES send failed: {e}")

# Template rendering
_template_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader("app/templates/emails"),
    autoescape=jinja2.select_autoescape(["html", "xml"])
)

def render_template(template_name: str, context: dict) -> str:
    """Render email template with context"""
    try:
        template = _template_env.get_template(template_name)
        return template.render(**context)
    except jinja2.TemplateNotFound:
        # Fallback to simple string formatting if template not found
        return f"<p>{context.get('message', '')}</p>"

# Public interface
def send_email(
    to_email: str,
    subject: str,
    template_name: str | None = None,
    context: dict | None = None,
    html_content: str | None = None,
    from_email: str | None = None,
) -> dict:
    """
    Send email using configured provider
    
    Args:
        to_email: Recipient email
        subject: Email subject
        template_name: Template file name (optional)
        context: Template variables (optional)
        html_content: Raw HTML content (optional, overrides template)
        from_email: Custom from email (optional)
    
    Returns:
        dict with message_id and provider
    """
    if html_content and template_name:
        raise ValueError("Cannot specify both template_name and html_content")
    
    if template_name:
        html_content = render_template(template_name, context or {})
    elif not html_content:
        html_content = context.get("message", "") if context else ""
    
    # Route to appropriate provider
    if EMAIL_PROVIDER == "ses":
        return _send_via_ses(to_email, subject, html_content, from_email)
    else:  # Default to SendGrid
        return _send_via_sendgrid(to_email, subject, html_content, from_email)
