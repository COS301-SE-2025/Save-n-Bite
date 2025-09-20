# digital_garden/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging

from notifications.services import NotificationService
from .models import PlantInventory
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

@receiver(post_save, sender=PlantInventory)
def notify_plant_earned(sender, instance, created, **kwargs):
    """Send notification when a new plant is added to inventory"""
    if created:
        try:
            # Determine milestone details if it's a milestone reward
            milestone_details = None
            if 'milestone' in instance.earned_reason:
                milestone_details = {
                    'earning_reason': instance.earned_reason,
                    'earned_from_order': instance.earned_from_order.id if instance.earned_from_order else None
                }
                
                # Add specific milestone information based on reason
                if instance.earned_reason == 'milestone_orders':
                    # You could calculate which milestone was reached here
                    milestone_details['milestone_count'] = 'multiple'  # Replace with actual count
                elif instance.earned_reason == 'milestone_amount':
                    milestone_details['milestone_amount'] = 'significant'  # Replace with actual amount
                elif instance.earned_reason == 'milestone_businesses':
                    milestone_details['business_count'] = 'multiple'  # Replace with actual count
            
            # Send the notification
            NotificationService.send_plant_earned_notification(
                customer=instance.customer,
                plant=instance.plant,
                quantity=instance.quantity,
                reason=instance.earned_reason,
                order=instance.earned_from_order,
                milestone_details=milestone_details
            )
            
            logger.info(f"Plant earned notification triggered for {instance.customer.email}: {instance.plant.name}")
            
        except Exception as e:
            logger.error(f"Failed to send plant earned notification for {instance.customer.email}: {str(e)}")
