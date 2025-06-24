# scheduling/services.py

import qrcode
from io import BytesIO
import base64
from datetime import datetime, timedelta, time, date
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.core.exceptions import ValidationError
from .models import (
    PickupLocation, PickupTimeSlot, ScheduledPickup, 
    PickupOptimization, PickupAnalytics
)
from interactions.models import Order
import logging

logger = logging.getLogger(__name__)

class PickupSchedulingService:
    """Core service for handling pickup scheduling logic"""

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
    def create_time_slot(business, location, slot_data):
        """Create a new time slot for pickups"""
        try:
            time_slot = PickupTimeSlot.objects.create(
                business=business,
                location=location,
                day_of_week=slot_data['day_of_week'],
                start_time=slot_data['start_time'],
                end_time=slot_data['end_time'],
                slot_duration=timedelta(minutes=slot_data.get('slot_duration_minutes', 30)),
                max_orders_per_slot=slot_data.get('max_orders_per_slot', 10),
                buffer_time=timedelta(minutes=slot_data.get('buffer_time_minutes', 5)),
                advance_booking_hours=slot_data.get('advance_booking_hours', 2),
            )
            
            logger.info(f"Created time slot for {business.business_name} on {time_slot.get_day_of_week_display()}")
            return time_slot
            
        except Exception as e:
            logger.error(f"Error creating time slot: {str(e)}")
            raise ValidationError(f"Failed to create time slot: {str(e)}")

    @staticmethod
    def get_available_slots(business, target_date=None, location=None):
        """Get available pickup slots for a specific date"""
        if target_date is None:
            target_date = timezone.now().date()
        
        # Get day of week (0=Monday, 6=Sunday)
        day_of_week = target_date.weekday()
        
        # Filter time slots
        slots_query = PickupTimeSlot.objects.filter(
            business=business,
            day_of_week=day_of_week,
            is_active=True
        )
        
        if location:
            slots_query = slots_query.filter(location=location)
        
        available_slots = []
        current_time = timezone.now()
        
        for time_slot in slots_query:
            # Check if slot is not in the past
            slot_datetime = timezone.make_aware(
                datetime.combine(target_date, time_slot.start_time)
            )
            
            # Skip if too close to start time (advance booking requirement)
            if slot_datetime <= current_time + timedelta(hours=time_slot.advance_booking_hours):
                continue
            
            # Count existing bookings for this slot
            existing_bookings = ScheduledPickup.objects.filter(
                time_slot=time_slot,
                scheduled_date=target_date,
                status__in=['scheduled', 'confirmed', 'in_progress']
            ).count()
            
            available_capacity = time_slot.max_orders_per_slot - existing_bookings
            
            if available_capacity > 0:
                # Generate specific time slots within the window
                slot_times = PickupSchedulingService._generate_slot_times(
                    time_slot, target_date, available_capacity
                )
                
                available_slots.extend(slot_times)
        
        return sorted(available_slots, key=lambda x: x['start_time'])

    @staticmethod
    def _generate_slot_times(time_slot, target_date, available_capacity):
        """Generate specific time slots within a time window"""
        slots = []
        current_time = time_slot.start_time
        slot_duration = time_slot.slot_duration
        buffer_time = time_slot.buffer_time
        
        while current_time < time_slot.end_time:
            end_time = (datetime.combine(date.today(), current_time) + slot_duration).time()
            
            if end_time <= time_slot.end_time:
                # Check if this specific time is available
                existing_count = ScheduledPickup.objects.filter(
                    time_slot=time_slot,
                    scheduled_date=target_date,
                    scheduled_start_time=current_time,
                    status__in=['scheduled', 'confirmed', 'in_progress']
                ).count()
                
                if existing_count == 0:  # Slot is available
                    slots.append({
                        'time_slot_id': time_slot.id,
                        'location_id': time_slot.location.id,
                        'location_name': time_slot.location.name,
                        'start_time': current_time,
                        'end_time': end_time,
                        'date': target_date,
                        'available_capacity': available_capacity
                    })
            
            # Move to next slot
            current_time = (datetime.combine(date.today(), current_time) + 
                          slot_duration + buffer_time).time()
        
        return slots

    @staticmethod
    def schedule_pickup(order, slot_data):
        """Schedule a pickup for an order"""
        try:
            time_slot = PickupTimeSlot.objects.get(id=slot_data['time_slot_id'])
            location = PickupLocation.objects.get(id=slot_data['location_id'])
            
            # Validate the slot is still available
            target_date = slot_data['date']
            target_start_time = slot_data['start_time']
            target_end_time = slot_data['end_time']
            
            # Check for conflicts
            existing_pickup = ScheduledPickup.objects.filter(
                time_slot=time_slot,
                scheduled_date=target_date,
                scheduled_start_time=target_start_time,
                status__in=['scheduled', 'confirmed', 'in_progress']
            ).exists()
            
            if existing_pickup:
                raise ValidationError("This time slot is no longer available")
            
            # Create the scheduled pickup
            pickup = ScheduledPickup.objects.create(
                order=order,
                time_slot=time_slot,
                location=location,
                scheduled_date=target_date,
                scheduled_start_time=target_start_time,
                scheduled_end_time=target_end_time,
            )
            
            # Generate QR code
            qr_image = PickupSchedulingService.generate_qr_code(pickup)
            
            # Send confirmation notification
            PickupSchedulingService._send_pickup_confirmation(pickup)
            
            logger.info(f"Scheduled pickup {pickup.confirmation_code} for order {order.id}")
            return pickup, qr_image
            
        except Exception as e:
            logger.error(f"Error scheduling pickup: {str(e)}")
            raise ValidationError(f"Failed to schedule pickup: {str(e)}")

    @staticmethod
    def generate_qr_code(pickup):
        """Generate QR code for pickup verification"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            qr.add_data(pickup.qr_code_data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64 string
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            qr_image = base64.b64encode(buffer.getvalue()).decode()
            
            return qr_image
            
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
            
            # Check if pickup is scheduled for today or is overdue
            today = timezone.now().date()
            if pickup.scheduled_date > today:
                raise ValidationError("Pickup is not scheduled for today")
            
            return pickup
            
        except ScheduledPickup.DoesNotExist:
            raise ValidationError("Invalid confirmation code")

    @staticmethod
    def complete_pickup(pickup, completion_data=None):
        """Mark a pickup as completed"""
        try:
            pickup.status = 'completed'
            pickup.actual_pickup_time = timezone.now()
            pickup.pickup_notes = completion_data.get('notes', '') if completion_data else ''
            pickup.save()
            
            # Update order status
            pickup.order.status = 'completed'
            pickup.order.save()
            
            # Send completion notifications
            PickupSchedulingService._send_completion_notifications(pickup)
            
            # Update analytics
            PickupSchedulingService._update_analytics(pickup)
            
            logger.info(f"Completed pickup {pickup.confirmation_code}")
            return pickup
            
        except Exception as e:
            logger.error(f"Error completing pickup: {str(e)}")
            raise ValidationError(f"Failed to complete pickup: {str(e)}")

    @staticmethod
    def _send_pickup_confirmation(pickup):
        """Send pickup confirmation notification"""
        try:
            from notifications.services import NotificationService
            
            # Notification to customer
            customer = pickup.order.interaction.user
            
            title = "Pickup Scheduled"
            message = f"Your pickup is scheduled for {pickup.scheduled_date} at {pickup.scheduled_start_time}. Location: {pickup.location.name}"
            
            NotificationService.create_notification(
                recipient=customer,
                notification_type='business_update',
                title=title,
                message=message,
                data={
                    'pickup_id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'location': pickup.location.name,
                    'scheduled_time': f"{pickup.scheduled_date} {pickup.scheduled_start_time}",
                    'qr_data': pickup.qr_code_data
                }
            )
            
        except Exception as e:
            logger.error(f"Error sending pickup confirmation: {str(e)}")

    @staticmethod
    def _send_completion_notifications(pickup):
        """Send completion notifications"""
        try:
            from notifications.services import NotificationService
            
            customer = pickup.order.interaction.user
            business_user = pickup.location.business.user
            
            # Customer notification
            NotificationService.create_notification(
                recipient=customer,
                notification_type='business_update',
                title="Order Completed",
                message=f"Your order has been successfully picked up. Thank you for using Save n Bite!",
                data={
                    'pickup_id': str(pickup.id),
                    'completion_time': pickup.actual_pickup_time.isoformat(),
                    'order_id': str(pickup.order.id)
                }
            )
            
            # Business notification
            NotificationService.create_notification(
                recipient=business_user,
                notification_type='business_update',
                title="Pickup Completed",
                message=f"Order {pickup.confirmation_code} has been picked up successfully.",
                data={
                    'pickup_id': str(pickup.id),
                    'customer_id': str(customer.id),
                    'completion_time': pickup.actual_pickup_time.isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Error sending completion notifications: {str(e)}")

    @staticmethod
    def _update_analytics(pickup):
        """Update pickup analytics"""
        try:
            business = pickup.location.business
            pickup_date = pickup.scheduled_date
            
            analytics, created = PickupAnalytics.objects.get_or_create(
                business=business,
                date=pickup_date,
                defaults={
                    'total_completed': 0,
                    'total_scheduled': 0,
                    'on_time_percentage': 0.0,
                    'efficiency_score': 0.0
                }
            )
            
            analytics.total_completed += 1
            
            # Calculate on-time percentage
            scheduled_time = timezone.make_aware(
                datetime.combine(pickup.scheduled_date, pickup.scheduled_start_time)
            )
            
            if pickup.actual_pickup_time <= scheduled_time + timedelta(minutes=15):
                # Consider on-time if within 15 minutes
                pass  # Update calculation logic as needed
            
            analytics.save()
            
        except Exception as e:
            logger.error(f"Error updating analytics: {str(e)}")

    @staticmethod
    def send_pickup_reminders():
        """Send reminder notifications for upcoming pickups"""
        try:
            # Get pickups starting in the next hour
            reminder_time = timezone.now() + timedelta(hours=1)
            reminder_date = reminder_time.date()
            reminder_hour = reminder_time.hour
            
            upcoming_pickups = ScheduledPickup.objects.filter(
                scheduled_date=reminder_date,
                scheduled_start_time__hour=reminder_hour,
                status='scheduled',
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
            message = f"Reminder: Your pickup is scheduled in 1 hour at {pickup.location.name}. Don't forget to bring your QR code!"
            
            NotificationService.create_notification(
                recipient=customer,
                notification_type='business_update',
                title=title,
                message=message,
                data={
                    'pickup_id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'location': pickup.location.name,
                    'time_until_pickup': '1 hour'
                }
            )
            
        except Exception as e:
            logger.error(f"Error sending pickup reminder: {str(e)}")

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
            return []

    @staticmethod
    def _analyze_schedule(pickups, optimization):
        """Analyze current schedule and provide recommendations"""
        recommendations = []
        
        # Check for peak time overload
        peak_start = optimization.peak_hours_start
        peak_end = optimization.peak_hours_end
        
        peak_pickups = [
            p for p in pickups 
            if peak_start <= p.scheduled_start_time <= peak_end
        ]
        
        if len(peak_pickups) > optimization.max_concurrent_pickups:
            recommendations.append({
                'type': 'peak_overload',
                'message': f'Too many pickups ({len(peak_pickups)}) during peak hours',
                'suggestion': 'Consider spreading some pickups to off-peak times'
            })
        
        # Check for gaps that could be filled
        # Add more optimization logic as needed
        
        return recommendations

    @staticmethod
    def get_business_analytics(business, days_back=7):
        """Get pickup analytics for a business"""
        try:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days_back)
            
            analytics = PickupAnalytics.objects.filter(
                business=business,
                date__range=[start_date, end_date]
            ).order_by('-date')
            
            # Calculate summary metrics
            total_scheduled = sum(a.total_scheduled for a in analytics)
            total_completed = sum(a.total_completed for a in analytics)
            total_missed = sum(a.total_missed for a in analytics)
            
            completion_rate = (total_completed / total_scheduled * 100) if total_scheduled > 0 else 0
            
            summary = {
                'total_scheduled': total_scheduled,
                'total_completed': total_completed,
                'total_missed': total_missed,
                'completion_rate': round(completion_rate, 2),
                'days_analyzed': days_back,
                'average_daily_pickups': round(total_scheduled / days_back, 1),
                'efficiency_trend': PickupOptimizationService._calculate_efficiency_trend(analytics)
            }
            
            return {
                'summary': summary,
                'daily_analytics': [
                    {
                        'date': a.date.isoformat(),
                        'scheduled': a.total_scheduled,
                        'completed': a.total_completed,
                        'missed': a.total_missed,
                        'on_time_percentage': a.on_time_percentage,
                        'efficiency_score': a.efficiency_score
                    }
                    for a in analytics
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting business analytics: {str(e)}")
            return {'summary': {}, 'daily_analytics': []}

    @staticmethod
    def _calculate_efficiency_trend(analytics):
        """Calculate efficiency trend over time"""
        if len(analytics) < 2:
            return 0
        
        recent_efficiency = analytics[0].efficiency_score
        older_efficiency = analytics[-1].efficiency_score
        
        if older_efficiency == 0:
            return 0
        
        return round(((recent_efficiency - older_efficiency) / older_efficiency) * 100, 2)