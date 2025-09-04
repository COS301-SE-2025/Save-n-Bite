# scheduling/urls.py

from django.urls import path
from . import views

app_name = 'scheduling'

urlpatterns = [
    # =============== BUSINESS PICKUP MANAGEMENT ===============
    
    # Pickup locations management
    path('pickup-locations/', views.pickup_locations, name='pickup_locations'),
    path('pickup-locations/<uuid:location_id>/', views.pickup_location_detail, name='pickup_location_detail'),
    
    # Business order management - simplified
    path('schedule-overview/', views.business_schedule_overview, name='schedule_overview'),
    path('mark-ready/<uuid:pickup_id>/', views.mark_order_ready, name='mark_order_ready'),
    path('verify-code/', views.verify_pickup_code, name='verify_pickup_code'),
    path('complete-pickup/<uuid:pickup_id>/', views.complete_pickup, name='complete_pickup'),
    
    # =============== CUSTOMER PICKUP SCHEDULING ===============
    
    # Simplified pickup scheduling (no time slots)
    path('schedule/', views.schedule_pickup, name='schedule_pickup'),
    path('my-pickups/', views.customer_pickups, name='customer_pickups'),
    path('pickups/<uuid:pickup_id>/', views.pickup_details, name='pickup_details'),
    path('pickups/<uuid:pickup_id>/cancel/', views.cancel_pickup, name='cancel_pickup'),
    
    # =============== ANALYTICS ===============
    
    # Simplified analytics
    path('analytics/', views.business_analytics, name='business_analytics'),
    
    # =============== UTILITY ENDPOINTS ===============
    
    # Administrative and utility functions
    path('send-reminders/', views.send_pickup_reminders, name='send_reminders'),
    path('check-missed/', views.check_missed_pickups, name='check_missed_pickups'),
    path('public/locations/<uuid:business_id>/', views.pickup_locations_public, name='public_locations'),
]