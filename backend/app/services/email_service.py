import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, body: str) -> None:
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT)) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
            logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        raise


def send_approval_email(to_email: str, full_name: str) -> None:
    subject = "Your DermOra AI Account Has Been Approved"
    body = f"""Dear Dr. {full_name},

Congratulations! Your account request has been approved.
You can now log in to DermOra AI using your registered email address.

Login here: http://localhost:5173/login

Best regards,
DermOra AI Team"""
    send_email(to_email, subject, body)


def send_deletion_email(to_email: str, full_name: str) -> None:
    subject = "Your DermOra AI Account Has Been Deleted"
    body = f"""Dear Dr. {full_name},

Your DermOra AI account and all associated data (patients, analyses, and support tickets) have been permanently deleted, as requested.

If you did not request this or believe this was done in error, please contact our support team immediately.

Best regards,
DermOra AI Team"""
    send_email(to_email, subject, body)


def send_rejection_email(to_email: str, full_name: str, reason: str) -> None:
    subject = "Your DermOra AI Account Request Update"
    body = f"""Dear {full_name},

We regret to inform you that your account request could not be approved at this time.

Reason: {reason}

If you believe this is an error or would like to reapply, please contact our support team.

Best regards,
DermOra AI Team"""
    send_email(to_email, subject, body)
