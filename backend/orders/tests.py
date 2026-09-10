from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from products.models import Product
from .models import Order

User = get_user_model()


class OrderAndDeliveryTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username='cust1',
            email='cust1@example.com',
            password='password123',
            role=User.Role.CUSTOMER,
            address='100 Customer Lane',
        )
        self.delivery_partner = User.objects.create_user(
            username='driver1',
            email='driver1@example.com',
            password='password123',
            role=User.Role.DELIVERY_PARTNER,
        )
        self.product = Product.objects.create(
            name='Test Wireless Earbuds',
            description='Noise cancelling earbuds',
            price=99.99,
            stock=10,
            category='Electronics',
            image='https://via.placeholder.com/150',
        )

    def test_customer_create_order(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('orders')
        data = {
            'product_id': self.product.id,
            'quantity': 2,
            'delivery_address': '100 Customer Lane',
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['quantity'], 2)
        self.assertEqual(float(res.data['total_price']), 199.98)
        self.assertEqual(res.data['status'], 'Pending')

        # Check stock reduced
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

    def test_delivery_partner_workflow(self):
        # Create an order
        order = Order.objects.create(
            user=self.customer,
            product=self.product,
            quantity=1,
            total_price=99.99,
            delivery_address='100 Customer Lane',
            status=Order.Status.PENDING,
        )

        # 1. Customer cannot view available deliveries
        self.client.force_authenticate(user=self.customer)
        res_blocked = self.client.get(reverse('available-deliveries'))
        self.assertEqual(res_blocked.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Delivery Partner views available deliveries
        self.client.force_authenticate(user=self.delivery_partner)
        res_avail = self.client.get(reverse('available-deliveries'))
        self.assertEqual(res_avail.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_avail.data), 1)

        # 3. Delivery Partner accepts delivery
        res_accept = self.client.post(reverse('order-accept-delivery', kwargs={'pk': order.id}))
        self.assertEqual(res_accept.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.delivery_partner, self.delivery_partner)

        # 4. Delivery Partner updates status to 'Picked Up' -> 'Out for Delivery' -> 'Delivered'
        res_pickup = self.client.post(
            reverse('order-update-status', kwargs={'pk': order.id}),
            {'status': 'Picked Up'},
            format='json',
        )
        self.assertEqual(res_pickup.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'Picked Up')

        res_delivered = self.client.post(
            reverse('order-update-status', kwargs={'pk': order.id}),
            {'status': 'Delivered'},
            format='json',
        )
        self.assertEqual(res_delivered.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'Delivered')

    def test_cancel_order_and_stock_restore(self):
        self.client.force_authenticate(user=self.customer)
        order = Order.objects.create(
            user=self.customer,
            product=self.product,
            quantity=3,
            total_price=299.97,
            status=Order.Status.PENDING,
        )
        self.product.stock -= 3
        self.product.save()

        res_cancel = self.client.post(reverse('order-cancel', kwargs={'pk': order.id}))
        self.assertEqual(res_cancel.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'Cancelled')

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)

