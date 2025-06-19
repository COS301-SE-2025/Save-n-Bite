# notifications/services.py

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Notification, EmailNotificationLog, BusinessFollower, NotificationPreferences
from authentication.models import FoodProviderProfile
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationService:
    """Service class to handle all notification operations"""

    @staticmethod
    def create_notification(
        recipient, 
        notification_type, 
        title, 
        message, 
        sender=None, 
        business=None, 
        data=None
    ):
        """Create an in-app notification"""
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            business=business,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data or {}
        )
        return notification

    @staticmethod
    def send_email_notification(user, subject, template_name, context, notification=None):
        """Send email notification to user"""
        try:
            # Check if user wants email notifications
            preferences, _ = NotificationPreferences.objects.get_or_create(user=user)
            if not preferences.email_notifications:
                logger.info(f"User {user.email} has disabled email notifications")
                return False

            # Create email log entry
            email_log = EmailNotificationLog.objects.create(
                recipient_email=user.email,
                recipient_user=user,
                notification=notification,
                subject=subject,
                template_name=template_name,
                status='pending'
            )

            # Render email content
            html_message = render_to_string(f'notifications/emails/{template_name}.html', context)
            plain_message = strip_tags(html_message)

            # Send email
            success = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False
            )

            if success:
                email_log.status = 'sent'
                email_log.sent_at = timezone.now()
                logger.info(f"Email sent successfully to {user.email}")
            else:
                email_log.status = 'failed'
                email_log.error_message = "Unknown error occurred"
                logger.error(f"Failed to send email to {user.email}")

            email_log.save()
            return success

        except Exception as e:
            logger.error(f"Error sending email to {user.email}: {str(e)}")
            if 'email_log' in locals():
                email_log.status = 'failed'
                email_log.error_message = str(e)
                email_log.save()
            return False

    @staticmethod
    def notify_followers_new_listing(business_profile, listing_data):
        """Notify all followers when a business creates a new listing"""
        followers = BusinessFollower.objects.filter(
            business=business_profile
        ).select_related('user')

        for follower in followers:
            # Check if user wants new listing notifications
            preferences, _ = NotificationPreferences.objects.get_or_create(user=follower.user)
            if not preferences.new_listing_notifications:
                continue

            # Create in-app notification
            title = f"New listing from {business_profile.business_name}"
            message = f"{business_profile.business_name} has added a new food item: {listing_data.get('name', 'Unknown item')}"
            
            notification = NotificationService.create_notification(
                recipient=follower.user,
                notification_type='new_listing',
                title=title,
                message=message,
                sender=business_profile.user,
                business=business_profile,
                data={
                    'listing_id': str(listing_data.get('id', '')),
                    'listing_name': listing_data.get('name', ''),
                    'listing_price': listing_data.get('price', ''),
                    'expiry_date': listing_data.get('expiry_date', ''),
                }
            )

            # Send email notification if enabled
            if preferences.email_notifications:
                email_context = {
                    'user_name': NotificationService._get_user_display_name(follower.user),
                    'business_name': business_profile.business_name,
                    'listing_name': listing_data.get('name', 'Unknown item'),
                    'listing_price': listing_data.get('price', 'Free'),
                    'expiry_date': listing_data.get('expiry_date', ''),
                    'listing_description': listing_data.get('description', ''),
                    'business_logo': business_profile.logo.url if business_profile.logo else None,
                }
                
                NotificationService.send_email_notification(
                    user=follower.user,
                    subject=f"New listing from {business_profile.business_name}",
                    template_name='new_listing',
                    context=email_context,
                    notification=notification
                )

        logger.info(f"Notified {followers.count()} followers about new listing from {business_profile.business_name}")

    @staticmethod
    def send_welcome_notification(user):
        """Send welcome notification to new users"""
        welcome_messages = {
            'customer': "Welcome to Save n Bite! Start browsing discounted food from local businesses and help reduce food waste.",
            'ngo': "Welcome to Save n Bite! Your organization registration is pending verification. You'll be notified once approved.",
            'provider': "Welcome to Save n Bite! Your business registration is pending verification. You'll be notified once approved."
        }

        title = "Welcome to Save n Bite!"
        message = welcome_messages.get(user.user_type, "Welcome to Save n Bite!")

        notification = NotificationService.create_notification(
            recipient=user,
            notification_type='welcome',
            title=title,
            message=message,
            data={'user_type': user.user_type}
        )

        # Send welcome email
        email_context = {
            'user_name': NotificationService._get_user_display_name(user),
            'user_type': user.user_type,
        }

        NotificationService.send_email_notification(
            user=user,
            subject="Welcome to Save n Bite!",
            template_name='welcome',
            context=email_context,
            notification=notification
        )

    @staticmethod
    def send_verification_status_notification(user, status, user_type):
        """Send notification when user verification status changes"""
        if status == 'verified':
            title = "Account Verified!"
            if user_type == 'ngo':
                message = "Congratulations! Your organization has been verified. You can now request food donations."
            else:
                message = "Congratulations! Your business has been verified. You can now start listing surplus food."
        else:
            title = "Account Verification Failed"
            message = "Unfortunately, your account verification was not approved. Please contact support for more information."

        notification = NotificationService.create_notification(
            recipient=user,
            notification_type='business_update',
            title=title,
            message=message,
            data={'verification_status': status, 'user_type': user_type}
        )

        # Send email notification
        email_context = {
            'user_name': NotificationService._get_user_display_name(user),
            'status': status,
            'user_type': user_type,
        }

        template_name = 'verification_approved' if status == 'verified' else 'verification_rejected'
        
        NotificationService.send_email_notification(
            user=user,
            subject=f"Save n Bite Account {status.title()}",
            template_name=template_name,
            context=email_context,
            notification=notification
        )

    @staticmethod
    def _get_user_display_name(user):
        """Get appropriate display name for user"""
        if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
            return user.customer_profile.full_name
        elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
            return user.ngo_profile.representative_name
        elif user.user_type == 'provider' and hasattr(user, 'provider_profile'):
            return user.provider_profile.business_name
        return user.email

    @staticmethod
    def mark_notifications_as_read(user, notification_ids):
        """Mark specified notifications as read"""
        notifications = Notification.objects.filter(
            id__in=notification_ids,
            recipient=user,
            is_read=False
        )
        
        count = notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return count

    @staticmethod
    def get_unread_count(user):
        """Get count of unread notifications for user"""
        return Notification.objects.filter(
            recipient=user,
            is_read=False,
            is_deleted=False
        ).count()

    @staticmethod
    def follow_business(user, business_id):
        """Follow a business"""
        try:
            business_user = User.objects.get(id=business_id, user_type='provider')
            business_profile = business_user.provider_profile
            
            if business_profile.status != 'verified':
                raise ValueError("Cannot follow unverified business")
            
            follower, created = BusinessFollower.objects.get_or_create(
                user=user,
                business=business_profile
            )
            
            if created:
                # Send notification to business about new follower
                NotificationService.create_notification(
                    recipient=business_user,
                    notification_type='business_update',
                    title="New Follower",
                    message=f"{NotificationService._get_user_display_name(user)} is now following your business!",
                    sender=user,
                    business=business_profile,
                    data={'follower_count': business_profile.followers.count()}
                )
            
            return follower, created
            
        except User.DoesNotExist:
            raise ValueError("Business not found")

    @staticmethod
    def unfollow_business(user, business_id):
        """Unfollow a business"""
        try:
            business_user = User.objects.get(id=business_id, user_type='provider')
            business_profile = business_user.provider_profile
            
            deleted_count, _ = BusinessFollower.objects.filter(
                user=user,
                business=business_profile
            ).delete()
            
            return deleted_count > 0
            
        except User.DoesNotExist:
            raise ValueError("Business not found")