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