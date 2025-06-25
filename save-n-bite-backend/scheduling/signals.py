# scheduling/signals.py

from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import (
    ScheduledPickup, PickupAnalytics, FoodListingPickupSchedule, 
    PickupTimeSlot
)
from food_listings.models import FoodListing
from interactions.models import Order
from .services import PickupAnalyticsService
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=FoodListing)
def food_listing_created(sender, instance, created, **kwargs):
    """Create pickup schedule when food listing is created (if pickup_window is provided)"""
    if created and instance.pickup_window:
        try:
            # Check if the business has any pickup locations
            from .models import PickupLocation
            
            pickup_locations = PickupLocation.objects.filter(
                business=instance.provider.provider_profile,
                is_active=True
            )
            
            if pickup_locations.exists():
                # Use the first available location as default
                # In production, this should be configurable by the business
                default_location = pickup_locations.first()
                
                # Create pickup schedule automatically
                FoodListingPickupSchedule.objects.create(
                    food_listing=instance,
                    location=default_location,
                    pickup_window=instance.pickup_window,
                    total_slots=4,  # Default value
                    max_orders_per_slot=5,  # Default value
                    slot_buffer_minutes=5  # Default value
                )
                
                logger.info(f"Created pickup schedule for food listing {instance.name}")
            else:
                logger.warning(f"No pickup locations available for business {instance.provider.provider_profile.business_name}")
                
        except Exception as e:
            logger.error(f"Error creating pickup schedule for food listing {instance.id}: {str(e)}")


@receiver(post_save, sender=ScheduledPickup)
def pickup_status_changed(sender, instance, created, **kwargs):
    """Handle pickup status changes and analytics updates"""
    if not created:  # Only for updates
        try:
            # Update analytics when pickup is completed
            if instance.status == 'completed' and instance.actual_pickup_time:
                update_daily_analytics(instance)
            
            # Auto-mark missed pickups (this could be run as a periodic task)
            elif instance.status in ['scheduled', 'confirmed']:
                check_missed_pickup(instance)
                
            # Update time slot booking count when pickup is cancelled
            elif instance.status == 'cancelled':
                time_slot = instance.time_slot
                time_slot.current_bookings = max(0, time_slot.current_bookings - 1)
                time_slot.save()
                
        except Exception as e:
            logger.error(f"Error in pickup status change handler: {str(e)}")


@receiver(post_save, sender=Order)
def order_created_notification(sender, instance, created, **kwargs):
    """Send notification when order is created and check for auto-scheduling"""
    if created:
        try:
            # Get the business from the order
            business = instance.interaction.food_listings.first().provider.provider_profile
            
            # Check if business has auto-scheduling enabled
            optimization = getattr(business, 'pickup_optimization', None)
            if optimization and getattr(optimization, 'auto_schedule', False):
                # Auto-scheduling logic could be implemented here
                logger.info(f"Auto-scheduling check for order {instance.id}")
            
            logger.info(f"New order {instance.id} created for business {business.business_name}")
            
        except Exception as e:
            logger.error(f"Error in order creation handler: {str(e)}")


@receiver(post_delete, sender=FoodListing)
def food_listing_deleted(sender, instance, **kwargs):
    """Clean up when food listing is deleted"""
    try:
        # Cancel any future scheduled pickups for this food listing
        future_pickups = ScheduledPickup.objects.filter(
            food_listing=instance,
            scheduled_date__gte=timezone.now().date(),
            status__in=['scheduled', 'confirmed']
        )
        
        cancelled_count = 0
        for pickup in future_pickups:
            pickup.status = 'cancelled'
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
        # Ensure the food listing matches the time slot's food listing
        if instance.time_slot and instance.food_listing:
            if instance.time_slot.pickup_schedule.food_listing != instance.food_listing:
                raise ValueError("Food listing must match the time slot's food listing")
        
        # Ensure location matches the pickup schedule location
        if instance.time_slot:
            instance.location = instance.time_slot.pickup_schedule.location
            
    except Exception as e:
        logger.error(f"Error validating pickup before save: {str(e)}")
        raise


