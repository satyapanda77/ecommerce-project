from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Notification
from .services import create_notification

User = get_user_model()

class NotificationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='notif_user',
            email='notif@example.com',
            password='password123',
        )
        self.notification = create_notification(
            user=self.user,
            title='Test Alert',
            message='Your order is ready',
            notification_type=Notification.NotificationType.ORDER,
        )

    def test_list_notifications(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get(reverse('notification-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], 'Test Alert')

    def test_mark_as_read(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post(reverse('notification-read', kwargs={'pk': self.notification.id}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)
