# authentication/urls.py

from django.urls import path
from django.http import HttpResponse
from . import views

# Add the admin creator function
def create_admin(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@savenbite.com', 'password123')
            return HttpResponse("Admin user created: username=admin, password=password123")
        else:
            return HttpResponse("Admin user already exists: username=admin, password=password123")
    except Exception as e:
        return HttpResponse(f"Error creating admin: {e}")

urlpatterns = [
    # Add this line for creating admin user
    path('create-admin/', create_admin, name='create_admin'),
    
    # Your existing URLs
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

    # Food Providers endpoints
    path('auth/providers/', views.get_food_providers, name='get_food_providers'),
    path('auth/providers/<uuid:provider_id>/', views.get_food_provider_by_id, name='get_food_provider_by_id'),
    path('auth/providers/locations/', views.get_food_providers_locations, name='get_food_providers_locations'),

    # Profile endpoints
    path('auth/profile/me/', views.get_my_profile, name='get_my_profile'),
    path('auth/profile/me/update/', views.update_my_profile, name='update_my_profile'),
    path('auth/profile/me/orders/', views.get_order_history, name='get_order_history'),
]