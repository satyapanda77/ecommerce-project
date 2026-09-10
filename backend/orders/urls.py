from django.urls import path
from .views import (
    OrderView,
    OrderDetailView,
    CancelOrderView,
    AvailableDeliveriesView,
    MyDeliveriesView,
    AcceptDeliveryView,
    UpdateDeliveryStatusView,
)

urlpatterns = [
    path('', OrderView.as_view(), name='orders'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/cancel/', CancelOrderView.as_view(), name='order-cancel'),
    path('available-deliveries/', AvailableDeliveriesView.as_view(), name='available-deliveries'),
    path('my-deliveries/', MyDeliveriesView.as_view(), name='my-deliveries'),
    path('<int:pk>/accept/', AcceptDeliveryView.as_view(), name='order-accept-delivery'),
    path('<int:pk>/status/', UpdateDeliveryStatusView.as_view(), name='order-update-status'),
]

