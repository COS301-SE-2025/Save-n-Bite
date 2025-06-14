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
]