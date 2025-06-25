# scheduling/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone
from .models import (
    PickupLocation, FoodListingPickupSchedule, PickupTimeSlot,
    ScheduledPickup, PickupOptimization, PickupAnalytics
)


@admin.register(PickupLocation)
class PickupLocationAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'business', 'contact_person', 'contact_phone', 
        'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'created_at', 'business']
    search_fields = ['name', 'business__business_name', 'contact_person', 'address']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('business', 'name', 'address', 'instructions')
        }),
        ('Contact Information', {
            'fields': ('contact_person', 'contact_phone')
        }),
        ('Location Coordinates', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('business')


class PickupTimeSlotInline(admin.TabularInline):
    model = PickupTimeSlot
    extra = 0
    readonly_fields = ['id', 'current_bookings', 'is_available', 'created_at']
    fields = [
        'slot_number', 'start_time', 'end_time', 'date', 
        'max_orders_per_slot', 'current_bookings', 'is_available', 'is_active'
    ]
    
    def is_available(self, obj):
        if obj.pk:
            return obj.is_available
        return True
    is_available.boolean = True
    is_available.short_description = 'Available'


@admin.register(FoodListingPickupSchedule)
class FoodListingPickupScheduleAdmin(admin.ModelAdmin):
    list_display = [
        'food_listing_name', 'business_name', 'location', 'pickup_window',
        'total_slots', 'max_orders_per_slot', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'created_at', 'location__business', 'total_slots']
    search_fields = [
        'food_listing__name', 'location__business__business_name', 
        'location__name', 'pickup_window'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'start_time', 'end_time',
        'window_duration_minutes', 'slot_duration_minutes', 'generated_slots_preview'
    ]
    inlines = [PickupTimeSlotInline]
    
    fieldsets = (
        ('Food Listing & Location', {
            'fields': ('food_listing', 'location')
        }),
        ('Schedule Configuration', {
            'fields': (
                'pickup_window', 'total_slots', 'max_orders_per_slot', 
                'slot_buffer_minutes'
            )
        }),
        ('Calculated Information', {
            'fields': (
                'start_time', 'end_time', 'window_duration_minutes', 
                'slot_duration_minutes', 'generated_slots_preview'
            ),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def food_listing_name(self, obj):
        return obj.food_listing.name
    food_listing_name.short_description = 'Food Listing'
    food_listing_name.admin_order_field = 'food_listing__name'
    
    def business_name(self, obj):
        return obj.location.business.business_name
    business_name.short_description = 'Business'
    business_name.admin_order_field = 'location__business__business_name'
    
    def generated_slots_preview(self, obj):
        if obj.pk:
            slots = obj.generate_time_slots()
            if slots:
                html = "<ul>"
                for slot in slots[:5]:  # Show first 5 slots
                    html += f"<li>Slot {slot['slot_number']}: {slot['start_time']} - {slot['end_time']} (max {slot['max_orders']})</li>"
                if len(slots) > 5:
                    html += f"<li>... and {len(slots) - 5} more slots</li>"
                html += "</ul>"
                return mark_safe(html)
        return "Save to see generated slots"
    generated_slots_preview.short_description = 'Generated Slots Preview'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'food_listing', 'location', 'location__business'
        )


@admin.register(PickupTimeSlot)
class PickupTimeSlotAdmin(admin.ModelAdmin):
    list_display = [
        'food_listing_name', 'date', 'slot_number', 'start_time', 'end_time',
        'current_bookings', 'max_orders_per_slot', 'availability_status', 'is_active'
    ]
    list_filter = [
        'date', 'is_active', 'pickup_schedule__location__business',
        'pickup_schedule__food_listing__status'
    ]
    search_fields = [
        'pickup_schedule__food_listing__name',
        'pickup_schedule__location__business__business_name'
    ]
    readonly_fields = [
        'id', 'is_available', 'available_spots', 'created_at'
    ]
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Schedule Reference', {
            'fields': ('pickup_schedule',)
        }),
        ('Slot Information', {
            'fields': (
                'slot_number', 'date', 'start_time', 'end_time', 
                'max_orders_per_slot'
            )
        }),
        ('Booking Status', {
            'fields': (
                'current_bookings', 'is_available', 'available_spots'
            )
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )
    
    def food_listing_name(self, obj):
        return obj.pickup_schedule.food_listing.name
    food_listing_name.short_description = 'Food Listing'
    food_listing_name.admin_order_field = 'pickup_schedule__food_listing__name'
    
    def availability_status(self, obj):
        if obj.is_available:
            return format_html(
                '<span style="color: green;">✓ Available ({}/{})</span>',
                obj.available_spots,
                obj.max_orders_per_slot
            )
        else:
            return format_html(
                '<span style="color: red;">✗ Full ({}/{})</span>',
                obj.current_bookings,
                obj.max_orders_per_slot
            )
    availability_status.short_description = 'Availability'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'pickup_schedule__food_listing', 'pickup_schedule__location__business'
        )


@admin.register(ScheduledPickup)
class ScheduledPickupAdmin(admin.ModelAdmin):
    list_display = [
        'confirmation_code', 'food_listing_name', 'customer_name',
        'scheduled_date', 'scheduled_start_time', 'status_badge', 
        'location', 'created_at'
    ]
    list_filter = [
        'status', 'scheduled_date', 'location__business', 
        'food_listing__food_type', 'created_at'
    ]
    search_fields = [
        'confirmation_code', 'food_listing__name',
        'order__interaction__user__email',
        'order__interaction__user__customer_profile__full_name'
    ]
    readonly_fields = [
        'id', 'confirmation_code', 'qr_code_data', 'is_upcoming', 
        'is_today', 'created_at', 'updated_at', 'qr_code_display'
    ]
    date_hierarchy = 'scheduled_date'
    
    fieldsets = (
        ('Order & Food Listing', {
            'fields': ('order', 'food_listing', 'time_slot')
        }),
        ('Schedule Details', {
            'fields': (
                'location', 'scheduled_date', 'scheduled_start_time', 
                'scheduled_end_time', 'actual_pickup_time'
            )
        }),
        ('Status & Verification', {
            'fields': (
                'status', 'confirmation_code', 'qr_code_display', 
                'reminder_sent'
            )
        }),
        ('Notes', {
            'fields': ('customer_notes', 'business_notes'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('is_upcoming', 'is_today'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'qr_code_data', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_as_completed', 'mark_as_missed', 'send_reminder']
    
    def food_listing_name(self, obj):
        return obj.food_listing.name
    food_listing_name.short_description = 'Food Listing'
    food_listing_name.admin_order_field = 'food_listing__name'
    
    def customer_name(self, obj):
        user = obj.order.interaction.user
        if hasattr(user, 'customer_profile'):
            return user.customer_profile.full_name or user.email
        return user.email
    customer_name.short_description = 'Customer'
    
    def status_badge(self, obj):
        colors = {
            'scheduled': '#17a2b8',  # Blue
            'confirmed': '#28a745',  # Green
            'in_progress': '#ffc107',  # Yellow
            'completed': '#6f42c1',  # Purple
            'missed': '#dc3545',  # Red
            'cancelled': '#6c757d',  # Gray
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def qr_code_display(self, obj):
        if obj.qr_code_data:
            return format_html(
                '<details><summary>View QR Data</summary><pre>{}</pre></details>',
                str(obj.qr_code_data)
            )
        return "No QR code data"
    qr_code_display.short_description = 'QR Code Data'
    
    def mark_as_completed(self, request, queryset):
        count = 0
        for pickup in queryset:
            if pickup.status in ['scheduled', 'confirmed', 'in_progress']:
                pickup.status = 'completed'
                pickup.actual_pickup_time = timezone.now()
                pickup.save()
                count += 1
        
        self.message_user(
            request, 
            f"Successfully marked {count} pickup(s) as completed."
        )
    mark_as_completed.short_description = "Mark selected pickups as completed"
    
    def mark_as_missed(self, request, queryset):
        count = 0
        for pickup in queryset:
            if pickup.status in ['scheduled', 'confirmed']:
                pickup.status = 'missed'
                pickup.save()
                # Free up the time slot
                time_slot = pickup.time_slot
                time_slot.current_bookings = max(0, time_slot.current_bookings - 1)
                time_slot.save()
                count += 1
        
        self.message_user(
            request, 
            f"Successfully marked {count} pickup(s) as missed."
        )
    mark_as_missed.short_description = "Mark selected pickups as missed"
    
    def send_reminder(self, request, queryset):
        count = 0
        from .services import PickupSchedulingService
        
        for pickup in queryset:
            if pickup.status in ['scheduled', 'confirmed'] and pickup.is_upcoming:
                try:
                    PickupSchedulingService._send_pickup_reminder(pickup)
                    pickup.reminder_sent = True
                    pickup.save()
                    count += 1
                except Exception as e:
                    pass
        
        self.message_user(
            request, 
            f"Successfully sent reminders for {count} pickup(s)."
        )
    send_reminder.short_description = "Send reminders for selected pickups"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'food_listing', 'location', 'order__interaction__user__customer_profile',
            'time_slot__pickup_schedule'
        )


@admin.register(PickupOptimization)
class PickupOptimizationAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'max_concurrent_pickups', 'auto_optimize', 
        'auto_send_reminders', 'optimization_score', 'last_optimization'
    ]
    list_filter = ['auto_optimize', 'auto_send_reminders', 'last_optimization']
    search_fields = ['business__business_name']
    readonly_fields = ['last_optimization', 'optimization_score']
    
    fieldsets = (
        ('Business', {
            'fields': ('business',)
        }),
        ('Capacity Settings', {
            'fields': (
                'max_concurrent_pickups', 'optimal_pickup_duration',
                'peak_hours_start', 'peak_hours_end'
            )
        }),
        ('Automation Settings', {
            'fields': (
                'auto_optimize', 'auto_send_reminders', 'reminder_hours_before'
            )
        }),
        ('Analytics', {
            'fields': ('last_optimization', 'optimization_score'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('business')


@admin.register(PickupAnalytics)
class PickupAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'date', 'total_scheduled', 'total_completed', 
        'completion_rate_display', 'on_time_percentage', 'efficiency_score'
    ]
    list_filter = ['date', 'business']
    search_fields = ['business__business_name']
    readonly_fields = ['completion_rate', 'no_show_rate']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Business & Date', {
            'fields': ('business', 'date')
        }),
        ('Basic Metrics', {
            'fields': (
                'total_scheduled', 'total_completed', 'total_missed', 
                'total_cancelled'
            )
        }),
        ('Performance Metrics', {
            'fields': (
                'on_time_percentage', 'average_pickup_duration',
                'customer_satisfaction_rating'
            )
        }),
        ('Efficiency Metrics', {
            'fields': (
                'slot_utilization_rate', 'peak_hour_efficiency', 
                'efficiency_score'
            )
        }),
        ('Calculated Rates', {
            'fields': ('completion_rate', 'no_show_rate'),
            'classes': ('collapse',)
        })
    )
    
    def completion_rate_display(self, obj):
        if obj.total_scheduled > 0:
            rate = (obj.total_completed / obj.total_scheduled) * 100
            color = 'green' if rate >= 80 else 'orange' if rate >= 60 else 'red'
            return format_html(
                '<span style="color: {};">{:.1f}%</span>',
                color, rate
            )
        return '0%'
    completion_rate_display.short_description = 'Completion Rate'
    
    def completion_rate(self, obj):
        if obj.total_scheduled > 0:
            return round((obj.total_completed / obj.total_scheduled) * 100, 2)
        return 0.0
    
    def no_show_rate(self, obj):
        if obj.total_scheduled > 0:
            return round((obj.total_missed / obj.total_scheduled) * 100, 2)
        return 0.0
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('business')


# Customize admin site header
admin.site.site_header = "Save n Bite - Pickup Scheduling Admin"
admin.site.site_title = "Pickup Scheduling"
admin.site.index_title = "Pickup Scheduling Administration"