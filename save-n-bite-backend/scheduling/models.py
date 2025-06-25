# scheduling/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from authentication.models import FoodProviderProfile
from interactions.models import Order
from food_listings.models import FoodListing
import uuid
from datetime import datetime, timedelta, time

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


class FoodListingPickupSchedule(models.Model):
    """Pickup schedule specific to a food listing"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    food_listing = models.OneToOneField(
        FoodListing,
        on_delete=models.CASCADE,
        related_name='pickup_schedule'
    )
    location = models.ForeignKey(
        PickupLocation,
        on_delete=models.CASCADE,
        related_name='food_listing_schedules'
    )
    
    # Pickup window from food listing (e.g., "17:00-19:00")
    pickup_window = models.CharField(max_length=50)
    
    # How many time slots to create within the window
    total_slots = models.PositiveIntegerField(default=4, help_text="Number of time slots within the pickup window")
    
    # Maximum orders per slot
    max_orders_per_slot = models.PositiveIntegerField(default=5)
    
    # Buffer time between slots (in minutes)
    slot_buffer_minutes = models.PositiveIntegerField(default=5)
    
    # Whether this schedule is active
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        # Validate that the location belongs to the same business as the food listing
        if self.location.business != self.food_listing.provider.provider_profile:
            raise ValidationError("Pickup location must belong to the same business that owns the food listing")
        
        # Validate pickup window format
        try:
            start_time, end_time = self.pickup_window.split('-')
            datetime.strptime(start_time, '%H:%M')
            datetime.strptime(end_time, '%H:%M')
        except (ValueError, AttributeError):
            raise ValidationError("Pickup window must be in format 'HH:MM-HH:MM'")

    @property
    def start_time(self):
        """Extract start time from pickup window"""
        try:
            start_str = self.pickup_window.split('-')[0]
            return datetime.strptime(start_str, '%H:%M').time()
        except (ValueError, IndexError):
            return None

    @property
    def end_time(self):
        """Extract end time from pickup window"""
        try:
            end_str = self.pickup_window.split('-')[1]
            return datetime.strptime(end_str, '%H:%M').time()
        except (ValueError, IndexError):
            return None

    @property
    def window_duration_minutes(self):
        """Calculate total duration of pickup window in minutes"""
        if self.start_time and self.end_time:
            start_datetime = datetime.combine(datetime.today(), self.start_time)
            end_datetime = datetime.combine(datetime.today(), self.end_time)
            
            # Handle cases where end time is next day
            if end_datetime <= start_datetime:
                end_datetime += timedelta(days=1)
            
            return int((end_datetime - start_datetime).total_seconds() / 60)
        return 0

    @property
    def slot_duration_minutes(self):
        """Calculate duration of each slot in minutes"""
        if self.total_slots > 0:
            return max(1, (self.window_duration_minutes - (self.total_slots - 1) * self.slot_buffer_minutes) // self.total_slots)
        return 0

    def generate_time_slots(self):
        """Generate individual time slots based on the pickup window and configuration"""
        if not self.start_time or not self.end_time:
            return []

        slots = []
        current_time = datetime.combine(datetime.today(), self.start_time)
        slot_duration = timedelta(minutes=self.slot_duration_minutes)
        buffer_duration = timedelta(minutes=self.slot_buffer_minutes)

        for i in range(self.total_slots):
            slot_start = current_time.time()
            slot_end = (current_time + slot_duration).time()
            
            slots.append({
                'slot_number': i + 1,
                'start_time': slot_start,
                'end_time': slot_end,
                'max_orders': self.max_orders_per_slot
            })
            
            # Move to next slot (add duration + buffer)
            current_time += slot_duration + buffer_duration
            
            # Break if we exceed the pickup window
            if current_time.time() > self.end_time:
                break

        return slots

    def __str__(self):
        return f"Pickup schedule for {self.food_listing.name} ({self.pickup_window})"


class PickupTimeSlot(models.Model):
    """Individual time slots generated from FoodListingPickupSchedule"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pickup_schedule = models.ForeignKey(
        FoodListingPickupSchedule,
        on_delete=models.CASCADE,
        related_name='time_slots'
    )
    
    # Slot details
    slot_number = models.PositiveIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    max_orders_per_slot = models.PositiveIntegerField(default=5)  # Added default value
    
    # Date for which this slot applies
    date = models.DateField()
    
    # Tracking
    current_bookings = models.PositiveIntegerField(default=0)  # This should already have default=0
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('pickup_schedule', 'date', 'slot_number')
        ordering = ['date', 'start_time']

    @property
    def is_available(self):
        """Check if slot has availability"""
        # Add None checks to prevent the error
        current = self.current_bookings or 0
        max_orders = self.max_orders_per_slot or 0
        return self.is_active and current < max_orders

    @property
    def available_spots(self):
        """Number of available booking spots"""
        # Add None checks to prevent the error
        current = self.current_bookings or 0
        max_orders = self.max_orders_per_slot or 0
        return max(0, max_orders - current)

    def __str__(self):
        return f"Slot {self.slot_number} for {self.pickup_schedule.food_listing.name} on {self.date} ({self.start_time}-{self.end_time})"


