# notifications/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Notification management
    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/unread-count/', views.get_unread_count, name='get_unread_count'),
    path('notifications/mark-read/', views.mark_notifications_read, name='mark_notifications_read'),
    path('notifications/mark-all-read/', views.mark_all_read, name='mark_all_read'),
    path('notifications/<uuid:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    
    # Notification preferences
    path('notifications/preferences/', views.notification_preferences, name='notification_preferences'),
    
    # Business following
    path('follow/', views.follow_business, name='follow_business'),
    path('unfollow/<uuid:business_id>/', views.unfollow_business, name='unfollow_business'),
    path('following/', views.get_following, name='get_following'),
    path('followers/', views.get_followers, name='get_followers'),
]