from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import DeliveryPartner

User = get_user_model()


class UserAuthAndRoleTests(APITestCase):
    def test_customer_registration(self):
        url = reverse('register')
        data = {
            'username': 'john_customer',
            'email': 'john@example.com',
            'password': 'password123',
            'role': 'CUSTOMER',
            'phone_number': '1234567890',
            'address': '123 Main St, Springfield',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='john_customer')
        self.assertEqual(user.role, User.Role.CUSTOMER)
        self.assertEqual(user.phone_number, '1234567890')
        self.assertEqual(user.address, '123 Main St, Springfield')

    def test_delivery_partner_registration(self):
        url = reverse('register')
        data = {
            'username': 'dave_driver',
            'email': 'dave@example.com',
            'password': 'password123',
            'role': 'DELIVERY_PARTNER',
            'phone_number': '9876543210',
            'address': '456 Hub St',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='dave_driver')
        self.assertEqual(user.role, User.Role.DELIVERY_PARTNER)
        self.assertTrue(DeliveryPartner.objects.filter(user=user).exists())

    def test_admin_registration_forbidden(self):
        url = reverse('register')
        data = {
            'username': 'bad_admin',
            'email': 'admin@example.com',
            'password': 'password123',
            'role': 'ADMIN',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_jwt_and_role(self):
        user = User.objects.create_user(
            username='alice',
            email='alice@example.com',
            password='password123',
            role=User.Role.CUSTOMER,
        )
        url = reverse('login')
        response = self.client.post(url, {'username': 'alice', 'password': 'password123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')

    def test_profile_and_password_change(self):
        user = User.objects.create_user(
            username='bob',
            email='bob@example.com',
            password='oldpassword123',
            role=User.Role.CUSTOMER,
        )
        self.client.force_authenticate(user=user)

        # Profile GET
        res_get = self.client.get(reverse('profile'))
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get.data['username'], 'bob')

        # Profile PUT
        res_put = self.client.put(reverse('profile'), {'phone_number': '555-0199', 'address': 'New Address'})
        self.assertEqual(res_put.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.phone_number, '555-0199')

        # Change password
        res_pw = self.client.post(reverse('change-password'), {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword456',
        })
        self.assertEqual(res_pw.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('newpassword456'))

