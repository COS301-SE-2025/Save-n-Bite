# admin_system/urls.py - Updated with new endpoints

from django.urls import path
from . import views

app_name = 'admin_system'

urlpatterns = [
    # ==================== ADMIN AUTHENTICATION ====================
    path('', views.admin_login_check, name='admin_login_check'),

    # ==================== DASHBOARD ====================
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    
    # ==================== USER MANAGEMENT ====================
    path('users/', views.get_all_users, name='get_all_users'),
    path('users/toggle-status/', views.toggle_user_status, name='toggle_user_status'),
    path('users/reset-password/', views.reset_user_password, name='reset_user_password'),
    
    # ==================== VERIFICATION MANAGEMENT ====================
    path('verifications/pending/', views.get_pending_verifications, name='get_pending_verifications'),
    path('verifications/update/', views.update_verification_status, name='update_verification_status'),
    
    # ==================== AUDIT & SYSTEM LOGS ====================
    path('logs/admin-actions/', views.get_admin_action_logs, name='get_admin_action_logs'),
    path('logs/system/', views.get_system_logs, name='get_system_logs'),
    path('logs/system/resolve/', views.resolve_system_log, name='resolve_system_log'),
    
    # ==================== ENHANCED ANALYTICS ====================
    path('analytics/', views.get_simple_analytics, name='get_simple_analytics'),
    
    # ==================== SECURITY & ANOMALY DETECTION ====================
    path('security/anomalies/', views.get_security_anomalies, name='get_security_anomalies'),
    
    # ==================== DATA EXPORT ====================
    path('export/', views.export_data, name='export_data'),

    # ==================== CUSTOM NOTIFICATIONS (NO SCHEDULING) ====================
    path('notifications/send/', views.send_custom_notification, name='send_custom_notification'),
    path('notifications/analytics/', views.get_notification_analytics, name='get_notification_analytics'),
    path('notifications/audience-counts/', views.get_audience_counts, name='get_audience_counts'),
    
    # ==================== ENHANCED LISTINGS MANAGEMENT ====================
    path('listings/', views.get_all_listings_admin, name='get_all_listings_admin'),
    path('listings/moderate/', views.moderate_listing, name='moderate_listing'),
]

