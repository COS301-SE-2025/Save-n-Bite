# digital_garden/serializers.py
# Fix the CustomerStatsSerializer to match the actual model fields

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Plant, CustomerGarden, GardenTile, PlantInventory, 
    PlantReward, CustomerStats
)

User = get_user_model()


class PlantSerializer(serializers.ModelSerializer):
    """Serializer for plant information"""
    
    class Meta:
        model = Plant
        fields = [
            'id', 'name', 'scientific_name', 'common_names',
            'category', 'rarity', 'native_region', 'care_difficulty',
            'sunlight_requirements', 'water_requirements', 'description',
            'fun_facts', 'growing_tips', 'rive_asset_name', 'icon_color'
        ]
        read_only_fields = ['id']


class GardenTileSerializer(serializers.ModelSerializer):
    """Serializer for individual garden tiles"""
    plant_details = PlantSerializer(source='plant', read_only=True)
    
    class Meta:
        model = GardenTile
        fields = [
            'id', 'row', 'col', 'plant', 'plant_details', 
            'planted_at', 'custom_data'
        ]
        read_only_fields = ['id', 'planted_at']


class CustomerGardenSerializer(serializers.ModelSerializer):
    """Full garden serializer with all tiles"""
    garden_tiles = GardenTileSerializer(many=True, read_only=True)
    completion_percentage = serializers.SerializerMethodField()
    rarity_distribution = serializers.SerializerMethodField()
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    
    class Meta:
        model = CustomerGarden
        fields = [
            'id', 'customer', 'customer_username', 'name', 
            'total_plants_earned', 'total_plants_placed', 'garden_level',
            'completion_percentage', 'rarity_distribution', 'garden_tiles',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'completion_percentage', 'rarity_distribution', 'created_at', 'updated_at']
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage()
    
    def get_rarity_distribution(self, obj):
        return list(obj.get_rarity_distribution())


class GardenSummarySerializer(serializers.ModelSerializer):
    """Lightweight garden summary without tile details"""
    completion_percentage = serializers.SerializerMethodField()
    rarity_distribution = serializers.SerializerMethodField()
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    
    class Meta:
        model = CustomerGarden
        fields = [
            'id', 'customer', 'customer_username', 'name',
            'total_plants_earned', 'total_plants_placed', 'garden_level',
            'completion_percentage', 'rarity_distribution',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'completion_percentage', 'rarity_distribution', 'created_at', 'updated_at']
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage()
    
    def get_rarity_distribution(self, obj):
        return list(obj.get_rarity_distribution())


class PlantInventorySerializer(serializers.ModelSerializer):
    """Serializer for plant inventory items"""
    plant_details = PlantSerializer(source='plant', read_only=True)
    
    class Meta:
        model = PlantInventory
        fields = [
            'id', 'plant', 'plant_details', 'quantity',
            'earned_from_order', 'earned_reason', 'earned_at'
        ]
        read_only_fields = ['id', 'earned_at']


class PlantPlacementSerializer(serializers.Serializer):
    """Serializer for placing plants in garden"""
    plant_inventory_id = serializers.UUIDField()
    row = serializers.IntegerField(min_value=0, max_value=7)
    col = serializers.IntegerField(min_value=0, max_value=7)
    custom_data = serializers.JSONField(required=False, default=dict)


class PlantRemovalSerializer(serializers.Serializer):
    """Serializer for removing plants from garden"""
    row = serializers.IntegerField(min_value=0, max_value=7)
    col = serializers.IntegerField(min_value=0, max_value=7)


class PlantMoveSerializer(serializers.Serializer):
    """Serializer for moving plants within garden"""
    from_row = serializers.IntegerField(min_value=0, max_value=7)
    from_col = serializers.IntegerField(min_value=0, max_value=7)
    to_row = serializers.IntegerField(min_value=0, max_value=7)
    to_col = serializers.IntegerField(min_value=0, max_value=7)


