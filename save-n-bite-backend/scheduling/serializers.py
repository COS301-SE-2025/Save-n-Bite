# scheduling/serializers.py

from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, date, time
from .models import (
    PickupLocation, FoodListingPickupSchedule, PickupTimeSlot, 
    ScheduledPickup, PickupOptimization, PickupAnalytics
)
from food_listings.models import FoodListing
from interactions.models import Order


class PickupLocationSerializer(serializers.ModelSerializer):
    """Serializer for pickup locations - unchanged"""
    
    class Meta:
        model = PickupLocation
        fields = [
            'id', 'name', 'address', 'instructions', 'contact_person',
            'contact_phone', 'latitude', 'longitude', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        business = self.context.get('business')
        if business and 'name' in data:
            # Check for duplicate names within the same business
            existing = PickupLocation.objects.filter(
                business=business, 
                name=data['name']
            ).exclude(id=self.instance.id if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError({
                    'name': 'A pickup location with this name already exists for your business.'
                })
        
        return data


class FoodListingPickupScheduleSerializer(serializers.ModelSerializer):
    """Serializer for food listing pickup schedules"""
    
    food_listing_name = serializers.CharField(source='food_listing.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    business_name = serializers.CharField(source='location.business.business_name', read_only=True)
    
    # Computed fields
    start_time = serializers.ReadOnlyField()
    end_time = serializers.ReadOnlyField()
    window_duration_minutes = serializers.ReadOnlyField()
    slot_duration_minutes = serializers.ReadOnlyField()
    generated_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodListingPickupSchedule
        fields = [
            'id', 'food_listing', 'food_listing_name', 'location', 'location_name',
            'business_name', 'pickup_window', 'total_slots', 'max_orders_per_slot',
            'slot_buffer_minutes', 'is_active', 'start_time', 'end_time',
            'window_duration_minutes', 'slot_duration_minutes', 'generated_slots',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_generated_slots(self, obj):
        """Get the time slots that would be generated for this schedule"""
        return obj.generate_time_slots()

    def validate_pickup_window(self, value):
        """Validate the pickup window format"""
        try:
            start_str, end_str = value.split('-')
            start_time = datetime.strptime(start_str.strip(), '%H:%M').time()
            end_time = datetime.strptime(end_str.strip(), '%H:%M').time()
            
            if start_time >= end_time:
                raise serializers.ValidationError("Start time must be before end time")
            
            return value
        except (ValueError, AttributeError):
            raise serializers.ValidationError("Pickup window must be in format 'HH:MM-HH:MM'")

    def validate(self, data):
        """Validate that location belongs to the same business as food listing"""
        food_listing = data.get('food_listing')
        location = data.get('location')
        
        if food_listing and location:
            if location.business != food_listing.provider.provider_profile:
                raise serializers.ValidationError({
                    'location': 'Pickup location must belong to the same business that owns the food listing'
                })
        
        return data


class PickupTimeSlotSerializer(serializers.ModelSerializer):
    """Serializer for individual time slots"""
    
    food_listing_name = serializers.CharField(source='pickup_schedule.food_listing.name', read_only=True)
    location_name = serializers.CharField(source='pickup_schedule.location.name', read_only=True)
    is_available = serializers.ReadOnlyField()
    available_spots = serializers.ReadOnlyField()
    
    class Meta:
        model = PickupTimeSlot
        fields = [
            'id', 'pickup_schedule', 'slot_number', 'start_time', 'end_time',
            'max_orders_per_slot', 'date', 'current_bookings', 'is_active',
            'food_listing_name', 'location_name', 'is_available', 'available_spots',
            'created_at'
        ]
        read_only_fields = ['id', 'current_bookings', 'created_at']


class AvailableSlotSerializer(serializers.ModelSerializer):
    """Serializer for available pickup slots (customer view)"""
    
    food_listing = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = PickupTimeSlot
        fields = [
            'id', 'slot_number', 'start_time', 'end_time', 'date',
            'available_spots', 'food_listing', 'location'
        ]
    
    def get_food_listing(self, obj):
        """Get food listing information"""
        listing = obj.pickup_schedule.food_listing
        return {
            'id': listing.id,
            'name': listing.name,
            'description': listing.description,
            'pickup_window': listing.pickup_window
        }
    
    def get_location(self, obj):
        """Get location information"""
        location = obj.pickup_schedule.location
        return {
            'id': location.id,
            'name': location.name,
            'address': location.address,
            'instructions': location.instructions,
            'contact_person': location.contact_person,
            'contact_phone': location.contact_phone
        }


class SchedulePickupSerializer(serializers.Serializer):
    """Serializer for scheduling a pickup"""
    
    food_listing_id = serializers.UUIDField()
    time_slot_id = serializers.UUIDField()
    date = serializers.DateField()
    customer_notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_food_listing_id(self, value):
        """Validate food listing exists and is available"""
        try:
            listing = FoodListing.objects.get(id=value, status='active')
            if listing.quantity_available <= 0:
                raise serializers.ValidationError("This food listing is no longer available")
            return value
        except FoodListing.DoesNotExist:
            raise serializers.ValidationError("Food listing not found or inactive")
    
    def validate_time_slot_id(self, value):
        """Validate time slot exists and is available"""
        try:
            slot = PickupTimeSlot.objects.get(id=value, is_active=True)
            if not slot.is_available:
                raise serializers.ValidationError("This time slot is no longer available")
            return value
        except PickupTimeSlot.DoesNotExist:
            raise serializers.ValidationError("Time slot not found or inactive")
    
    def validate_date(self, value):
        """Validate date is not in the past"""
        if value < timezone.now().date():
            raise serializers.ValidationError("Cannot schedule pickup for past dates")
        return value
    
    def validate(self, data):
        """Cross-validate the data"""
        try:
            food_listing = FoodListing.objects.get(id=data['food_listing_id'])
            time_slot = PickupTimeSlot.objects.get(id=data['time_slot_id'])
            
            # Ensure time slot belongs to the food listing
            if time_slot.pickup_schedule.food_listing != food_listing:
                raise serializers.ValidationError({
                    'time_slot_id': 'Time slot does not belong to the specified food listing'
                })
            
            # Ensure the date matches the time slot date
            if time_slot.date != data['date']:
                raise serializers.ValidationError({
                    'date': 'Date does not match the time slot date'
                })
            
        except (FoodListing.DoesNotExist, PickupTimeSlot.DoesNotExist):
            pass  # Already handled in individual field validators
        
        return data


class ScheduledPickupSerializer(serializers.ModelSerializer):
    """Serializer for scheduled pickups"""
    
    customer = serializers.SerializerMethodField()
    food_listing = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    is_upcoming = serializers.ReadOnlyField()
    is_today = serializers.ReadOnlyField()
    
    class Meta:
        model = ScheduledPickup
        fields = [
            'id', 'order', 'food_listing', 'time_slot', 'location',
            'scheduled_date', 'scheduled_start_time', 'scheduled_end_time',
            'actual_pickup_time', 'status', 'confirmation_code',
            'customer', 'customer_notes', 'business_notes',
            'is_upcoming', 'is_today', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'confirmation_code', 'qr_code_data', 'is_upcoming', 
            'is_today', 'created_at', 'updated_at'
        ]
    
    def get_customer(self, obj):
        """Get customer information"""
        user = obj.order.interaction.user
        return {
            'id': user.id,
            'full_name': getattr(user.customer_profile, 'full_name', ''),
            'email': user.email,
            'phone': getattr(user.customer_profile, 'phone_number', '')
        }
    
    def get_food_listing(self, obj):
        """Get food listing information"""
        listing = obj.food_listing
        return {
            'id': listing.id,
            'name': listing.name,
            'description': listing.description,
            'quantity': obj.order.total_quantity,
            'pickup_window': listing.pickup_window
        }
    
    def get_location(self, obj):
        """Get pickup location information"""
        location = obj.location
        return {
            'id': location.id,
            'name': location.name,
            'address': location.address,
            'instructions': location.instructions,
            'contact_person': location.contact_person,
            'contact_phone': location.contact_phone
        }


class PickupVerificationSerializer(serializers.Serializer):
    """Serializer for pickup verification"""
    
    confirmation_code = serializers.CharField(max_length=10)
    
    def validate_confirmation_code(self, value):
        """Validate confirmation code exists"""
        business = self.context.get('business')
        
        try:
            pickup = ScheduledPickup.objects.get(
                confirmation_code=value,
                location__business=business,
                status__in=['scheduled', 'confirmed']
            )
            return value
        except ScheduledPickup.DoesNotExist:
            raise serializers.ValidationError("Invalid confirmation code or pickup not found")


class QRCodeVerificationSerializer(serializers.Serializer):
    """Serializer for QR code verification"""
    
    qr_data = serializers.JSONField()
    
    def validate_qr_data(self, value):
        """Validate QR code data"""
        required_fields = ['pickup_id', 'confirmation_code', 'business_id']
        
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"QR code missing required field: {field}")
        
        business = self.context.get('business')
        if str(business.id) != value.get('business_id'):
            raise serializers.ValidationError("QR code is not for this business")
        
        return value


class BusinessScheduleOverviewSerializer(serializers.Serializer):
    """Serializer for business schedule overview"""
    
    date = serializers.DateField()
    total_pickups = serializers.IntegerField()
    completed_pickups = serializers.IntegerField()
    pending_pickups = serializers.IntegerField()
    missed_pickups = serializers.IntegerField()
    pickups_by_hour = serializers.DictField()
    food_listings_with_pickups = serializers.ListField()


class CustomerScheduleSerializer(serializers.ModelSerializer):
    """Serializer for customer's pickup schedule"""
    
    food_listing = serializers.SerializerMethodField()
    business = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduledPickup
        fields = [
            'id', 'scheduled_date', 'scheduled_start_time', 'scheduled_end_time',
            'status', 'confirmation_code', 'food_listing', 'business',
            'location', 'customer_notes', 'is_upcoming', 'is_today'
        ]
    
    def get_food_listing(self, obj):
        """Get food listing information"""
        return {
            'id': obj.food_listing.id,
            'name': obj.food_listing.name,
            'description': obj.food_listing.description,
            'pickup_window': obj.food_listing.pickup_window,
            'expiry_date': obj.food_listing.expiry_date
        }
    
    def get_business(self, obj):
        """Get business information"""
        business = obj.location.business
        return {
            'id': business.id,
            'business_name': business.business_name,
            'business_address': business.business_address,
            'business_contact': business.business_contact
        }
    
    def get_location(self, obj):
        """Get pickup location information"""
        return {
            'id': obj.location.id,
            'name': obj.location.name,
            'address': obj.location.address,
            'instructions': obj.location.instructions,
            'contact_person': obj.location.contact_person,
            'contact_phone': obj.location.contact_phone
        }


class PickupHistorySerializer(serializers.ModelSerializer):
    """Serializer for pickup history"""
    
    food_listing_name = serializers.CharField(source='food_listing.name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    location_name = serializers.CharField(source='location.name', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduledPickup
        fields = [
            'id', 'scheduled_date', 'scheduled_start_time', 'scheduled_end_time',
            'actual_pickup_time', 'status', 'confirmation_code',
            'food_listing_name', 'customer_name', 'location_name',
            'duration', 'customer_notes', 'business_notes'
        ]
    
    def get_customer_name(self, obj):
        """Get customer name"""
        return getattr(obj.order.interaction.user.customer_profile, 'full_name', 'Unknown')
    
    def get_duration(self, obj):
        """Calculate pickup duration if completed"""
        if obj.actual_pickup_time and obj.status == 'completed':
            scheduled_datetime = timezone.make_aware(
                datetime.combine(obj.scheduled_date, obj.scheduled_start_time)
            )
            duration = obj.actual_pickup_time - scheduled_datetime
            return int(duration.total_seconds() / 60)  # Return in minutes
        return None


class PickupOptimizationSerializer(serializers.ModelSerializer):
    """Serializer for pickup optimization settings"""
    
    class Meta:
        model = PickupOptimization
        fields = [
            'id', 'max_concurrent_pickups', 'optimal_pickup_duration',
            'peak_hours_start', 'peak_hours_end', 'auto_optimize',
            'auto_send_reminders', 'reminder_hours_before',
            'last_optimization', 'optimization_score'
        ]
        read_only_fields = ['id', 'last_optimization', 'optimization_score']


class PickupAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for pickup analytics"""
    
    completion_rate = serializers.SerializerMethodField()
    no_show_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = PickupAnalytics
        fields = [
            'id', 'date', 'total_scheduled', 'total_completed', 'total_missed',
            'total_cancelled', 'on_time_percentage', 'average_pickup_duration',
            'customer_satisfaction_rating', 'slot_utilization_rate',
            'peak_hour_efficiency', 'efficiency_score', 'completion_rate',
            'no_show_rate'
        ]
        read_only_fields = ['id']
    
    def get_completion_rate(self, obj):
        """Calculate completion rate"""
        if obj.total_scheduled > 0:
            return round((obj.total_completed / obj.total_scheduled) * 100, 2)
        return 0.0
    
    def get_no_show_rate(self, obj):
        """Calculate no-show rate"""
        if obj.total_scheduled > 0:
            return round((obj.total_missed / obj.total_scheduled) * 100, 2)
        return 0.0


# Additional serializers for specific use cases

class CreatePickupScheduleSerializer(serializers.Serializer):
    """Serializer for creating pickup schedule when creating food listing"""
    
    location_id = serializers.UUIDField()
    pickup_window = serializers.CharField(max_length=50)
    total_slots = serializers.IntegerField(min_value=1, max_value=20, default=4)
    max_orders_per_slot = serializers.IntegerField(min_value=1, max_value=50, default=5)
    slot_buffer_minutes = serializers.IntegerField(min_value=0, max_value=60, default=5)
    
    def validate_location_id(self, value):
        """Validate location exists and is active"""
        try:
            location = PickupLocation.objects.get(id=value, is_active=True)
            return value
        except PickupLocation.DoesNotExist:
            raise serializers.ValidationError("Pickup location not found or inactive")
    
    def validate_pickup_window(self, value):
        """Validate pickup window format"""
        try:
            start_str, end_str = value.split('-')
            start_time = datetime.strptime(start_str.strip(), '%H:%M').time()
            end_time = datetime.strptime(end_str.strip(), '%H:%M').time()
            
            if start_time >= end_time:
                raise serializers.ValidationError("Start time must be before end time")
            
            return value
        except (ValueError, AttributeError):
            raise serializers.ValidationError("Pickup window must be in format 'HH:MM-HH:MM'")


class GenerateTimeSlotsSerializer(serializers.Serializer):
    """Serializer for generating time slots for a specific date"""
    
    food_listing_id = serializers.UUIDField()
    date = serializers.DateField()
    
    def validate_food_listing_id(self, value):
        """Validate food listing has a pickup schedule"""
        try:
            listing = FoodListing.objects.get(id=value, status='active')
            if not hasattr(listing, 'pickup_schedule'):
                raise serializers.ValidationError("Food listing does not have a pickup schedule configured")
            return value
        except FoodListing.DoesNotExist:
            raise serializers.ValidationError("Food listing not found or inactive")
    
    def validate_date(self, value):
        """Validate date is not in the past"""
        if value < timezone.now().date():
            raise serializers.ValidationError("Cannot generate slots for past dates")
        return value