# authentication/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Individual, Business, Organisation, Admin, PaymentMethod, AvailableHours

# Custom User Admin
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'user_type', 'is_active', 'date_joined']
    list_filter = ['user_type', 'role', 'is_active', 'date_joined', 'admin_rights']
    search_fields = ['email', 'username']
    ordering = ['email']
    #im not sure if i agree with this bc its for an admin but Claude insists
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('user_type', 'role', 'phone_number', 'profile_picture', 'admin_rights')  # ← Added new fields
        }),
    )


@admin.register(Individual)
class IndividualAdmin(admin.ModelAdmin):
    list_display = ['get_username', 'get_email', 'date_of_birth']
    search_fields = ['user__email', 'user__username']
    
    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ['organisation_name', 'get_email', 'representative_name', 'status']
    list_filter = ['status', 'verified_org', 'organisation_type']  # ← Updated filter fields
    search_fields = ['organisation_name', 'user__email', 'representative_name']
    
    fieldsets = (
        ('Organization Info', {
            'fields': ('user', 'organisation_name', 'organisation_contact', 'organisation_type')  # ← Removed organisation_email
        }),
        ('Representative', {
            'fields': ('representative_name', 'representative_email')
        }),
        ('Address', {
            'fields': ('street_number', 'street', 'suburb', 'city', 'province_or_state', 'postal_code', 'country')
        }),
        ('Documents & Status', {
            'fields': ('ngo_registration', 'organisation_logo', 'status', 'verified_org')  # ← Updated field names
        }),
    )
    
    def get_email(self, obj):
        return obj.user.email  # ← Get email from linked User
    get_email.short_description = 'Email'

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'get_email', 'business_contact', 'status']
    list_filter = ['status', 'verified', 'business_type']  # ← Added new filter fields
    search_fields = ['business_name', 'user__email', 'business_contact']
    
    fieldsets = (
        ('Business Info', {
            'fields': ('user', 'business_name', 'business_contact', 'business_type')  
        }),
        ('Address', {
            'fields': ('street_number', 'street', 'suburb', 'city', 'province_or_state', 'postal_code', 'country') 
        }),
        ('Documents & Status', {
            'fields': ('business_licence', 'logo', 'status', 'verified')  
        }),
    )
    
    def get_email(self, obj):
        return obj.user.email  
    get_email.short_description = 'Email'

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['get_username', 'payment_method', 'billing_address']
    list_filter = ['payment_method']
    search_fields = ['user__email', 'user__username']
    
    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'

@admin.register(AvailableHours)
class AvailableHoursAdmin(admin.ModelAdmin):
    list_display = ['get_business_name', 'day_of_week', 'hours']
    list_filter = ['day_of_week']
    search_fields = ['business__business_name']
    
    def get_business_name(self, obj):
        return obj.business.business_name
    get_business_name.short_description = 'Business Name'

@admin.register(Admin)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ['get_username', 'get_email']
    search_fields = ['user__email', 'user__username']
    
    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'