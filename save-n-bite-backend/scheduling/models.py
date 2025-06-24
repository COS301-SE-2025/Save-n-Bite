# scheduling/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from authentication.models import FoodProviderProfile
from interactions.models import Order
import uuid
from datetime import datetime, timedelta, time

User = get_user_model()

class PickupLocation(models.Model):
    """Pickup locations for businesses"""
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

class PickupTimeSlot(models.Model):
    """Available pickup time slots for businesses"""
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        FoodProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='pickup_time_slots'
    )
    location = models.ForeignKey(
        PickupLocation, 
        on_delete=models.CASCADE, 
        related_name='time_slots'
    )
    
    # Time configuration
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration = models.DurationField(default=timedelta(minutes=30))
    max_orders_per_slot = models.PositiveIntegerField(default=10)
    
    # Scheduling preferences
    buffer_time = models.DurationField(
        default=timedelta(minutes=5), 
        help_text="Buffer time between pickups"
    )
    advance_booking_hours = models.PositiveIntegerField(
        default=2, 
        help_text="Minimum hours in advance for booking"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('business', 'location', 'day_of_week', 'start_time')
        ordering = ['day_of_week', 'start_time']

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time")
        
        if self.location.business != self.business:
            raise ValidationError("Location must belong to the same business")

    def __str__(self):
        day_name = dict(self.DAYS_OF_WEEK)[self.day_of_week]
        return f"{self.business.business_name} - {day_name} {self.start_time}-{self.end_time}"

class ScheduledPickup(models.Model):
    """Individual scheduled pickup appointments"""
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
    time_slot = models.ForeignKey(
        PickupTimeSlot, 
        on_delete=models.CASCADE, 
        related_name='scheduled_pickups'
    )
    location = models.ForeignKey(
        PickupLocation, 
        on_delete=models.CASCADE, 
        related_name='scheduled_pickups'
    )
    
    # Scheduled time details
    scheduled_date = models.DateField()
    scheduled_start_time = models.TimeField()
    scheduled_end_time = models.TimeField()
    
    # Actual pickup details
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    pickup_notes = models.TextField(blank=True)
    
    # Status and verification
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    confirmation_code = models.CharField(max_length=10, unique=True)
    qr_code_data = models.JSONField(default=dict, blank=True)
    
    # Notifications tracking
    reminder_sent = models.BooleanField(default=False)
    confirmation_sent = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_date', 'scheduled_start_time']
        indexes = [
            models.Index(fields=['scheduled_date', 'status']),
            models.Index(fields=['confirmation_code']),
        ]

    def clean(self):
        if self.scheduled_start_time >= self.scheduled_end_time:
            raise ValidationError("Start time must be before end time")
        
        # Validate that scheduled time falls within time slot
        if (self.scheduled_start_time < self.time_slot.start_time or 
            self.scheduled_end_time > self.time_slot.end_time):
            raise ValidationError("Scheduled time must be within the time slot")

    def save(self, *args, **kwargs):
        if not self.confirmation_code:
            self.confirmation_code = self.generate_confirmation_code()
        if not self.qr_code_data:
            self.qr_code_data = self.generate_qr_data()
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

    def __str__(self):
        return f"Pickup {self.confirmation_code} - {self.scheduled_date} {self.scheduled_start_time}"

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
    peak_hours_start = models.TimeField(default=time(17, 0))  # 5 PM
    peak_hours_end = models.TimeField(default=time(19, 0))    # 7 PM
    
    # Historical data for optimization
    average_pickup_duration = models.DurationField(default=timedelta(minutes=10))
    peak_day_demand = models.JSONField(default=dict, blank=True)  # {day: avg_pickups}
    efficiency_score = models.FloatField(default=0.0)
    
    # Auto-optimization settings
    auto_optimize = models.BooleanField(default=True)
    last_optimization = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Optimization for {self.business.business_name}"

class PickupAnalytics(models.Model):
    """Track pickup performance analytics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        FoodProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='pickup_analytics'
    )
    
    # Date and metrics
    date = models.DateField()
    total_scheduled = models.PositiveIntegerField(default=0)
    total_completed = models.PositiveIntegerField(default=0)
    total_missed = models.PositiveIntegerField(default=0)
    total_cancelled = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    average_pickup_duration = models.DurationField(null=True, blank=True)
    on_time_percentage = models.FloatField(default=0.0)
    customer_satisfaction_score = models.FloatField(default=0.0)
    
    # Operational insights
    peak_hour = models.TimeField(null=True, blank=True)
    busiest_location = models.CharField(max_length=255, blank=True)
    efficiency_score = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('business', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Analytics for {self.business.business_name} - {self.date}"