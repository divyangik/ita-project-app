import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from .config import (
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
    FROM_EMAIL, DEVELOPER_EMAIL,
)


def send_itinerary_email(to_email: str, name: str, package_title: str, pdf_path: str | None) -> bool:
    """Emails the itinerary PDF (if present) + price details to the client,
    and Bccs the developer inbox on the same message."""
    msg = MIMEMultipart()
    msg["Subject"] = f"Your Itinerary — {package_title}"
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    if DEVELOPER_EMAIL:
        msg["Bcc"] = DEVELOPER_EMAIL

    body = (
        f"Hi {name or 'there'},\n\n"
        f"Thank you for your interest in {package_title}. "
        f"Please find the itinerary and price details attached.\n\n"
        f"For any further assistance, we are just a call away: 213-293-6422 "
        f"or write to us at travel@itaglobal.com\n\n"
        f"— ITA Global"
    )
    msg.attach(MIMEText(body, "plain"))

    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            attachment = MIMEApplication(f.read(), _subtype="pdf")
            attachment.add_header(
                "Content-Disposition", "attachment",
                filename=os.path.basename(pdf_path),
            )
            msg.attach(attachment)

    recipients = [to_email] + ([DEVELOPER_EMAIL] if DEVELOPER_EMAIL else [])

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, recipients, msg.as_string())
        return True
    except Exception:
        import traceback
        traceback.print_exc()
        return False