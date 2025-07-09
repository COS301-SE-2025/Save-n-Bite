from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q
from admin_panel.permissions import IsSystemAdmin
from admin_panel.services import AdminService
from .models import FoodListing
from .serializers import FoodListingSerializer

def get_client_ip(request):
    """Helper function to get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def admin_get_all_listings(request):
    """Get all listings for admin management"""
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        provider_id = request.GET.get('provider')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        # Build query
        queryset = FoodListing.objects.select_related('provider').all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(provider__provider_profile__business_name__icontains=search)
            )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        # Paginate
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        # Serialize
        serializer = FoodListingSerializer(page_obj.object_list, many=True)
        
        return Response({
            'listings': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'LISTINGS_FETCH_ERROR',
                'message': 'Failed to fetch listings'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsSystemAdmin])
def admin_moderate_listing(request):
    """Remove, flag, or restore a listing"""
    listing_id = request.data.get('listing_id')
    action = request.data.get('action')  # 'remove', 'flag', 'restore'
    reason = request.data.get('reason', '')
    
    if not listing_id or not action:
        return Response({
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'listing_id and action are required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        listing = FoodListing.objects.get(id=listing_id)
        
        if action == 'remove':
            listing.admin_remove(request.user, reason)
            action_desc = f"Removed listing: {listing.name}"
        elif action == 'flag':
            listing.admin_flag(request.user, reason)
            action_desc = f"Flagged listing: {listing.name}"
        elif action == 'restore':
            listing.admin_restore()
            action_desc = f"Restored listing: {listing.name}"
        else:
            return Response({
                'error': {
                    'code': 'INVALID_ACTION',
                    'message': 'Action must be remove, flag, or restore'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log the action
        AdminService.log_admin_action(
            admin_user=request.user,
            action_type='listing_moderation',
            target_type='food_listing',
            target_id=listing_id,
            description=action_desc,
            metadata={
                'action': action,
                'reason': reason,
                'listing_name': listing.name,
                'provider': listing.provider.provider_profile.business_name if hasattr(listing.provider, 'provider_profile') else 'Unknown'
            },
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'message': f'Listing {action}ed successfully',
            'listing': {
                'id': str(listing.id),
                'name': listing.name,
                'status': listing.status,
                'action': action
            }
        }, status=status.HTTP_200_OK)
        
    except FoodListing.DoesNotExist:
        return Response({
            'error': {
                'code': 'LISTING_NOT_FOUND',
                'message': 'Listing not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': {
                'code': 'MODERATION_ERROR',
                'message': 'Failed to moderate listing'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)