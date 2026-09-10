from .models import Notification

def create_notification(user, title, message, notification_type=Notification.NotificationType.INFO, related_order_id=None):
    try:
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            related_order_id=related_order_id
        )
    except Exception:
        return None