class ScheduledPickup(models.Model):
    """Individual scheduled pickup appointments - updated to reference food listing"""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
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
    
    # NEW: Link to specific food listing and its pickup schedule
    food_listing = models.ForeignKey(
        FoodListing,
        on_delete=models.CASCADE,
        related_name='scheduled_pickups'
    )
    time_slot = models.ForeignKey(
        PickupTimeSlot,
        on_delete=models.CASCADE,
        related_name='scheduled_pickups'
    )
    
    # Location (derived from time_slot but kept for quick access)
    location = models.ForeignKey(
        PickupLocation, 
        on_delete=models.CASCADE, 
        related_name='scheduled_pickups'
    )
    
    # Timing
    scheduled_date = models.DateField()
    scheduled_start_time = models.TimeField()
    scheduled_end_time = models.TimeField()
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    
    # Status and verification
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    confirmation_code = models.CharField(max_length=10, unique=True, blank=True)
    qr_code_data = models.JSONField(blank=True, null=True)
    
    # Communication
    reminder_sent = models.BooleanField(default=False)
    customer_notes = models.TextField(blank=True)
    business_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.confirmation_code:
            self.confirmation_code = self.generate_confirmation_code()
        
        if not self.qr_code_data:
            self.qr_code_data = self.generate_qr_data()
        
        # Ensure location matches the time slot's location
        if self.time_slot:
            self.location = self.time_slot.pickup_schedule.location
            
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
            'food_listing_id': str(self.food_listing.id),
            'confirmation_code': self.confirmation_code,
            'business_id': str(self.location.business.id),
            'scheduled_time': f"{self.scheduled_date} {self.scheduled_start_time}",
            'location': self.location.name,
            'generated_at': timezone.now().isoformat()
        }

    @property
    def is_upcoming(self):
        """Check if pickup is in the future"""
        scheduled_datetime = timezone.make_aware(
            datetime.combine(self.scheduled_date, self.scheduled_start_time)
        )
        return scheduled_datetime > timezone.now()

    @property
    def is_today(self):
        """Check if pickup is today"""
        return self.scheduled_date == timezone.now().date()

    def clean(self):
        # Ensure the food listing matches the time slot's food listing
        if self.time_slot and self.food_listing != self.time_slot.pickup_schedule.food_listing:
            raise ValidationError("Food listing must match the time slot's food listing")

    def __str__(self):
        return f"Pickup {self.confirmation_code} - {self.food_listing.name} on {self.scheduled_date} {self.scheduled_start_time}"


# Keep existing models as they are
class PickupOptimization(models.Model):
    """Store optimization settings and results for pickup scheduling"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField(
        FoodProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='pickup_optimization'
    )
    
    # Optimization settings
    max_concurrent_pickups = models.PositiveIntegerField(default=3)
    optimal_pickup_duration = models.DurationField(default=timedelta(minutes=15))
    peak_hours_start = models.TimeField(default=time(17, 0))
    peak_hours_end = models.TimeField(default=time(19, 0))
    
    # Automation settings
    auto_optimize = models.BooleanField(default=False)
    auto_send_reminders = models.BooleanField(default=True)
    reminder_hours_before = models.PositiveIntegerField(default=1)
    
    # Analytics
    last_optimization = models.DateTimeField(null=True, blank=True)
    optimization_score = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pickup optimization for {self.business.business_name}"


class PickupAnalytics(models.Model):
    """Daily pickup analytics for businesses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        FoodProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='pickup_analytics'
    )
    
    date = models.DateField()
    
    # Basic metrics
    total_scheduled = models.PositiveIntegerField(default=0)
    total_completed = models.PositiveIntegerField(default=0)
    total_missed = models.PositiveIntegerField(default=0)
    total_cancelled = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    on_time_percentage = models.FloatField(default=0.0)
    average_pickup_duration = models.DurationField(null=True, blank=True)
    customer_satisfaction_rating = models.FloatField(null=True, blank=True)
    
    # Efficiency metrics
    slot_utilization_rate = models.FloatField(default=0.0)
    peak_hour_efficiency = models.FloatField(default=0.0)
    efficiency_score = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('business', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Analytics for {self.business.business_name} on {self.date}"