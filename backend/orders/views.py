from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import CartItem
from notifications.models import Notification
from notifications.services import create_notification
from products.models import Product
from users.permissions import IsCustomer, IsDeliveryPartner
from .models import Order
from .serializers import OrderSerializer


class OrderView(APIView):
    """
    GET  /api/orders/ -> list the current user's orders (or all if admin)
    POST /api/orders/ -> place an order (customer only)

    POST body:
      - { "product_id": <id>, "quantity": <n>, "delivery_address": "...", "delivery_notes": "..." }
      - { "delivery_address": "...", "delivery_notes": "..." } (checkout whole cart)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'ADMIN' or request.user.is_staff:
            orders = Order.objects.all().select_related('product', 'user', 'delivery_partner')
        else:
            orders = Order.objects.filter(user=request.user).select_related('product', 'delivery_partner')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        delivery_address = request.data.get('delivery_address') or getattr(request.user, 'address', '') or ''
        delivery_notes = request.data.get('delivery_notes', '')

        if product_id:
            quantity = int(request.data.get('quantity', 1))
            if quantity < 1:
                return Response({'detail': 'quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

            product = get_object_or_404(Product, pk=product_id)
            order = self._create_order(request.user, product, quantity, delivery_address, delivery_notes)
            if order is None:
                return Response(
                    {'detail': f'Not enough stock for {product.name}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Create notification
            create_notification(
                user=request.user,
                title="Order Placed Successfully",
                message=f"Your order #{order.id} for {product.name} (x{quantity}) has been placed.",
                notification_type=Notification.NotificationType.ORDER,
                related_order_id=order.id,
            )

            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        # No product_id supplied -> checkout everything currently in the cart.
        cart_items = CartItem.objects.filter(user=request.user).select_related('product')
        if not cart_items.exists():
            return Response({'detail': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        created_orders = []
        with transaction.atomic():
            for item in cart_items:
                order = self._create_order(request.user, item.product, item.quantity, delivery_address, delivery_notes)
                if order is None:
                    return Response(
                        {'detail': f'Not enough stock for {item.product.name}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                created_orders.append(order)
            cart_items.delete()

        for ord_item in created_orders:
            create_notification(
                user=request.user,
                title="Order Placed Successfully",
                message=f"Your order #{ord_item.id} for {ord_item.product.name} (x{ord_item.quantity}) has been placed.",
                notification_type=Notification.NotificationType.ORDER,
                related_order_id=ord_item.id,
            )

        return Response(OrderSerializer(created_orders, many=True).data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _create_order(user, product, quantity, delivery_address='', delivery_notes=''):
        if quantity > product.stock:
            return None
        total_price = product.price * quantity
        product.stock -= quantity
        product.save()
        return Order.objects.create(
            user=user,
            product=product,
            quantity=quantity,
            total_price=total_price,
            delivery_address=delivery_address,
            delivery_notes=delivery_notes,
            status=Order.Status.PENDING,
        )


class OrderDetailView(APIView):
    """GET /api/orders/<id>/ -> Retrieve single order details with status history."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role == 'ADMIN' or request.user.is_staff:
            order = get_object_or_404(Order, pk=pk)
        elif request.user.role == 'DELIVERY_PARTNER':
            order = get_object_or_404(Order, pk=pk)
            # Delivery partner can view assigned deliveries or available orders
            if order.delivery_partner and order.delivery_partner != request.user:
                return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            order = get_object_or_404(Order, pk=pk, user=request.user)

        serializer = OrderSerializer(order)
        return Response(serializer.data)


class CancelOrderView(APIView):
    """POST /api/orders/<id>/cancel/ -> Cancel an order if it has not been picked up/delivered."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        if order.status in [Order.Status.PICKED_UP, Order.Status.OUT_FOR_DELIVERY, Order.Status.DELIVERED, Order.Status.COMPLETED]:
            return Response(
                {'detail': f'Cannot cancel order in "{order.status}" status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if order.status == Order.Status.CANCELLED:
            return Response({'detail': 'Order is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        # Restore stock
        order.product.stock += order.quantity
        order.product.save()

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status', 'updated_at'])

        create_notification(
            user=request.user,
            title="Order Cancelled",
            message=f"Order #{order.id} for {order.product.name} has been cancelled.",
            notification_type=Notification.NotificationType.ORDER,
            related_order_id=order.id,
        )

        return Response({'message': 'Order cancelled successfully.', 'order': OrderSerializer(order).data})


# =========================================================================
# Delivery Partner Endpoints
# =========================================================================

class AvailableDeliveriesView(generics.ListAPIView):
    """GET /api/orders/available-deliveries/ -> Orders waiting for a delivery partner."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsDeliveryPartner]

    def get_queryset(self):
        return Order.objects.filter(
            delivery_partner__isnull=True,
            status__in=[Order.Status.PENDING, Order.Status.CONFIRMED, Order.Status.PREPARING]
        ).select_related('product', 'user')


