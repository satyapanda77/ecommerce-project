from rest_framework import serializers

from products.serializers import ProductSerializer

from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'product', 'quantity', 'total_price', 'status', 'created_at')
        read_only_fields = ('total_price', 'status', 'created_at')
