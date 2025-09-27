# badges/urls.py

from django.urls import path
from . import views

app_name = 'badges'

urlpatterns = [
    # Badge Types (public)
    path('types/', views.BadgeTypeListView.as_view(), name='badge-types'),
    path('categories/', views.get_badge_categories, name='badge-categories'),
    path('rarities/', views.get_badge_rarities, name='badge-rarities'),
    
    # Provider Badges
    path('my-badges/', views.get_my_badges, name='my-badges'),
    path('provider/<uuid:provider_id>/', views.get_provider_badges, name='provider-badges'),
    path('progress/', views.get_badge_progress, name='badge-progress'),
    
    # Badge Management
    path('pin/', views.BadgePinView.as_view(), name='badge-pin'),
    path('download/<uuid:badge_id>/', views.download_badge, name='badge-download'),
    path('refresh/', views.refresh_my_badges, name='refresh-badges'),
    
    # Leaderboards
    path('leaderboard/', views.get_badge_leaderboard, name='badge-leaderboard'),
    path('leaderboard/monthly/', views.get_monthly_leaderboards, name='monthly-leaderboards'),
    
    # Admin endpoints (optional)
    path('admin/initialize-types/', views.admin_initialize_badge_types, name='admin-initialize-types'),
]