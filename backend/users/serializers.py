from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import DeliveryPartner

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(
        choices=[User.Role.CUSTOMER, User.Role.DELIVERY_PARTNER],
        default=User.Role.CUSTOMER,
        required=False,
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'phone_number', 'address')

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError('Admin role cannot be selected via public registration.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.CUSTOMER)
        phone_number = validated_data.get('phone_number', '')
        address = validated_data.get('address', '')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role,
            phone_number=phone_number,
            address=address,
        )

        if role == User.Role.DELIVERY_PARTNER:
            DeliveryPartner.objects.get_or_create(user=user)

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 'address', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'phone_number', 'address', 'first_name', 'last_name')

