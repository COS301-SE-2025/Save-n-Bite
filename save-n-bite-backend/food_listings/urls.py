# food_listings/urls.py

from django.urls import path
from . import views, admin_views

app_name = 'food_listings'

urlpatterns = [
    # Provider endpoints
    path('provider/listings/', views.get_provider_listings, name='provider_listings'),
    path('provider/listings/create/', views.create_food_listing, name='create_listing'),
    path('provider/listings/<uuid:listing_id>/', views.update_food_listing, name='update_listing'),
    
    # Customer browsing endpoints
    path('food-listings/', views.browse_food_listings, name='browse_listings'),
    path('food-listings/<uuid:listing_id>/', views.get_food_listing_details, name='listing_details'),
    # Admin endpoints
    path('admin/listings/', admin_views.admin_get_all_listings, name='admin_get_all_listings'),
    path('admin/listings/moderate/', admin_views.admin_moderate_listing, name='admin_moderate_listing'),
]