from __future__ import annotations

import logging
import smtplib
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from app.core.config import settings
from app.services.email_client import send_email
# from app.services.notification_preferences_service import is_notification_enabled  # Will create when needed
from app.services.sms_client import send_sms

logger = logging.getLogger("afruheritage.notifications")


class NotificationProvider(ABC):
    @abstractmethod
    def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        plain_body: str | None = None,
        from_name: str | None = None,
        from_email: str | None = None,
    ) -> bool: ...


class SMTPProvider(NotificationProvider):
    def __init__(self):
        self.host = getattr(settings, "smtp_host", "")
        self.port = int(getattr(settings, "smtp_port", 587))
        self.username = getattr(settings, "smtp_username", "")
        self.password = getattr(settings, "smtp_password", "")
        self.use_tls = getattr(settings, "smtp_use_tls", True)
        self.default_from = getattr(settings, "smtp_from_email", "noreply@afruheritage.com")
        self.default_from_name = getattr(settings, "smtp_from_name", "Afruheritage")

    def enabled(self) -> bool:
        return bool(self.host and self.username)

    def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        plain_body: str | None = None,
        from_name: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        if not self.enabled():
            logger.warning("SMTP not configured, skipping email to %s", to)
            return False

        sender_name = from_name or self.default_from_name
        sender_email = from_email or self.default_from
        sender = f"{sender_name} <{sender_email}>"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to

        if plain_body:
            msg.attach(MIMEText(plain_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            if self.use_tls:
                server = smtplib.SMTP(self.host, self.port)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(self.host, self.port)
            server.login(self.username, self.password)
            server.sendmail(sender_email, [to], msg.as_string())
            server.quit()
            logger.info("Email sent to %s: %s", to, subject)
            return True
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", to, exc)
            return False


class LogOnlyProvider(NotificationProvider):
    def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        plain_body: str | None = None,
        from_name: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        logger.info("[LOG-ONLY] Email to=%s subject=%s", to, subject)
        return True


class NotificationService:
    def __init__(self, provider: NotificationProvider | None = None, db: Session | None = None):
        if provider:
            self._provider = provider
        else:
            smtp = SMTPProvider()
            self._provider = smtp if smtp.enabled() else LogOnlyProvider()
        self._db = db

    def _check_email_preference(self, tenant_id: str, notification_type: str) -> bool:
        """Check if email notification is enabled for tenant"""
        if not self._db:
            return True  # Default to enabled if no DB session
        
        try:
            from app.models.notification_preferences import NotificationType, NotificationChannel
            return is_notification_enabled(
                self._db,
                tenant_id,
                NotificationType(notification_type),
                NotificationChannel.EMAIL,
            )
        except (ValueError, ImportError):
            return True  # Default to enabled if preference check fails

    def _check_sms_preference(self, tenant_id: str, notification_type: str) -> bool:
        """Check if SMS notification is enabled for tenant"""
        if not self._db:
            return False  # Default to disabled for SMS if no DB session
        
        try:
            from app.models.notification_preferences import NotificationType, NotificationChannel
            return is_notification_enabled(
                self._db,
                tenant_id,
                NotificationType(notification_type),
                NotificationChannel.SMS,
            )
        except (ValueError, ImportError):
            return False  # Default to disabled for SMS if preference check fails

    def send_verification_email(self, to: str, verification_url: str, company_name: str = "Afruheritage") -> bool:
        subject = f"{company_name} — Verify Your Email Address"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Verify your email address</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Thank you for signing up with {company_name}. Please click the button below to verify your email address.
            </p>
            <div style="margin: 32px 0;">
                <a href="{verification_url}"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Verify Email
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                If you did not create an account, please ignore this email.
            </p>
            <p style="color: #94a3b8; font-size: 14px;">
                This link expires in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="color: #cbd5e1; font-size: 12px;">{company_name}</p>
        </div>
        """
        plain = (
            f"Verify your email address\n\n"
            f"Thank you for signing up with {company_name}.\n"
            f"Click here to verify: {verification_url}\n\n"
            f"This link expires in 24 hours.\n\n"
            f"If you did not create an account, please ignore this email."
        )
        return self._provider.send_email(to, subject, html, plain)

    def send_tenant_approved_email(self, to: str, company_name: str, login_url: str) -> bool:
        subject = f"{company_name} — Your Application Has Been Approved"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Application Approved!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Great news! Your application for <strong>{company_name}</strong> has been approved.
                Your freight-forwarding platform is being prepared.
            </p>
            <div style="margin: 32px 0;">
                <a href="{login_url}"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Go to Dashboard
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                You will receive another email once your platform is fully provisioned and ready.
            </p>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_tenant_launched_email(self, to: str, company_name: str, console_url: str) -> bool:
        subject = f"{company_name} — Your Platform is Live!"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">🎉 Your platform is live!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                <strong>{company_name}</strong> is now fully provisioned and ready.
                You can access your freight-forwarding console at:
            </p>
            <div style="margin: 32px 0;">
                <a href="{console_url}"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Open Console
                </a>
            </div>
            <p style="color: #475569; font-size: 14px;">Console URL: {console_url}</p>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_password_reset_email(self, to: str, reset_url: str, company_name: str = "Afruheritage") -> bool:
        subject = f"{company_name} — Password Reset Request"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Reset Your Password</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to choose a new password.
            </p>
            <div style="margin: 32px 0;">
                <a href="{reset_url}"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Reset Password
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                This link expires in 1 hour. If you did not request a password reset, please ignore this email.
            </p>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_generic_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        plain_body: str | None = None,
        from_name: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        return self._provider.send_email(to, subject, html_body, plain_body, from_name, from_email)

    # Billing notifications
    def send_payment_success_email(self, to: str, amount: float, currency: str, plan_name: str, company_name: str) -> bool:
        subject = f"{company_name} — Payment Successful"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">💳 Payment Successful</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Your payment of <strong>{currency} {amount:,.2f}</strong> for the <strong>{plan_name}</strong> plan has been successfully processed.
            </p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #64748b;"><strong>Plan:</strong> {plan_name}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Amount:</strong> {currency} {amount:,.2f}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Status:</strong> ✅ Active</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                You can view your billing history in your dashboard.
            </p>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_payment_failed_email(self, to: str, amount: float, currency: str, plan_name: str, company_name: str) -> bool:
        subject = f"{company_name} — Payment Failed"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">❌ Payment Failed</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                We were unable to process your payment of <strong>{currency} {amount:,.2f}</strong> for the <strong>{plan_name}</strong> plan.
            </p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #991b1b;"><strong>Action Required:</strong> Please update your payment method.</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                Your service will continue until the end of your current billing period.
            </p>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_wallet_low_balance_email(self, to: str, balance: float, currency: str, company_name: str) -> bool:
        subject = f"{company_name} — Low Wallet Balance"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 16px;">⚠️ Low Wallet Balance</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Your wallet balance is running low. Current balance: <strong>{currency} {balance:,.2f}</strong>
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                To avoid service interruption, please top up your wallet soon.
            </p>
            <div style="margin: 32px 0;">
                <a href="https://app.afruheritage.com/billing"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Top Up Wallet
                </a>
            </div>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    # Shipment notifications
    def send_shipment_status_update_email(self, to: str, tracking_number: str, status: str, company_name: str) -> bool:
        subject = f"{company_name} — Shipment Update: {tracking_number}"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">📦 Shipment Update</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Your shipment <strong>{tracking_number}</strong> has been updated to: <strong>{status}</strong>
            </p>
            <div style="margin: 32px 0;">
                <a href="https://app.afruheritage.com/track/{tracking_number}"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Track Shipment
                </a>
            </div>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_shipment_delivered_email(self, to: str, tracking_number: str, company_name: str) -> bool:
        subject = f"{company_name} — Shipment Delivered: {tracking_number}"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 16px;">✅ Shipment Delivered!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Great news! Your shipment <strong>{tracking_number}</strong> has been successfully delivered.
            </p>
            <div style="margin: 32px 0;">
                <a href="https://app.afruheritage.com/track/{tracking_number}"
                   style="background: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    View Details
                </a>
            </div>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    # Support ticket notifications
    def send_ticket_created_email(self, to: str, ticket_id: str, subject_line: str, company_name: str) -> bool:
        subject = f"{company_name} — Support Ticket Created: #{ticket_id}"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">🎫 Support Ticket Created</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Your support ticket <strong>#{ticket_id}</strong> has been created successfully.
            </p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #64748b;"><strong>Ticket ID:</strong> #{ticket_id}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Subject:</strong> {subject_line}</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                Our support team will respond within 24 hours.
            </p>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_ticket_reply_email(self, to: str, ticket_id: str, reply_content: str, company_name: str) -> bool:
        subject = f"{company_name} — New Reply to Ticket #{ticket_id}"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">💬 New Reply</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                You have a new reply to your support ticket <strong>#{ticket_id}</strong>.
            </p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #64748b;">{reply_content}</p>
            </div>
            <div style="margin: 32px 0;">
                <a href="https://app.afruheritage.com/support/tickets/{ticket_id}"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    View Ticket
                </a>
            </div>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_tenant_welcome_email(
        self,
        to: str,
        company_name: str,
        subdomain: str,
        login_url: str,
        temp_password: str,
        contact_name: str,
    ) -> bool:
        """Send welcome email to new tenant with login credentials"""
        subject = f"Welcome to Afruheritage - {company_name} is Ready!"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">🎉 Welcome to Afruheritage!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Hi {contact_name}, your freight forwarding platform <strong>{company_name}</strong> is now ready!
            </p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #64748b;"><strong>Your Portal:</strong> https://{subdomain}.afruheritage.com</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Login Email:</strong> {to}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Temporary Password:</strong> {temp_password}</p>
            </div>
            <div style="margin: 32px 0;">
                <a href="{login_url}"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Login to Your Portal
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                Please change your password after first login for security.
            </p>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    def send_internal_tenant_created_notification(
        self,
        to: str,
        tenant_id: str,
        company_name: str,
        subdomain: str,
        contact_email: str,
        plan: str,
    ) -> bool:
        """Send internal notification about new tenant creation"""
        subject = f"New Tenant Created: {company_name} ({subdomain})"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">🏢 New Tenant Created</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                A new tenant has been created and is ready for setup.
            </p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #64748b;"><strong>Company:</strong> {company_name}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Subdomain:</strong> {subdomain}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Contact:</strong> {contact_email}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Plan:</strong> {plan}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Tenant ID:</strong> {tenant_id}</p>
            </div>
            <div style="margin: 32px 0;">
                <a href="https://admin.afruheritage.com/tenants/{tenant_id}"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    View Tenant Details
                </a>
            </div>
        </div>
        """
        return self._provider.send_email(to, subject, html)

    # SMS notifications (for critical updates)
    def send_shipment_status_sms(self, to_phone: str, tracking_number: str, status: str) -> bool:
        message = f"Afruheritage: Shipment {tracking_number} updated to {status}. Track: app.afruheritage.com/track/{tracking_number}"
        try:
            send_sms(to_phone, message)
            return True
        except Exception as e:
            logger.error("Failed to send SMS to %s: %s", to_phone, e)
            return False

    def send_critical_alert_sms(self, to_phone: str, message: str) -> bool:
        message = f"Afruheritage ALERT: {message}"
        try:
            send_sms(to_phone, message)
            return True
        except Exception as e:
            logger.error("Failed to send alert SMS to %s: %s", to_phone, e)
            return False


notification_service = NotificationService()


def get_notification_service(db: Session | None = None) -> NotificationService:
    """Get notification service instance with optional database session"""
    return NotificationService(db=db)
