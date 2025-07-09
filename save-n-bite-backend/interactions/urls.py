from django.urls import path
from .views import (
    CartView,
    AddToCartView,
    RemoveCartItemView,
    CheckoutView,
    OrderListView,
    OrderDetailView,
    check_interaction_review_status,
    get_interaction_review,
    admin_views
)

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('add/', AddToCartView.as_view(), name='add-to-cart'),
    path('remove/', RemoveCartItemView.as_view(), name='remove-from-cart'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/<uuid:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('interactions/<uuid:interaction_id>/review-status/', check_interaction_review_status, name='check_interaction_review_status'),
    path('interactions/<uuid:interaction_id>/review/', get_interaction_review, name='get_interaction_review'),
        # Admin endpoints
    path('admin/transactions/', admin_views.admin_get_all_transactions, name='admin_get_all_transactions'),
    path('admin/transactions/update-status/', admin_views.admin_update_transaction_status, name='admin_update_transaction_status'),

]