# scheduling/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone
from .models import PickupLocation, ScheduledPickup, PickupAnalytics

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


@admin.register(ScheduledPickup)
class ScheduledPickupAdmin(admin.ModelAdmin):
    list_display = [
        'confirmation_code', 'food_listing_name', 'customer_name',
        'pickup_date', 'status_badge', 'location', 'ready_status',
        'deadline_status', 'created_at'
    ]
    list_filter = [
        'status', 'pickup_date', 'location__business', 
        'ready_notification_sent', 'reminder_sent', 'created_at'
    ]
    search_fields = [
        'confirmation_code', 'order__interaction__user__email',
        'order__interaction__user__customer_profile__full_name',
        'location__business__business_name'
    ]
    readonly_fields = [
        'id', 'confirmation_code', 'qr_code_data', 'is_upcoming', 
        'is_today', 'is_overdue', 'food_listing_display', 'customer_info',
        'created_at', 'updated_at', 'qr_code_display'
    ]
    date_hierarchy = 'pickup_date'
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order', 'food_listing_display', 'customer_info')
        }),
        ('Pickup Details', {
            'fields': (
                'location', 'pickup_date', 'estimated_ready_time', 
                'pickup_deadline', 'actual_ready_time', 'actual_pickup_time'
            )
        }),
        ('Status & Verification', {
            'fields': (
                'status', 'confirmation_code', 'qr_code_display'
            )
        }),
        ('Communication Tracking', {
            'fields': (
                'ready_notification_sent', 'ready_notification_sent_at',
                'reminder_sent', 'reminder_sent_at'
            ),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('customer_notes', 'business_notes'),
            'classes': ('collapse',)
        }),
        ('Status Checks', {
            'fields': ('is_upcoming', 'is_today', 'is_overdue'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'qr_code_data', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_as_ready', 'mark_as_completed', 'mark_as_missed', 'send_reminder']
    
    def food_listing_name(self, obj):
        """Get food listing name"""
        food_listing = obj.food_listing
        if food_listing:
            return food_listing.name
        return 'Unknown'
    food_listing_name.short_description = 'Food Listing'
    
    def customer_name(self, obj):
        """Get customer name"""
        from .services import PickupNotificationService
        return PickupNotificationService._get_customer_name(obj.order.interaction.user)
    customer_name.short_description = 'Customer'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'pending': '#ffc107',  # Yellow
            'ready': '#17a2b8',    # Blue
            'completed': '#28a745', # Green
            'missed': '#dc3545',    # Red
            'cancelled': '#6c757d', # Gray
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def ready_status(self, obj):
        """Show ready notification status"""
        if obj.ready_notification_sent:
            return format_html(
                '<span style="color: green;">✓ Sent</span>'
            )
        elif obj.status == 'ready':
            return format_html(
                '<span style="color: orange;">⚠ Ready but not notified</span>'
            )
        else:
            return format_html(
                '<span style="color: gray;">Not ready</span>'
            )
    ready_status.short_description = 'Ready Notification'
    
    def deadline_status(self, obj):
        """Show deadline status"""
        now = timezone.now()
        deadline = obj.pickup_deadline
        
        if obj.status in ['completed', 'cancelled']:
            return format_html('<span style="color: gray;">-</span>')
        
        if deadline < now:
            return format_html(
                '<span style="color: red;">⚠ Overdue</span>'
            )
        
        time_left = deadline - now
        hours_left = int(time_left.total_seconds() // 3600)
        
        if hours_left < 2:
            color = 'orange'
            icon = '⚠'
        else:
            color = 'green'
            icon = '✓'
            
        return format_html(
            '<span style="color: {};">{} {}h left</span>',
            color, icon, hours_left
        )
    deadline_status.short_description = 'Deadline'
    
    def food_listing_display(self, obj):
        """Display food listing info"""
        food_listing = obj.food_listing
        if food_listing:
            return format_html(
                '<strong>{}</strong><br>Quantity: {}<br>Expires: {}',
                food_listing.name,
                sum(item.quantity for item in obj.order.interaction.items.all()),
                food_listing.expiry_date
            )
        return "Unknown food listing"
    food_listing_display.short_description = 'Food Listing Details'
    
    def customer_info(self, obj):
        """Display customer info"""
        user = obj.order.interaction.user
        from .services import PickupNotificationService
        name = PickupNotificationService._get_customer_name(user)
        
        return format_html(
            '<strong>{}</strong><br>Email: {}<br>Type: {}',
            name,
            user.email,
            user.user_type.title()
        )
    customer_info.short_description = 'Customer Details'
    
    def qr_code_display(self, obj):
        """Display QR code data"""
        if obj.qr_code_data:
            return format_html(
                '<details><summary>View QR Data</summary><pre>{}</pre></details>',
                str(obj.qr_code_data)
            )
        return "No QR code data"
    qr_code_display.short_description = 'QR Code Data'
    
    # Admin actions
    def mark_as_ready(self, request, queryset):
        """Mark selected orders as ready for pickup"""
        count = 0
        for pickup in queryset:
            if pickup.status == 'pending':
                try:
                    pickup.mark_ready_for_pickup()
                    count += 1
                except Exception as e:
                    self.message_user(
                        request, 
                        f"Failed to mark pickup {pickup.confirmation_code} as ready: {str(e)}",
                        level='ERROR'
                    )
        
        if count > 0:
            self.message_user(
                request, 
                f"Successfully marked {count} pickup(s) as ready and sent notifications."
            )
    mark_as_ready.short_description = "Mark selected pickups as ready"
    
    def mark_as_completed(self, request, queryset):
        """Mark selected pickups as completed"""
        count = 0
        for pickup in queryset:
            if pickup.status == 'ready':
                try:
                    from .services import PickupSchedulingService
                    PickupSchedulingService.complete_pickup(pickup)
                    count += 1
                except Exception as e:
                    self.message_user(
                        request, 
                        f"Failed to complete pickup {pickup.confirmation_code}: {str(e)}",
                        level='ERROR'
                    )
        
        if count > 0:
            self.message_user(
                request, 
                f"Successfully completed {count} pickup(s)."
            )
    mark_as_completed.short_description = "Mark selected pickups as completed"
    
    def mark_as_missed(self, request, queryset):
        """Mark selected pickups as missed"""
        count = 0
        for pickup in queryset:
            if pickup.status in ['ready']:
                pickup.status = 'missed'
                pickup.save()
                
                # Update order status
                pickup.order.status = 'missed'
                pickup.order.save()
                
                count += 1
        
        if count > 0:
            self.message_user(
                request, 
                f"Successfully marked {count} pickup(s) as missed."
            )
    mark_as_missed.short_description = "Mark selected pickups as missed"
    
    def send_reminder(self, request, queryset):
        """Send reminders for selected pickups"""
        count = 0
        from .services import PickupNotificationService
        
        for pickup in queryset:
            if pickup.status == 'ready' and pickup.is_upcoming and not pickup.reminder_sent:
                try:
                    PickupNotificationService.send_pickup_reminder(pickup)
                    count += 1
                except Exception as e:
                    self.message_user(
                        request, 
                        f"Failed to send reminder for pickup {pickup.confirmation_code}: {str(e)}",
                        level='ERROR'
                    )
        
        if count > 0:
            self.message_user(
                request, 
                f"Successfully sent reminders for {count} pickup(s)."
            )
    send_reminder.short_description = "Send reminders for selected pickups"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'location', 'order', 'order__interaction', 'order__interaction__user'
        )


@admin.register(PickupAnalytics)
class PickupAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'date', 'total_orders', 'orders_completed', 
        'completion_rate_display', 'on_time_pickup_percentage', 'average_prep_time_display'
    ]
    list_filter = ['date', 'business']
    search_fields = ['business__business_name']
    readonly_fields = ['completion_rate', 'missed_rate']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Business & Date', {
            'fields': ('business', 'date')
        }),
        ('Order Metrics', {
            'fields': (
                'total_orders', 'orders_completed', 'orders_missed', 
                'orders_cancelled'
            )
        }),
        ('Performance Metrics', {
            'fields': (
                'on_time_pickup_percentage', 'average_preparation_time',
                'customer_satisfaction_rating'
            )
        }),
        ('Calculated Rates', {
            'fields': ('completion_rate', 'missed_rate'),
            'classes': ('collapse',)
        })
    )
    
    def completion_rate_display(self, obj):
        """Display completion rate with color coding"""
        if obj.total_orders > 0:
            rate = (obj.orders_completed / obj.total_orders) * 100
            color = 'green' if rate >= 80 else 'orange' if rate >= 60 else 'red'
            return format_html(
                '<span style="color: {};">{:.1f}%</span>',
                color, rate
            )
        return '0%'
    completion_rate_display.short_description = 'Completion Rate'
    
    def average_prep_time_display(self, obj):
        """Display average preparation time"""
        if obj.average_preparation_time:
            total_seconds = obj.average_preparation_time.total_seconds()
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)
            
            if hours > 0:
                return f"{hours}h {minutes}m"
            else:
                return f"{minutes}m"
        return "No data"
    average_prep_time_display.short_description = 'Avg Prep Time'
    
    def completion_rate(self, obj):
        """Calculate completion rate"""
        if obj.total_orders > 0:
            return round((obj.orders_completed / obj.total_orders) * 100, 2)
        return 0.0
    
    def missed_rate(self, obj):
        """Calculate missed rate"""
        if obj.total_orders > 0:
            return round((obj.orders_missed / obj.total_orders) * 100, 2)
        return 0.0
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('business')


# Customize admin site header
admin.site.site_header = "Save n Bite - Simplified Pickup Scheduling Admin"
admin.site.site_title = "Pickup Scheduling"
admin.site.index_title = "Simplified Pickup Scheduling Administration"