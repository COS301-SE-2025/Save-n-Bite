# authentication/admin.py - Updated with new FoodProvider fields

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

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
    list_display = [
        'business_name', 
        'business_email', 
        'business_contact', 
        'status',
        'has_banner',
        'has_description', 
        'tag_count',
        'profile_completeness_display'
    ]
    list_filter = [
        'status', 
        'geocoding_failed',
        'banner_updated_at',
        'description_updated_at',
        'tags_updated_at'
    ]
    search_fields = [
        'business_name', 
        'business_email', 
        'business_description',
        'business_tags'  # This will search within the JSON field
    ]
    
    readonly_fields = [
        'geocoded_at', 
        'geocoding_failed', 
        'geocoding_error',
        'banner_updated_at',
        'description_updated_at',
        'tags_updated_at',
        'banner_preview',
        'logo_preview',
        'tags_display'
    ]
    
    fieldsets = (
        ('Business Info', {
            'fields': (
                'user', 
                'business_name', 
                'business_email', 
                'business_contact',
                'business_description'
            )
        }),
        ('Address & Location', {
            'fields': (
                'business_address',
                'latitude',
                'longitude', 
                'geocoded_at',
                'geocoding_failed',
                'geocoding_error'
            )
        }),
        ('Business Details', {
            'fields': (
                'business_hours',
                'phone_number',
                'website',
                'business_tags',
                'tags_display'
            )
        }),
        ('Media & Branding', {
            'fields': (
                'logo',
                'logo_preview',
                'banner',
                'banner_preview'
            )
        }),
        ('Documents & Status', {
            'fields': (
                'cipc_document', 
                'status'
            )
        }),
        ('Update Tracking', {
            'fields': (
                'banner_updated_at',
                'description_updated_at',
                'tags_updated_at'
            ),
            'classes': ('collapse',)
        }),
    )

    def has_banner(self, obj):
        """Display whether business has a banner"""
        return bool(obj.banner)
    has_banner.boolean = True
    has_banner.short_description = 'Has Banner'

    def has_description(self, obj):
        """Display whether business has a description"""
        return bool(obj.business_description and obj.business_description.strip())
    has_description.boolean = True
    has_description.short_description = 'Has Description'

    def tag_count(self, obj):
        """Display number of tags"""
        if isinstance(obj.business_tags, list):
            return len(obj.business_tags)
        return 0
    tag_count.short_description = 'Tag Count'

    def profile_completeness_display(self, obj):
        """Display profile completeness status"""
        is_complete = obj.has_complete_profile()
        color = 'green' if is_complete else 'orange'
        text = 'Complete' if is_complete else 'Basic'
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            text
        )
    profile_completeness_display.short_description = 'Profile'

    def banner_preview(self, obj):
        """Display banner preview in admin"""
        if obj.banner:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 100px;" />',
                obj.banner.url
            )
        return "No banner"
    banner_preview.short_description = 'Banner Preview'

    def logo_preview(self, obj):
        """Display logo preview in admin"""
        if obj.logo:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;" />',
                obj.logo.url
            )
        return "No logo"
    logo_preview.short_description = 'Logo Preview'

    def tags_display(self, obj):
        """Display tags in a nice format"""
        tags = obj.get_tag_display()
        if tags:
            tag_html = []
            for tag in tags:
                tag_html.append(
                    f'<span style="background-color: #e1f5fe; color: #01579b; '
                    f'padding: 2px 6px; border-radius: 3px; margin: 2px; '
                    f'display: inline-block; font-size: 12px;">{tag}</span>'
                )
            return mark_safe(''.join(tag_html))
        return "No tags"
    tags_display.short_description = 'Business Tags'

    def get_queryset(self, request):
        """Optimize queries for admin list view"""
        return super().get_queryset(request).select_related('user')

    actions = ['verify_providers', 'reject_providers', 'geocode_addresses']

    def verify_providers(self, request, queryset):
        """Admin action to verify multiple providers"""
        updated = queryset.filter(status='pending_verification').update(status='verified')
        self.message_user(request, f"{updated} providers verified successfully.")
    verify_providers.short_description = "Verify selected providers"

    def reject_providers(self, request, queryset):
        """Admin action to reject multiple providers"""
        updated = queryset.filter(status='pending_verification').update(status='rejected')
        self.message_user(request, f"{updated} providers rejected.")
    reject_providers.short_description = "Reject selected providers"

    def geocode_addresses(self, request, queryset):
        """Admin action to geocode addresses for providers missing coordinates"""
        count = 0
        for provider in queryset.filter(latitude__isnull=True, longitude__isnull=True):
            try:
                provider.geocode_address()
                provider.save()
                count += 1
            except Exception as e:
                pass
        self.message_user(request, f"{count} providers geocoded successfully.")
    geocode_addresses.short_description = "Geocode addresses for selected providers"