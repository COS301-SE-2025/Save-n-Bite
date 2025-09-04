# scheduling/serializers.py

from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, date, time
from .models import PickupLocation, ScheduledPickup, PickupAnalytics
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


class SchedulePickupSerializer(serializers.Serializer):
    """Serializer for scheduling a pickup - simplified without time slots"""
    
    order_id = serializers.UUIDField()
    location_id = serializers.UUIDField()
    customer_notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_order_id(self, value):
        """Validate order exists and belongs to the user"""
        try:
            user = self.context['request'].user
            order = Order.objects.get(
                id=value,
                interaction__user=user,
                status__in=['pending', 'confirmed']  # Only orders that can be scheduled
            )
            return value
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found or cannot be scheduled")
    
    def validate_location_id(self, value):
        """Validate location exists and is active"""
        try:
            location = PickupLocation.objects.get(id=value, is_active=True)
            return value
        except PickupLocation.DoesNotExist:
            raise serializers.ValidationError("Pickup location not found or inactive")
    
    def validate(self, data):
        """Cross-validate the data"""
        try:
            user = self.context['request'].user
            order = Order.objects.get(id=data['order_id'], interaction__user=user)
            location = PickupLocation.objects.get(id=data['location_id'])
            
            # Ensure location belongs to a business that has food items in this order
            order_businesses = set()
            for item in order.interaction.items.all():
                if item.food_listing:
                    order_businesses.add(item.food_listing.provider.provider_profile)
            
            if location.business not in order_businesses:
                raise serializers.ValidationError({
                    'location_id': 'Location must belong to a business that has items in your order'
                })
            
        except (Order.DoesNotExist, PickupLocation.DoesNotExist):
            pass  # Already handled in individual field validators
        
        return data


