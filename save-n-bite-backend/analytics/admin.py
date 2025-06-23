# analytics/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Avg
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    UserAnalytics, MonthlyAnalytics, TransactionAnalytics, 
    ReviewAnalytics, Badge, UserBadge, SystemAnalytics
)

@admin.register(UserAnalytics)
class UserAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'user_type', 'total_orders', 'total_donations_given', 
        'total_followers', 'average_rating', 'meals_saved', 
        'co2_reduction_kg', 'percentile_display'
    ]
    list_filter = ['user_type', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'average_rating', 'percentile_display']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'user_type')
        }),
        ('Core Metrics', {
            'fields': (
                'total_orders', 'total_donations_given', 'total_donations_received',
                'total_followers'
            )
        }),
        ('Ratings & Reviews', {
            'fields': ('total_reviews', 'rating_sum', 'average_rating')
        }),
        ('Sustainability Impact', {
            'fields': ('meals_saved', 'co2_reduction_kg')
        }),
        ('Rewards & Gamification', {
            'fields': ('savecoins_earned', 'savecoins_spent', 'total_badges')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at', 'percentile_display'),
            'classes': ('collapse',)
        })
    )
    
    def percentile_display(self, obj):
        percentile = obj.get_percentile_rank()
        if percentile >= 90:
            color = 'green'
        elif percentile >= 75:
            color = 'blue'
        elif percentile >= 50:
            color = 'orange'
        else:
            color = 'red'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">Top {}%</span>',
            color, percentile
        )
    percentile_display.short_description = 'Percentile Rank'
    
    actions = ['recalculate_ratings', 'export_analytics']
    
    def recalculate_ratings(self, request, queryset):
        for analytics in queryset:
            analytics.calculate_average_rating()
        self.message_user(request, f'Recalculated ratings for {queryset.count()} users.')
    recalculate_ratings.short_description = 'Recalculate average ratings'

@admin.register(MonthlyAnalytics)
class MonthlyAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'month_year', 'orders_count', 'donations_given', 
        'total_sales', 'meals_saved_monthly', 'co2_reduced_monthly'
    ]
    list_filter = ['year', 'month', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    def month_year(self, obj):
        return f"{obj.month:02d}/{obj.year}"
    month_year.short_description = 'Month/Year'
    month_year.admin_order_field = 'year'

@admin.register(TransactionAnalytics)
class TransactionAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'transaction_type', 'amount', 'quantity', 
        'meals_saved', 'co2_reduction', 'created_at'
    ]
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Transaction Details', {
            'fields': ('user', 'transaction_type', 'amount', 'quantity')
        }),
        ('Impact Metrics', {
            'fields': ('meals_saved', 'co2_reduction')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(ReviewAnalytics)
class ReviewAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['reviewer', 'reviewed_user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['reviewer__username', 'reviewed_user__username']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'criteria_type', 'criteria_value', 'total_earned']
    list_filter = ['criteria_type']
    search_fields = ['name', 'description']
    
    def total_earned(self, obj):
        count = UserBadge.objects.filter(badge=obj).count()
        return format_html(
            '<span style="font-weight: bold;">{}</span> users',
            count
        )
    total_earned.short_description = 'Total Earned'

class UserBadgeInline(admin.TabularInline):
    model = UserBadge
    extra = 0
    readonly_fields = ['earned_at']

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'earned_at']
    list_filter = ['badge', 'earned_at']
    search_fields = ['user__username', 'badge__name']
    readonly_fields = ['created_at', 'updated_at', 'earned_at']

@admin.register(SystemAnalytics)
class SystemAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'total_active_users', 'total_transactions', 
        'total_donations', 'total_sales_volume', 'total_meals_saved'
    ]
    list_filter = ['date']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Date', {
            'fields': ('date',)
        }),
        ('User Metrics', {
            'fields': ('total_active_users',)
        }),
        ('Transaction Metrics', {
            'fields': ('total_transactions', 'total_donations', 'total_sales_volume')
        }),
        ('Impact Metrics', {
            'fields': ('total_meals_saved', 'total_co2_reduced')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def changelist_view(self, request, extra_context=None):
        # Add summary statistics to the changelist
        response = super().changelist_view(request, extra_context=extra_context)
        
        try:
            qs = response.context_data['cl'].queryset
            summary = qs.aggregate(
                total_users=Sum('total_active_users'),
                total_transactions=Sum('total_transactions'),
                total_meals=Sum('total_meals_saved'),
                avg_daily_users=Avg('total_active_users')
            )
            
            response.context_data['summary'] = summary
        except (AttributeError, KeyError):
            pass
            
        return response

# Custom admin site configuration
admin.site.site_header = "Save n Bite Analytics Admin"
admin.site.site_title = "Analytics Admin"
admin.site.index_title = "Analytics Dashboard"