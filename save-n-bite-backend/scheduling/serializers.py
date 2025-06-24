# scheduling/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    PickupLocation, PickupTimeSlot, ScheduledPickup, 
    PickupOptimization, PickupAnalytics
)
from interactions.models import Order
from datetime import datetime, time

User = get_user_model()

class PickupLocationSerializer(serializers.ModelSerializer):
    """Serializer for pickup locations"""
    
    class Meta:
        model = PickupLocation
        fields = [
            'id', 'name', 'address', 'instructions', 'contact_person', 
            'contact_phone', 'latitude', 'longitude', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        """Ensure location name is unique for the business"""
        business = self.context.get('business')
        if business:
            existing = PickupLocation.objects.filter(
                business=business, 
                name=value
            ).exclude(id=self.instance.id if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError(
                    "A pickup location with this name already exists for your business"
                )
        return value

class PickupTimeSlotSerializer(serializers.ModelSerializer):
    """Serializer for pickup time slots"""
    location_name = serializers.CharField(source='location.name', read_only=True)
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = PickupTimeSlot
        fields = [
            'id', 'location', 'location_name', 'day_of_week', 'day_name',
            'start_time', 'end_time', 'slot_duration', 'max_orders_per_slot',
            'buffer_time', 'advance_booking_hours', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'location_name', 'day_name']

    def validate(self, data):
        """Validate time slot data"""
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time")
        
        # Validate location belongs to the business
        location = data.get('location')
        business = self.context.get('business')
        if business and location and location.business != business:
            raise serializers.ValidationError("Location must belong to your business")
        
        return data

class AvailableSlotSerializer(serializers.Serializer):
    """Serializer for available pickup slots"""
    time_slot_id = serializers.UUIDField()
    location_id = serializers.UUIDField()
    location_name = serializers.CharField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    date = serializers.DateField()
    available_capacity = serializers.IntegerField()

class SchedulePickupSerializer(serializers.Serializer):
    """Serializer for scheduling a pickup"""
    order_id = serializers.UUIDField()
    time_slot_id = serializers.UUIDField()
    location_id = serializers.UUIDField()
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    special_instructions = serializers.CharField(required=False, allow_blank=True)

    def validate_order_id(self, value):
        """Validate order exists and belongs to user"""
        user = self.context.get('user')
        try:
            order = Order.objects.get(id=value, interaction__user=user)
            if hasattr(order, 'scheduled_pickup'):
                raise serializers.ValidationError("This order already has a scheduled pickup")
            return value
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found")

    def validate_date(self, value):
        """Validate pickup date is not in the past"""
        if value < datetime.now().date():
            raise serializers.ValidationError("Cannot schedule pickup for past dates")
        return value

class ScheduledPickupSerializer(serializers.ModelSerializer):
    """Serializer for scheduled pickups"""
    order_details = serializers.SerializerMethodField()
    location_details = serializers.SerializerMethodField()
    customer_details = serializers.SerializerMethodField()
    qr_code_image = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_today = serializers.BooleanField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)

    class Meta:
        model = ScheduledPickup
        fields = [
            'id', 'order_details', 'location_details', 'customer_details',
            'scheduled_date', 'scheduled_start_time', 'scheduled_end_time',
            'actual_pickup_time', 'pickup_notes', 'status', 'status_display',
            'confirmation_code', 'qr_code_data', 'qr_code_image',
            'reminder_sent', 'confirmation_sent', 'is_today', 'is_upcoming',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'confirmation_code', 'qr_code_data', 'reminder_sent',
            'confirmation_sent', 'created_at', 'updated_at'
        ]

    def get_order_details(self, obj):
        """Get order information"""
        order = obj.order
        interaction = order.interaction
        
        return {
            'order_id': str(order.id),
            'total_amount': float(interaction.total_amount),
            'item_count': interaction.items.count(),
            'items': [
                {
                    'name': item.name,
                    'quantity': item.quantity,
                    'price': float(item.price_per_item)
                }
                for item in interaction.items.all()
            ]
        }

    def get_location_details(self, obj):
        """Get pickup location information"""
        location = obj.location
        return {
            'id': str(location.id),
            'name': location.name,
            'address': location.address,
            'instructions': location.instructions,
            'contact_person': location.contact_person,
            'contact_phone': location.contact_phone
        }

    def get_customer_details(self, obj):
        """Get customer information"""
        user = obj.order.interaction.user
        
        customer_data = {
            'id': str(user.UserID),
            'email': user.email,
            'user_type': user.user_type,
            'name': None
        }
        
        if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
            customer_data['name'] = user.customer_profile.full_name
        elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
            customer_data['name'] = user.ngo_profile.organisation_name
        
        return customer_data

    def get_qr_code_image(self, obj):
        """Get QR code image for pickup"""
        try:
            from .services import PickupSchedulingService
            return PickupSchedulingService.generate_qr_code(obj)
        except Exception:
            return None

class PickupVerificationSerializer(serializers.Serializer):
    """Serializer for pickup verification"""
    confirmation_code = serializers.CharField(max_length=10)
    completion_notes = serializers.CharField(required=False, allow_blank=True)

    def validate_confirmation_code(self, value):
        """Validate confirmation code format"""
        if len(value) != 6:
            raise serializers.ValidationError("Confirmation code must be 6 characters")
        return value.upper()

class QRCodeVerificationSerializer(serializers.Serializer):
    """Serializer for QR code verification"""
    qr_data = serializers.JSONField()
    completion_notes = serializers.CharField(required=False, allow_blank=True)

    def validate_qr_data(self, value):
        """Validate QR code data structure"""
        required_fields = ['pickup_id', 'order_id', 'confirmation_code', 'business_id']
        
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"QR code missing required field: {field}")
        
        return value

