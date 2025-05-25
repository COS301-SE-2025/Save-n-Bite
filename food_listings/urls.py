# food_listings/urls.py

from django.urls import path
from . import views

app_name = 'food_listings'

urlpatterns = [
    # Provider endpoints
    path('provider/listings/', views.get_provider_listings, name='provider_listings'),
    path('provider/listings/create/', views.create_food_listing, name='create_listing'),
    path('provider/listings/<uuid:listing_id>/', views.update_food_listing, name='update_listing'),
    
    # Customer browsing endpoints
    path('food-listings/', views.browse_food_listings, name='browse_listings'),
    path('food-listings/<uuid:listing_id>/', views.get_food_listing_details, name='listing_details'),
    
    # # Cart endpoints
    # path('cart/', views.get_cart_items, name='get_cart'),
    # path('cart/add/', views.add_to_cart, name='add_to_cart'),
    # path('cart/remove/', views.remove_from_cart, name='remove_from_cart'),
    # path('cart/checkout/', views.checkout_cart, name='checkout'),
    
    # # Order endpoints
    # path('orders/<uuid:order_id>/pickup/', views.get_pickup_details, name='pickup_details'),
]