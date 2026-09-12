from django.urls import path
from .views import WishlistView, WishlistDeleteView, WishlistIdsView

urlpatterns = [
    path('', WishlistView.as_view(), name='wishlist'),
    path('ids/', WishlistIdsView.as_view(), name='wishlist-ids'),
    path('<int:product_id>/', WishlistDeleteView.as_view(), name='wishlist-delete'),
]
