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
    check_interaction_review_status,
    get_interaction_review
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
    path('donation/request/', DonationRequestView.as_view(), name='donation-request'),
    path('donation/<uuid:interaction_id>/accept/', AcceptDonationView.as_view(), name='donation-accept'),
    path('donation/<uuid:interaction_id>/reject/', RejectDonationView.as_view(), name='donation-reject'),
]