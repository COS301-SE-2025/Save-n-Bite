# scheduling/urls.py

from django.urls import path
from . import views

app_name = 'scheduling'

urlpatterns = [
    # =============== BUSINESS PICKUP MANAGEMENT ===============
    
    # Pickup locations management
    path('pickup-locations/', views.pickup_locations, name='pickup_locations'),
    path('pickup-locations/<uuid:location_id>/', views.pickup_location_detail, name='pickup_location_detail'),
    
    # Food listing pickup schedules (NEW - replaces general time slots)
    path('pickup-schedules/', views.food_listing_pickup_schedules, name='pickup_schedules'),
    path('generate-time-slots/', views.generate_time_slots, name='generate_time_slots'),
    
    # Business schedule management
    path('schedule-overview/', views.business_schedule_overview, name='schedule_overview'),
    path('verify-code/', views.verify_pickup_code, name='verify_pickup_code'),
    path('complete-pickup/<uuid:pickup_id>/', views.complete_pickup, name='complete_pickup'),
    
    # =============== CUSTOMER PICKUP SCHEDULING ===============
    
    # Browse and schedule pickups
    path('available-slots/', views.available_pickup_slots, name='available_slots'),
    path('schedule/', views.schedule_pickup, name='schedule_pickup'),
    path('my-pickups/', views.customer_pickups, name='customer_pickups'),
    path('pickups/<uuid:pickup_id>/', views.pickup_details, name='pickup_details'),
    path('pickups/<uuid:pickup_id>/cancel/', views.cancel_pickup, name='cancel_pickup'),
    
    # =============== ANALYTICS AND OPTIMIZATION ===============
    
    # Business analytics
    path('analytics/', views.business_analytics, name='business_analytics'),
    path('optimization/', views.optimization_recommendations, name='optimization_recommendations'),
    
    # =============== UTILITY ENDPOINTS ===============
    
    # Administrative and utility functions
    path('send-reminders/', views.send_pickup_reminders, name='send_reminders'),
    path('public/locations/<uuid:business_id>/', views.pickup_locations_public, name='public_locations'),
]