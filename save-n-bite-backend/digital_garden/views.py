# digital_garden/views.py

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

from .models import (
    Plant, CustomerGarden, GardenTile, PlantInventory,
    PlantReward, CustomerStats
)
from .serializers import (
    PlantSerializer, CustomerGardenSerializer, GardenSummarySerializer,
    PlantInventorySerializer, PlantPlacementSerializer, PlantRemovalSerializer,
    PlantMoveSerializer, CustomerStatsSerializer, PlantRewardSerializer,
    GardenInitializationSerializer, BulkPlantActionSerializer
)
from .services import DigitalGardenService

logger = logging.getLogger(__name__)


class GardenView(APIView):
    """Main garden view for retrieving and managing customer gardens"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get customer's garden with all tiles and plants"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers can have gardens'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        service = DigitalGardenService()
        garden = service.initialize_customer_garden(customer)
        
        serializer = CustomerGardenSerializer(garden)
        return Response(serializer.data)
    
    def post(self, request):
        """Initialize a new garden for customer"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers can have gardens'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if CustomerGarden.objects.filter(customer=customer).exists():
            return Response(
                {'error': 'Garden already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = GardenInitializationSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            garden = serializer.create(serializer.validated_data)
            response_serializer = CustomerGardenSerializer(garden)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GardenSummaryView(APIView):
    """Lightweight garden summary view"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get customer's garden summary without full tile data"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers can have gardens'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            garden = CustomerGarden.objects.get(customer=customer)
            serializer = GardenSummarySerializer(garden)
            return Response(serializer.data)
        except CustomerGarden.DoesNotExist:
            # Initialize garden if it doesn't exist
            service = DigitalGardenService()
            garden = service.initialize_customer_garden(customer)
            serializer = GardenSummarySerializer(garden)
            return Response(serializer.data)


class PlantInventoryView(APIView):
    """View for managing customer's plant inventory"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get customer's plant inventory"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers can have plant inventory'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        inventory = PlantInventory.objects.filter(
            customer=customer
        ).select_related('plant').order_by('-earned_at')
        
        serializer = PlantInventorySerializer(inventory, many=True)
        return Response(serializer.data)


class PlantCatalogView(APIView):
    """View for browsing available plants"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get all available plants, optionally filtered by rarity or category"""
        rarity = request.query_params.get('rarity')
        category = request.query_params.get('category')
        
        queryset = Plant.objects.filter(is_active=True)
        
        if rarity:
            queryset = queryset.filter(rarity=rarity)
        
        if category:
            queryset = queryset.filter(category=category)
        
        queryset = queryset.order_by('rarity', 'name')
        
        serializer = PlantSerializer(queryset, many=True)
        return Response(serializer.data)


class PlantDetailView(APIView):
    """View for getting detailed plant information"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, plant_id):
        """Get detailed information about a specific plant"""
        plant = get_object_or_404(Plant, id=plant_id, is_active=True)
        serializer = PlantSerializer(plant)
        return Response(serializer.data)


class PlantPlacementView(APIView):
    """View for placing plants in garden"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Place a plant from inventory into garden"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers can place plants'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PlantPlacementSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                service = DigitalGardenService()
                tile = service.place_plant_in_garden(
                    customer=customer,
                    plant_id=str(serializer.validated_data['plant_id']),
                    row=serializer.validated_data['row'],
                    col=serializer.validated_data['col'],
                    custom_data=serializer.validated_data.get('custom_data', {})
                )
                
                from .serializers import GardenTileSerializer
                response_serializer = GardenTileSerializer(tile)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
            except ValueError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlantRemovalView(APIView):
    """View for removing plants from garden"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Remove a plant from garden and return to inventory"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers can remove plants'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PlantRemovalSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                service = DigitalGardenService()
                plant = service.remove_plant_from_garden(
                    customer=customer,
                    row=serializer.validated_data['row'],
                    col=serializer.validated_data['col']
                )
                
                return Response({
                    'message': f'{plant.name} removed from garden and returned to inventory',
                    'plant': PlantSerializer(plant).data
                })
            
            except ValueError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlantMoveView(APIView):
    """View for moving plants within garden"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Move a plant from one tile to another"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers can move plants'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PlantMoveSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                service = DigitalGardenService()
                from_tile, to_tile = service.move_plant_in_garden(
                    customer=customer,
                    from_row=serializer.validated_data['from_row'],
                    from_col=serializer.validated_data['from_col'],
                    to_row=serializer.validated_data['to_row'],
                    to_col=serializer.validated_data['to_col']
                )
                
                from .serializers import GardenTileSerializer
                return Response({
                    'message': 'Plant moved successfully',
                    'from_tile': GardenTileSerializer(from_tile).data,
                    'to_tile': GardenTileSerializer(to_tile).data
                })
            
            except ValueError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BulkGardenActionsView(APIView):
    """View for performing multiple garden actions in one request"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Perform multiple plant actions (place, remove, move) in one transaction"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers can perform garden actions'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BulkPlantActionSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                service = DigitalGardenService()
                result = service.perform_bulk_garden_actions(
                    customer=customer,
                    actions=serializer.validated_data['actions']
                )
                
                return Response(result)
            
            except Exception as e:
                logger.error(f"Bulk garden actions failed for {customer.username}: {str(e)}")
                return Response(
                    {'error': 'Failed to perform bulk actions'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerStatsView(APIView):
    """View for customer statistics and milestones"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get customer's garden statistics and next milestones"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers have garden statistics'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        service = DigitalGardenService()
        stats = service.update_customer_stats(customer)
        
        serializer = CustomerStatsSerializer(stats)
        return Response(serializer.data)
    
    def post(self, request):
        """Manually recalculate customer statistics (for debugging)"""
        customer = request.user
        
        if customer.user_type != 'customer':
            return Response(
                {'error': 'Only customers have garden statistics'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        service = DigitalGardenService()
        stats = service.update_customer_stats(customer)
        
        serializer = CustomerStatsSerializer(stats)
        return Response({
            'message': 'Statistics recalculated',
            'stats': serializer.data
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def garden_rarities(request):
    """Get available plant rarity options"""
    from .models import Plant
    rarities = [choice[0] for choice in Plant.RARITY_CHOICES]
    return Response({'rarities': rarities})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def garden_categories(request):
    """Get available plant category options"""
    from .models import Plant
    categories = [choice[0] for choice in Plant.CATEGORY_CHOICES]
    return Response({'categories': categories})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def simulate_order_completion(request):
    """Simulate order completion for testing plant rewards (DEBUG ONLY)"""
    from django.conf import settings
    
    if not settings.DEBUG:
        return Response(
            {'error': 'This endpoint is only available in DEBUG mode'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    customer = request.user
    
    if customer.user_type != 'customer':
        return Response(
            {'error': 'Only customers can simulate order completion'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create a mock order for testing
    from interactions.models import Order, Interaction
    from authentication.models import FoodProviderProfile
    from decimal import Decimal
    
    try:
        # Get a random food provider for the mock order
        provider = FoodProviderProfile.objects.first()
        if not provider:
            return Response(
                {'error': 'No food providers available for simulation'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create mock interaction and order
        interaction = Interaction.objects.create(
            user=customer,
            business=provider,
            interaction_type='Purchase',
            total_amount=Decimal('250.00')  # R250 order
        )
        
        order = Order.objects.create(
            interaction=interaction,
            status='completed',
            pickup_window='12:00-13:00',
            pickup_code='TEST123'
        )
        
        # Process the order completion
        service = DigitalGardenService()
        result = service.process_order_completion(order)
        
        return Response({
            'message': 'Order completion simulated',
            'order_id': str(order.id),
            'result': result
        })
    
    except Exception as e:
        logger.error(f"Simulation failed for {customer.username}: {str(e)}")
        return Response(
            {'error': f'Simulation failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )