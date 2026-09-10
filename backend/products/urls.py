from django.urls import path
from .views import ProductListView, ProductDetailView, ProductCategoryListView

urlpatterns = [
    path('', ProductListView.as_view(), name='product-list'),
    path('categories/', ProductCategoryListView.as_view(), name='product-categories'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
]

