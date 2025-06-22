from django.urls import path
from .views import (
    CartView,
    AddToCartView,
    RemoveCartItemView,
    CheckoutView,
    OrderListView,
    OrderDetailView
)

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('add/', AddToCartView.as_view(), name='add-to-cart'),
    path('remove/', RemoveCartItemView.as_view(), name='remove-from-cart'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/<uuid:order_id>/', OrderDetailView.as_view(), name='order-detail'),
]