from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model for MiniShop.

    Reuses Django's built-in AbstractUser, which already provides:
    id, username, email, password (plus is_active, date_joined, etc.)
    We simply make email required and unique.
    """
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username
