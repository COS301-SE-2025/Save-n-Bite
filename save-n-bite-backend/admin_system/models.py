# admin_panel/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
import uuid

User = get_user_model()

class AdminActionLog(models.Model):
    """Track all admin actions for audit purposes"""
    ACTION_CHOICES = [
        ('user_verification', 'User Verification'),
        ('user_management', 'User Management'),
        ('listing_moderation', 'Listing Moderation'),
        ('system_announcement', 'System Announcement'),
        ('password_reset', 'Password Reset'),
        ('data_export', 'Data Export'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_actions')
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=50)  # 'user', 'ngo_profile', 'provider_profile', 'listing', etc.
    target_id = models.CharField(max_length=100)   # ID of the target object
    action_description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)  # Store additional context
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['admin_user', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['target_type', 'target_id']),
        ]

    def __str__(self):
        return f"{self.admin_user.username} - {self.action_type} - {self.timestamp}"

class SystemAnnouncement(models.Model):
    """System-wide announcements from admins"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    target_user_types = ArrayField(
        models.CharField(max_length=20),
        default=list,
        help_text="User types to target: customer, provider, ngo"
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'created_at']),
            models.Index(fields=['priority', 'created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.priority}"

class SystemLogEntry(models.Model):
    """System-wide error and event logging"""
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('ignored', 'Ignored'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    category = models.CharField(max_length=50)  # 'authentication', 'database', 'payment', etc.
    title = models.CharField(max_length=200)
    description = models.TextField()
    error_details = models.JSONField(default=dict, blank=True)  # Stack trace, error codes, etc.
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_logs')
    resolution_notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['severity', 'timestamp']),
            models.Index(fields=['status', 'timestamp']),
            models.Index(fields=['category', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.severity.upper()}: {self.title}"

class DocumentAccessLog(models.Model):
    """Track access to verification documents for security"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_accesses')
    document_type = models.CharField(max_length=50)  # 'npo_document', 'cipc_document'
    profile_type = models.CharField(max_length=20)   # 'ngo', 'provider'
    profile_id = models.CharField(max_length=100)    # ID of the profile
    document_name = models.CharField(max_length=255)
    access_timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-access_timestamp']
        indexes = [
            models.Index(fields=['admin_user', 'access_timestamp']),
            models.Index(fields=['profile_type', 'profile_id']),
        ]

    def __str__(self):
        return f"{self.admin_user.username} accessed {self.document_name}"

class PasswordReset(models.Model):
    """Track admin-initiated password resets"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_password_resets')
    reset_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='initiated_resets')
    temporary_password_hash = models.CharField(max_length=128)  # Store hash of temp password
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    is_expired = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_user', 'created_at']),
            models.Index(fields=['expires_at', 'is_expired']),
        ]

    def __str__(self):
        return f"Password reset for {self.target_user.username} by {self.reset_by.username}"