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
]