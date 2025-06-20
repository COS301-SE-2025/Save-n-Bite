# notifications/signals.py - Fixed verification signals

from django.db.models.signals import post_save, pre_save
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

# Store the previous status to detect changes
_ngo_previous_status = {}
_provider_previous_status = {}

@receiver(pre_save, sender=NGOProfile)
def store_ngo_previous_status(sender, instance, **kwargs):
    """Store the previous status before saving"""
    if instance.pk:
        try:
            old_instance = NGOProfile.objects.get(pk=instance.pk)
            _ngo_previous_status[instance.pk] = old_instance.status
        except NGOProfile.DoesNotExist:
            _ngo_previous_status[instance.pk] = None

@receiver(pre_save, sender=FoodProviderProfile)
def store_provider_previous_status(sender, instance, **kwargs):
    """Store the previous status before saving"""
    if instance.pk:
        try:
            old_instance = FoodProviderProfile.objects.get(pk=instance.pk)
            _provider_previous_status[instance.pk] = old_instance.status
        except FoodProviderProfile.DoesNotExist:
            _provider_previous_status[instance.pk] = None

@receiver(post_save, sender=NGOProfile)
def ngo_verification_status_changed(sender, instance, created, **kwargs):
    """Send notification when NGO verification status changes"""
    if not created:  # Only for updates, not new creations
        try:
            previous_status = _ngo_previous_status.get(instance.pk)
            current_status = instance.status
            
            # Only send notification if status actually changed to verified or rejected
            if (previous_status != current_status and 
                current_status in ['verified', 'rejected'] and 
                previous_status == 'pending_verification'):
                
                NotificationService.send_verification_status_notification(
                    user=instance.user,
                    status=current_status,
                    user_type='ngo'
                )
                logger.info(f"Verification status notification sent to NGO {instance.organisation_name}: {current_status}")
                
            # Clean up the stored status
            if instance.pk in _ngo_previous_status:
                del _ngo_previous_status[instance.pk]
                
        except Exception as e:
            logger.error(f"Failed to send verification notification to NGO {instance.organisation_name}: {str(e)}")

@receiver(post_save, sender=FoodProviderProfile)
def provider_verification_status_changed(sender, instance, created, **kwargs):
    """Send notification when Food Provider verification status changes"""
    if not created:  # Only for updates, not new creations
        try:
            previous_status = _provider_previous_status.get(instance.pk)
            current_status = instance.status
            
            # Only send notification if status actually changed to verified or rejected
            if (previous_status != current_status and 
                current_status in ['verified', 'rejected'] and 
                previous_status == 'pending_verification'):
                
                NotificationService.send_verification_status_notification(
                    user=instance.user,
                    status=current_status,
                    user_type='provider'
                )
                logger.info(f"Verification status notification sent to Provider {instance.business_name}: {current_status}")
                
            # Clean up the stored status
            if instance.pk in _provider_previous_status:
                del _provider_previous_status[instance.pk]
                
        except Exception as e:
            logger.error(f"Failed to send verification notification to Provider {instance.business_name}: {str(e)}")

# Note: The signal for new food listings is handled in the food_listings app