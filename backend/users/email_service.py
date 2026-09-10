import logging
import threading
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)


def _async_send_mail(subject, message, recipient_list, html_message=None):
    def _send():
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            logger.warning(f"Email failed to send to {recipient_list}: {e}")

    thread = threading.Thread(target=_send)
    thread.daemon = True
    thread.start()


def send_login_security_email(user, ip_address=None, user_agent=None):
    if not user.email:
        return
    now_str = timezone.now().strftime("%B %d, %Y at %I:%M %p UTC")
    subject = "New Login Detected - MiniShop Security"
    message = (
        f"Hi {user.username},\n\n"
        f"A new login to your account was detected on {now_str}.\n"
        f"Device: {user_agent or 'Unknown device'}\n"
        f"IP Address: {ip_address or 'Unknown'}\n\n"
        "If this was you, you can ignore this alert.\n"
        "If you did not log in, please reset your password immediately."
    )
    html_message = (
        f'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">'
        f'<h2 style="color: #4f46e5; margin-top: 0;">New Login Detected</h2>'
        f'<p>Hi <strong>{user.username}</strong>,</p>'
        f'<p>A new login to your MiniShop account was detected.</p>'
        f'<table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; padding: 12px;">'
        f'<tr><td style="padding: 8px; color: #64748b;"><strong>Time:</strong></td><td style="padding: 8px;">{now_str}</td></tr>'
        f'<tr><td style="padding: 8px; color: #64748b;"><strong>Device:</strong></td><td style="padding: 8px;">{user_agent or "Web Browser"}</td></tr>'
        f'<tr><td style="padding: 8px; color: #64748b;"><strong>IP Address:</strong></td><td style="padding: 8px;">{ip_address or "Hidden"}</td></tr>'
        f'</table>'
        f'<p style="color: #64748b; font-size: 14px;">If this was you, you can safely ignore this email.</p>'
        f'<p style="color: #dc2626; font-size: 14px; font-weight: bold;">If you did not authorize this login, please contact support and change your password immediately.</p>'
        f'<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />'
        f'<p style="font-size: 12px; color: #94a3b8;">MiniShop Security Team</p>'
        f'</div>'
    )
    _async_send_mail(subject, message, [user.email], html_message=html_message)


def send_welcome_email(user):
    if not user.email:
        return
    role_name = user.get_role_display() if hasattr(user, 'get_role_display') else user.role
    subject = "Welcome to MiniShop!"
    message = f"Hi {user.username},\n\nWelcome to MiniShop! Your {role_name} account has been created successfully."
    html_message = (
        f'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">'
        f'<h2 style="color: #4f46e5; margin-top: 0;">Welcome to MiniShop!</h2>'
        f'<p>Hi <strong>{user.username}</strong>,</p>'
        f'<p>Thank you for joining us as a <strong>{role_name}</strong>.</p>'
        f'<p>Explore our products, manage your orders, and enjoy fast, reliable delivery.</p>'
        f'<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />'
        f'<p style="font-size: 12px; color: #94a3b8;">MiniShop Team</p>'
        f'</div>'
    )
    _async_send_mail(subject, message, [user.email], html_message=html_message)

