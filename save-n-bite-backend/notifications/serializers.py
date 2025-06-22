# notifications/serializers.py - Fixed to handle UserID correctly

from rest_framework import serializers
from .models import Notification, NotificationPreferences, BusinessFollower, EmailNotificationLog
from authentication.models import FoodProviderProfile
from django.contrib.auth import get_user_model

User = get_user_model()

class NotificationPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreferences
        fields = [
            'email_notifications', 
            'new_listing_notifications', 
            'promotional_notifications', 
            'weekly_digest'
        ]

class BusinessFollowerSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.business_name', read_only=True)
    business_logo = serializers.SerializerMethodField()
    business_id = serializers.SerializerMethodField()  # Fix: Use UserID

    class Meta:
        model = BusinessFollower
        fields = ['id', 'business_id', 'business_name', 'business_logo', 'created_at']

    def get_business_logo(self, obj):
        if obj.business.logo:
            return obj.business.logo.url
        return None
    
    def get_business_id(self, obj):
        # Fix: Return UserID instead of id
        return str(obj.business.user.UserID)

class FollowBusinessSerializer(serializers.Serializer):
    business_id = serializers.UUIDField()

    def validate_business_id(self, value):
        try:
            # Fix: Use UserID instead of id
            business_user = User.objects.get(UserID=value, user_type='provider')
            if not hasattr(business_user, 'provider_profile'):
                raise serializers.ValidationError("Business profile not found")
            if business_user.provider_profile.status != 'verified':
                raise serializers.ValidationError("Business is not verified")
        except User.DoesNotExist:
            raise serializers.ValidationError("Business not found")
        return value

class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    business_name = serializers.CharField(source='business.business_name', read_only=True)
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'data',
            'is_read', 'created_at', 'read_at', 'sender_name', 
            'business_name', 'time_ago'
        ]

    def get_sender_name(self, obj):
        if obj.sender:
            if obj.sender.user_type == 'provider' and hasattr(obj.sender, 'provider_profile'):
                return obj.sender.provider_profile.business_name
            elif obj.sender.user_type == 'customer' and hasattr(obj.sender, 'customer_profile'):
                return obj.sender.customer_profile.full_name
            elif obj.sender.user_type == 'ngo' and hasattr(obj.sender, 'ngo_profile'):
                return obj.sender.ngo_profile.organisation_name
        return "System"

    def get_time_ago(self, obj):
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"

class MarkNotificationReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )

class EmailNotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailNotificationLog
        fields = ['id', 'recipient_email', 'subject', 'status', 'sent_at', 'created_at', 'error_message']