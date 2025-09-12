# digital_garden/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging

from interactions.models import Order
from .services import DigitalGardenService

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def handle_order_completion(sender, instance, **kwargs):
    """
    Signal handler for when an order is completed.
    Automatically awards plants to customer's garden.
    """
    # Only process when order status changes to completed
    if instance.status == 'completed' and instance.interaction.user.user_type == 'customer':
        try:
            service = DigitalGardenService()
            result = service.process_order_completion(instance)
            
            if result['plants_earned']:
                logger.info(
                    f"Order {instance.id} completed - awarded {len(result['plants_earned'])} "
                    f"plants to customer {instance.interaction.user.username}"
                )
            
        except Exception as e:
            logger.error(
                f"Failed to process plant rewards for order {instance.id}: {str(e)}"
            )