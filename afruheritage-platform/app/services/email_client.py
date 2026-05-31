from __future__ import annotations

import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx
import jinja2

EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "smtp").lower()

# ── SMTP (Zoho / any SMTP) ─────────────────────────────────────────────────

def _send_via_smtp(to_email: str, subject: str, html_content: str, from_email: str | None = None) -> dict:
    host = os.getenv("SMTP_HOST", "smtppro.zoho.com")
    port = int(os.getenv("SMTP_PORT", "465"))
    secure = os.getenv("SMTP_SECURE", "true").lower() == "true"
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASS", "")
    sender = from_email or os.getenv("FROM_EMAIL", user)
    sender_name = os.getenv("FROM_NAME", "Afruheritage")

    if not user or not password:
        raise RuntimeError("SMTP credentials (SMTP_USER / SMTP_PASS) are not set")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{sender_name} <{sender}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    ctx = ssl.create_default_context()
    if secure:
        with smtplib.SMTP_SSL(host, port, context=ctx) as server:
            server.login(user, password)
            server.sendmail(sender, [to_email], msg.as_bytes())
    else:
        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            server.starttls(context=ctx)
            server.login(user, password)
            server.sendmail(sender, [to_email], msg.as_bytes())

    return {"provider": "smtp", "to": to_email}


# ── SendGrid (fallback) ────────────────────────────────────────────────────

def _send_via_sendgrid(to_email: str, subject: str, html_content: str, from_email: str | None = None) -> dict:
    api_key = os.getenv("SENDGRID_API_KEY", "")
    if not api_key:
        raise RuntimeError("SENDGRID_API_KEY is not set")
    sender = from_email or os.getenv("FROM_EMAIL", "noreply@afruheritage.com")
    sender_name = os.getenv("FROM_NAME", "Afruheritage")
    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": sender, "name": sender_name},
        "subject": subject,
        "content": [{"type": "text/html", "value": html_content}],
    }
    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
    return {"provider": "sendgrid", "message_id": resp.headers.get("X-Message-Id"), "to": to_email}


# ── Template rendering ─────────────────────────────────────────────────────

_template_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader("app/templates/emails"),
    autoescape=jinja2.select_autoescape(["html", "xml"]),
)


def render_template(template_name: str, context: dict) -> str:
    try:
        tpl = _template_env.get_template(template_name)
        return tpl.render(**context)
    except jinja2.TemplateNotFound:
        return context.get("html_fallback") or f"<p>{context.get('message', '')}</p>"


# ── Public interface ───────────────────────────────────────────────────────

def send_email(
    to_email: str,
    subject: str,
    template_name: str | None = None,
    context: dict | None = None,
    html_content: str | None = None,
    from_email: str | None = None,
) -> dict:
    """Send an email using the configured provider (smtp or sendgrid)."""
    if html_content and template_name:
        raise ValueError("Specify either template_name or html_content, not both")
    if template_name:
        html_content = render_template(template_name, context or {})
    elif not html_content:
        html_content = (context or {}).get("message", "")
    if EMAIL_PROVIDER == "sendgrid":
        return _send_via_sendgrid(to_email, subject, html_content, from_email)
    return _send_via_smtp(to_email, subject, html_content, from_email)
