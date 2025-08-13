# food_listings/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import FoodListing

@admin.register(FoodListing)
class FoodListingAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider', 'food_type', 'discounted_price', 'quantity_available', 'status', 'expiry_date', 'created_at']
    list_filter = ['food_type', 'status', 'created_at', 'expiry_date']
    search_fields = ['name', 'provider__email', 'provider__provider_profile__business_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'savings', 'discount_percentage']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'description', 'food_type', 'provider')
        }),
        ('Pricing', {
            'fields': ('original_price', 'discounted_price', 'savings', 'discount_percentage')
        }),
        ('Quantity & Availability', {
            'fields': ('quantity', 'quantity_available', 'status')
        }),
        ('Dates & Pickup', {
            'fields': ('expiry_date', 'pickup_window')
        }),
        ('Additional Info', {
            'fields': ('images', 'allergens', 'dietary_info')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )