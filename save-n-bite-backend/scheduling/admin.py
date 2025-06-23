# scheduling/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    PickupLocation, PickupTimeSlot, ScheduledPickup, 
    PickupOptimization, PickupAnalytics
)

@admin.register(PickupLocation)
class PickupLocationAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'business_name', 'contact_person', 'contact_phone', 
        'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'created_at', 'business__status']
    search_fields = [
        'name', 'business__business_name', 'contact_person', 
        'contact_phone', 'address'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'business', 'name', 'address')
        }),
        ('Contact Details', {
            'fields': ('contact_person', 'contact_phone', 'instructions')
        }),
        ('Location Data', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def business_name(self, obj):
        return obj.business.business_name
    business_name.short_description = 'Business'
    business_name.admin_order_field = 'business__business_name'

@admin.register(PickupTimeSlot)
class PickupTimeSlotAdmin(admin.ModelAdmin):
    list_display = [
        'business_name', 'location_name', 'day_name', 'time_range',
        'max_orders_per_slot', 'is_active'
    ]
    list_filter = [
        'day_of_week', 'is_active', 'business__status', 'created_at'
    ]
    search_fields = [
        'business__business_name', 'location__name'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'business', 'location')
        }),
        ('Schedule Details', {
            'fields': (
                'day_of_week', 'start_time', 'end_time', 
                'slot_duration', 'max_orders_per_slot'
            )
        }),
        ('Booking Settings', {
            'fields': ('buffer_time', 'advance_booking_hours')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def business_name(self, obj):
        return obj.business.business_name
    business_name.short_description = 'Business'
    business_name.admin_order_field = 'business__business_name'

    def location_name(self, obj):
        return obj.location.name
    location_name.short_description = 'Location'
    location_name.admin_order_field = 'location__name'

    def day_name(self, obj):
        return obj.get_day_of_week_display()
    day_name.short_description = 'Day'
    day_name.admin_order_field = 'day_of_week'

    def time_range(self, obj):
        return f"{obj.start_time} - {obj.end_time}"
    time_range.short_description = 'Time Range'

@admin.register(ScheduledPickup)
class ScheduledPickupAdmin(admin.ModelAdmin):
    list_display = [
        'confirmation_code', 'business_name', 'customer_name', 
        'scheduled_date', 'scheduled_time', 'status_badge', 
        'actual_pickup_time', 'created_at'
    ]
    list_filter = [
        'status', 'scheduled_date', 'reminder_sent', 
        'confirmation_sent', 'created_at'
    ]
    search_fields = [
        'confirmation_code', 'order__interaction__user__email',
        'location__business__business_name', 'location__name'
    ]
    readonly_fields = [
        'id', 'confirmation_code', 'qr_code_data', 'qr_code_display',
        'created_at', 'updated_at'
    ]
    date_hierarchy = 'scheduled_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'order', 'time_slot', 'location')
        }),
        ('Schedule Details', {
            'fields': (
                'scheduled_date', 'scheduled_start_time', 
                'scheduled_end_time', 'actual_pickup_time'
            )
        }),
        ('Verification', {
            'fields': ('confirmation_code', 'qr_code_data', 'qr_code_display')
        }),
        ('Status & Notes', {
            'fields': ('status', 'pickup_notes')
        }),
        ('Notifications', {
            'fields': ('reminder_sent', 'confirmation_sent')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def business_name(self, obj):
        return obj.location.business.business_name
    business_name.short_description = 'Business'
    business_name.admin_order_field = 'location__business__business_name'

    def customer_name(self, obj):
        user = obj.order.interaction.user
        if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
            return user.customer_profile.full_name
        elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
            return user.ngo_profile.organisation_name
        return user.email
    customer_name.short_description = 'Customer'

    def scheduled_time(self, obj):
        return obj.scheduled_start_time
    scheduled_time.short_description = 'Time'
    scheduled_time.admin_order_field = 'scheduled_start_time'

    def status_badge(self, obj):
        colors = {
            'scheduled': 'blue',
            'confirmed': 'green',
            'in_progress': 'orange',
            'completed': 'darkgreen',
            'missed': 'red',
            'cancelled': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def qr_code_display(self, obj):
        if obj.qr_code_data:
            return format_html(
                '<details><summary>View QR Data</summary><pre>{}</pre></details>',
                obj.qr_code_data
            )
        return 'No QR data'
    qr_code_display.short_description = 'QR Code Data'

    actions = ['mark_as_completed', 'mark_as_missed', 'send_reminders']

    def mark_as_completed(self, request, queryset):
        count = 0
        for pickup in queryset.filter(status__in=['scheduled', 'confirmed']):
            pickup.status = 'completed'
            pickup.actual_pickup_time = timezone.now()
            pickup.save()
            count += 1
        
        self.message_user(
            request, 
            f'{count} pickup(s) marked as completed.'
        )
    mark_as_completed.short_description = 'Mark selected pickups as completed'

    def mark_as_missed(self, request, queryset):
        count = 0
        for pickup in queryset.filter(status__in=['scheduled', 'confirmed']):
            pickup.status = 'missed'
            pickup.save()
            count += 1
        
        self.message_user(
            request, 
            f'{count} pickup(s) marked as missed.'
        )
    mark_as_missed.short_description = 'Mark selected pickups as missed'

    def send_reminders(self, request, queryset):
        count = 0
        for pickup in queryset.filter(
            status='scheduled', 
            reminder_sent=False,
            scheduled_date=timezone.now().date()
        ):
            try:
                from .services import PickupSchedulingService
                PickupSchedulingService._send_pickup_reminder(pickup)
                pickup.reminder_sent = True
                pickup.save()
                count += 1
            except Exception:
                pass
        
        self.message_user(
            request, 
            f'{count} reminder(s) sent.'
        )
    send_reminders.short_description = 'Send reminders for selected pickups'

@admin.register(PickupOptimization)
class PickupOptimizationAdmin(admin.ModelAdmin):
    list_display = [
        'business_name', 'max_concurrent_pickups', 'efficiency_score',
        'auto_optimize', 'last_optimization', 'created_at'
    ]
    list_filter = ['auto_optimize', 'last_optimization', 'created_at']
    search_fields = ['business__business_name']
    readonly_fields = [
        'id', 'average_pickup_duration', 'peak_day_demand', 
        'efficiency_score', 'last_optimization', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Business', {
            'fields': ('id', 'business')
        }),
        ('Optimization Settings', {
            'fields': (
                'max_concurrent_pickups', 'optimal_pickup_duration',
                'peak_hours_start', 'peak_hours_end'
            )
        }),
        ('Performance Data', {
            'fields': (
                'average_pickup_duration', 'peak_day_demand', 
                'efficiency_score'
            ),
            'classes': ('collapse',)
        }),
        ('Auto-Optimization', {
            'fields': ('auto_optimize', 'last_optimization')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def business_name(self, obj):
        return obj.business.business_name
    business_name.short_description = 'Business'
    business_name.admin_order_field = 'business__business_name'

@admin.register(PickupAnalytics)
class PickupAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'business_name', 'date', 'total_scheduled', 'total_completed',
        'completion_rate_display', 'on_time_percentage', 'efficiency_score'
    ]
    list_filter = ['date', 'created_at']
    search_fields = ['business__business_name']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'business', 'date')
        }),
        ('Pickup Counts', {
            'fields': (
                'total_scheduled', 'total_completed', 
                'total_missed', 'total_cancelled'
            )
        }),
        ('Performance Metrics', {
            'fields': (
                'average_pickup_duration', 'on_time_percentage', 
                'customer_satisfaction_score', 'efficiency_score'
            )
        }),
        ('Operational Insights', {
            'fields': ('peak_hour', 'busiest_location'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def business_name(self, obj):
        return obj.business.business_name
    business_name.short_description = 'Business'
    business_name.admin_order_field = 'business__business_name'

    def completion_rate_display(self, obj):
        if obj.total_scheduled == 0:
            return '0%'
        rate = (obj.total_completed / obj.total_scheduled) * 100
        color = 'green' if rate >= 80 else 'orange' if rate >= 60 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color, rate
        )
    completion_rate_display.short_description = 'Completion Rate'

# Custom admin site configuration
admin.site.site_header = 'Save n Bite Pickup Management'
admin.site.site_title = 'Pickup Admin'
admin.site.index_title = 'Pickup & Scheduling Administration'