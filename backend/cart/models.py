from django.conf import settings
from django.db import models

from products.models import Product


class CartItem(models.Model):
    """One product + quantity that a user has placed in their cart."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-id']

    def __str__(self):
        return f'{self.user.username} - {self.product.name} x {self.quantity}'
