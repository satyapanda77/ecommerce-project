from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product

from .models import CartItem
from .serializers import CartItemSerializer


class CartView(APIView):
    """
    GET    /api/cart/  -> list the current user's cart items
    POST   /api/cart/  -> add a product to the cart (or increase quantity)
    DELETE /api/cart/  -> remove a product from the cart
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = CartItem.objects.filter(user=request.user)
        serializer = CartItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'detail': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity < 1:
            return Response({'detail': 'quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, pk=product_id)

        cart_item, created = CartItem.objects.get_or_create(
            user=request.user, product=product, defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def patch(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        if not product_id:
            return Response({'detail': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity <= 0:
            CartItem.objects.filter(user=request.user, product_id=product_id).delete()
            return Response({'message': 'Item removed from cart.'})
        cart_item = get_object_or_404(CartItem, user=request.user, product_id=product_id)
        cart_item.quantity = quantity
        cart_item.save(update_fields=['quantity'])
        return Response(CartItemSerializer(cart_item).data)

    def delete(self, request):
        product_id = request.data.get('product_id') or request.query_params.get('product_id')

        if not product_id:
            return Response({'detail': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item = get_object_or_404(CartItem, user=request.user, product_id=product_id)
        cart_item.delete()
        return Response({'message': 'Item removed from cart.'}, status=status.HTTP_200_OK)

