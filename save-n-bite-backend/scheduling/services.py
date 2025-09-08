# scheduling/services.py

import qrcode
from io import BytesIO
import base64
from datetime import datetime, timedelta, time, date
from django.utils import timezone
from django.db.models import Count, Q, Avg, F
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import (
    PickupLocation, FoodListingPickupSchedule, PickupTimeSlot, 
    ScheduledPickup, PickupOptimization, PickupAnalytics
)
from food_listings.models import FoodListing
from interactions.models import Order
import logging

logger = logging.getLogger(__name__)

class PickupSchedulingService:
    """Core service for handling food-listing-based pickup scheduling logic"""

    @staticmethod
    def create_pickup_location(business, location_data):
        """Create a new pickup location for a business"""
        try:
            location = PickupLocation.objects.create(
                business=business,
                name=location_data['name'],
                address=location_data['address'],
                instructions=location_data.get('instructions', ''),
                contact_person=location_data['contact_person'],
                contact_phone=location_data['contact_phone'],
                latitude=location_data.get('latitude'),
                longitude=location_data.get('longitude'),
            )
            
            logger.info(f"Created pickup location {location.name} for {business.business_name}")
            return location
            
        except Exception as e:
            logger.error(f"Error creating pickup location: {str(e)}")
            raise ValidationError(f"Failed to create pickup location: {str(e)}")

    @staticmethod
    def create_pickup_schedule_for_listing(food_listing, schedule_data):
        """Create pickup schedule when creating a food listing"""
        try:
            with transaction.atomic():
                # Get location and validate it belongs to the same business
                location = PickupLocation.objects.get(
                    id=schedule_data['location_id'],
                    business=food_listing.provider.provider_profile,
                    is_active=True
                )
                
                # Create the pickup schedule
                pickup_schedule = FoodListingPickupSchedule.objects.create(
                    food_listing=food_listing,
                    location=location,
                    pickup_window=schedule_data['pickup_window'],
                    total_slots=schedule_data.get('total_slots', 4),
                    max_orders_per_slot=schedule_data.get('max_orders_per_slot', 5),
                    slot_buffer_minutes=schedule_data.get('slot_buffer_minutes', 5)
                )
                
                logger.info(f"Created pickup schedule for food listing {food_listing.name}")
                return pickup_schedule
                
        except PickupLocation.DoesNotExist:
            raise ValidationError("Pickup location not found or doesn't belong to your business")
        except Exception as e:
            logger.error(f"Error creating pickup schedule: {str(e)}")
            raise ValidationError(f"Failed to create pickup schedule: {str(e)}")

    @staticmethod
    def generate_time_slots_for_date(food_listing, target_date):
        """Generate time slots for a specific food listing and date"""
        try:
            # Check if food listing has a pickup schedule
            if not hasattr(food_listing, 'pickup_schedule'):
                raise ValidationError("Food listing does not have a pickup schedule configured")
            
            pickup_schedule = food_listing.pickup_schedule
            
            # Check if slots already exist for this date
            existing_slots = PickupTimeSlot.objects.filter(
                pickup_schedule=pickup_schedule,
                date=target_date
            )
            
            if existing_slots.exists():
                logger.info(f"Time slots already exist for {food_listing.name} on {target_date}")
                return existing_slots
            
            # Generate new slots
            slot_configs = pickup_schedule.generate_time_slots()
            created_slots = []
            
            with transaction.atomic():
                for slot_config in slot_configs:
                    slot = PickupTimeSlot.objects.create(
                        pickup_schedule=pickup_schedule,
                        slot_number=slot_config['slot_number'],
                        start_time=slot_config['start_time'],
                        end_time=slot_config['end_time'],
                        max_orders_per_slot=slot_config.get('max_orders', pickup_schedule.max_orders_per_slot),
                        date=target_date,
                        current_bookings=0,
                        is_active=True
                    )
                    created_slots.append(slot)
                
                logger.info(f"Generated {len(created_slots)} time slots for {food_listing.name} on {target_date}")
                return created_slots
                
        except Exception as e:
            logger.error(f"Error generating time slots: {str(e)}")
            raise ValidationError(f"Failed to generate time slots: {str(e)}")

    @staticmethod
    def get_available_slots(food_listing, target_date=None):
        """Get available pickup slots for a food listing"""
        try:
            if target_date is None:
                target_date = timezone.now().date()
            
            # Ensure slots exist for the target date
            PickupSchedulingService.generate_time_slots_for_date(food_listing, target_date)
            
            # Get available slots using database filtering
            available_slots = PickupTimeSlot.objects.filter(
                pickup_schedule__food_listing=food_listing,
                date=target_date,
                is_active=True,
                current_bookings__lt=F('max_orders_per_slot')
            ).select_related(
                'pickup_schedule__food_listing',
                'pickup_schedule__location'
            ).order_by('start_time')
            
            return available_slots
            
        except Exception as e:
            logger.error(f"Error getting available slots: {str(e)}")
            return PickupTimeSlot.objects.none()

    @staticmethod
    def schedule_pickup(order, schedule_data):
        """Schedule a pickup for an order"""
        try:
            with transaction.atomic():
                # Get and validate the time slot
                time_slot = PickupTimeSlot.objects.select_for_update().get(
                    id=schedule_data['time_slot_id'],
                    date=schedule_data['date'],
                    is_active=True
                )
                
                # Check availability
                if not time_slot.is_available:
                    raise ValidationError("Time slot is no longer available")
                
                # Get the food listing from the order
                food_listing = FoodListing.objects.get(id=schedule_data['food_listing_id'])
                
                # Validate that the time slot belongs to this food listing
                if time_slot.pickup_schedule.food_listing != food_listing:
                    raise ValidationError("Time slot does not belong to the specified food listing")
                existing_pickup = ScheduledPickup.objects.filter(
                order=order,
                food_listing=food_listing,
                status__in=['scheduled', 'confirmed', 'completed']
            ).first()

                if existing_pickup:
                    raise ValidationError(f"Pickup already scheduled for this item. Confirmation code: {existing_pickup.confirmation_code}")
                # Create the scheduled pickup
                scheduled_pickup = ScheduledPickup.objects.create(
                    order=order,
                    food_listing=food_listing,
                    time_slot=time_slot,
                    location=time_slot.pickup_schedule.location,
                    scheduled_date=schedule_data['date'],
                    scheduled_start_time=time_slot.start_time,
                    scheduled_end_time=time_slot.end_time,
                    customer_notes=schedule_data.get('customer_notes', ''),
                    status='scheduled'
                )
                
                # Update time slot booking count
                time_slot.current_bookings += 1
                time_slot.save()
                
                # Generate QR code
                qr_code_image = PickupSchedulingService.generate_qr_code(scheduled_pickup)
                
                logger.info(f"Scheduled pickup {scheduled_pickup.confirmation_code} for order {order.id}")
                
                return scheduled_pickup, qr_code_image
                
        except PickupTimeSlot.DoesNotExist:
            raise ValidationError("Time slot not found or inactive")
        except FoodListing.DoesNotExist:
            raise ValidationError("Food listing not found")
        except Exception as e:
            logger.error(f"Error scheduling pickup: {str(e)}")
            raise ValidationError(f"Failed to schedule pickup: {str(e)}")

    @staticmethod
    def generate_qr_code(scheduled_pickup):
        """Generate QR code for pickup verification"""
        try:
            qr_data = scheduled_pickup.qr_code_data
            
            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(str(qr_data))
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            logger.error(f"Error generating QR code: {str(e)}")
            return None

    @staticmethod
    def verify_pickup_code(confirmation_code, business):
        """Verify pickup confirmation code"""
        try:
            pickup = ScheduledPickup.objects.get(
                confirmation_code=confirmation_code,
                location__business=business,
                status__in=['scheduled', 'confirmed']
            )
            
            # Update status to confirmed if it was just scheduled
            if pickup.status == 'scheduled':
                pickup.status = 'confirmed'
                pickup.save()
            
            return pickup
            
        except ScheduledPickup.DoesNotExist:
            raise ValidationError("Invalid confirmation code or pickup not found")

    @staticmethod
    def complete_pickup(pickup):
        """Mark pickup as completed"""
        try:
            with transaction.atomic():
                pickup.status = 'completed'
                pickup.actual_pickup_time = timezone.now()
                pickup.save()
                
                # Update order status if needed
                order = pickup.order
                if order.status != 'completed':
                    order.status = 'completed'
                    order.save()
                
                logger.info(f"Completed pickup {pickup.confirmation_code}")
                return pickup
                
        except Exception as e:
            logger.error(f"Error completing pickup: {str(e)}")
            raise ValidationError(f"Failed to complete pickup: {str(e)}")

    @staticmethod
    def cancel_pickup(pickup, cancelled_by_customer=True):
        """Cancel a scheduled pickup"""
        try:
            with transaction.atomic():
                # Update pickup status
                pickup.status = 'cancelled'
                pickup.save()
                
                # Free up the time slot
                time_slot = pickup.time_slot
                time_slot.current_bookings = max(0, time_slot.current_bookings - 1)
                time_slot.save()
                
                # Update order status
                order = pickup.order
                if cancelled_by_customer:
                    order.status = 'cancelled'
                    order.save()
                
                logger.info(f"Cancelled pickup {pickup.confirmation_code}")
                return pickup
                
        except Exception as e:
            logger.error(f"Error cancelling pickup: {str(e)}")
            raise ValidationError(f"Failed to cancel pickup: {str(e)}")

    @staticmethod
    def get_business_schedule_overview(business, target_date=None):
        """Get schedule overview for a business"""
        try:
            if target_date is None:
                target_date = timezone.now().date()
            
            # Get all pickups for the date
            pickups = ScheduledPickup.objects.filter(
                location__business=business,
                scheduled_date=target_date
            ).select_related('food_listing', 'location', 'order', 'order__interaction', 'order__interaction__user')
            
            # Calculate metrics
            total_pickups = pickups.count()
            completed_pickups = pickups.filter(status='completed').count()
            pending_pickups = pickups.filter(status__in=['scheduled', 'confirmed']).count()
            missed_pickups = pickups.filter(status='missed').count()
            
            # Group by hour
            pickups_by_hour = {}
            for pickup in pickups:
                if pickup.scheduled_start_time:  # Check if time exists
                    hour = pickup.scheduled_start_time.hour
                    if hour not in pickups_by_hour:
                        pickups_by_hour[hour] = []
                    
                    # Safely get customer name - handle both customers and NGOs
                    customer_name = 'Unknown'
                    try:
                        user = pickup.order.interaction.user
                        user_type = getattr(user, 'user_type', 'unknown')
                        
                        if user_type == 'customer' and hasattr(user, 'customer_profile') and user.customer_profile:
                            # Customer user with customer_profile
                            customer_name = getattr(user.customer_profile, 'full_name', 'Unknown')
                        elif user_type == 'ngo' and hasattr(user, 'ngo_profile') and user.ngo_profile:
                            # NGO user with ngo_profile
                            ngo_name = getattr(user.ngo_profile, 'organization_name', None)
                            contact_name = getattr(user.ngo_profile, 'contact_person_name', None)
                            if ngo_name:
                                customer_name = ngo_name
                                if contact_name:
                                    customer_name = f"{ngo_name} ({contact_name})"
                            elif contact_name:
                                customer_name = contact_name
                            else:
                                customer_name = user.email or 'Unknown NGO'
                        elif hasattr(user, 'get_full_name'):
                            # Fallback to user's get_full_name method
                            customer_name = user.get_full_name() or user.email or 'Unknown'
                        else:
                            # Final fallback to email
                            customer_name = user.email or 'Unknown'
                            
                    except Exception as e:
                        logger.warning(f"Error getting customer name for pickup {pickup.id}: {str(e)}")
                        customer_name = 'Unknown'
                    
                    pickups_by_hour[hour].append({
                        'id': str(pickup.id),
                        'confirmation_code': pickup.confirmation_code,
                        'food_listing_name': pickup.food_listing.name if pickup.food_listing else 'Unknown',
                        'customer_name': customer_name,
                        'status': pickup.status,
                        'time': pickup.scheduled_start_time.strftime('%H:%M')
                    })
            
            # Get food listings with pickups
            food_listings_with_pickups = []
            try:
                food_listings_with_pickups = list(
                    pickups.values('food_listing__id', 'food_listing__name')
                    .distinct()
                    .annotate(pickup_count=Count('id'))
                )
            except Exception as e:
                logger.warning(f"Error getting food listings with pickups: {str(e)}")
            
            return {
                'date': target_date.isoformat(),
                'total_pickups': total_pickups,
                'completed_pickups': completed_pickups,
                'pending_pickups': pending_pickups,
                'missed_pickups': missed_pickups,
                'pickups_by_hour': pickups_by_hour,
                'food_listings_with_pickups': food_listings_with_pickups
            }
            
        except Exception as e:
            logger.error(f"Error getting schedule overview: {str(e)}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            
            # Return empty structure instead of None
            return {
                'date': target_date.isoformat() if target_date else timezone.now().date().isoformat(),
                'total_pickups': 0,
                'completed_pickups': 0,
                'pending_pickups': 0,
                'missed_pickups': 0,
                'pickups_by_hour': {},
                'food_listings_with_pickups': []
            }

    @staticmethod
    def send_pickup_reminders():
        """Send pickup reminders for upcoming pickups"""
        try:
            # Get pickups that need reminders (1 hour before)
            reminder_time = timezone.now() + timedelta(hours=1)
            reminder_date = reminder_time.date()
            reminder_hour = reminder_time.hour
            
            upcoming_pickups = ScheduledPickup.objects.filter(
                scheduled_date=reminder_date,
                scheduled_start_time__hour=reminder_hour,
                status__in=['scheduled', 'confirmed'],
                reminder_sent=False
            )
            
            for pickup in upcoming_pickups:
                PickupSchedulingService._send_pickup_reminder(pickup)
                pickup.reminder_sent = True
                pickup.save()
                
            logger.info(f"Sent {upcoming_pickups.count()} pickup reminders")
            
        except Exception as e:
            logger.error(f"Error sending pickup reminders: {str(e)}")

    @staticmethod
    def _send_pickup_reminder(pickup):
        """Send individual pickup reminder"""
        try:
            from notifications.services import NotificationService
            
            customer = pickup.order.interaction.user
            
            title = "Pickup Reminder"
            message = f"Reminder: Your pickup for '{pickup.food_listing.name}' is scheduled in 1 hour at {pickup.location.name}. Don't forget to bring your QR code!"
            
            NotificationService.create_notification(
                recipient=customer,
                notification_type='pickup_reminder',
                title=title,
                message=message,
                data={
                    'pickup_id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'food_listing_name': pickup.food_listing.name,
                    'location_name': pickup.location.name,
                    'time_until_pickup': '1 hour'
                }
            )
            
        except Exception as e:
            logger.error(f"Error sending pickup reminder: {str(e)}")

    @staticmethod
    def update_pickup_schedule(pickup_schedule, schedule_data):
        """Update existing pickup schedule"""
        try:
            with transaction.atomic():
                # Update schedule fields
                for field, value in schedule_data.items():
                    if hasattr(pickup_schedule, field):
                        setattr(pickup_schedule, field, value)
                
                pickup_schedule.save()
                
                # If the schedule changed significantly, we might need to regenerate future slots
                # For now, just log the change
                logger.info(f"Updated pickup schedule for {pickup_schedule.food_listing.name}")
                
                return pickup_schedule
                
        except Exception as e:
            logger.error(f"Error updating pickup schedule: {str(e)}")
            raise ValidationError(f"Failed to update pickup schedule: {str(e)}")


class PickupOptimizationService:
    """Service for optimizing pickup schedules"""

    @staticmethod
    def optimize_schedule(business, target_date=None):
        """Optimize pickup schedule for a business"""
        try:
            if target_date is None:
                target_date = timezone.now().date()
            
            optimization, created = PickupOptimization.objects.get_or_create(
                business=business,
                defaults={
                    'max_concurrent_pickups': 3,
                    'optimal_pickup_duration': timedelta(minutes=15),
                    'auto_optimize': True
                }
            )
            
            # Get scheduled pickups for the date
            scheduled_pickups = ScheduledPickup.objects.filter(
                location__business=business,
                scheduled_date=target_date,
                status__in=['scheduled', 'confirmed']
            ).order_by('scheduled_start_time')
            
            # Analysis and optimization logic
            recommendations = PickupOptimizationService._analyze_schedule(
                scheduled_pickups, optimization
            )
            
            optimization.last_optimization = timezone.now()
            optimization.save()
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error optimizing schedule: {str(e)}")
            return None

    @staticmethod
    def _analyze_schedule(pickups, optimization):
        """Analyze pickup schedule and provide recommendations"""
        try:
            recommendations = {
                'total_pickups': pickups.count(),
                'peak_hours': [],
                'suggestions': [],
                'efficiency_score': 0.0
            }
            
            if not pickups.exists():
                return recommendations
            
            # Group pickups by hour to find peak times
            pickups_by_hour = {}
            for pickup in pickups:
                hour = pickup.scheduled_start_time.hour
                pickups_by_hour[hour] = pickups_by_hour.get(hour, 0) + 1
            
            # Find peak hours (more than max_concurrent_pickups)
            for hour, count in pickups_by_hour.items():
                if count > optimization.max_concurrent_pickups:
                    recommendations['peak_hours'].append({
                        'hour': hour,
                        'pickup_count': count,
                        'suggested_max': optimization.max_concurrent_pickups
                    })
                    recommendations['suggestions'].append(
                        f"Consider spreading out pickups at {hour}:00 - currently {count} scheduled"
                    )
            
            # Calculate efficiency score
            total_slots = len(pickups_by_hour)
            if total_slots > 0:
                avg_pickups_per_slot = pickups.count() / total_slots
                optimal_pickups_per_slot = optimization.max_concurrent_pickups * 0.8  # 80% utilization
                efficiency = min(100, (avg_pickups_per_slot / optimal_pickups_per_slot) * 100)
                recommendations['efficiency_score'] = round(efficiency, 2)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error analyzing schedule: {str(e)}")
            return {'error': str(e)}


class PickupAnalyticsService:
    """Service for pickup analytics"""

    @staticmethod
    def update_daily_analytics(business, target_date=None):
        """Update daily analytics for a business"""
        try:
            if target_date is None:
                target_date = timezone.now().date()
            
            # Get pickups for the date
            pickups = ScheduledPickup.objects.filter(
                location__business=business,
                scheduled_date=target_date
            )
            
            # Calculate metrics
            total_scheduled = pickups.count()
            total_completed = pickups.filter(status='completed').count()
            total_missed = pickups.filter(status='missed').count()
            total_cancelled = pickups.filter(status='cancelled').count()
            
            # Calculate on-time percentage
            on_time_pickups = pickups.filter(
                status='completed',
                actual_pickup_time__lte=timezone.make_aware(
                    datetime.combine(target_date, time(23, 59))
                )
            ).count()
            
            on_time_percentage = (on_time_pickups / total_scheduled * 100) if total_scheduled > 0 else 0
            
            # Update or create analytics record
            analytics, created = PickupAnalytics.objects.update_or_create(
                business=business,
                date=target_date,
                defaults={
                    'total_scheduled': total_scheduled,
                    'total_completed': total_completed,
                    'total_missed': total_missed,
                    'total_cancelled': total_cancelled,
                    'on_time_percentage': round(on_time_percentage, 2),
                    'slot_utilization_rate': PickupAnalyticsService._calculate_slot_utilization(business, target_date),
                    'efficiency_score': PickupAnalyticsService._calculate_efficiency_score(business, target_date)
                }
            )
            
            logger.info(f"Updated analytics for {business.business_name} on {target_date}")
            return analytics
            
        except Exception as e:
            logger.error(f"Error updating analytics: {str(e)}")
            return None

    @staticmethod
    def _calculate_slot_utilization(business, target_date):
        """Calculate slot utilization rate"""
        try:
            # Get all time slots for the date
            total_slots = PickupTimeSlot.objects.filter(
                pickup_schedule__location__business=business,
                date=target_date,
                is_active=True
            ).count()
            
            if total_slots == 0:
                return 0.0
            
            # Get slots with bookings
            utilized_slots = PickupTimeSlot.objects.filter(
                pickup_schedule__location__business=business,
                date=target_date,
                is_active=True,
                current_bookings__gt=0
            ).count()
            
            return round((utilized_slots / total_slots) * 100, 2)
            
        except Exception as e:
            logger.error(f"Error calculating slot utilization: {str(e)}")
            return 0.0

    @staticmethod
    def _calculate_efficiency_score(business, target_date):
        """Calculate overall efficiency score"""
        try:
            # This is a composite score based on various factors
            analytics = PickupAnalytics.objects.filter(
                business=business,
                date=target_date
            ).first()
            
            if not analytics:
                return 0.0
            
            # Factors: completion rate, on-time rate, slot utilization
            completion_rate = (analytics.total_completed / max(1, analytics.total_scheduled)) * 100
            on_time_rate = analytics.on_time_percentage
            utilization_rate = analytics.slot_utilization_rate
            
            # Weighted average
            efficiency_score = (completion_rate * 0.4) + (on_time_rate * 0.3) + (utilization_rate * 0.3)
            
            return round(efficiency_score, 2)
            
        except Exception as e:
            logger.error(f"Error calculating efficiency score: {str(e)}")
            return 0.0