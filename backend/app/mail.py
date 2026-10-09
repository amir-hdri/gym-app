"""Password reset delivery. Tokens must never be written to application logs."""
from email.message import EmailMessage
import smtplib
import ssl
from urllib.parse import urlencode

from app.config import settings


def send_password_reset(recipient: str, token: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        raise RuntimeError("Password reset mail is not configured")
    link = f"{settings.FRONTEND_URL.rstrip('/')}/auth/reset-password?{urlencode({'token': token})}"
    message = EmailMessage()
    message["Subject"] = "بازیابی رمز عبور — Lumi Wellness"
    message["From"] = settings.SMTP_FROM
    message["To"] = recipient
    message.set_content(f"برای انتخاب رمز عبور جدید، پیوند زیر را باز کنید:\n\n{link}\n\nاین پیوند ۳۰ دقیقه اعتبار دارد و فقط یک بار قابل استفاده است.\nاگر این درخواست از طرف شما نیست، این ایمیل را نادیده بگیرید.")
    context = ssl.create_default_context()
    connection = (smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15, context=context)
                  if settings.SMTP_SSL else smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15))
    with connection as smtp:
        if settings.SMTP_STARTTLS and not settings.SMTP_SSL:
            smtp.starttls(context=context)
        if settings.SMTP_USERNAME:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(message)
