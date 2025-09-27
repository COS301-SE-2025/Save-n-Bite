# badges/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging

from interactions.models import Order
from reviews.models import Review
from .services import BadgeService, BadgeInitializationService

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=Order)
def award_badges_on_order_completion(sender, instance, created, **kwargs):
    """
    Automatically award badges when an order is completed
    Mirrors the digital garden's automatic plant awarding on order completion
    """
    # Only process when order status changes to completed and it's a provider order
    if (instance.status == 'completed' and 
        hasattr(instance, 'interaction') and 
        hasattr(instance.interaction, 'business') and
        hasattr(instance.interaction.business, 'user') and
        instance.interaction.business.user.user_type == 'provider'):
        
        try:
            badge_service = BadgeService()
            badges_awarded = badge_service.process_order_completion(instance)
            
            if badges_awarded:
                logger.info(
                    f"Order {instance.id} completion awarded {len(badges_awarded)} "
                    f"badges to provider {instance.interaction.business.user.email}: "
                    f"{', '.join([badge.badge_type.name for badge in badges_awarded])}"
                )
            
        except Exception as e:
            logger.error(
                f"Failed to process badge awards for order {instance.id}: {str(e)}"
            )
# badges/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging

from interactions.models import Order
from reviews.models import Review
from .services import BadgeService, BadgeInitializationService

logger = logging.getLogger(__name__)
User = get_user_model()

# Global flag to ensure badge types are initialized only once
_badge_types_initialized = False


def ensure_badge_types_initialized():
    """
    Ensure badge types are initialized when first needed
    This avoids database access during app startup
    """
    global _badge_types_initialized
    if not _badge_types_initialized:
        try:
            BadgeInitializationService.create_default_badge_types()
            _badge_types_initialized = True
            logger.info("Badge types initialized on first use")
        except Exception as e:
            logger.error(f"Failed to initialize badge types: {str(e)}")


@receiver(post_save, sender=Order)
def award_badges_on_order_completion(sender, instance, created, **kwargs):
    """
    Automatically award badges when an order is completed
    Mirrors the digital garden's automatic plant awarding on order completion
    """
    # Only process when order status changes to completed and it's a provider order
    if (instance.status == 'completed' and 
        hasattr(instance, 'interaction') and 
        hasattr(instance.interaction, 'business') and
        hasattr(instance.interaction.business, 'user') and
        instance.interaction.business.user.user_type == 'provider'):
        
        try:
            # Ensure badge types are initialized
            ensure_badge_types_initialized()
            
            badge_service = BadgeService()
            badges_awarded = badge_service.process_order_completion(instance)
            
            if badges_awarded:
                logger.info(
                    f"Order {instance.id} completion awarded {len(badges_awarded)} "
                    f"badges to provider {instance.interaction.business.user.email}: "
                    f"{', '.join([badge.badge_type.name for badge in badges_awarded])}"
                )
            
        except Exception as e:
            logger.error(
                f"Failed to process badge awards for order {instance.id}: {str(e)}"
            )
            # Don't fail the order completion process due to badge errors


@receiver(post_save, sender=Review)
def award_badges_on_review_creation(sender, instance, created, **kwargs):
    """
    Automatically award badges when a review is created or updated
    """
    # Only process active reviews for providers
    if (instance.status == 'active' and 
        instance.business and 
        hasattr(instance.business, 'user') and
        instance.business.user.user_type == 'provider'):
        
        try:
            # Ensure badge types are initialized
            ensure_badge_types_initialized()
            
            badge_service = BadgeService()
            badges_awarded = badge_service.process_review_creation(instance)
            
            if badges_awarded:
                action = "created" if created else "updated"
                logger.info(
                    f"Review {action} awarded {len(badges_awarded)} "
                    f"badges to provider {instance.business.user.email}: "
                    f"{', '.join([badge.badge_type.name for badge in badges_awarded])}"
                )
            
        except Exception as e:
            logger.error(
                f"Failed to process badge awards for review {instance.id}: {str(e)}"
            )
            # Don't fail the review process due to badge errors


@receiver(post_save, sender=User)
def check_early_adopter_badge(sender, instance, created, **kwargs):
    """
    Check for early adopter badge when a new provider registers
    """
    if created and instance.user_type == 'provider':
        try:
            # Ensure badge types are initialized
            ensure_badge_types_initialized()
            
            # Small delay to ensure provider profile is created
            from django.utils import timezone
            from datetime import timedelta
            
            # Check if this is an early adopter (within first month of platform)
            platform_launch = timezone.now().replace(year=2024, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            if instance.date_joined <= (platform_launch + timedelta(days=30)):
                badge_service = BadgeService()
                # Process special badges (which includes early adopter)
                stats = badge_service.update_provider_stats(instance)
                special_badges = badge_service.check_special_achievement_badges(instance, stats)
                
                if special_badges:
                    for badge in special_badges:
                        badge_service.send_badge_notification(instance, badge)
                    
                    logger.info(
                        f"Early adopter badge awarded to new provider {instance.email}"
                    )
            
        except Exception as e:
            logger.error(
                f"Failed to check early adopter badge for new provider {instance.email}: {str(e)}"
            )