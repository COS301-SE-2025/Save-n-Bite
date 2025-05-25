# food_listings/admin.py

from django.contrib import admin
from .models import FoodListing, CartItem, Order, OrderItem

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

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'listing', 'quantity', 'total_price', 'added_at']
    list_filter = ['added_at']
    search_fields = ['user__email', 'listing__name']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['pickup_code', 'user', 'provider', 'total_amount', 'status', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['pickup_code', 'user__email', 'provider__provider_profile__business_name']
    readonly_fields = ['id', 'pickup_code', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('id', 'pickup_code', 'user', 'provider', 'status')
        }),
        ('Payment', {
            'fields': ('total_amount', 'payment_method', 'payment_status')
        }),
        ('Additional', {
            'fields': ('special_instructions',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'listing', 'quantity', 'price_per_item', 'total_price']
    search_fields = ['order__pickup_code', 'listing__name']

# Register your models here.
