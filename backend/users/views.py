from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from notifications.models import Notification
from notifications.services import create_notification
from .email_service import send_login_security_email, send_welcome_email
from .serializers import RegisterSerializer, UserSerializer, UserProfileUpdateSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/register/ - create a new user."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Trigger welcome notifications safely
        send_welcome_email(user)
        create_notification(
            user=user,
            title="Welcome to MiniShop!",
            message=f"Welcome aboard, {user.username}! Your {user.get_role_display()} account is now active.",
            notification_type=Notification.NotificationType.INFO,
        )

        return Response(
            {
                'message': 'User registered successfully.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginSerializer(TokenObtainPairSerializer):
    """
    Allows the user to log in with either their username or email
    in the `username` field, plus their password.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        login_value = attrs.get(self.username_field)
        if login_value and '@' in login_value:
            try:
                user = User.objects.get(email__iexact=login_value)
                attrs[self.username_field] = user.username
            except User.DoesNotExist:
                pass
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    """POST /api/login/ - authenticate the user and return JWT tokens."""
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            try:
                username = request.data.get('username', '')
                user = None
                if '@' in username:
                    user = User.objects.filter(email__iexact=username).first()
                if not user:
                    user = User.objects.filter(username__iexact=username).first()

                if user:
                    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    send_login_security_email(user, ip_address=ip_address, user_agent=user_agent)
                    create_notification(
                        user=user,
                        title="Security Alert: Login Detected",
                        message=f"Successful login from {user_agent[:40] if user_agent else 'web client'}.",
                        notification_type=Notification.NotificationType.SECURITY,
                    )
            except Exception:
                pass  # Security email/notification must never fail successful login
        return response


class ProfileView(APIView):
    """GET/PUT /api/profile/ - Retrieve and update user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'message': 'Profile updated successfully.',
            'user': UserSerializer(request.user).data,
        })


class ChangePasswordView(APIView):
    """POST /api/change-password/ - Change password for authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'detail': 'Both old_password and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(old_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {'detail': 'New password must be at least 6 characters long.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save()

        create_notification(
            user=request.user,
            title="Password Changed",
            message="Your password was updated successfully. If you did not make this change, contact support.",
            notification_type=Notification.NotificationType.SECURITY,
        )

        return Response({'message': 'Password changed successfully.'})

