# badges/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging

from interactions.models import Order
from reviews.models import Review
from .services import BadgeService

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=Order)
def check_badges_on_order_completion(sender, instance, created, **kwargs):
    """
    Check for badge eligibility when an order is completed
    """
    # Only process when order status changes to completed and it's a provider order
    if (instance.status == 'completed' and 
        hasattr(instance, 'interaction') and 
        hasattr(instance.interaction, 'business') and
        hasattr(instance.interaction.business, 'user') and
        instance.interaction.business.user.user_type == 'provider'):
        
        try:
            badge_service = BadgeService()
            badges_awarded = badge_service.calculate_provider_badges(instance.interaction.business.user)
            
            if badges_awarded:
                logger.info(
                    f"Order {instance.id} completion triggered {len(badges_awarded)} "
                    f"badges for provider {instance.interaction.business.user.email}"
                )
            
        except Exception as e:
            logger.error(
                f"Failed to process badges for order {instance.id}: {str(e)}"
            )


@receiver(post_save, sender=Review)
def check_badges_on_review_creation(sender, instance, created, **kwargs):
    """
    Check for badge eligibility when a review is created or updated
    """
    # Only process active reviews for approved providers
    if (instance.status == 'active' and 
        instance.business and 
        hasattr(instance.business, 'user') and
        instance.business.user.user_type == 'provider'):
        
        try:
            badge_service = BadgeService()
            badges_awarded = badge_service.calculate_provider_badges(instance.business.user)
            
            if badges_awarded:
                action = "created" if created else "updated"
                logger.info(
                    f"Review {action} triggered {len(badges_awarded)} "
                    f"badges for provider {instance.business.user.email}"
                )
            
        except Exception as e:
            logger.error(
                f"Failed to process badges for review {instance.id}: {str(e)}"
            )


# Initialize badge service when Django starts
def initialize_badge_types():
    """
    Initialize default badge types when the app starts
    """
    try:
        from .services import BadgeInitializationService
        BadgeInitializationService.create_default_badge_types()
        logger.info("Badge types initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize badge types: {str(e)}")


# You can call this in a management command or during deployment
# initialize_badge_types()