class MyDeliveriesView(generics.ListAPIView):
    """GET /api/orders/my-deliveries/ -> Orders assigned to the current delivery partner."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsDeliveryPartner]

    def get_queryset(self):
        return Order.objects.filter(
            delivery_partner=self.request.user
        ).select_related('product', 'user').order_by('-updated_at')


class AcceptDeliveryView(APIView):
    """POST /api/orders/<id>/accept/ -> Delivery partner accepts an order."""
    permission_classes = [IsAuthenticated, IsDeliveryPartner]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)

        if order.delivery_partner and order.delivery_partner != request.user:
            return Response({'detail': 'This delivery is already assigned to another partner.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.status in [Order.Status.CANCELLED, Order.Status.DELIVERED, Order.Status.COMPLETED]:
            return Response({'detail': f'Cannot accept order with status {order.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        order.delivery_partner = request.user
        if order.status == Order.Status.PENDING:
            order.status = Order.Status.CONFIRMED
        order.save(update_fields=['delivery_partner', 'status', 'updated_at'])

        # Notify Customer
        create_notification(
            user=order.user,
            title="Delivery Partner Assigned",
            message=f"Delivery partner {request.user.username} has accepted your order #{order.id}.",
            notification_type=Notification.NotificationType.DELIVERY,
            related_order_id=order.id,
        )

        return Response({'message': 'Delivery accepted.', 'order': OrderSerializer(order).data})


class UpdateDeliveryStatusView(APIView):
    """
    POST /api/orders/<id>/status/ -> Update delivery status (Preparing -> Picked Up -> Out for Delivery -> Delivered).
    """
    permission_classes = [IsAuthenticated, IsDeliveryPartner]

    VALID_TRANSITIONS = {
        Order.Status.PENDING: [Order.Status.CONFIRMED, Order.Status.PREPARING, Order.Status.CANCELLED],
        Order.Status.CONFIRMED: [Order.Status.PREPARING, Order.Status.PICKED_UP, Order.Status.CANCELLED],
        Order.Status.PREPARING: [Order.Status.PICKED_UP, Order.Status.CANCELLED],
        Order.Status.PICKED_UP: [Order.Status.OUT_FOR_DELIVERY, Order.Status.CANCELLED],
        Order.Status.OUT_FOR_DELIVERY: [Order.Status.DELIVERED, Order.Status.COMPLETED],
        Order.Status.DELIVERED: [Order.Status.COMPLETED],
    }

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)

        # Ensure order is assigned to current partner (or user is admin)
        if order.delivery_partner != request.user and not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({'detail': 'You are not assigned to this delivery.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if not new_status or new_status not in Order.Status.values:
            return Response(
                {'detail': f'Invalid status. Allowed values: {list(Order.Status.values)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        # Notify customer with status-specific message
        messages = {
            Order.Status.CONFIRMED: f"Your order #{order.id} has been confirmed.",
            Order.Status.PREPARING: f"Your order #{order.id} is now being prepared.",
            Order.Status.PICKED_UP: f"Your order #{order.id} has been picked up by {request.user.username}.",
            Order.Status.OUT_FOR_DELIVERY: f"Your order #{order.id} is out for delivery!",
            Order.Status.DELIVERED: f"Your order #{order.id} has been delivered successfully. Enjoy your purchase!",
            Order.Status.COMPLETED: f"Your order #{order.id} is marked as completed.",
        }

        notif_msg = messages.get(new_status, f"Order #{order.id} status updated to {new_status}.")
        create_notification(
            user=order.user,
            title=f"Order Update: {new_status}",
            message=notif_msg,
            notification_type=Notification.NotificationType.ORDER,
            related_order_id=order.id,
        )

        return Response({
            'message': f'Status updated to {new_status}.',
            'order': OrderSerializer(order).data,
        })

