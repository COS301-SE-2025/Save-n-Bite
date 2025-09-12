# digital_garden/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import uuid
import json

User = get_user_model()

class Plant(models.Model):
    """Master plant database with all available plants"""
    RARITY_CHOICES = [
        ('common', 'Common'),
        ('uncommon', 'Uncommon'), 
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ]
    
    CATEGORY_CHOICES = [
        ('vegetable', 'Vegetable'),
        ('succulent', 'Succulent'),
        ('flowering', 'Flowering Plant'),
        ('herb', 'Herb'),
        ('shrub', 'Shrub'),
        ('tree', 'Tree'),
        ('grass', 'Grass'),
        ('fern', 'Fern'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    scientific_name = models.CharField(max_length=255, blank=True)
    common_names = models.JSONField(default=list, help_text="Alternative common names")
    
    # Plant characteristics
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    rarity = models.CharField(max_length=50, choices=RARITY_CHOICES)
    native_region = models.CharField(max_length=255, default="South Africa")
    
    # Care information
    care_difficulty = models.CharField(max_length=20, choices=[
        ('easy', 'Easy'),
        ('moderate', 'Moderate'), 
        ('difficult', 'Difficult')
    ], default='easy')
    
    sunlight_requirements = models.CharField(max_length=50, choices=[
        ('full_sun', 'Full Sun'),
        ('partial_sun', 'Partial Sun'),
        ('shade', 'Shade'),
        ('any', 'Any')
    ])
    
    water_requirements = models.CharField(max_length=50, choices=[
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High')
    ])
    
    # Display information
    description = models.TextField()
    fun_facts = models.TextField(help_text="Interesting facts about the plant")
    growing_tips = models.TextField(help_text="Tips for growing at home")
    
    # Visual representation (for Rive integration)
    rive_asset_name = models.CharField(max_length=100, help_text="Name of Rive asset/animation")
    icon_color = models.CharField(max_length=7, default="#62BD38", help_text="Hex color for plant icon")
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['rarity', 'category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.rarity})"


class CustomerGarden(models.Model):
    """Each customer's 8x8 garden"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='digital_garden',
        limit_choices_to={'user_type': 'customer'}
    )
    
    # Garden metadata
    name = models.CharField(max_length=255, default="My Garden")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Statistics
    total_plants_earned = models.PositiveIntegerField(default=0)
    total_plants_placed = models.PositiveIntegerField(default=0)
    garden_level = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.customer.username}'s Garden"
    
    def get_completion_percentage(self):
        """Calculate how full the garden is (out of 64 tiles)"""
        placed_plants = self.garden_tiles.filter(plant__isnull=False).count()
        return (placed_plants / 64) * 100
    
    def get_rarity_distribution(self):
        """Get distribution of plant rarities in garden"""
        from django.db.models import Count
        return self.garden_tiles.filter(
            plant__isnull=False
        ).values(
            'plant__rarity'
        ).annotate(
            count=Count('plant__rarity')
        )


class GardenTile(models.Model):
    """Individual tile in the 8x8 garden grid"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    garden = models.ForeignKey(
        CustomerGarden, 
        on_delete=models.CASCADE, 
        related_name='garden_tiles'
    )
    
    # Position in 8x8 grid (0-7, 0-7)
    row = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(7)])
    col = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(7)])
    
    # Plant placed on this tile (null = empty)
    plant = models.ForeignKey(
        Plant, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='placed_tiles'
    )
    
    # When plant was placed
    planted_at = models.DateTimeField(null=True, blank=True)
    
    # Plant instance data (for customization)
    custom_data = models.JSONField(
        default=dict, 
        help_text="Custom plant instance data (growth stage, color variants, etc.)"
    )
    
    class Meta:
        unique_together = ('garden', 'row', 'col')
        indexes = [
            models.Index(fields=['garden', 'row', 'col']),
            models.Index(fields=['plant']),
        ]
    
    def __str__(self):
        plant_name = self.plant.name if self.plant else "Empty"
        return f"{self.garden.customer.username}'s Garden [{self.row},{self.col}]: {plant_name}"
    
    def clean(self):
        # Validate grid bounds
        if not (0 <= self.row <= 7):
            raise ValidationError("Row must be between 0 and 7")
        if not (0 <= self.col <= 7):
            raise ValidationError("Column must be between 0 and 7")


