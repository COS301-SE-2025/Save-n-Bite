# authentication/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/customer/', views.register_customer, name='register_customer'),
    path('auth/register/ngo/', views.register_ngo, name='register_ngo'),
    path('auth/register/provider/', views.register_provider, name='register_provider'),
    path('auth/login/', views.login_user, name='login_user'),
    path('auth/google-signin/', views.google_signin, name='google_signin'),
]