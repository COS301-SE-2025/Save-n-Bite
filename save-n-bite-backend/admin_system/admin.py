from django.contrib import admin
from .models import SystemLogEntry, AdminActionLog, SystemAnnouncement

@admin.register(SystemLogEntry)
class SystemLogEntryAdmin(admin.ModelAdmin):
    list_display = ['title', 'severity', 'category', 'status', 'timestamp']
    list_filter = ['severity', 'category', 'status', 'timestamp']
    search_fields = ['title', 'description', 'category']
    readonly_fields = ['id', 'timestamp']
    ordering = ['-timestamp']

@admin.register(AdminActionLog)
class AdminActionLogAdmin(admin.ModelAdmin):
    list_display = ['admin_user', 'action_type', 'target_type', 'timestamp']
    list_filter = ['action_type', 'target_type', 'timestamp']
    search_fields = ['action_description', 'admin_user__username']
    readonly_fields = ['id', 'timestamp']
    ordering = ['-timestamp']

@admin.register(SystemAnnouncement)
class SystemAnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'priority', 'is_active', 'created_at']
    list_filter = ['priority', 'is_active', 'created_at']
    search_fields = ['title', 'message']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']