class ScheduledPickupSerializer(serializers.ModelSerializer):
    """Serializer for scheduled pickups - simplified"""
    
    customer = serializers.SerializerMethodField()
    food_listing = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    is_upcoming = serializers.SerializerMethodField()
    is_today = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduledPickup
        fields = [
            'id', 'order', 'location', 'pickup_date', 'estimated_ready_time',
            'actual_ready_time', 'pickup_deadline', 'actual_pickup_time',
            'status', 'confirmation_code', 'customer', 'food_listing',
            'customer_notes', 'business_notes', 'is_upcoming', 'is_today',
            'is_overdue', 'ready_notification_sent', 'reminder_sent',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'confirmation_code', 'qr_code_data', 'is_upcoming', 
            'is_today', 'is_overdue', 'created_at', 'updated_at'
        ]
    
    def get_customer(self, obj):
        """Get customer information"""
        user = obj.order.interaction.user
        customer_name = 'Unknown'
        
        try:
            if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
                customer_name = user.customer_profile.full_name or user.email
            elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
                customer_name = user.ngo_profile.organisation_name or user.email
            else:
                customer_name = user.get_full_name() or user.email
        except:
            customer_name = user.email
            
        return {
            'id': user.id,
            'full_name': customer_name,
            'email': user.email,
            'phone': getattr(user, 'phone_number', '')
        }
    
    def get_food_listing(self, obj):
        """Get food listing information"""
        food_listing = obj.food_listing
        if not food_listing:
            return None
            
        # Calculate total quantity from interaction items
        total_quantity = sum(item.quantity for item in obj.order.interaction.items.all())
        
        return {
            'id': food_listing.id,
            'name': food_listing.name,
            'description': food_listing.description,
            'quantity': total_quantity,
            'expiry_date': food_listing.expiry_date
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
    
    def get_is_upcoming(self, obj):
        """Check if pickup is in the future"""
        return obj.is_upcoming
    
    def get_is_today(self, obj):
        """Check if pickup is today"""
        return obj.is_today
        
    def get_is_overdue(self, obj):
        """Check if pickup is overdue"""
        return obj.is_overdue


class PickupVerificationSerializer(serializers.Serializer):
    """Serializer for pickup verification"""
    
    confirmation_code = serializers.CharField(max_length=10)
    
    def validate_confirmation_code(self, value):
        """Validate confirmation code exists and is ready for pickup"""
        business = self.context.get('business')
        
        try:
            pickup = ScheduledPickup.objects.get(
                confirmation_code=value,
                location__business=business,
                status='ready'  # Only ready orders can be verified
            )
            return value
        except ScheduledPickup.DoesNotExist:
            raise serializers.ValidationError("Invalid confirmation code or order not ready for pickup")


class BusinessScheduleOverviewSerializer(serializers.Serializer):
    """Serializer for business schedule overview - simplified"""
    
    date = serializers.DateField()
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    ready_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
    missed_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()
    orders_by_status = serializers.DictField()


class CustomerScheduleSerializer(serializers.ModelSerializer):
    """Serializer for customer's pickup schedule - simplified"""
    
    food_listing = serializers.SerializerMethodField()
    business = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    is_upcoming = serializers.SerializerMethodField()
    is_today = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduledPickup
        fields = [
            'id', 'pickup_date', 'pickup_deadline', 'estimated_ready_time',
            'actual_ready_time', 'status', 'confirmation_code', 'food_listing', 
            'business', 'location', 'customer_notes', 'is_upcoming', 'is_today', 
            'is_overdue'
        ]
    
    def get_food_listing(self, obj):
        """Get food listing information"""
        food_listing = obj.food_listing
        if not food_listing:
            return None
            
        return {
            'id': food_listing.id,
            'name': food_listing.name,
            'description': food_listing.description,
            'expiry_date': food_listing.expiry_date
        }
    
    def get_is_upcoming(self, obj):
        """Check if pickup is in the future"""
        return obj.is_upcoming
    
    def get_is_today(self, obj):
        """Check if pickup is today"""
        return obj.is_today
        
    def get_is_overdue(self, obj):
        """Check if pickup is overdue"""
        return obj.is_overdue
    
    def get_business(self, obj):
        """Get business information"""
        business = obj.location.business
        return {
            'id': business.id,
            'business_name': business.business_name,
            'business_address': business.business_address,
            'business_contact': business.business_contact,
            'business_hours': business.business_hours
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


class PickupAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for pickup analytics - simplified"""
    
    completion_rate = serializers.SerializerMethodField()
    missed_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = PickupAnalytics
        fields = [
            'id', 'date', 'total_orders', 'orders_completed', 'orders_missed',
            'orders_cancelled', 'average_preparation_time', 'on_time_pickup_percentage',
            'customer_satisfaction_rating', 'completion_rate', 'missed_rate'
        ]
        read_only_fields = ['id']
    
    def get_completion_rate(self, obj):
        """Calculate completion rate"""
        if obj.total_orders > 0:
            return round((obj.orders_completed / obj.total_orders) * 100, 2)
        return 0.0
    
    def get_missed_rate(self, obj):
        """Calculate missed rate"""
        if obj.total_orders > 0:
            return round((obj.orders_missed / obj.total_orders) * 100, 2)
        return 0.0


# Additional serializers for business operations

class MarkOrderReadySerializer(serializers.Serializer):
    """Serializer for marking order as ready"""
    
    pickup_id = serializers.UUIDField()
    estimated_ready_time = serializers.TimeField(required=False, help_text="Time when order will be ready (optional)")
    business_notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_pickup_id(self, value):
        """Validate pickup exists and can be marked ready"""
        try:
            business = self.context.get('business')
            pickup = ScheduledPickup.objects.get(
                id=value,
                location__business=business,
                status='pending'
            )
            return value
        except ScheduledPickup.DoesNotExist:
            raise serializers.ValidationError("Pickup not found or cannot be marked ready")


class BusinessOrderListSerializer(serializers.ModelSerializer):
    """Serializer for business order list view"""
    
    customer_info = serializers.SerializerMethodField()
    food_items = serializers.SerializerMethodField()
    time_since_order = serializers.SerializerMethodField()
    time_until_deadline = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduledPickup
        fields = [
            'id', 'confirmation_code', 'status', 'pickup_date', 'pickup_deadline',
            'estimated_ready_time', 'actual_ready_time', 'customer_info', 'food_items',
            'customer_notes', 'business_notes', 'time_since_order', 'time_until_deadline',
            'created_at'
        ]
    
    def get_customer_info(self, obj):
        """Get customer information for business view"""
        user = obj.order.interaction.user
        
        try:
            if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
                name = user.customer_profile.full_name or 'Customer'
            elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
                name = user.ngo_profile.organisation_name or 'NGO'
            else:
                name = user.get_full_name() or 'Customer'
        except:
            name = 'Customer'
            
        return {
            'name': name,
            'email': user.email,
            'phone': getattr(user, 'phone_number', ''),
            'user_type': user.user_type
        }
    
    def get_food_items(self, obj):
        """Get food items in the order"""
        items = []
        for item in obj.order.interaction.items.all():
            items.append({
                'name': item.name,
                'quantity': item.quantity,
                'food_listing_id': str(item.food_listing.id) if item.food_listing else None,
                'expiry_date': item.expiry_date
            })
        return items
    
    def get_time_since_order(self, obj):
        """Calculate time since order was placed"""
        time_diff = timezone.now() - obj.created_at
        hours = int(time_diff.total_seconds() // 3600)
        minutes = int((time_diff.total_seconds() % 3600) // 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"
    
    def get_time_until_deadline(self, obj):
        """Calculate time until pickup deadline"""
        if obj.status in ['completed', 'missed', 'cancelled']:
            return None
            
        time_diff = obj.pickup_deadline - timezone.now()
        
        if time_diff.total_seconds() <= 0:
            return "Overdue"
        
        hours = int(time_diff.total_seconds() // 3600)
        minutes = int((time_diff.total_seconds() % 3600) // 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"