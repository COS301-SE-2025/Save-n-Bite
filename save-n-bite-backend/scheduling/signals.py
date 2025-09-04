# scheduling/signals.py

from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import ScheduledPickup, PickupAnalytics
from food_listings.models import FoodListing
from interactions.models import Order
from .services import PickupAnalyticsService, PickupNotificationService
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=ScheduledPickup)
def pickup_status_changed(sender, instance, created, **kwargs):
    """Handle pickup status changes and analytics updates"""
    if not created:  # Only for updates
        try:
            # Update analytics when pickup is completed or missed
            if instance.status in ['completed', 'missed']:
                PickupAnalyticsService.update_daily_analytics(
                    instance.location.business, 
                    instance.pickup_date
                )
                
        except Exception as e:
            logger.error(f"Error in pickup status change handler: {str(e)}")


@receiver(post_save, sender=Order)
def order_created_notification(sender, instance, created, **kwargs):
    """Handle order creation - no auto-scheduling needed in simplified flow"""
    if created:
        try:
            logger.info(f"New order {instance.id} created - waiting for pickup scheduling")
            
        except Exception as e:
            logger.error(f"Error in order creation handler: {str(e)}")


@receiver(post_delete, sender=FoodListing)
def food_listing_deleted(sender, instance, **kwargs):
    """Clean up when food listing is deleted"""
    try:
        # Cancel any future scheduled pickups for orders containing this food listing
        future_pickups = ScheduledPickup.objects.filter(
            order__interaction__items__food_listing=instance,
            pickup_date__gte=timezone.now().date(),
            status__in=['pending', 'ready']
        ).distinct()
        
        cancelled_count = 0
        for pickup in future_pickups:
            pickup.status = 'cancelled'
            pickup.business_notes += f"\nCancelled due to food listing deletion: {instance.name}"
            pickup.save()
            cancelled_count += 1
        
        if cancelled_count > 0:
            logger.info(f"Cancelled {cancelled_count} future pickups for deleted food listing {instance.name}")
            
    except Exception as e:
        logger.error(f"Error handling food listing deletion: {str(e)}")


@receiver(pre_save, sender=ScheduledPickup)
def validate_pickup_before_save(sender, instance, **kwargs):
    """Validate pickup data before saving"""
    try:
        # Ensure pickup deadline is in the future for new pickups
        if not instance.pk and instance.pickup_deadline <= timezone.now():
            raise ValueError("Pickup deadline must be in the future")
            
    except Exception as e:
        logger.error(f"Error validating pickup before save: {str(e)}")
        raise


# Periodic task signals - these would typically be run by Celery or cron jobs
def check_missed_pickups_task():
    """Periodic task to check for missed pickups"""
    try:
        missed_count = PickupNotificationService.check_and_mark_missed_pickups()
        logger.info(f"Periodic task: Marked {missed_count} pickups as missed")
        return missed_count
    except Exception as e:
        logger.error(f"Error in missed pickups task: {str(e)}")
        return 0


def send_pickup_reminders_task():
    """Periodic task to send pickup reminders"""
    try:
        reminder_count = PickupNotificationService.check_and_send_reminders()
        logger.info(f"Periodic task: Sent {reminder_count} pickup reminders")
        return reminder_count
    except Exception as e:
        logger.error(f"Error in pickup reminders task: {str(e)}")
        return 0