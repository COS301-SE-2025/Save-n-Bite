# admin_panel/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from authentication.models import NGOProfile, FoodProviderProfile
from .models import AdminActionLog, SystemAnnouncement, SystemLogEntry, DocumentAccessLog

User = get_user_model()

class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    users = serializers.DictField()
    verifications = serializers.DictField()
    listings = serializers.DictField()
    transactions = serializers.DictField()
    system_health = serializers.DictField()

class RecentActivitySerializer(serializers.Serializer):
    """Serializer for recent activity items"""
    type = serializers.CharField()
    description = serializers.CharField()
    timestamp = serializers.DateTimeField()
    icon = serializers.CharField()

class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list in admin panel"""
    profile_info = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['UserID', 'username', 'email', 'user_type', 'is_active', 'created_at', 'profile_info', 'status']
    
    def get_profile_info(self, obj):
        """Get profile-specific information based on user type"""
        if obj.user_type == 'ngo' and hasattr(obj, 'ngo_profile'):
            return {
                'name': obj.ngo_profile.organisation_name,
                'contact': obj.ngo_profile.organisation_contact,
                'verification_status': obj.ngo_profile.status
            }
        elif obj.user_type == 'provider' and hasattr(obj, 'provider_profile'):
            return {
                'name': obj.provider_profile.business_name,
                'contact': obj.provider_profile.business_contact,
                'verification_status': obj.provider_profile.status
            }
        elif obj.user_type == 'customer' and hasattr(obj, 'customer_profile'):
            return {
                'name': obj.customer_profile.full_name,
                'contact': obj.phone_number,
                'verification_status': 'verified'  # Customers are auto-verified
            }
        return {}
    
    def get_status(self, obj):
        """Get user status"""
        return 'active' if obj.is_active else 'inactive'

class VerificationRequestSerializer(serializers.Serializer):
    """Serializer for verification request data"""
    id = serializers.UUIDField()
    type = serializers.CharField()
    name = serializers.CharField()
    email = serializers.EmailField()
    contact = serializers.CharField()
    address = serializers.CharField(required=False)
    representative = serializers.CharField(required=False)
    created_at = serializers.DateTimeField()
    documents = serializers.DictField()

class VerificationUpdateSerializer(serializers.Serializer):
    profile_type = serializers.ChoiceField(choices=['ngo', 'provider'])
    profile_id = serializers.CharField() 
    new_status = serializers.ChoiceField(choices=['verified', 'rejected'])
    reason = serializers.CharField(required=False, allow_blank=True)

class PasswordResetSerializer(serializers.Serializer):
    """Serializer for admin password reset"""
    user_id = serializers.UUIDField()
    reason = serializers.CharField(required=False, allow_blank=True)

class UserToggleSerializer(serializers.Serializer):
    """Serializer for activating/deactivating users"""
    user_id = serializers.UUIDField()
    reason = serializers.CharField(required=False, allow_blank=True)

class AdminActionLogSerializer(serializers.ModelSerializer):
    """Serializer for admin action logs"""
    admin_name = serializers.CharField(source='admin_user.username', read_only=True)
    admin_email = serializers.CharField(source='admin_user.email', read_only=True)
    
    class Meta:
        model = AdminActionLog
        fields = [
            'id', 'admin_name', 'admin_email', 'action_type', 'target_type', 
            'target_id', 'action_description', 'metadata', 'timestamp', 'ip_address'
        ]

class SystemAnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for system announcements"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = SystemAnnouncement
        fields = [
            'id', 'title', 'message', 'priority', 'target_user_types', 'is_active',
            'created_by_name', 'created_at', 'expires_at'
        ]

class CreateAnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for creating system announcements"""
    
    class Meta:
        model = SystemAnnouncement
        fields = ['title', 'message', 'priority', 'target_user_types', 'expires_at']
    
    def validate_target_user_types(self, value):
        """Validate target user types"""
        valid_types = ['customer', 'provider', 'ngo']
        for user_type in value:
            if user_type not in valid_types:
                raise serializers.ValidationError(f"Invalid user type: {user_type}")
        return value

class SystemLogSerializer(serializers.ModelSerializer):
    """Serializer for system logs"""
    resolved_by_name = serializers.CharField(source='resolved_by.username', read_only=True)
    
    class Meta:
        model = SystemLogEntry
        fields = [
            'id', 'severity', 'category', 'title', 'description', 'error_details',
            'status', 'resolved_by_name', 'resolution_notes', 'timestamp', 'resolved_at'
        ]

class ResolveSystemLogSerializer(serializers.Serializer):
    """Serializer for resolving system logs"""
    log_id = serializers.UUIDField()
    resolution_notes = serializers.CharField(required=False, allow_blank=True)

