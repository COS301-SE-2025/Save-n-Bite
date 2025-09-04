# scheduling/services.py

import qrcode
from io import BytesIO
import base64
from datetime import datetime, timedelta, time, date
from django.utils import timezone
from django.db.models import Count, Q, Avg, F
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import PickupLocation, ScheduledPickup, PickupAnalytics
from food_listings.models import FoodListing
from interactions.models import Order
import logging
import re

logger = logging.getLogger(__name__)

class PickupSchedulingService:
    """Simplified service for notification-based pickup scheduling"""

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
    def schedule_pickup(order, location_id, customer_notes=""):
        """Schedule a pickup for an order - simplified without time slots"""
        try:
            with transaction.atomic():
                # Get pickup location
                location = PickupLocation.objects.get(
                    id=location_id,
                    is_active=True
                )
                
                # Validate that location belongs to the business that owns the food listings
                business = None
                for item in order.interaction.items.all():
                    if item.food_listing:
                        item_business = item.food_listing.provider.provider_profile
                        if business is None:
                            business = item_business
                        elif business != item_business:
                            raise ValidationError("Order contains items from multiple businesses")
                
                if business != location.business:
                    raise ValidationError("Pickup location must belong to the business that owns the food items")
                
                # Calculate pickup deadline from business hours
                pickup_date = timezone.now().date()  # Today by default
                pickup_deadline = PickupSchedulingService._calculate_pickup_deadline(location.business, pickup_date)
                
                # Create the scheduled pickup
                scheduled_pickup = ScheduledPickup.objects.create(
                    order=order,
                    location=location,
                    pickup_date=pickup_date,
                    pickup_deadline=pickup_deadline,
                    customer_notes=customer_notes,
                    status='pending'
                )
                
                # Update order status to confirmed
                order.status = 'confirmed'
                order.save()
                
                # Generate QR code
                qr_code_image = PickupSchedulingService.generate_qr_code(scheduled_pickup)
                
                # Send order received notification
                PickupNotificationService.send_order_received_notification(scheduled_pickup)
                
                logger.info(f"Scheduled pickup {scheduled_pickup.confirmation_code} for order {order.id}")
                
                return scheduled_pickup, qr_code_image
                
        except PickupLocation.DoesNotExist:
            raise ValidationError("Pickup location not found or inactive")
        except Exception as e:
            logger.error(f"Error scheduling pickup: {str(e)}")
            raise ValidationError(f"Failed to schedule pickup: {str(e)}")

    @staticmethod
    def _calculate_pickup_deadline(business, pickup_date):
        """Calculate pickup deadline based on business hours"""
        try:
            business_hours = business.business_hours
            if not business_hours:
                # Default to 6 PM if no business hours specified
                deadline_time = time(18, 0)
            else:
                # Parse business hours - more robust parsing
                deadline_time = PickupSchedulingService._parse_closing_time(business_hours)
            
            return timezone.make_aware(
                datetime.combine(pickup_date, deadline_time)
            )
        except Exception as e:
            logger.error(f"Error calculating pickup deadline: {str(e)}")
            # Fallback to 6 PM on pickup date
            return timezone.make_aware(
                datetime.combine(pickup_date, time(18, 0))
            )

    @staticmethod
    def _parse_closing_time(business_hours):
        """Parse business hours to extract closing time"""
        try:
            # Handle various formats:
            # "Mon-Fri: 9AM-6PM"
            # "Monday to Friday: 9:00 AM - 6:00 PM" 
            # "9AM-6PM"
            # "9:00-18:00"
            
            # First, try to find PM times
            pm_times = re.findall(r'(\d{1,2})(?::(\d{2}))?\s*PM', business_hours, re.IGNORECASE)
            if pm_times:
                hour_str, minute_str = pm_times[-1]  # Take the last (closing) time
                hour = int(hour_str)
                minute = int(minute_str) if minute_str else 0
                if hour != 12:  # Convert PM to 24-hour format
                    hour += 12
                elif hour == 12:  # Handle 12 PM (noon)
                    hour = 12
                return time(hour, minute)
            
            # Try to find 24-hour format times
            twenty_four_hour = re.findall(r'(\d{1,2}):(\d{2})', business_hours)
            if twenty_four_hour:
                hour_str, minute_str = twenty_four_hour[-1]  # Take the last time
                hour = int(hour_str)
                minute = int(minute_str)
                return time(hour, minute)
            
            # Try AM/PM format
            am_times = re.findall(r'(\d{1,2})(?::(\d{2}))?\s*AM', business_hours, re.IGNORECASE)
            if am_times:
                hour_str, minute_str = am_times[-1]
                hour = int(hour_str)
                minute = int(minute_str) if minute_str else 0
                if hour == 12:  # Handle 12 AM (midnight)
                    hour = 0
                return time(hour, minute)
            
            # Default fallback
            return time(18, 0)  # 6 PM
            
        except Exception as e:
            logger.error(f"Error parsing business hours '{business_hours}': {str(e)}")
            return time(18, 0)  # 6 PM fallback

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
                status__in=['ready']  # Only ready orders can be picked up
            )
            
            return pickup
            
        except ScheduledPickup.DoesNotExist:
            raise ValidationError("Invalid confirmation code or order not ready for pickup")

    @staticmethod
    def complete_pickup(pickup):
        """Mark pickup as completed"""
        try:
            with transaction.atomic():
                pickup.status = 'completed'
                pickup.actual_pickup_time = timezone.now()
                pickup.save()
                
                # Update order status
                order = pickup.order
                order.status = 'completed'
                order.save()
                
                # Update interaction status  
                interaction = order.interaction
                interaction.status = 'completed'
                interaction.completed_at = timezone.now()
                interaction.save()
                
                # Send completion notification
                PickupNotificationService.send_order_completion_notification(pickup)
                
                logger.info(f"Completed pickup {pickup.confirmation_code}")
                return pickup
                
        except Exception as e:
            logger.error(f"Error completing pickup: {str(e)}")
            raise ValidationError(f"Failed to complete pickup: {str(e)}")

    @staticmethod
    def cancel_pickup(pickup, cancelled_by_customer=True, reason=""):
        """Cancel a scheduled pickup"""
        try:
            with transaction.atomic():
                pickup.status = 'cancelled'
                pickup.business_notes += f"\nCancelled: {reason}" if reason else ""
                pickup.save()
                
                # Update order status
                order = pickup.order
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
                pickup_date=target_date
            ).select_related('location', 'order', 'order__interaction', 'order__interaction__user')
            
            # Calculate metrics
            total_orders = pickups.count()
            pending_orders = pickups.filter(status='pending').count()
            ready_orders = pickups.filter(status='ready').count()
            completed_orders = pickups.filter(status='completed').count()
            missed_orders = pickups.filter(status='missed').count()
            cancelled_orders = pickups.filter(status='cancelled').count()
            
            # Group by status for business dashboard
            orders_by_status = {
                'pending': [],
                'ready': [],
                'completed': [],
                'missed': [],
                'cancelled': []
            }
            
            for pickup in pickups:
                customer = pickup.order.interaction.user
                customer_name = PickupNotificationService._get_customer_name(customer)
                
                order_info = {
                    'id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'food_listing_name': pickup.food_listing.name if pickup.food_listing else 'Unknown',
                    'customer_name': customer_name,
                    'customer_email': customer.email,
                    'pickup_deadline': pickup.pickup_deadline,
                    'actual_ready_time': pickup.actual_ready_time,
                    'customer_notes': pickup.customer_notes,
                    'created_at': pickup.created_at
                }
                
                if pickup.status in orders_by_status:
                    orders_by_status[pickup.status].append(order_info)
            
            return {
                'date': target_date.isoformat(),
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'ready_orders': ready_orders,
                'completed_orders': completed_orders,
                'missed_orders': missed_orders,
                'cancelled_orders': cancelled_orders,
                'orders_by_status': orders_by_status
            }
            
        except Exception as e:
            logger.error(f"Error getting schedule overview: {str(e)}")
            return {
                'date': target_date.isoformat() if target_date else timezone.now().date().isoformat(),
                'total_orders': 0,
                'pending_orders': 0,
                'ready_orders': 0,
                'completed_orders': 0,
                'missed_orders': 0,
                'cancelled_orders': 0,
                'orders_by_status': {}
            }


