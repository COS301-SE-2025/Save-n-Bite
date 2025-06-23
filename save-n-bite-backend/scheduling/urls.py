# scheduling/urls.py

from django.urls import path
from . import views

app_name = 'scheduling'

urlpatterns = [
    # Business pickup management
    path('pickup-locations/', views.pickup_locations, name='pickup_locations'),
    path('pickup-locations/<uuid:location_id>/', views.pickup_location_detail, name='pickup_location_detail'),
    path('time-slots/', views.pickup_time_slots, name='pickup_time_slots'),
    path('schedule-overview/', views.business_schedule_overview, name='schedule_overview'),
    path('verify-code/', views.verify_pickup_code, name='verify_pickup_code'),
    path('complete-pickup/<uuid:pickup_id>/', views.complete_pickup, name='complete_pickup'),
    
    # Customer pickup scheduling
    path('available-slots/', views.available_pickup_slots, name='available_slots'),
    path('schedule/', views.schedule_pickup, name='schedule_pickup'),
    path('my-pickups/', views.customer_pickups, name='customer_pickups'),
    path('pickups/<uuid:pickup_id>/', views.pickup_details, name='pickup_details'),
    path('pickups/<uuid:pickup_id>/cancel/', views.cancel_pickup, name='cancel_pickup'),
    
    # Analytics and optimization
    path('analytics/', views.business_analytics, name='business_analytics'),
    path('optimization/', views.optimization_recommendations, name='optimization_recommendations'),
    
    # Utility endpoints
    path('send-reminders/', views.send_pickup_reminders, name='send_reminders'),
    path('public/locations/<uuid:business_id>/', views.pickup_locations_public, name='public_locations'),
]