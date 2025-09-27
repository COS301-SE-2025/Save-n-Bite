# badges/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.cache import cache
import logging
import threading
from datetime import datetime, timedelta

from interactions.models import Order
from reviews.models import Review
from .services import BadgeService

logger = logging.getLogger(__name__)
User = get_user_model()


def run_calculate_badges_async():
    """
    Run calculate_badges command asynchronously to avoid blocking the main thread
    """
    def _run_command():
        try:
            logger.info("🏆 Running calculate_badges command after order completion...")
            call_command('calculate_badges', verbosity=0)
            logger.info("✅ Badge calculation completed successfully")
        except Exception as e:
            logger.error(f"❌ Failed to run calculate_badges command: {str(e)}")
    
    # Run in a separate thread to avoid blocking the main request
    thread = threading.Thread(target=_run_command)
    thread.daemon = True
    thread.start()


def should_run_badge_calculation():
    """
    Check if we should run badge calculation based on rate limiting
    """
    cache_key = 'last_badge_calculation'
    last_run = cache.get(cache_key)
    
    if not last_run:
        return True
    
    # Only run if it's been more than 5 minutes since last calculation
    time_since_last = datetime.now() - last_run
    return time_since_last > timedelta(minutes=5)


@receiver(post_save, sender=Order)
def check_badges_on_order_completion(sender, instance, created, **kwargs):
    """
    Check for badge eligibility when an order is completed
    """
    # Only process when order status changes to completed
    if instance.status == 'completed':
        try:
            # 1. Calculate badges for the specific provider (immediate)
            if (hasattr(instance, 'interaction') and 
                hasattr(instance.interaction, 'business') and
                hasattr(instance.interaction.business, 'user') and
                instance.interaction.business.user.user_type == 'provider'):
                
                badge_service = BadgeService()
                badges_awarded = badge_service.calculate_provider_badges(instance.interaction.business.user)
                
                if badges_awarded:
                    logger.info(
                        f"Order {instance.id} completion triggered {len(badges_awarded)} "
                        f"badges for provider {instance.interaction.business.user.email}"
                    )
            
            # 2. Run full badge calculation asynchronously (with rate limiting)
            if should_run_badge_calculation():
                logger.info(f"Order {instance.id} completion - triggering full badge calculation")
                run_calculate_badges_async()
                
                # Update the last run time
                cache.set('last_badge_calculation', datetime.now(), timeout=3600)
            else:
                logger.info(f"Order {instance.id} completion - skipping badge calculation (rate limited)")
            
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
            # 1. Calculate badges for the specific provider (immediate)
            badge_service = BadgeService()
            badges_awarded = badge_service.calculate_provider_badges(instance.business.user)
            
            if badges_awarded:
                action = "created" if created else "updated"
                logger.info(
                    f"Review {action} triggered {len(badges_awarded)} "
                    f"badges for provider {instance.business.user.email}"
                )
            
            # 2. Run full badge calculation asynchronously (with rate limiting)
            if should_run_badge_calculation():
                action = "created" if created else "updated"
                logger.info(f"Review {action} - triggering full badge calculation")
                run_calculate_badges_async()
                
                # Update the last run time
                cache.set('last_badge_calculation', datetime.now(), timeout=3600)
            else:
                action = "created" if created else "updated"
                logger.info(f"Review {action} - skipping badge calculation (rate limited)")
            
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