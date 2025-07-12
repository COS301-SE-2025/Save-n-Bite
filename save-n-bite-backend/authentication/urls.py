# authentication/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/customer/', views.register_customer, name='register_customer'),
    path('auth/register/ngo/', views.register_ngo, name='register_ngo'),
    path('auth/register/provider/', views.register_provider, name='register_provider'),
    path('auth/login/', views.login_user, name='login_user'),
    path('auth/google-signin/', views.google_signin, name='google_signin'),

    # Profile endpoints
    path('auth/profile/', views.get_user_profile, name='get_user_profile'),
    path('auth/profile/update/', views.update_user_profile, name='update_user_profile'),
    path('auth/business/<uuid:business_id>/', views.get_business_profile, name='get_business_profile'),
    path('auth/businesses/search/', views.search_businesses, name='search_businesses'),

    # Password management (WE MIGHT NOT USE THESE)
    path('login/', views.login_view, name='login'),
    path('change-password/', views.change_password, name='change_password'),
    path('password-status/', views.check_password_status, name='password_status'),

    # Password management URLs
    path('auth/change-temporary-password/', views.change_temporary_password, name='change_temporary_password'),
    path('auth/password-status/', views.check_password_status, name='check_password_status'),
    path('auth/login-enhanced/', views.login_with_password_check, name='login_with_password_check'),

    # Self-service password reset URLs
    path('auth/forgot-password/', views.request_password_reset, name='request_password_reset'),
    path('auth/check-email/', views.check_email_exists, name='check_email_exists'),  # Optional
    
    
]