from rest_framework import serializers
from products.serializers import ProductSerializer
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    delivery_partner_name = serializers.CharField(source='delivery_partner.username', read_only=True, default=None)
    customer_name = serializers.CharField(source='user.username', read_only=True)
    customer_phone = serializers.CharField(source='user.phone_number', read_only=True, default='')
    customer_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id',
            'product',
            'quantity',
            'total_price',
            'status',
            'delivery_address',
            'delivery_notes',
            'delivery_partner',
            'delivery_partner_name',
            'customer_name',
            'customer_phone',
            'customer_email',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('total_price', 'created_at', 'updated_at')

