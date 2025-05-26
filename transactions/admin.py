from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import (
    Transaction, Cart, CartItem, Order, Payment,
    TransactionItem, PickupDetails, TransactionStatusHistory
)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction_type', 'status', 'total_amount', 'user', 'business', 'created_at')
    list_filter = ('status', 'transaction_type')
    search_fields = ('id', 'user__email', 'business__user__email')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_items', 'subtotal', 'created_at')

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'food_listing', 'quantity', 'added_at')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction', 'status', 'pickup_window', 'created_at')
    list_filter = ('status',)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction', 'method', 'amount', 'status', 'processed_at')

@admin.register(TransactionItem)
class TransactionItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction', 'name', 'quantity', 'price_per_item', 'total_price')

@admin.register(PickupDetails)
class PickupDetailsAdmin(admin.ModelAdmin):
    list_display = ('order', 'scheduled_time', 'actual_time', 'location', 'contact_person', 'is_completed')

@admin.register(TransactionStatusHistory)
class TransactionStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'old_status', 'new_status', 'changed_by', 'changed_at')
