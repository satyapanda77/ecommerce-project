from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import CartItem
from products.models import Product

from .models import Order
from .serializers import OrderSerializer


class OrderView(APIView):
    """
    GET  /api/orders/ -> list the current user's orders
    POST /api/orders/ -> place an order

    POST body:
      - { "product_id": <id>, "quantity": <n> }  -> order that single product
      - {}                                        -> checkout the whole cart
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')

        if product_id:
            quantity = int(request.data.get('quantity', 1))
            if quantity < 1:
                return Response({'detail': 'quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

            product = get_object_or_404(Product, pk=product_id)
            order = self._create_order(request.user, product, quantity)
            if order is None:
                return Response(
                    {'detail': f'Not enough stock for {product.name}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        # No product_id supplied -> checkout everything currently in the cart.
        cart_items = CartItem.objects.filter(user=request.user).select_related('product')
        if not cart_items.exists():
            return Response({'detail': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        created_orders = []
        with transaction.atomic():
            for item in cart_items:
                order = self._create_order(request.user, item.product, item.quantity)
                if order is None:
                    return Response(
                        {'detail': f'Not enough stock for {item.product.name}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                created_orders.append(order)
            cart_items.delete()

        return Response(OrderSerializer(created_orders, many=True).data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _create_order(user, product, quantity):
        if quantity > product.stock:
            return None
        total_price = product.price * quantity
        product.stock -= quantity
        product.save()
        return Order.objects.create(
            user=user, product=product, quantity=quantity, total_price=total_price
        )
