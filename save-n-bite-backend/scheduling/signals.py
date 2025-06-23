# scheduling/signals.py

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import ScheduledPickup, PickupAnalytics
from interactions.models import Order
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=ScheduledPickup)
def pickup_status_changed(sender, instance, created, **kwargs):
    """Handle pickup status changes"""
    if not created:  # Only for updates
        try:
            # Update analytics when pickup is completed
            if instance.status == 'completed' and instance.actual_pickup_time:
                update_daily_analytics(instance)
            
            # Auto-mark missed pickups
            elif instance.status in ['scheduled', 'confirmed']:
                check_missed_pickup(instance)
                
        except Exception as e:
            logger.error(f"Error in pickup status change handler: {str(e)}")

@receiver(post_save, sender=Order)
def order_created_notification(sender, instance, created, **kwargs):
    """Send notification when order is created (for auto-scheduling)"""
    if created:
        try:
            # Check if order needs auto-scheduling based on business preferences
            business = instance.interaction.business
            
            # This could be expanded to include auto-scheduling logic
            # For now, just log the event
            logger.info(f"New order {instance.id} created for business {business.business_name}")
            
        except Exception as e:
            logger.error(f"Error in order creation handler: {str(e)}")

def update_daily_analytics(pickup):
    """Update daily analytics when pickup is completed"""
    try:
        business = pickup.location.business
        pickup_date = pickup.scheduled_date
        
        analytics, created = PickupAnalytics.objects.get_or_create(
            business=business,
            date=pickup_date,
            defaults={
                'total_completed': 0,
                'total_scheduled': 0,
                'total_missed': 0,
                'total_cancelled': 0,
                'on_time_percentage': 0.0,
                'efficiency_score': 0.0
            }
        )
        
        # Update completion count
        analytics.total_completed += 1
        
        # Calculate if pickup was on time
        scheduled_datetime = timezone.make_aware(
            timezone.datetime.combine(pickup.scheduled_date, pickup.scheduled_start_time)
        )
        
        # Consider on-time if within 15 minutes of scheduled time
        if pickup.actual_pickup_time <= scheduled_datetime + timedelta(minutes=15):
            # Update on-time calculations
            pass
        
        # Calculate total scheduled for the day
        total_scheduled = ScheduledPickup.objects.filter(
            location__business=business,
            scheduled_date=pickup_date
        ).count()
        
        analytics.total_scheduled = total_scheduled
        
        # Calculate completion rate and efficiency
        if total_scheduled > 0:
            completed_count = ScheduledPickup.objects.filter(
                location__business=business,
                scheduled_date=pickup_date,
                status='completed'
            ).count()
            
            on_time_count = ScheduledPickup.objects.filter(
                location__business=business,
                scheduled_date=pickup_date,
                status='completed',
                actual_pickup_time__lte=scheduled_datetime + timedelta(minutes=15)
            ).count()
            
            analytics.on_time_percentage = (on_time_count / completed_count * 100) if completed_count > 0 else 0
            analytics.efficiency_score = (completed_count / total_scheduled * 100)
        
        analytics.save()
        
        logger.info(f"Updated analytics for {business.business_name} on {pickup_date}")
        
    except Exception as e:
        logger.error(f"Error updating daily analytics: {str(e)}")

def check_missed_pickup(pickup):
    """Check if a pickup should be marked as missed"""
    try:
        # Only check if pickup is in the past
        pickup_datetime = timezone.make_aware(
            timezone.datetime.combine(pickup.scheduled_date, pickup.scheduled_end_time)
        )
        
        # If pickup time has passed by more than 30 minutes, mark as missed
        if timezone.now() > pickup_datetime + timedelta(minutes=30):
            pickup.status = 'missed'
            pickup.save()
            
            # Send notification about missed pickup
            send_missed_pickup_notification(pickup)
            
            logger.info(f"Marked pickup {pickup.confirmation_code} as missed")
            
    except Exception as e:
        logger.error(f"Error checking missed pickup: {str(e)}")

def send_missed_pickup_notification(pickup):
    """Send notification when pickup is missed"""
    try:
        from notifications.services import NotificationService
        
        # Notify customer
        customer = pickup.order.interaction.user
        NotificationService.create_notification(
            recipient=customer,
            notification_type='business_update',
            title="Pickup Missed",
            message=f"Your scheduled pickup at {pickup.location.name} was missed. Please contact the business to reschedule.",
            data={
                'pickup_id': str(pickup.id),
                'confirmation_code': pickup.confirmation_code,
                'business_contact': pickup.location.contact_phone
            }
        )
        
        # Notify business
        business_user = pickup.location.business.user
        NotificationService.create_notification(
            recipient=business_user,
            notification_type='business_update',
            title="Missed Pickup",
            message=f"Pickup {pickup.confirmation_code} was not collected during the scheduled time.",
            data={
                'pickup_id': str(pickup.id),
                'customer_email': customer.email,
                'scheduled_time': f"{pickup.scheduled_date} {pickup.scheduled_start_time}"
            }
        )
        
    except Exception as e:
        logger.error(f"Error sending missed pickup notification: {str(e)}")