class CustomerStatsSerializer(serializers.ModelSerializer):
    """Serializer for customer garden statistics - FIXED field names"""
    
    # Add computed fields for garden-specific stats
    plants_earned = serializers.SerializerMethodField()
    plants_placed = serializers.SerializerMethodField()
    garden_completion_percentage = serializers.SerializerMethodField()
    current_streak_days = serializers.SerializerMethodField()
    longest_streak_days = serializers.SerializerMethodField()
    last_order_date = serializers.SerializerMethodField()
    next_milestones = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerStats
        fields = [
            # Actual model fields
            'total_orders', 'total_order_amount', 'unique_businesses_ordered_from',
            'achieved_milestones', 'next_milestones', 'last_calculated_at',
            # Computed fields
            'plants_earned', 'plants_placed', 'garden_completion_percentage',
            'current_streak_days', 'longest_streak_days', 'last_order_date'
        ]
        read_only_fields = fields

    def get_next_milestones(self, obj):
        """Get the next achievable milestones"""
        from .services import DigitalGardenService
        service = DigitalGardenService()
        return service.get_next_milestones(obj.customer)
    
    def get_plants_earned(self, obj):
        """Get total plants earned by customer"""
        try:
            garden = obj.customer.digital_garden
            return garden.total_plants_earned
        except:
            return 0
    
    def get_plants_placed(self, obj):
        """Get total plants placed in garden"""
        try:
            garden = obj.customer.digital_garden
            return garden.total_plants_placed
        except:
            return 0
    
    def get_garden_completion_percentage(self, obj):
        """Get garden completion percentage"""
        try:
            garden = obj.customer.digital_garden
            return garden.get_completion_percentage()
        except:
            return 0.0
    
    def get_current_streak_days(self, obj):
        """Calculate current order streak (placeholder)"""
        # TODO: Implement streak calculation logic
        return 0
    
    def get_longest_streak_days(self, obj):
        """Calculate longest order streak (placeholder)"""
        # TODO: Implement streak calculation logic
        return 0
    
    def get_last_order_date(self, obj):
        """Get last order date"""
        from interactions.models import Order
        try:
            last_order = Order.objects.filter(
                interaction__user=obj.customer,
                status='completed'
            ).order_by('-created_at').first()
            return last_order.created_at if last_order else None
        except:
            return None


class PlantRewardSerializer(serializers.ModelSerializer):
    """Serializer for plant reward history"""
    plant_details = PlantSerializer(source='plant', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    
    class Meta:
        model = PlantReward
        fields = [
            'id', 'milestone_type', 'milestone_value', 'plant', 'plant_details',
            'quantity', 'is_active', 'created_at'
        ]
        read_only_fields = fields


class GardenInitializationSerializer(serializers.ModelSerializer):
    """Serializer for initializing new gardens"""
    
    class Meta:
        model = CustomerGarden
        fields = ['name']
    
    def create(self, validated_data):
        customer = self.context['request'].user
        garden = CustomerGarden.objects.create(
            customer=customer,
            **validated_data
        )
        
        # Initialize 64 empty tiles (8x8 grid)
        tiles = []
        for row in range(8):
            for col in range(8):
                tiles.append(GardenTile(
                    garden=garden,
                    row=row,
                    col=col
                ))
        
        GardenTile.objects.bulk_create(tiles)
        return garden


class BulkPlantActionSerializer(serializers.Serializer):
    """Serializer for bulk plant operations"""
    action = serializers.ChoiceField(choices=['place', 'remove', 'move'])
    operations = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=64  # Maximum tiles in garden
    )
    
    def validate_operations(self, value):
        """Validate individual operations based on action type"""
        action = self.initial_data.get('action')
        
        for operation in value:
            if action == 'place':
                required_fields = ['plant_inventory_id', 'row', 'col']
            elif action == 'remove':
                required_fields = ['row', 'col']
            elif action == 'move':
                required_fields = ['from_row', 'from_col', 'to_row', 'to_col']
            else:
                raise serializers.ValidationError("Invalid action type")
            
            for field in required_fields:
                if field not in operation:
                    raise serializers.ValidationError(f"Operation missing required field: {field}")
            
            # Validate coordinates
            for coord_field in [f for f in required_fields if 'row' in f or 'col' in f]:
                if not (0 <= operation[coord_field] <= 7):
                    raise serializers.ValidationError(f"Invalid coordinate {coord_field}: {operation[coord_field]}")
        
        return value