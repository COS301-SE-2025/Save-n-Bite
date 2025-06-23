# analytics/urls.py
from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    # Main views
    path('', views.dashboard_view, name='dashboard'),
    path('detailed/', views.detailed_analytics_view, name='detailed'),
    path('sustainability/', views.sustainability_impact_view, name='sustainability'),
    path('badges/', views.badges_view, name='badges'),
    path('leaderboard/', views.leaderboard_view, name='leaderboard'),
    
    # API endpoints for AJAX requests
    path('orders-per-month/', views.api_orders_per_month, name='api_orders_per_month'),
    path('sales-vs-donations/', views.api_sales_vs_donations, name='api_sales_vs_donations'),
    path('followers-over-time/', views.api_followers_over_time, name='api_followers_over_time'),
    path('leaderboard/', views.api_leaderboard, name='api_leaderboard'),
    path('update/', views.update_analytics, name='api_update'),
    path('dashboard-overview/', views.api_dashboard_overview, name='api_dashboard_overview'),
]