# notifications/models.py

from django.db import models
from django.contrib.auth import get_user_model
from authentication.models import FoodProviderProfile
import uuid

User = get_user_model()

class NotificationPreferences(models.Model):
    """User preferences for notifications"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='notification_preferences',
        # Remove the to_field parameter - let Django handle the FK correctly
    )
    email_notifications = models.BooleanField(default=True)
    new_listing_notifications = models.BooleanField(default=True)
    promotional_notifications = models.BooleanField(default=False)
    weekly_digest = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"

    def __str__(self):
        return f"{self.user.email} - Notification Preferences"

class BusinessFollower(models.Model):
    """Tracks which users follow which businesses"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='following',
        # Remove the to_field parameter - let Django handle the FK correctly
    )
    business = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'business')
        verbose_name = "Business Follower"
        verbose_name_plural = "Business Followers"

    def __str__(self):
        return f"{self.user.email} follows {self.business.business_name}"

class Notification(models.Model):
    """In-app notifications"""
    NOTIFICATION_TYPES = [
        ('new_listing', 'New Listing'),
        ('listing_expiring', 'Listing Expiring'),
        ('business_update', 'Business Update'),
        ('system_announcement', 'System Announcement'),
        ('welcome', 'Welcome'),
        ('pickup_reminder', 'Pickup Reminder'),  # Existing type from scheduling
        ('order_preparation', 'Order Preparation'),
        ('order_completion', 'Order Completion'),
        ('donation_request', 'Donation Request'),
        ('donation_response', 'Donation Response'), 
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications',
        # Remove the to_field parameter - let Django handle the FK correctly
    )
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_notifications', 
        null=True, 
        blank=True,
        # Remove the to_field parameter - let Django handle the FK correctly
    )
    business = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE, null=True, blank=True)
    
    notification_type = models.CharField(max_length=40, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Optional data payload (JSON format for additional info)
    data = models.JSONField(default=dict, blank=True)
    
    # Status tracking
    is_read = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.title} -> {self.recipient.email}"

class EmailNotificationLog(models.Model):
    """Track sent email notifications to prevent duplicates and for analytics"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient_email = models.EmailField()
    recipient_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='email_logs',
        # Remove the to_field parameter - let Django handle the FK correctly
    )
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='email_logs', null=True, blank=True)
    
    subject = models.CharField(max_length=255)
    template_name = models.CharField(max_length=100)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Email Notification Log"
        verbose_name_plural = "Email Notification Logs"

    def __str__(self):
        return f"Email to {self.recipient_email} - {self.status}"