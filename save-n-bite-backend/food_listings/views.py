# food_listings/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q, Min, Max
from django.db import models
from django.shortcuts import get_object_or_404
from datetime import datetime, date
from django.utils import timezone

from .models import FoodListing
from .serializers import (
    FoodListingSerializer, FoodListingCreateSerializer, 
    FoodListingDetailSerializer, FoodListingUpdateSerializer
)

# =============== PROVIDER VIEWS ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_provider_listings(request):
    """Get all listings for the authenticated provider with follower insights"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can access this endpoint'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    listings = FoodListing.objects.filter(provider=request.user)
    serializer = FoodListingSerializer(listings, many=True)
    
    # Add follower insights
    try:
        from notifications.models import BusinessFollower
        follower_count = BusinessFollower.objects.filter(
            business=request.user.provider_profile
        ).count()
    except:
        follower_count = 0
    
    return Response({
        'listings': serializer.data,
        'totalCount': listings.count(),
        'followerCount': follower_count,
        'insights': {
            'total_followers': follower_count,
            'active_listings': listings.filter(status='active').count(),
            'sold_out_listings': listings.filter(status='sold_out').count(),
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_food_listing(request):
    """Create a new food listing"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can create listings'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check if provider is verified
    if not hasattr(request.user, 'provider_profile') or request.user.provider_profile.status != 'verified':
        return Response({
            'error': {
                'code': 'VERIFICATION_REQUIRED',
                'message': 'Provider account must be verified to create listings'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = FoodListingCreateSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        try:
            listing = serializer.save()
            
            return Response({
                'message': 'Listing created successfully',
                'listing': {
                    'id': str(listing.id),
                    'name': listing.name,
                    'quantity': listing.quantity,
                    'price': float(listing.discounted_price),
                    'status': listing.status,
                    'createdAt': listing.created_at.isoformat()
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': {
                    'code': 'CREATION_ERROR',
                    'message': 'Failed to create listing',
                    'details': [{'field': 'general', 'message': str(e)}]
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Request validation failed',
            'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_food_listing(request, listing_id):
    """Update an existing food listing"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can update listings'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        listing = FoodListing.objects.get(id=listing_id, provider=request.user)
    except FoodListing.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Listing not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = FoodListingUpdateSerializer(listing, data=request.data, partial=True)
    
    if serializer.is_valid():
        try:
            updated_listing = serializer.save()
            
            return Response({
                'message': 'Listing updated successfully',
                'listing': {
                    'id': str(updated_listing.id),
                    'name': updated_listing.name,
                    'updatedAt': updated_listing.updated_at.isoformat()
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': {
                    'code': 'UPDATE_ERROR',
                    'message': 'Failed to update listing',
                    'details': [{'field': 'general', 'message': str(e)}]
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Request validation failed',
            'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_food_listing(request, listing_id):
    """Delete a food listing (provider only) - Simplified version"""
    
    # Check if user is a provider
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can delete listings'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get the listing and verify ownership
    try:
        listing = FoodListing.objects.get(id=listing_id, provider=request.user)
    except FoodListing.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Listing not found or you do not have permission to delete it'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if listing is already deleted
    if listing.status == 'removed':
        return Response({
            'error': {
                'code': 'ALREADY_DELETED',
                'message': 'This listing has already been deleted'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Store listing details for response
        listing_data = {
            'id': str(listing.id),
            'name': listing.name,
            'created_at': listing.created_at.isoformat()
        }
        
        # Clean up images if they exist
        deleted_images_count = 0
        if isinstance(listing.images, list) and len(listing.images) > 0:
            try:
                for image_url in listing.images[:]:
                    success = listing.remove_image(image_url)
                    if success:
                        deleted_images_count += 1
            except Exception as e:
                # Log error but don't fail deletion
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to delete some images for listing {listing.id}: {str(e)}")
        
        # Check if hard delete is requested
        hard_delete = request.query_params.get('hard_delete', 'false').lower() == 'true'
        
        if hard_delete:
            # Permanently delete
            listing.delete()
            message = 'Listing permanently deleted'
            deletion_type = 'permanent'
        else:
            # Soft delete
            listing.status = 'removed'
            listing.admin_removal_reason = f"Deleted by provider on {timezone.now().isoformat()}"
            listing.removed_by = request.user
            listing.removed_at = timezone.now()
            listing.save()
            message = 'Listing deleted successfully'
            deletion_type = 'soft'
        
        return Response({
            'message': message,
            'deleted_listing': {
                **listing_data,
                'deleted_at': timezone.now().isoformat(),
                'deletion_type': deletion_type,
                'deleted_images_count': deleted_images_count,
                'can_be_restored': not hard_delete
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'DELETION_ERROR',
                'message': 'Failed to delete listing',
                'details': [{'field': 'general', 'message': str(e)}]
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_food_listing(request, listing_id):
    """Restore a soft-deleted food listing - Simplified version"""
    
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can restore listings'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        listing = FoodListing.objects.get(
            id=listing_id, 
            provider=request.user,
            status='removed'
        )
    except FoodListing.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Removed listing not found or you do not have permission to restore it'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        # Check if listing is expired
        if listing.is_expired:
            return Response({
                'error': {
                    'code': 'EXPIRED_LISTING',
                    'message': 'Cannot restore expired listing. Please create a new listing instead.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Restore the listing using the existing model method
        listing.admin_restore()
        
        return Response({
            'message': 'Listing restored successfully',
            'restored_listing': {
                'id': str(listing.id),
                'name': listing.name,
                'status': listing.status,
                'restored_at': timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'RESTORATION_ERROR',
                'message': 'Failed to restore listing',
                'details': [{'field': 'general', 'message': str(e)}]
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_deleted_listings(request):
    """Get all soft-deleted listings for the authenticated provider - Simplified version"""
    
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can access this endpoint'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    deleted_listings = FoodListing.objects.filter(
        provider=request.user,
        status='removed'
    ).order_by('-removed_at')
    
    # Use existing serializer
    from .serializers import FoodListingSerializer
    serializer = FoodListingSerializer(deleted_listings, many=True)
    
    return Response({
        'deleted_listings': serializer.data,
        'count': deleted_listings.count(),
        'message': 'Use the restore endpoint to recover any of these listings'
    }, status=status.HTTP_200_OK)


# =============== CUSTOMER VIEWS ===============

@api_view(['GET'])
@permission_classes([AllowAny])
def browse_food_listings(request):
    """Browse available food listings with filtering and sorting"""
    # Base queryset - only active listings
    queryset = FoodListing.objects.filter(
        status='active',
        quantity_available__gt=0,
        expiry_date__gte=date.today()
    ).select_related('provider__provider_profile')
    
    # Apply search query
    search_query = request.GET.get('search', '').strip()
    if search_query:
        queryset = queryset.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(provider__provider_profile__business_name__icontains=search_query) |
            Q(food_type__icontains=search_query)
        )
    
    # Apply filters
    store = request.GET.get('store')
    if store:
        queryset = queryset.filter(
            provider__provider_profile__business_name__icontains=store
        )
    
    price_min = request.GET.get('priceMin')
    if price_min:
        try:
            queryset = queryset.filter(discounted_price__gte=float(price_min))
        except ValueError:
            pass
    
    price_max = request.GET.get('priceMax')
    if price_max:
        try:
            queryset = queryset.filter(discounted_price__lte=float(price_max))
        except ValueError:
            pass
    
    food_type = request.GET.get('type')
    if food_type:
        if food_type == 'discount':
            # Filter for items where original price is greater than discounted price
            queryset = queryset.filter(
                models.Q(original_price__gt=models.F('discounted_price')) &
                models.Q(discounted_price__gt=0)
            )
        elif food_type == 'donation':
            # Filter for items with no price (donations)
            queryset = queryset.filter(discounted_price=0)
        else:
            queryset = queryset.filter(food_type=food_type)
    
    area = request.GET.get('area')
    if area:
        queryset = queryset.filter(
            provider__provider_profile__business_address__icontains=area
        )
    
    # Apply sorting
    sort_by = request.GET.get('sort', '-created_at')
    queryset = queryset.order_by(sort_by)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    
    paginator = Paginator(queryset, limit)
    page_obj = paginator.get_page(page)
    
    # Serialize listings with follow status if user is authenticated
    listings_data = []
    for listing in page_obj.object_list:
        serializer = FoodListingSerializer(listing)
        listing_data = serializer.data
        
        # Add follow status if user is authenticated
        if request.user.is_authenticated:
            try:
                from notifications.models import BusinessFollower
                is_following = BusinessFollower.objects.filter(
                    user=request.user,
                    business=listing.provider.provider_profile
                ).exists()
                listing_data['provider']['is_following'] = is_following
            except:
                listing_data['provider']['is_following'] = False
        else:
            listing_data['provider']['is_following'] = False
            
        listings_data.append(listing_data)
    
    # Get filter options
    all_listings = FoodListing.objects.filter(status='active')
    available_types = list(all_listings.values_list('food_type', flat=True).distinct())
    price_range = {
        'min': float(all_listings.aggregate(min_price=models.Min('discounted_price'))['min_price'] or 0),
        'max': float(all_listings.aggregate(max_price=models.Max('discounted_price'))['max_price'] or 0)
    }
    
    return Response({
        'listings': listings_data,
        'pagination': {
            'currentPage': page,
            'totalPages': paginator.num_pages,
            'totalItems': paginator.count,
            'hasNext': page_obj.has_next(),
            'hasPrev': page_obj.has_previous()
        },
        'filters': {
            'availableTypes': available_types,
            'priceRange': price_range,
            'availableAreas': ['downtown', 'suburbs', 'north_end']  # Placeholder
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_food_listing_details(request, listing_id):
    """Get detailed information about a specific food listing"""
    try:
        listing = FoodListing.objects.select_related('provider__provider_profile').get(
            id=listing_id,
            status='active'
        )
    except FoodListing.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Listing not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = FoodListingDetailSerializer(listing)
    listing_data = serializer.data
    
    # Add follow status and follower count if user is authenticated
    if request.user.is_authenticated:
        try:
            from notifications.models import BusinessFollower
            is_following = BusinessFollower.objects.filter(
                user=request.user,
                business=listing.provider.provider_profile
            ).exists()
            listing_data['provider']['is_following'] = is_following
            
            # Add follower count
            follower_count = BusinessFollower.objects.filter(
                business=listing.provider.provider_profile
            ).count()
            listing_data['provider']['follower_count'] = follower_count
        except:
            listing_data['provider']['is_following'] = False
            listing_data['provider']['follower_count'] = 0
    else:
        listing_data['provider']['is_following'] = False
        listing_data['provider']['follower_count'] = 0
    
    return Response({
        'listing': listing_data
    }, status=status.HTTP_200_OK)