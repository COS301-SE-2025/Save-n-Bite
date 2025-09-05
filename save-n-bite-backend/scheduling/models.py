# scheduling/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from authentication.models import FoodProviderProfile
from interactions.models import Order
from food_listings.models import FoodListing
import uuid
from datetime import datetime, time, timedelta

User = get_user_model()

class PickupLocation(models.Model):
    """Pickup locations for businesses - unchanged"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        FoodProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='pickup_locations'
    )
    name = models.CharField(max_length=255, help_text="e.g., 'Main Counter', 'Side Entrance'")
    address = models.TextField()
    instructions = models.TextField(blank=True, help_text="Special pickup instructions")
    contact_person = models.CharField(max_length=255)
    contact_phone = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    
    # Coordinates for mapping (optional)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('business', 'name')

    def __str__(self):
        return f"{self.business.business_name} - {self.name}"


class ScheduledPickup(models.Model):
    """Simplified pickup model without time slots"""
    STATUS_CHOICES = [
        ('pending', 'Pending Preparation'),
        ('ready', 'Ready for Pickup'),
        ('completed', 'Completed'),
        ('missed', 'Missed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(
        Order, 
        on_delete=models.CASCADE, 
        related_name='scheduled_pickup'
    )
    
    # Location for pickup
    location = models.ForeignKey(
        PickupLocation, 
        on_delete=models.CASCADE, 
        related_name='scheduled_pickups'
    )
    
    # Timing - simplified without slots
    pickup_date = models.DateField()
    estimated_ready_time = models.TimeField(null=True, blank=True, help_text="Estimated time when order will be ready")
    actual_ready_time = models.DateTimeField(null=True, blank=True, help_text="When business marked order as ready")
    pickup_deadline = models.DateTimeField(help_text="Deadline for pickup (usually business closing time)")
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    
    # Status and verification
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    confirmation_code = models.CharField(max_length=10, unique=True, blank=True)
    qr_code_data = models.JSONField(blank=True, null=True)
    
    # Communication tracking
    ready_notification_sent = models.BooleanField(default=False)
    ready_notification_sent_at = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    customer_notes = models.TextField(blank=True)
    business_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.confirmation_code:
            self.confirmation_code = self.generate_confirmation_code()
        
        if not self.qr_code_data:
            self.qr_code_data = self.generate_qr_data()
        
        # Calculate pickup deadline from business hours if not set
        if not self.pickup_deadline:
            self.pickup_deadline = self.calculate_pickup_deadline()
        
        super().save(*args, **kwargs)

    def generate_confirmation_code(self):
        """Generate a unique 6-digit confirmation code"""
        import random
        import string
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not ScheduledPickup.objects.filter(confirmation_code=code).exists():
                return code

    def generate_qr_data(self):
        """Generate QR code data for pickup verification"""
        return {
            'pickup_id': str(self.id),
            'order_id': str(self.order.id),
            'confirmation_code': self.confirmation_code,
            'business_id': str(self.location.business.id),
            'pickup_date': str(self.pickup_date),
            'location': self.location.name,
            'generated_at': timezone.now().isoformat()
        }

    def calculate_pickup_deadline(self):
        """Calculate pickup deadline based on business hours"""
        try:
            business_hours = self.location.business.business_hours
            if not business_hours:
                # Default to 6 PM if no business hours specified
                deadline_time = time(18, 0)
            else:
                # Parse business hours - assumes format like "Mon-Fri: 9AM-6PM" 
                # Extract closing time (simplified parsing)
                if 'PM' in business_hours:
                    # Extract the last time mentioned
                    import re
                    times = re.findall(r'(\d{1,2})PM', business_hours)
                    if times:
                        closing_hour = int(times[-1])
                        if closing_hour != 12:  # Convert PM to 24-hour format
                            closing_hour += 12
                        deadline_time = time(closing_hour, 0)
                    else:
                        deadline_time = time(18, 0)  # Default
                else:
                    deadline_time = time(18, 0)  # Default
            
            return timezone.make_aware(
                datetime.combine(self.pickup_date, deadline_time)
            )
        except:
            # Fallback to 6 PM on pickup date
            return timezone.make_aware(
                datetime.combine(self.pickup_date, time(18, 0))
            )

    @property
    def is_upcoming(self):
        """Check if pickup is in the future"""
        return self.pickup_deadline > timezone.now()

    @property
    def is_today(self):
        """Check if pickup is today"""
        return self.pickup_date == timezone.now().date()

    @property
    def is_overdue(self):
        """Check if pickup deadline has passed"""
        return timezone.now() > self.pickup_deadline and self.status not in ['completed', 'missed', 'cancelled']

    @property
    def food_listing(self):
        """Get the food listing from the order"""
        # Get first food listing from order items
        first_item = self.order.interaction.items.first()
        return first_item.food_listing if first_item else None

    def mark_ready_for_pickup(self):
        """Mark order as ready and send notification"""
        if self.status != 'pending':
            raise ValidationError("Can only mark pending orders as ready")
        
        self.status = 'ready'
        self.actual_ready_time = timezone.now()
        self.save()
        
        # Send notification via notifications app
        try:
            from notifications.services import NotificationService
            NotificationService.send_order_ready_notification(self)
        except Exception as e:
            # Log error but don't fail the status update
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send ready notification for pickup {self.id}: {str(e)}")

    def __str__(self):
        food_name = self.food_listing.name if self.food_listing else 'Unknown Food'
        return f"Pickup {self.confirmation_code} - {food_name} on {self.pickup_date}"


# Keep analytics model but simplified
class PickupAnalytics(models.Model):
    """Daily pickup analytics for businesses - simplified"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        FoodProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='pickup_analytics'
    )
    
    date = models.DateField()
    
    # Basic metrics
    total_orders = models.PositiveIntegerField(default=0)
    orders_ready = models.PositiveIntegerField(default=0)
    orders_completed = models.PositiveIntegerField(default=0)
    orders_missed = models.PositiveIntegerField(default=0)
    orders_cancelled = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    average_preparation_time = models.DurationField(null=True, blank=True)
    on_time_pickup_percentage = models.FloatField(default=0.0)
    customer_satisfaction_rating = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('business', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Analytics for {self.business.business_name} on {self.date}"


# Remove these models completely:
# - FoodListingPickupSchedule
# - PickupTimeSlot 
# - PickupOptimization