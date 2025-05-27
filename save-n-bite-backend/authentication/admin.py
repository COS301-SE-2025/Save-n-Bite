# authentication/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile

# Custom User Admin
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'user_type', 'is_active', 'date_joined']
    list_filter = ['user_type', 'is_active', 'date_joined']
    search_fields = ['email', 'username']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('user_type',)
        }),
    )

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name']
    search_fields = ['user__email', 'full_name']

@admin.register(NGOProfile)
class NGOProfileAdmin(admin.ModelAdmin):
    list_display = ['organisation_name', 'representative_name', 'representative_email', 'status']
    list_filter = ['status']
    search_fields = ['organisation_name', 'representative_name', 'representative_email']
    
    fieldsets = (
        ('Organization Info', {
            'fields': ('user', 'organisation_name', 'organisation_contact', 'organisation_email')
        }),
        ('Representative', {
            'fields': ('representative_name', 'representative_email')
        }),
        ('Address', {
            'fields': ('address_line1', 'address_line2', 'city', 'province_or_state', 'postal_code', 'country')
        }),
        ('Documents & Status', {
            'fields': ('npo_document', 'organisation_logo', 'status')
        }),
    )

@admin.register(FoodProviderProfile)
class FoodProviderProfileAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'business_email', 'business_contact', 'status']
    list_filter = ['status']
    search_fields = ['business_name', 'business_email']
    
    fieldsets = (
        ('Business Info', {
            'fields': ('user', 'business_name', 'business_email', 'business_contact')
        }),
        ('Address', {
            'fields': ('business_address',)
        }),
        ('Documents & Status', {
            'fields': ('cipc_document', 'logo', 'status')
        }),
    )

# Register your models here.
