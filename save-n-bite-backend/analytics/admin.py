# analytics/admin.py
from django.contrib import admin
from .models import UserAnalytics, MonthlyAnalytics, TransactionAnalytics, Badge, UserBadge, SystemAnalytics

@admin.register(UserAnalytics)
class UserAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'meals_saved', 'total_spent')
    list_filter = ('user_type',)
    search_fields = ('user__email',)

@admin.register(MonthlyAnalytics)
class MonthlyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('user', 'year', 'month', 'orders_count', 'meals_saved', 'co2_reduced')
    list_filter = ('year', 'month')
    search_fields = ('user__email',)

@admin.register(TransactionAnalytics)
class TransactionAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_type', 'amount', 'meals_saved')
    list_filter = ('transaction_type',)
    search_fields = ('user__email', 'interaction__id')

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'badge_type', 'tier', 'threshold')
    list_filter = ('badge_type', 'tier')
    search_fields = ('name', 'description')

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'created_at')
    list_filter = ('badge__badge_type', 'badge__tier')
    search_fields = ('user__email', 'badge__name')

@admin.register(SystemAnalytics)
class SystemAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_users', 'total_transactions', 'total_meals_saved')
    list_filter = ('date',)
    date_hierarchy = 'date'