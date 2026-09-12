"""
URL configuration for the MiniShop config project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),

    # API 1 & 2 - auth
    path('api/', include('users.urls')),
    # API 3 & 4 - products
    path('api/products/', include('products.urls')),
    # API 5 - cart
    path('api/cart/', include('cart.urls')),
    # API 6 - orders
    path('api/orders/', include('orders.urls')),
    # API 7 - notifications
    path('api/notifications/', include('notifications.urls')),
    # API 8 - wishlist
    path('api/wishlist/', include('wishlist.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
