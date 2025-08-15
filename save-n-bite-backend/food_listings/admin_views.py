# food_listings/admin_views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
import logging

from .models import FoodListing
from .serializers import FoodListingSerializer
from admin_system.permissions import IsSystemAdmin
from admin_system.services import AdminService
from admin_system.utils import get_client_ip

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def admin_get_all_listings(request):
    """Get all food listings for admin management"""
    try:
        search = request.GET.get('search', '')
        type_filter = request.GET.get('type', '')
        status_filter = request.GET.get('status', '')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        queryset = FoodListing.objects.select_related('provider', 'provider__provider_profile').all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(provider__username__icontains=search) |
                Q(provider__provider_profile__business_name__icontains=search)
            )
        
        if type_filter and type_filter != 'All':
            queryset = queryset.filter(food_type=type_filter.lower())
            
        if status_filter and status_filter != 'All':
            queryset = queryset.filter(status=status_filter.lower())
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        # Paginate
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        listings_data = []
        for listing in page_obj.object_list:
            provider_name = (
                listing.provider.provider_profile.business_name 
                if hasattr(listing.provider, 'provider_profile') 
                else listing.provider.username
            )
            
            listings_data.append({
                'id': str(listing.id),
                'name': listing.name,
                'provider': provider_name,
                'type': listing.food_type.replace('_', ' ').title(),
                'price': f"R{listing.discounted_price}" if listing.discounted_price > 0 else "Free",
                'status': listing.status.title(),
                'created': listing.created_at.isoformat(),
                'image': listing.images[0] if listing.images else None,
                'expiry_date': listing.expiry_date.isoformat(),
                'quantity_available': listing.quantity_available,
                'admin_flagged': listing.admin_flagged,
                'admin_removal_reason': listing.admin_removal_reason
            })
        
        return Response({
            'listings': listings_data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get admin listings error: {str(e)}")
        return Response({
            'error': {
                'code': 'LISTINGS_FETCH_ERROR',
                'message': 'Failed to fetch listings'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsSystemAdmin])
def admin_moderate_listing(request):
    """Flag, unflag, or remove a listing"""
    try:
        listing_id = request.data.get('listing_id')
        action = request.data.get('action')  # 'flag', 'unflag', 'remove'
        reason = request.data.get('reason', '')
        
        if not listing_id or not action:
            return Response({
                'error': {
                    'code': 'MISSING_DATA',
                    'message': 'listing_id and action are required'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        listing = FoodListing.objects.get(id=listing_id)
        old_status = listing.status
        
        if action == 'flag':
            listing.status = 'flagged'
            listing.admin_flagged = True
            listing.admin_removal_reason = reason
            listing.save()
            
        elif action == 'unflag':
            # Restore to active if it was flagged
            if listing.status == 'flagged':
                listing.status = 'active'
                listing.admin_flagged = False
                listing.admin_removal_reason = ''
                listing.save()
            
        elif action == 'remove':
            listing.admin_remove(admin_user=request.user, reason=reason)
            listing.save()
            
        else:
            return Response({
                'error': {'code': 'INVALID_ACTION', 'message': 'Invalid action. Use flag, unflag, or remove'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log the action
        AdminService.log_admin_action(
            admin_user=request.user,
            action_type='listing_moderation',
            target_type='listing',
            target_id=str(listing.id),
            description=f"Listing {action}ed: {listing.name}. Reason: {reason}",
            metadata={
                'old_status': old_status,
                'new_status': listing.status,
                'reason': reason,
                'action': action,
                'provider': listing.provider.username
            },
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'message': f'Listing {action}ed successfully',
            'listing': {
                'id': str(listing.id),
                'status': listing.status,
                'admin_flagged': listing.admin_flagged
            }
        }, status=status.HTTP_200_OK)
        
    except FoodListing.DoesNotExist:
        return Response({
            'error': {'code': 'LISTING_NOT_FOUND', 'message': 'Listing not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Moderate listing error: {str(e)}")
        return Response({
            'error': {'code': 'MODERATION_ERROR', 'message': 'Failed to moderate listing'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)