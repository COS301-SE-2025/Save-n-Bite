# food_listings/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import FoodListing
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=FoodListing)
def notify_followers_new_listing(sender, instance, created, **kwargs):
    """Notify followers when a new food listing is created"""
    if created and instance.status == 'active':
        try:
            # Import here to avoid circular imports
            from notifications.services import NotificationService
            
            # Prepare listing data for notification
            listing_data = {
                'id': str(instance.id),
                'name': instance.name,
                'description': instance.description,
                'price': float(instance.discounted_price),
                'original_price': float(instance.original_price),
                'expiry_date': instance.expiry_date.isoformat() if instance.expiry_date else None,
                'pickup_window': instance.pickup_window,
                'food_type': instance.food_type,
                'quantity': instance.quantity,
                'images': instance.images[0] if instance.images else None,
                'savings': float(instance.savings),
                'discount_percentage': instance.discount_percentage,
            }
            
            # Notify all followers of this business
            NotificationService.notify_followers_new_listing(
                business_profile=instance.provider.provider_profile,
                listing_data=listing_data
            )
            
            logger.info(f"Notified followers about new listing: {instance.name} from {instance.provider.provider_profile.business_name}")
            
        except Exception as e:
            logger.error(f"Failed to notify followers about new listing {instance.id}: {str(e)}")
            # Don't raise the exception to avoid breaking the food listing creation