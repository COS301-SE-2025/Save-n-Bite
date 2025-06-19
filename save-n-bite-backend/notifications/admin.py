# notifications/admin.py

from django.contrib import admin
from .models import Notification, NotificationPreferences, BusinessFollower, EmailNotificationLog

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'recipient', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'is_deleted', 'created_at']
    search_fields = ['title', 'recipient__email', 'sender__email']
    readonly_fields = ['id', 'created_at', 'read_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'recipient', 'sender', 'business')
        }),
        ('Content', {
            'fields': ('notification_type', 'title', 'message', 'data')
        }),
        ('Status', {
            'fields': ('is_read', 'is_deleted', 'created_at', 'read_at')
        }),
    )

@admin.register(NotificationPreferences)
class NotificationPreferencesAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_notifications', 'new_listing_notifications', 'promotional_notifications', 'weekly_digest']
    list_filter = ['email_notifications', 'new_listing_notifications', 'promotional_notifications', 'weekly_digest']
    search_fields = ['user__email']
    
@admin.register(BusinessFollower)
class BusinessFollowerAdmin(admin.ModelAdmin):
    list_display = ['user', 'business', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'business__business_name']
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('user', 'business')

@admin.register(EmailNotificationLog)
class EmailNotificationLogAdmin(admin.ModelAdmin):
    list_display = ['recipient_email', 'subject', 'status', 'sent_at', 'created_at']
    list_filter = ['status', 'template_name', 'sent_at', 'created_at']
    search_fields = ['recipient_email', 'subject']
    readonly_fields = ['id', 'created_at', 'sent_at']
    
    fieldsets = (
        ('Recipient Info', {
            'fields': ('recipient_email', 'recipient_user')
        }),
        ('Email Details', {
            'fields': ('subject', 'template_name', 'notification')
        }),
        ('Status', {
            'fields': ('status', 'error_message', 'sent_at', 'created_at')
        }),
    )
