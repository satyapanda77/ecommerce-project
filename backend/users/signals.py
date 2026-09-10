import logging
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from .email_service import send_login_security_email

logger = logging.getLogger(__name__)

@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    try:
        ip = None
        ua = None
        if request:
            ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            ua = request.META.get('HTTP_USER_AGENT', '')
        send_login_security_email(user, ip_address=ip, user_agent=ua)
    except Exception as e:
        logger.warning(f'Error sending login signal email: {e}')
