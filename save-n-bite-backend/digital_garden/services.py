# digital_garden/services.py

from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import logging
from typing import List, Dict, Tuple, Optional

from .models import (
    Plant, CustomerGarden, GardenTile, PlantInventory,
    PlantReward, CustomerStats
)
from interactions.models import Order

User = get_user_model()
logger = logging.getLogger(__name__)


class DigitalGardenService:
    """Core service class for digital garden operations"""
    
    def __init__(self):
        self.logger = logger
    
    def initialize_customer_garden(self, customer: User) -> CustomerGarden:
        """Initialize a new customer's garden with empty 8x8 grid"""
        if customer.user_type != 'customer':
            raise ValueError("Only customers can have gardens")
        
        with transaction.atomic():
            # Create garden
            garden, created = CustomerGarden.objects.get_or_create(
                customer=customer,
                defaults={'name': 'My Garden'}
            )
            
            if created:
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
                
                # Initialize stats
                CustomerStats.objects.get_or_create(customer=customer)
                
                self.logger.info(f"Initialized garden for customer {customer.username}")
            
            return garden
    
    def process_order_completion(self, order: Order) -> Dict:
        """Process plant rewards when an order is completed"""
        customer = order.interaction.user
        
        if customer.user_type != 'customer':
            return {'plants_earned': []}
        
        # Ensure garden exists
        garden = self.initialize_customer_garden(customer)
        
        # Calculate and update stats
        stats = self.update_customer_stats(customer)
        
        plants_earned = []
        
        with transaction.atomic():
            # 1. Always give a common plant for any order
            common_plant = self._get_random_plant('common')
            if common_plant:
                inventory_item = self._add_plant_to_inventory(
                    customer=customer,
                    plant=common_plant,
                    quantity=1,
                    reason='order',
                    order=order
                )
                plants_earned.append({
                    'plant': common_plant,
                    'quantity': 1,
                    'reason': 'Regular order completion'
                })
                
                # Update garden stats
                garden.total_plants_earned += 1
                garden.save()
            
            # 2. Check for milestone rewards
            milestone_plants = self._check_and_award_milestones(
                customer, stats, order
            )
            plants_earned.extend(milestone_plants)
        
        self.logger.info(
            f"Order {order.id} completed for {customer.username}. "
            f"Earned {len(plants_earned)} plants"
        )
        
        return {
            'plants_earned': plants_earned,
            'stats': {
                'total_orders': stats.total_orders,
                'total_amount': stats.total_order_amount,
                'unique_businesses': stats.unique_businesses_ordered_from
            }
        }
    
    def place_plant_in_garden(self, customer: User, plant_id: str, row: int, col: int, custom_data: dict = None) -> GardenTile:
        """Place a plant from inventory into garden"""
        with transaction.atomic():
            # Validate customer has garden
            try:
                garden = CustomerGarden.objects.get(customer=customer)
            except CustomerGarden.DoesNotExist:
                garden = self.initialize_customer_garden(customer)
            
            # Check if customer has the plant in inventory
            try:
                inventory_item = PlantInventory.objects.get(
                    customer=customer,
                    plant_id=plant_id,
                    quantity__gte=1
                )
            except PlantInventory.DoesNotExist:
                raise ValueError("Plant not found in inventory")
            
            # Get the tile
            try:
                tile = GardenTile.objects.get(
                    garden=garden,
                    row=row,
                    col=col
                )
            except GardenTile.DoesNotExist:
                raise ValueError(f"Invalid tile position [{row}, {col}]")
            
            # Check if tile is already occupied
            if tile.plant is not None:
                raise ValueError(f"Tile [{row}, {col}] is already occupied")
            
            # Place the plant
            tile.plant = inventory_item.plant
            tile.planted_at = timezone.now()
            tile.custom_data = custom_data or {}
            tile.save()
            
            # Remove from inventory
            inventory_item.quantity -= 1
            if inventory_item.quantity == 0:
                inventory_item.delete()
            else:
                inventory_item.save()
            
            # Update garden stats
            garden.total_plants_placed += 1
            garden.save()
        
        return tile
    
    def remove_plant_from_garden(self, customer: User, row: int, col: int) -> Plant:
        """Remove a plant from garden and return to inventory"""
        with transaction.atomic():
            try:
                garden = CustomerGarden.objects.get(customer=customer)
                tile = GardenTile.objects.get(
                    garden=garden,
                    row=row,
                    col=col
                )
            except (CustomerGarden.DoesNotExist, GardenTile.DoesNotExist):
                raise ValueError(f"Invalid tile position [{row}, {col}]")
            
            if tile.plant is None:
                raise ValueError(f"No plant at position [{row}, {col}]")
            
            plant = tile.plant
            
            # Add back to inventory
            inventory_item, created = PlantInventory.objects.get_or_create(
                customer=customer,
                plant=plant,
                defaults={
                    'quantity': 1,
                    'earned_reason': 'admin_grant'  # Since it's being returned
                }
            )
            
            if not created:
                inventory_item.quantity += 1
                inventory_item.save()
            
            # Clear the tile
            tile.plant = None
            tile.planted_at = None
            tile.custom_data = {}
            tile.save()
            
            # Update garden stats
            garden.total_plants_placed = max(0, garden.total_plants_placed - 1)
            garden.save()
        
        return plant
    
    def move_plant_in_garden(self, customer: User, from_row: int, from_col: int, to_row: int, to_col: int) -> Tuple[GardenTile, GardenTile]:
        """Move a plant from one tile to another in the garden"""
        with transaction.atomic():
            try:
                garden = CustomerGarden.objects.get(customer=customer)
                from_tile = GardenTile.objects.get(
                    garden=garden,
                    row=from_row,
                    col=from_col
                )
                to_tile = GardenTile.objects.get(
                    garden=garden,
                    row=to_row,
                    col=to_col
                )
            except (CustomerGarden.DoesNotExist, GardenTile.DoesNotExist):
                raise ValueError("Invalid tile position")
            
            if from_tile.plant is None:
                raise ValueError(f"No plant at position [{from_row}, {from_col}]")
            
            if to_tile.plant is not None:
                raise ValueError(f"Tile [{to_row}, {to_col}] is already occupied")
            
            # Move the plant
            plant = from_tile.plant
            custom_data = from_tile.custom_data
            planted_at = from_tile.planted_at
            
            # Clear source tile
            from_tile.plant = None
            from_tile.planted_at = None
            from_tile.custom_data = {}
            from_tile.save()
            
            # Set destination tile
            to_tile.plant = plant
            to_tile.planted_at = planted_at
            to_tile.custom_data = custom_data
            to_tile.save()
        
        return from_tile, to_tile
    
    def update_customer_stats(self, customer: User) -> CustomerStats:
        """Update customer statistics based on completed orders"""
        stats, created = CustomerStats.objects.get_or_create(customer=customer)
        stats.calculate_stats()
        return stats
    
    def get_next_milestones(self, customer: User) -> List[Dict]:
        """Get the next achievable milestones for a customer"""
        stats = CustomerStats.objects.get_or_create(customer=customer)[0]
        
        # Define milestone thresholds
        order_milestones = [1, 3, 5, 10, 15, 20, 25, 30, 50, 100]
        amount_milestones = [150, 200, 300, 500, 1000, 2000]
        business_milestones = [5, 10, 15, 20, 25]
        
        next_milestones = []
        
        # Next order count milestone
        for milestone in order_milestones:
            if stats.total_orders < milestone:
                orders_needed = milestone - stats.total_orders
                next_milestones.append({
                    'type': 'order_count',
                    'target': milestone,
                    'current': stats.total_orders,
                    'remaining': orders_needed,
                    'description': f'Complete {orders_needed} more order{"s" if orders_needed != 1 else ""} to reach {milestone} total orders'
                })
                break
        
        # Next amount milestone
        for milestone in amount_milestones:
            if stats.total_order_amount < milestone:
                amount_needed = Decimal(str(milestone)) - stats.total_order_amount
                next_milestones.append({
                    'type': 'order_amount',
                    'target': milestone,
                    'current': float(stats.total_order_amount),
                    'remaining': float(amount_needed),
                    'description': f'Spend R{amount_needed:.2f} more to reach R{milestone} total spent'
                })
                break
        
        # Next business diversity milestone
        for milestone in business_milestones:
            if stats.unique_businesses_ordered_from < milestone:
                businesses_needed = milestone - stats.unique_businesses_ordered_from
                next_milestones.append({
                    'type': 'business_count',
                    'target': milestone,
                    'current': stats.unique_businesses_ordered_from,
                    'remaining': businesses_needed,
                    'description': f'Order from {businesses_needed} more unique business{"es" if businesses_needed != 1 else ""} to reach {milestone} total'
                })
                break
        
        return next_milestones
    
    def get_available_plants_by_rarity(self, rarity: str = None) -> List[Plant]:
        """Get available plants, optionally filtered by rarity"""
        queryset = Plant.objects.filter(is_active=True)
        if rarity:
            queryset = queryset.filter(rarity=rarity)
        return list(queryset.order_by('name'))
    
    def _get_random_plant(self, rarity: str) -> Optional[Plant]:
        """Get a random plant of specified rarity"""
        plants = Plant.objects.filter(rarity=rarity, is_active=True)
        if plants.exists():
            return plants.order_by('?').first()
        return None
    
    def _add_plant_to_inventory(self, customer: User, plant: Plant, quantity: int = 1, 
                               reason: str = 'order', order: Order = None) -> PlantInventory:
        """Add a plant to customer's inventory"""
        inventory_item, created = PlantInventory.objects.get_or_create(
            customer=customer,
            plant=plant,
            defaults={
                'quantity': quantity,
                'earned_reason': reason,
                'earned_from_order': order
            }
        )
        
        if not created:
            inventory_item.quantity += quantity
            inventory_item.save()
        
        return inventory_item
    
    def _check_and_award_milestones(self, customer: User, stats: CustomerStats, order: Order) -> List[Dict]:
        """Check for milestone achievements and award plants"""
        plants_earned = []
        
        # Get order details
        order_amount = float(order.interaction.total_amount)
        
        # Check order count milestones
        order_milestones = self._check_order_count_milestones(customer, stats)
        plants_earned.extend(order_milestones)
        
        # Check order amount milestones  
        amount_milestones = self._check_order_amount_milestones(customer, stats, order_amount)
        plants_earned.extend(amount_milestones)
        
        # Check business diversity milestones
        business_milestones = self._check_business_milestones(customer, stats)
        plants_earned.extend(business_milestones)
        
        return plants_earned
    
    def _check_order_count_milestones(self, customer: User, stats: CustomerStats) -> List[Dict]:
        """Check and award order count milestone rewards"""
        plants_earned = []
        milestone_key = 'order_count'
        
        # Define order count milestones and their rarities
        milestones = [
            (1, 'uncommon'),   # First order
            (3, 'uncommon'),   # 3rd order  
            (5, 'rare'),       # 5th order
            (10, 'rare'),      # 10th order
            (15, 'epic'),      # 15th order
            (20, 'epic'),      # 20th order
            (25, 'legendary'), # 25th order
            (30, 'legendary'), # 30th order
            (50, 'legendary'), # 50th order
            (100, 'legendary') # 100th order
        ]
        
        achieved_milestones = stats.achieved_milestones.get(milestone_key, [])
        
        for count, rarity in milestones:
            if stats.total_orders >= count and count not in achieved_milestones:
                # Award plant
                plant = self._get_random_plant(rarity)
                if plant:
                    self._add_plant_to_inventory(
                        customer=customer,
                        plant=plant,
                        reason='milestone_orders'
                    )
                    
                    plants_earned.append({
                        'plant': plant,
                        'quantity': 1,
                        'reason': f'Order milestone: {count} orders completed'
                    })
                    
                    # Mark milestone as achieved
                    achieved_milestones.append(count)
        
        # Update achieved milestones
        if achieved_milestones:
            stats.achieved_milestones[milestone_key] = achieved_milestones
            stats.save()
        
        return plants_earned
    
    def _check_order_amount_milestones(self, customer: User, stats: CustomerStats, order_amount: float) -> List[Dict]:
        """Check and award order amount milestone rewards"""
        plants_earned = []
        milestone_key = 'order_amount'
        
        # Define amount milestones and their rarities
        milestones = [
            (150, 'uncommon'),
            (200, 'uncommon'), 
            (300, 'rare'),
            (500, 'epic'),
            (1000, 'legendary')
        ]
        
        achieved_milestones = stats.achieved_milestones.get(milestone_key, [])
        
        for amount, rarity in milestones:
            if order_amount >= amount and amount not in achieved_milestones:
                # Award plant
                plant = self._get_random_plant(rarity)
                if plant:
                    self._add_plant_to_inventory(
                        customer=customer,
                        plant=plant,
                        reason='milestone_amount'
                    )
                    
                    plants_earned.append({
                        'plant': plant,
                        'quantity': 1,
                        'reason': f'Order amount milestone: R{amount} order'
                    })
                    
                    # Mark milestone as achieved
                    achieved_milestones.append(amount)
        
        # Update achieved milestones
        if achieved_milestones:
            stats.achieved_milestones[milestone_key] = achieved_milestones
            stats.save()
        
        return plants_earned
    
    def _check_business_milestones(self, customer: User, stats: CustomerStats) -> List[Dict]:
        """Check and award business diversity milestone rewards"""
        plants_earned = []
        milestone_key = 'business_count'
        
        # Define business count milestones and their rarities
        milestones = [
            (5, 'rare'),       # 5 different businesses
            (10, 'epic'),      # 10 different businesses
            (15, 'epic'),      # 15 different businesses
            (20, 'legendary'), # 20 different businesses
            (25, 'legendary')  # 25 different businesses
        ]
        
        achieved_milestones = stats.achieved_milestones.get(milestone_key, [])
        
        for count, rarity in milestones:
            if stats.unique_businesses_ordered_from >= count and count not in achieved_milestones:
                # Award plant
                plant = self._get_random_plant(rarity)
                if plant:
                    self._add_plant_to_inventory(
                        customer=customer,
                        plant=plant,
                        reason='milestone_businesses'
                    )
                    
                    plants_earned.append({
                        'plant': plant,
                        'quantity': 1,
                        'reason': f'Business diversity milestone: {count} unique businesses'
                    })
                    
                    # Mark milestone as achieved
                    achieved_milestones.append(count)
        
        # Update achieved milestones
        if achieved_milestones:
            stats.achieved_milestones[milestone_key] = achieved_milestones
            stats.save()
        
        return plants_earned
    
    def perform_bulk_garden_actions(self, customer: User, actions: List[Dict]) -> Dict:
        """Perform multiple garden actions in a single transaction"""
        results = []
        errors = []
        
        with transaction.atomic():
            for i, action in enumerate(actions):
                try:
                    action_type = action['type']
                    
                    if action_type == 'place':
                        result = self.place_plant_in_garden(
                            customer=customer,
                            plant_id=action['plant_id'],
                            row=action['row'],
                            col=action['col'],
                            custom_data=action.get('custom_data', {})
                        )
                        results.append({
                            'action_index': i,
                            'type': 'place',
                            'success': True,
                            'tile_id': str(result.id)
                        })
                    
                    elif action_type == 'remove':
                        result = self.remove_plant_from_garden(
                            customer=customer,
                            row=action['row'],
                            col=action['col']
                        )
                        results.append({
                            'action_index': i,
                            'type': 'remove', 
                            'success': True,
                            'plant_name': result.name
                        })
                    
                    elif action_type == 'move':
                        from_tile, to_tile = self.move_plant_in_garden(
                            customer=customer,
                            from_row=action['from_row'],
                            from_col=action['from_col'],
                            to_row=action['to_row'],
                            to_col=action['to_col']
                        )
                        results.append({
                            'action_index': i,
                            'type': 'move',
                            'success': True,
                            'from_tile_id': str(from_tile.id),
                            'to_tile_id': str(to_tile.id)
                        })
                
                except Exception as e:
                    errors.append({
                        'action_index': i,
                        'error': str(e)
                    })
        
        return {
            'successful_actions': len(results),
            'failed_actions': len(errors),
            'results': results,
            'errors': errors
        }