from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product
from .serializers import ProductSerializer


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/ - return products with search, category filter, and sorting support.
    Query params:
      - q: search term (matches name or description)
      - category: filter by category
      - sort: 'price_asc', 'price_desc', 'newest', 'name'
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.all()
        q = self.request.query_params.get('q') or self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        sort = self.request.query_params.get('sort')

        if q:
            queryset = queryset.filter(Q(name__icontains=q) | Q(description__icontains=q))

        if category and category.lower() != 'all':
            queryset = queryset.filter(category__iexact=category)

        if sort == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort == 'name':
            queryset = queryset.order_by('name')
        else:
            queryset = queryset.order_by('-id')

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """GET /api/products/<id>/ - return details of one product."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class ProductCategoryListView(APIView):
    """GET /api/products/categories/ - return unique list of categories."""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Product.objects.values_list('category', flat=True).distinct()
        cleaned_categories = sorted(list({cat.strip() for cat in categories if cat}))
        return Response(cleaned_categories)