class PickupOptimizationSerializer(serializers.ModelSerializer):
    """Serializer for pickup optimization settings"""
    
    class Meta:
        model = PickupOptimization
        fields = [
            'id', 'max_concurrent_pickups', 'optimal_pickup_duration',
            'peak_hours_start', 'peak_hours_end', 'average_pickup_duration',
            'peak_day_demand', 'efficiency_score', 'auto_optimize',
            'last_optimization', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'average_pickup_duration', 'peak_day_demand', 
            'efficiency_score', 'last_optimization', 'created_at', 'updated_at'
        ]

class PickupAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for pickup analytics"""
    completion_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = PickupAnalytics
        fields = [
            'id', 'date', 'total_scheduled', 'total_completed', 
            'total_missed', 'total_cancelled', 'completion_rate',
            'average_pickup_duration', 'on_time_percentage', 
            'customer_satisfaction_score', 'peak_hour', 
            'busiest_location', 'efficiency_score', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_completion_rate(self, obj):
        """Calculate completion rate percentage"""
        if obj.total_scheduled == 0:
            return 0
        return round((obj.total_completed / obj.total_scheduled) * 100, 2)

class BusinessScheduleOverviewSerializer(serializers.Serializer):
    """Serializer for business schedule overview"""
    date = serializers.DateField()
    total_pickups = serializers.IntegerField()
    pending_pickups = serializers.IntegerField()
    completed_pickups = serializers.IntegerField()
    missed_pickups = serializers.IntegerField()
    peak_hours = serializers.ListField(child=serializers.TimeField())
    locations = serializers.ListField(child=serializers.CharField())

class CustomerScheduleSerializer(serializers.Serializer):
    """Serializer for customer's scheduled pickups"""
    pickup_id = serializers.UUIDField()
    business_name = serializers.CharField()
    business_logo = serializers.URLField(allow_null=True)
    location_name = serializers.CharField()
    location_address = serializers.CharField()
    scheduled_date = serializers.DateField()
    scheduled_time = serializers.TimeField()
    confirmation_code = serializers.CharField()
    status = serializers.CharField()
    qr_code_image = serializers.CharField(allow_null=True)
    order_total = serializers.DecimalField(max_digits=10, decimal_places=2)

class PickupHistorySerializer(serializers.ModelSerializer):
    """Serializer for pickup history"""
    business_name = serializers.CharField(source='location.business.business_name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduledPickup
        fields = [
            'id', 'business_name', 'customer_name', 'scheduled_date',
            'scheduled_start_time', 'actual_pickup_time', 'status',
            'confirmation_code', 'duration_minutes', 'pickup_notes'
        ]

    def get_customer_name(self, obj):
        """Get customer display name"""
        user = obj.order.interaction.user
        if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
            return user.customer_profile.full_name
        elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
            return user.ngo_profile.organisation_name
        return user.email

    def get_duration_minutes(self, obj):
        """Calculate pickup duration in minutes"""
        if obj.actual_pickup_time and obj.scheduled_start_time:
            scheduled_datetime = datetime.combine(
                obj.scheduled_date, 
                obj.scheduled_start_time
            )
            
            if obj.actual_pickup_time.date() == obj.scheduled_date:
                duration = obj.actual_pickup_time.time()
                scheduled_time = obj.scheduled_start_time
                
                # Simple duration calculation (this could be improved)
                duration_delta = datetime.combine(datetime.min, duration) - datetime.combine(datetime.min, scheduled_time)
                return int(duration_delta.total_seconds() / 60)
        
        return None

class PickupReminderSerializer(serializers.Serializer):
    """Serializer for pickup reminder settings"""
    pickup_id = serializers.UUIDField()
    reminder_time_minutes = serializers.IntegerField(min_value=15, max_value=1440)  # 15 minutes to 24 hours
    send_email = serializers.BooleanField(default=True)
    send_push = serializers.BooleanField(default=True)
    custom_message = serializers.CharField(required=False, allow_blank=True, max_length=255)