class PickupNotificationService:
    """Service for handling pickup-related notifications"""

    @staticmethod
    def send_order_received_notification(pickup):
        """Send notification when order is received and being prepared"""
        try:
            from notifications.services import NotificationService
            from notifications.models import NotificationPreferences
            
            customer = pickup.order.interaction.user
            business = pickup.location.business
            food_name = pickup.food_listing.name if pickup.food_listing else 'your order'
            
            # Create in-app notification
            title = "Order Received!"
            message = f"Great news! {business.business_name} has received your order for '{food_name}' and is now preparing it. You'll get notified when it's ready for pickup."
            
            notification = NotificationService.create_notification(
                recipient=customer,
                notification_type='order_preparation',
                title=title,
                message=message,
                sender=business.user,
                business=business,
                data={
                    'pickup_id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'food_listing_name': food_name,
                    'business_name': business.business_name,
                    'pickup_date': pickup.pickup_date.isoformat(),
                    'pickup_deadline': pickup.pickup_deadline.isoformat(),
                    'location_name': pickup.location.name,
                    'location_address': pickup.location.address,
                    'order_status': 'preparation'
                }
            )

            # Send email if preferences allow
            preferences, _ = NotificationPreferences.objects.get_or_create(user=customer)
            if preferences.email_notifications:
                email_context = {
                    'customer_name': PickupNotificationService._get_customer_name(customer),
                    'business_name': business.business_name,
                    'food_listing_name': food_name,
                    'confirmation_code': pickup.confirmation_code,
                    'pickup_date': pickup.pickup_date.strftime('%B %d, %Y'),
                    'pickup_deadline': pickup.pickup_deadline.strftime('%B %d, %Y at %I:%M %p'),
                    'location_name': pickup.location.name,
                    'location_address': pickup.location.address,
                    'location_instructions': pickup.location.instructions,
                    'contact_person': pickup.location.contact_person,
                    'contact_phone': pickup.location.contact_phone,
                    'customer_notes': pickup.customer_notes,
                    'business_logo': business.logo.url if business.logo else None,
                }
                
                NotificationService.send_email_notification(
                    user=customer,
                    subject=f"Order Received - {business.business_name}",
                    template_name='order_received',
                    context=email_context,
                    notification=notification
                )

            logger.info(f"Sent order received notification to {customer.email} for pickup {pickup.confirmation_code}")
            return notification

        except Exception as e:
            logger.error(f"Failed to send order received notification for pickup {pickup.id}: {str(e)}")
            return None

    @staticmethod
    def send_ready_for_pickup_notification(pickup):
        """Send notification when order is ready for pickup"""
        try:
            from notifications.services import NotificationService
            from notifications.models import NotificationPreferences
            
            customer = pickup.order.interaction.user
            business = pickup.location.business
            food_name = pickup.food_listing.name if pickup.food_listing else 'your order'
            
            # Calculate time until deadline
            time_until_deadline = pickup.pickup_deadline - timezone.now()
            hours_until_deadline = max(1, int(time_until_deadline.total_seconds() // 3600))
            
            # Create in-app notification
            title = "Order Ready for Pickup!"
            message = f"🎉 Your order for '{food_name}' from {business.business_name} is now ready! Please collect it from {pickup.location.name} before {pickup.pickup_deadline.strftime('%I:%M %p')} today. You have {hours_until_deadline} hour(s) remaining."
            
            notification = NotificationService.create_notification(
                recipient=customer,
                notification_type='order_ready',
                title=title,
                message=message,
                sender=business.user,
                business=business,
                data={
                    'pickup_id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'food_listing_name': food_name,
                    'business_name': business.business_name,
                    'ready_time': pickup.actual_ready_time.isoformat() if pickup.actual_ready_time else timezone.now().isoformat(),
                    'pickup_deadline': pickup.pickup_deadline.isoformat(),
                    'location_name': pickup.location.name,
                    'location_address': pickup.location.address,
                    'hours_remaining': hours_until_deadline,
                    'order_status': 'ready'
                }
            )

            # Update pickup record
            pickup.ready_notification_sent = True
            pickup.ready_notification_sent_at = timezone.now()
            pickup.save()

            # Send email if preferences allow
            preferences, _ = NotificationPreferences.objects.get_or_create(user=customer)
            if preferences.email_notifications:
                email_context = {
                    'customer_name': PickupNotificationService._get_customer_name(customer),
                    'business_name': business.business_name,
                    'food_listing_name': food_name,
                    'confirmation_code': pickup.confirmation_code,
                    'pickup_deadline': pickup.pickup_deadline.strftime('%B %d, %Y at %I:%M %p'),
                    'hours_remaining': hours_until_deadline,
                    'location_name': pickup.location.name,
                    'location_address': pickup.location.address,
                    'location_instructions': pickup.location.instructions,
                    'contact_person': pickup.location.contact_person,
                    'contact_phone': pickup.location.contact_phone,
                    'business_logo': business.logo.url if business.logo else None,
                    'qr_code_url': f"data:image/png;base64,{pickup.qr_code_data}" if pickup.qr_code_data else None
                }
                
                NotificationService.send_email_notification(
                    user=customer,
                    subject=f"Your Order is Ready! - {business.business_name}",
                    template_name='order_ready',
                    context=email_context,
                    notification=notification
                )

            logger.info(f"Sent ready notification to {customer.email} for pickup {pickup.confirmation_code}")
            return notification

        except Exception as e:
            logger.error(f"Failed to send ready notification for pickup {pickup.id}: {str(e)}")
            return None

    @staticmethod
    def send_order_completion_notification(pickup):
        """Send thank you notification when pickup is completed"""
        try:
            from notifications.services import NotificationService
            from notifications.models import NotificationPreferences
            
            customer = pickup.order.interaction.user
            business = pickup.location.business
            food_name = pickup.food_listing.name if pickup.food_listing else 'your order'
            
            # Create in-app notification
            title = "Thank You for Your Order!"
            message = f"Thank you for picking up '{food_name}' from {business.business_name}! Your purchase helps reduce food waste and supports our mission."
            
            notification = NotificationService.create_notification(
                recipient=customer,
                notification_type='order_completion',
                title=title,
                message=message,
                sender=business.user,
                business=business,
                data={
                    'pickup_id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'food_listing_name': food_name,
                    'business_name': business.business_name,
                    'completed_at': pickup.actual_pickup_time.isoformat(),
                    'order_status': 'completed'
                }
            )

            # Send email if preferences allow
            preferences, _ = NotificationPreferences.objects.get_or_create(user=customer)
            if preferences.email_notifications:
                email_context = {
                    'customer_name': PickupNotificationService._get_customer_name(customer),
                    'business_name': business.business_name,
                    'food_listing_name': food_name,
                    'pickup_time': pickup.actual_pickup_time.strftime('%B %d, %Y at %I:%M %p'),
                    'business_logo': business.logo.url if business.logo else None,
                }
                
                NotificationService.send_email_notification(
                    user=customer,
                    subject=f"Thank You! - {business.business_name}",
                    template_name='order_completion',
                    context=email_context,
                    notification=notification
                )

            logger.info(f"Sent completion notification to {customer.email} for pickup {pickup.confirmation_code}")
            return notification

        except Exception as e:
            logger.error(f"Failed to send completion notification for pickup {pickup.id}: {str(e)}")
            return None

    @staticmethod
    def send_pickup_reminder(pickup):
        """Send reminder notification for orders approaching deadline"""
        try:
            from notifications.services import NotificationService
            
            customer = pickup.order.interaction.user
            business = pickup.location.business
            food_name = pickup.food_listing.name if pickup.food_listing else 'your order'
            
            # Calculate time remaining
            time_remaining = pickup.pickup_deadline - timezone.now()
            hours_remaining = max(1, int(time_remaining.total_seconds() // 3600))
            
            # Create in-app notification
            title = "Pickup Reminder"
            message = f"⏰ Don't forget to collect '{food_name}' from {business.business_name} at {pickup.location.name}. You have {hours_remaining} hour(s) remaining before the deadline."
            
            notification = NotificationService.create_notification(
                recipient=customer,
                notification_type='pickup_reminder',
                title=title,
                message=message,
                sender=business.user,
                business=business,
                data={
                    'pickup_id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'food_listing_name': food_name,
                    'business_name': business.business_name,
                    'pickup_deadline': pickup.pickup_deadline.isoformat(),
                    'hours_remaining': hours_remaining,
                    'location_name': pickup.location.name
                }
            )

            # Update pickup record
            pickup.reminder_sent = True
            pickup.reminder_sent_at = timezone.now()
            pickup.save()

            logger.info(f"Sent pickup reminder to {customer.email} for pickup {pickup.confirmation_code}")
            return notification

        except Exception as e:
            logger.error(f"Failed to send pickup reminder for pickup {pickup.id}: {str(e)}")
            return None

    @staticmethod
    def check_and_send_reminders():
        """Check for orders that need reminders and send them"""
        try:
            # Find orders that are ready but approaching deadline (2 hours before)
            reminder_threshold = timezone.now() + timedelta(hours=2)
            
            pickups_needing_reminder = ScheduledPickup.objects.filter(
                status='ready',
                pickup_deadline__lte=reminder_threshold,
                pickup_deadline__gt=timezone.now(),
                reminder_sent=False
            )
            
            reminder_count = 0
            for pickup in pickups_needing_reminder:
                PickupNotificationService.send_pickup_reminder(pickup)
                reminder_count += 1
            
            logger.info(f"Sent {reminder_count} pickup reminders")
            return reminder_count
            
        except Exception as e:
            logger.error(f"Error checking and sending reminders: {str(e)}")
            return 0

    @staticmethod
    def check_and_mark_missed_pickups():
        """Check for orders past deadline and mark as missed"""
        try:
            missed_pickups = ScheduledPickup.objects.filter(
                status='ready',
                pickup_deadline__lt=timezone.now()
            )
            
            missed_count = 0
            for pickup in missed_pickups:
                pickup.status = 'missed'
                pickup.save()
                
                # Update order status
                pickup.order.status = 'missed'
                pickup.order.save()
                
                missed_count += 1
                logger.info(f"Marked pickup {pickup.confirmation_code} as missed")
            
            return missed_count
            
        except Exception as e:
            logger.error(f"Error checking missed pickups: {str(e)}")
            return 0

    @staticmethod
    def _get_customer_name(user):
        """Get customer display name safely"""
        try:
            if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
                return user.customer_profile.full_name or user.email
            elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
                return user.ngo_profile.organisation_name or user.email
            else:
                return user.get_full_name() or user.email
        except:
            return user.email or 'Unknown'


class PickupAnalyticsService:
    """Service for pickup analytics - simplified"""

    @staticmethod
    def update_daily_analytics(business, target_date=None):
        """Update daily analytics for a business"""
        try:
            if target_date is None:
                target_date = timezone.now().date()
            
            # Get pickups for the date
            pickups = ScheduledPickup.objects.filter(
                location__business=business,
                pickup_date=target_date
            )
            
            # Calculate metrics
            total_orders = pickups.count()
            orders_completed = pickups.filter(status='completed').count()
            orders_missed = pickups.filter(status='missed').count()
            orders_cancelled = pickups.filter(status='cancelled').count()
            
            # Calculate average preparation time for completed orders
            completed_pickups = pickups.filter(
                status='completed',
                actual_ready_time__isnull=False,
                created_at__isnull=False
            )
            
            total_prep_time = timedelta()
            prep_time_count = 0
            
            for pickup in completed_pickups:
                if pickup.actual_ready_time and pickup.created_at:
                    prep_time = pickup.actual_ready_time - pickup.created_at
                    total_prep_time += prep_time
                    prep_time_count += 1
            
            avg_prep_time = None
            if prep_time_count > 0:
                avg_prep_time = total_prep_time / prep_time_count
            
            # Calculate on-time pickup percentage
            on_time_pickups = pickups.filter(
                status='completed',
                actual_pickup_time__lte=F('pickup_deadline')
            ).count()
            
            on_time_percentage = (on_time_pickups / total_orders * 100) if total_orders > 0 else 0
            
            # Update or create analytics record
            analytics, created = PickupAnalytics.objects.update_or_create(
                business=business,
                date=target_date,
                defaults={
                    'total_orders': total_orders,
                    'orders_completed': orders_completed,
                    'orders_missed': orders_missed,
                    'orders_cancelled': orders_cancelled,
                    'average_preparation_time': avg_prep_time,
                    'on_time_pickup_percentage': round(on_time_percentage, 2)
                }
            )
            
            logger.info(f"Updated analytics for {business.business_name} on {target_date}")
            return analytics
            
        except Exception as e:
            logger.error(f"Error updating analytics: {str(e)}")
            return None