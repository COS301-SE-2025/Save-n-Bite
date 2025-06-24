from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from decimal import Decimal
import logging

from interactions.models import Interaction  
from notifications.models import BusinessFollower 
from analytics.models import UserAnalytics
from analytics.services import AnalyticsService

logger = logging.getLogger(__name__)
User = get_user_model()

# 1. Update analytics on transaction
@receiver(post_save, sender=Interaction)
def update_analytics_on_transaction(sender, instance, created, **kwargs):
    if instance.status == 'completed':  # Remove created check
        try:
            # Calculate meals saved and CO2 reduction from items
            meals_saved = sum(item.quantity for item in instance.items.all())
            co2_reduction = sum(
                item.quantity * item.food_listing.co2_saving_per_item 
                for item in instance.items.all()
            )
            
            transaction_data = {
                'type': instance.interaction_type.lower(),
                'amount': float(instance.total_amount),
                'meals_saved': meals_saved,
                'co2_reduction': float(co2_reduction),
                'user_type': 'provider' if hasattr(instance.user, 'provider_profile') else 'customer'
            }
            AnalyticsService.update_user_analytics(instance.user, transaction_data)
        except Exception as e:
            logger.error(f"Error updating analytics for interaction {instance.id}: {str(e)}")
            
# 2. Update follower count
@receiver(post_save, sender=BusinessFollower)  # Changed from m2m_changed
def update_follower_count(sender, instance, created, **kwargs):
    try:
        analytics, _ = UserAnalytics.objects.get_or_create(user=instance.business.user)
        analytics.total_followers = instance.business.followers.count()
        analytics.save()
        logger.info(f"Updated follower count for {instance.business.user.email}")
    except Exception as e:
        logger.error(f"Error updating follower count: {e}")

# 3. Create UserAnalytics record on user creation
@receiver(post_save, sender=User)
def create_user_analytics(sender, instance, created, **kwargs):
    if created:
        UserAnalytics.objects.get_or_create(
            user=instance, 
            defaults={'user_type': 'individual'}
        )