class DocumentAccessSerializer(serializers.ModelSerializer):
    """Serializer for document access logs"""
    admin_name = serializers.CharField(source='admin_user.username', read_only=True)
    
    class Meta:
        model = DocumentAccessLog
        fields = [
            'id', 'admin_name', 'document_type', 'profile_type', 'profile_id',
            'document_name', 'access_timestamp', 'ip_address'
        ]

class ListingModerationSerializer(serializers.Serializer):
    """Serializer for listing moderation actions"""
    listing_id = serializers.UUIDField()
    action = serializers.ChoiceField(choices=['remove', 'restore', 'flag'])
    reason = serializers.CharField(required=False, allow_blank=True)

class ListingModerationActionSerializer(serializers.Serializer):
    """Serializer for listing moderation actions - COPIED from working review moderation"""
    
    ACTION_CHOICES = [
        ('flag', 'Flag'),
        ('remove', 'Remove'),
        ('restore', 'Restore'),
    ]
    
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    reason = serializers.CharField(max_length=500)
    moderation_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)

class SimpleAnalyticsSerializer(serializers.Serializer):
    """Serializer for simple analytics data"""
    total_users = serializers.IntegerField()
    new_users_week = serializers.IntegerField()
    new_users_month = serializers.IntegerField()
    user_growth_percentage = serializers.FloatField()
    
    total_listings = serializers.IntegerField()
    active_listings = serializers.IntegerField()
    new_listings_week = serializers.IntegerField()
    listing_growth_percentage = serializers.FloatField()
    
    total_transactions = serializers.IntegerField()
    completed_transactions = serializers.IntegerField()
    transaction_success_rate = serializers.FloatField()
    
    user_distribution = serializers.DictField()  # {customer: 60%, provider: 30%, ngo: 10%}
    top_providers = serializers.ListField()

class DataExportSerializer(serializers.Serializer):
    """Serializer for data export requests"""
    export_type = serializers.ChoiceField(choices=[
        'users',           # Keep - essential for user management
        'analytics',       # Keep - dashboard data
        'audit_logs',      # ADD - important for compliance/security
        'system_logs',     # ADD - important for troubleshooting
        'transactions',    # Keep if you have interaction/payment data
        'listings',        # Keep - food listing data
    ])
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    format = serializers.ChoiceField(choices=['csv', 'excel'], default='csv')
    filters = serializers.DictField(required=False)

class CustomNotificationSerializer(serializers.Serializer):
    """Serializer for creating custom admin notifications"""
    
    subject = serializers.CharField(
        max_length=255,
        help_text="Email subject line and notification title"
    )
    
    body = serializers.CharField(
        max_length=2000,
        help_text="Main message content for both email and in-app notification"
    )
    
    target_audience = serializers.ChoiceField(
        choices=[
            ('all', 'All Users'),
            ('customers', 'Customers Only'),
            ('businesses', 'Businesses Only'),
            ('organisations', 'Organisations Only')
        ],
        help_text="Target audience for the notification"
    )
    
    # REMOVED: scheduling fields
    
    def validate_subject(self, value):
        """Validate subject line"""
        if not value.strip():
            raise serializers.ValidationError("Subject cannot be empty")
        return value.strip()
    
    def validate_body(self, value):
        """Validate body content"""
        if not value.strip():
            raise serializers.ValidationError("Message body cannot be empty")
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message body must be at least 10 characters long")
        return value.strip()

class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification delivery statistics"""
    
    total_users = serializers.IntegerField()
    notifications_sent = serializers.IntegerField()
    emails_sent = serializers.IntegerField()
    emails_failed = serializers.IntegerField()
    target_audience = serializers.CharField()

class NotificationAnalyticsSerializer(serializers.Serializer):
    """Serializer for notification analytics data"""
    
    total_notifications = serializers.IntegerField()
    read_notifications = serializers.IntegerField()
    total_emails = serializers.IntegerField()
    successful_emails = serializers.IntegerField()
    failed_emails = serializers.IntegerField()
    read_rate = serializers.SerializerMethodField()
    email_success_rate = serializers.SerializerMethodField()
    
    def get_read_rate(self, obj):
        """Calculate notification read rate percentage"""
        if obj['total_notifications'] > 0:
            return round((obj['read_notifications'] / obj['total_notifications']) * 100, 2)
        return 0.0
    
    def get_email_success_rate(self, obj):
        """Calculate email delivery success rate percentage"""
        if obj['total_emails'] > 0:
            return round((obj['successful_emails'] / obj['total_emails']) * 100, 2)
        return 0.0