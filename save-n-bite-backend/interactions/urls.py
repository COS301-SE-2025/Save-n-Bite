# Updated urls.py file

from django.urls import path
from .views import (
    AcceptDonationView,
    CartView,
    AddToCartView,
    DonationRequestView,
    RejectDonationView,
    RemoveCartItemView,
    CheckoutView,
    OrderListView,
    OrderDetailView,
    UpdateInteractionStatusView,  # Add this import
    check_interaction_review_status,
    get_interaction_review,
    BusinessHistoryView, 
    InitiateCheckoutView,
    CompleteCheckoutView
    #admin_views
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
    #path('admin/transactions/', admin_views.admin_get_all_transactions, name='admin_get_all_transactions'),
    #path('admin/transactions/update-status/', admin_views.admin_update_transaction_status, name='admin_update_transaction_status'),
    path('donation/request/', DonationRequestView.as_view(), name='donation-request'),
    path('donation/<uuid:interaction_id>/accept/', AcceptDonationView.as_view(), name='donation-accept'),
    path('donation/<uuid:interaction_id>/reject/', RejectDonationView.as_view(), name='donation-reject'),
    path('business/history/', BusinessHistoryView.as_view(), name='business-history'),
    path('interactions/<uuid:interaction_id>/status/', UpdateInteractionStatusView.as_view(), name='update_interaction_status'), 
    path('checkout/initiate/', InitiateCheckoutView.as_view(), name='initiate-checkout'),
    path('checkout/complete/', CompleteCheckoutView.as_view(), name='complete-checkout'),
]