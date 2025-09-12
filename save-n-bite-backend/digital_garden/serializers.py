# digital_garden/serializers.py

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
        read_only_fields = ['id', 'customer', 'created_at', 'updated_at']
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage()
    
    def get_rarity_distribution(self, obj):
        return list(obj.get_rarity_distribution())


class GardenSummarySerializer(serializers.ModelSerializer):
    """Lightweight garden summary (without full tile data)"""
    completion_percentage = serializers.SerializerMethodField()
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    
    class Meta:
        model = CustomerGarden
        fields = [
            'id', 'customer_username', 'name', 'total_plants_earned',
            'total_plants_placed', 'garden_level', 'completion_percentage',
            'created_at', 'updated_at'
        ]
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage()


class PlantInventorySerializer(serializers.ModelSerializer):
    """Serializer for plant inventory"""
    plant_details = PlantSerializer(source='plant', read_only=True)
    earned_from_order_id = serializers.CharField(source='earned_from_order.id', read_only=True)
    
    class Meta:
        model = PlantInventory
        fields = [
            'id', 'plant', 'plant_details', 'quantity', 
            'earned_from_order_id', 'earned_reason', 'earned_at'
        ]
        read_only_fields = ['id', 'earned_at']


class PlantPlacementSerializer(serializers.Serializer):
    """Serializer for placing plants in garden"""
    plant_id = serializers.UUIDField()
    row = serializers.IntegerField(min_value=0, max_value=7)
    col = serializers.IntegerField(min_value=0, max_value=7)
    custom_data = serializers.JSONField(required=False, default=dict)
    
    def validate(self, data):
        # Check if plant exists
        try:
            plant = Plant.objects.get(id=data['plant_id'])
            data['plant'] = plant
        except Plant.DoesNotExist:
            raise serializers.ValidationError("Plant not found")
        
        return data


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
    
    def validate(self, data):
        # Ensure we're not moving to the same position
        if (data['from_row'] == data['to_row'] and 
            data['from_col'] == data['to_col']):
            raise serializers.ValidationError(
                "Cannot move plant to the same position"
            )
        return data


class CustomerStatsSerializer(serializers.ModelSerializer):
    """Serializer for customer statistics"""
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    next_milestones = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerStats
        fields = [
            'id', 'customer_username', 'total_orders', 'total_order_amount',
            'unique_businesses_ordered_from', 'achieved_milestones',
            'next_milestones', 'last_calculated_at'
        ]
        read_only_fields = ['id', 'last_calculated_at']
    
    def get_next_milestones(self, obj):
        """Get the next achievable milestones"""
        from .services import DigitalGardenService
        service = DigitalGardenService()
        return service.get_next_milestones(obj.customer)


class PlantRewardSerializer(serializers.ModelSerializer):
    """Serializer for plant reward configuration"""
    plant_details = PlantSerializer(source='plant', read_only=True)
    
    class Meta:
        model = PlantReward
        fields = [
            'id', 'milestone_type', 'milestone_value', 'plant',
            'plant_details', 'quantity', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class GardenInitializationSerializer(serializers.Serializer):
    """Serializer for initializing a customer's garden"""
    garden_name = serializers.CharField(max_length=255, required=False, default="My Garden")
    
    def create(self, validated_data):
        customer = self.context['request'].user
        
        # Create garden
        garden = CustomerGarden.objects.create(
            customer=customer,
            name=validated_data.get('garden_name', 'My Garden')
        )
        
        # Create all 64 empty tiles
        tiles = []
        for row in range(8):
            for col in range(8):
                tiles.append(GardenTile(
                    garden=garden,
                    row=row,
                    col=col
                ))
        
        GardenTile.objects.bulk_create(tiles)
        
        # Create stats record
        CustomerStats.objects.get_or_create(customer=customer)
        
        return garden


class BulkPlantActionSerializer(serializers.Serializer):
    """Serializer for bulk plant operations"""
    actions = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
        max_length=64  # Max garden size
    )
    
    def validate_actions(self, actions):
        """Validate bulk action format"""
        valid_action_types = ['place', 'remove', 'move']
        
        for i, action in enumerate(actions):
            action_type = action.get('type')
            if action_type not in valid_action_types:
                raise serializers.ValidationError(
                    f"Action {i}: Invalid action type '{action_type}'"
                )
            
            # Validate based on action type
            if action_type == 'place':
                required_fields = ['plant_id', 'row', 'col']
                for field in required_fields:
                    if field not in action:
                        raise serializers.ValidationError(
                            f"Action {i}: Missing required field '{field}' for place action"
                        )
            
            elif action_type == 'remove':
                required_fields = ['row', 'col']
                for field in required_fields:
                    if field not in action:
                        raise serializers.ValidationError(
                            f"Action {i}: Missing required field '{field}' for remove action"
                        )
            
            elif action_type == 'move':
                required_fields = ['from_row', 'from_col', 'to_row', 'to_col']
                for field in required_fields:
                    if field not in action:
                        raise serializers.ValidationError(
                            f"Action {i}: Missing required field '{field}' for move action"
                        )
        
        return actions