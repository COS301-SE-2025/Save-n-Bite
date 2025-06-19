# notifications/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from authentication.models import NGOProfile, FoodProviderProfile
from .services import NotificationService
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def send_welcome_notification(sender, instance, created, **kwargs):
    """Send welcome notification when a new user is created"""
    if created:
        try:
            NotificationService.send_welcome_notification(instance)
            logger.info(f"Welcome notification sent to {instance.email}")
        except Exception as e:
            logger.error(f"Failed to send welcome notification to {instance.email}: {str(e)}")

@receiver(post_save, sender=NGOProfile)
def ngo_verification_status_changed(sender, instance, **kwargs):
    """Send notification when NGO verification status changes"""
    if kwargs.get('update_fields') and 'status' in kwargs['update_fields']:
        try:
            if instance.status in ['verified', 'rejected']:
                NotificationService.send_verification_status_notification(
                    user=instance.user,
                    status=instance.status,
                    user_type='ngo'
                )
                logger.info(f"Verification status notification sent to NGO {instance.organisation_name}")
        except Exception as e:
            logger.error(f"Failed to send verification notification to NGO {instance.organisation_name}: {str(e)}")

@receiver(post_save, sender=FoodProviderProfile)
def provider_verification_status_changed(sender, instance, **kwargs):
    """Send notification when Food Provider verification status changes"""
    if kwargs.get('update_fields') and 'status' in kwargs['update_fields']:
        try:
            if instance.status in ['verified', 'rejected']:
                NotificationService.send_verification_status_notification(
                    user=instance.user,
                    status=instance.status,
                    user_type='provider'
                )
                logger.info(f"Verification status notification sent to Provider {instance.business_name}")
        except Exception as e:
            logger.error(f"Failed to send verification notification to Provider {instance.business_name}: {str(e)}")

# Note: The signal for new food listings will be added in the food_listings app
# since that's where the FoodListing model will be defined