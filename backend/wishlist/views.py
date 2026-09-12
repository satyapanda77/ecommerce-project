from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistView(APIView):
    """
    GET    /api/wishlist/              -> list user's wishlist items
    POST   /api/wishlist/              -> add a product to wishlist
    DELETE /api/wishlist/<product_id>/ -> remove from wishlist
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = WishlistItem.objects.filter(user=request.user).select_related('product')
        serializer = WishlistItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'detail': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, pk=product_id)
        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)

        if not created:
            return Response({'detail': 'Product already in wishlist.'}, status=status.HTTP_200_OK)

        return Response(WishlistItemSerializer(item).data, status=status.HTTP_201_CREATED)


class WishlistDeleteView(APIView):
    """DELETE /api/wishlist/<product_id>/ -> remove product from wishlist."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        item = get_object_or_404(WishlistItem, user=request.user, product_id=product_id)
        item.delete()
        return Response({'message': 'Removed from wishlist.'}, status=status.HTTP_200_OK)


class WishlistIdsView(APIView):
    """GET /api/wishlist/ids/ -> list of product ids in user's wishlist (for fast lookup)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ids = WishlistItem.objects.filter(user=request.user).values_list('product_id', flat=True)
        return Response(list(ids))