class PlantInventory(models.Model):
    """Customer's plant inventory (plants not yet placed in garden)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='plant_inventory',
        limit_choices_to={'user_type': 'customer'}
    )
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    
    # Quantity of this plant type in inventory
    quantity = models.PositiveIntegerField(default=1)
    
    # How the plant was earned
    earned_from_order = models.ForeignKey(
        'interactions.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='earned_plants'
    )
    
    earned_reason = models.CharField(max_length=100, choices=[
        ('order', 'Regular Order'),
        ('milestone_orders', 'Order Count Milestone'),
        ('milestone_amount', 'Order Amount Milestone'), 
        ('milestone_businesses', 'Business Diversity Milestone'),
        ('special_event', 'Special Event'),
        ('admin_grant', 'Admin Granted'),
    ])
    
    # Metadata
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('customer', 'plant')
        ordering = ['-earned_at']
        indexes = [
            models.Index(fields=['customer', 'plant']),
            models.Index(fields=['earned_reason']),
        ]
    
    def __str__(self):
        return f"{self.customer.username} has {self.quantity}x {self.plant.name}"


class PlantReward(models.Model):
    """Configuration for plant rewards based on milestones"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Milestone configuration
    milestone_type = models.CharField(max_length=50, choices=[
        ('order_count', 'Order Count Milestone'),
        ('order_amount', 'Order Amount Milestone'),
        ('business_count', 'Unique Business Count Milestone'),
    ])
    
    # Milestone value (e.g., 5 for "5th order", 150 for "R150 order")
    milestone_value = models.PositiveIntegerField()
    
    # Reward configuration
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('milestone_type', 'milestone_value', 'plant')
        ordering = ['milestone_type', 'milestone_value']
        indexes = [
            models.Index(fields=['milestone_type', 'is_active']),
            models.Index(fields=['milestone_value']),
        ]
    
    def __str__(self):
        return f"{self.get_milestone_type_display()}: {self.milestone_value} → {self.plant.name}"


class CustomerStats(models.Model):
    """Track customer statistics for milestone calculations"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='garden_stats',
        limit_choices_to={'user_type': 'customer'}
    )
    
    # Order statistics
    total_orders = models.PositiveIntegerField(default=0)
    total_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unique_businesses_ordered_from = models.PositiveIntegerField(default=0)
    
    # Milestone tracking (JSON field to track which milestones have been achieved)
    achieved_milestones = models.JSONField(
        default=dict,
        help_text="Track achieved milestones to prevent duplicate rewards"
    )
    
    # Cache frequently calculated values
    last_calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['total_orders']),
            models.Index(fields=['total_order_amount']),
            models.Index(fields=['unique_businesses_ordered_from']),
        ]
    
    def __str__(self):
        return f"{self.customer.username} - Stats"
    
    def calculate_stats(self):
        """Recalculate statistics from orders"""
        from interactions.models import Order
        from django.db.models import Sum, Count
        
        completed_orders = Order.objects.filter(
            interaction__user=self.customer,
            status='completed'
        )
        
        # Calculate totals
        self.total_orders = completed_orders.count()
        
        # Calculate total amount
        total_amount = completed_orders.aggregate(
            total=Sum('interaction__total_amount')
        )['total'] or 0
        self.total_order_amount = total_amount
        
        # Calculate unique businesses
        unique_businesses = completed_orders.values(
            'interaction__business'
        ).distinct().count()
        self.unique_businesses_ordered_from = unique_businesses
        
        self.save()
        return self