def update_daily_analytics(pickup):
    """Update daily analytics when pickup is completed"""
    try:
        business = pickup.location.business
        pickup_date = pickup.scheduled_date
        
        # Update analytics using the service
        PickupAnalyticsService.update_daily_analytics(business, pickup_date)
        
        logger.info(f"Updated analytics for {business.business_name} on {pickup_date}")
        
    except Exception as e:
        logger.error(f"Error updating daily analytics: {str(e)}")


def check_missed_pickup(pickup):
    """Check if pickup should be marked as missed"""
    try:
        current_time = timezone.now()
        scheduled_datetime = timezone.make_aware(
            timezone.datetime.combine(pickup.scheduled_date, pickup.scheduled_end_time)
        )
        
        # If current time is more than 30 minutes past scheduled end time, mark as missed
        if current_time > scheduled_datetime + timedelta(minutes=30):
            pickup.status = 'missed'
            pickup.save()
            
            # Free up the time slot
            time_slot = pickup.time_slot
            time_slot.current_bookings = max(0, time_slot.current_bookings - 1)
            time_slot.save()
            
            logger.info(f"Marked pickup {pickup.confirmation_code} as missed")
            
    except Exception as e:
        logger.error(f"Error checking missed pickup: {str(e)}")


# New signals for the updated models

@receiver(post_save, sender=FoodListingPickupSchedule)
def pickup_schedule_created(sender, instance, created, **kwargs):
    """Handle pickup schedule creation"""
    if created:
        try:
            logger.info(f"Created pickup schedule for {instance.food_listing.name} with window {instance.pickup_window}")
            
            # Optionally generate time slots for today and tomorrow
            from .services import PickupSchedulingService
            
            today = timezone.now().date()
            tomorrow = today + timedelta(days=1)
            
            # Generate slots for today if it's still early enough
            if timezone.now().hour < 20:  # Before 8 PM
                try:
                    PickupSchedulingService.generate_time_slots_for_date(instance.food_listing, today)
                except Exception as e:
                    logger.error(f"Error generating slots for today: {str(e)}")
            
            # Generate slots for tomorrow
            try:
                PickupSchedulingService.generate_time_slots_for_date(instance.food_listing, tomorrow)
            except Exception as e:
                logger.error(f"Error generating slots for tomorrow: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error in pickup schedule creation handler: {str(e)}")


@receiver(post_save, sender=PickupTimeSlot)
def time_slot_created(sender, instance, created, **kwargs):
    """Handle time slot creation"""
    if created:
        try:
            logger.info(f"Created time slot {instance.slot_number} for {instance.pickup_schedule.food_listing.name} on {instance.date}")
        except Exception as e:
            logger.error(f"Error in time slot creation handler: {str(e)}")


# Signal to auto-generate time slots when needed
@receiver(post_save, sender=Order)
def check_time_slots_availability(sender, instance, created, **kwargs):
    """Check if time slots need to be generated for the order's food listings"""
    if created:
        try:
            # Get all food listings in this order
            food_listings = []
            for item in instance.items.all():
                if hasattr(item, 'food_listing'):
                    food_listings.append(item.food_listing)
            
            # Generate time slots for the next few days if they don't exist
            from .services import PickupSchedulingService
            
            for food_listing in food_listings:
                if hasattr(food_listing, 'pickup_schedule'):
                    for days_ahead in range(0, 3):  # Today, tomorrow, day after
                        target_date = timezone.now().date() + timedelta(days=days_ahead)
                        try:
                            PickupSchedulingService.generate_time_slots_for_date(food_listing, target_date)
                        except Exception as e:
                            logger.error(f"Error generating time slots for {food_listing.name} on {target_date}: {str(e)}")
                            
        except Exception as e:
            logger.error(f"Error checking time slots availability: {str(e)}")