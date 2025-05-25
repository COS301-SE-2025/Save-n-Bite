# food_listings/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q, Min, Max
from django.db import models
from django.shortcuts import get_object_or_404
from django.db import transaction
from datetime import datetime, date

from .models import FoodListing#, CartItem, Order, OrderItem
from .serializers import (
    FoodListingSerializer, FoodListingCreateSerializer, 
    FoodListingDetailSerializer, FoodListingUpdateSerializer,
    # CartItemSerializer, AddToCartSerializer, RemoveFromCartSerializer,
    # OrderSerializer, CheckoutSerializer
)

# =============== PROVIDER VIEWS ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_provider_listings(request):
    """Get all listings for the authenticated provider"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can access this endpoint'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    listings = FoodListing.objects.filter(provider=request.user)
    serializer = FoodListingSerializer(listings, many=True)
    
    return Response({
        'listings': serializer.data,
        'totalCount': listings.count()
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
            response_serializer = FoodListingSerializer(listing)
            
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
def browse_food_listings(request):
    """Browse available food listings with filtering and sorting"""
    # Base queryset - only active listings
    queryset = FoodListing.objects.filter(
        status='active',
        quantity_available__gt=0,
        expiry_date__gte=date.today()
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
        queryset = queryset.filter(food_type=food_type)
    
    area = request.GET.get('area')
    if area:
        queryset = queryset.filter(
            provider__provider_profile__business_address__icontains=area
        )
    
    # Apply sorting
    sort_by = request.GET.get('sort', 'created_at')
    sort_mapping = {
        'price_asc': 'discounted_price',
        'price_desc': '-discounted_price',
        'expiry_asc': 'expiry_date',
        'distance': 'created_at',  # Placeholder for distance sorting
    }
    
    order_by = sort_mapping.get(sort_by, '-created_at')
    queryset = queryset.order_by(order_by)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    
    paginator = Paginator(queryset, limit)
    page_obj = paginator.get_page(page)
    
    # Serialize listings
    serializer = FoodListingSerializer(page_obj.object_list, many=True)
    
    # Get filter options
    all_listings = FoodListing.objects.filter(status='active')
    available_types = list(all_listings.values_list('food_type', flat=True).distinct())
    price_range = {
        'min': float(all_listings.aggregate(min_price=models.Min('discounted_price'))['min_price'] or 0),
        'max': float(all_listings.aggregate(max_price=models.Max('discounted_price'))['max_price'] or 0)
    }
    
    return Response({
        'listings': serializer.data,
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
def get_food_listing_details(request, listing_id):
    """Get detailed information about a specific food listing"""
    try:
        listing = FoodListing.objects.select_related('provider').get(
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
    
    return Response({
        'listing': serializer.data
    }, status=status.HTTP_200_OK)


# # =============== CART VIEWS ===============

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_cart_items(request):
#     """Get items in user's cart"""
#     if request.user.user_type != 'customer':
#         return Response({
#             'error': {
#                 'code': 'FORBIDDEN',
#                 'message': 'Only customers can access cart'
#             }
#         }, status=status.HTTP_403_FORBIDDEN)
    
#     cart_items = CartItem.objects.filter(user=request.user).select_related('listing')
#     serializer = CartItemSerializer(cart_items, many=True)
    
#     # Calculate summary
#     total_items = sum(item.quantity for item in cart_items)
#     subtotal = sum(item.total_price for item in cart_items)
#     estimated_savings = sum(item.listing.savings * item.quantity for item in cart_items)
    
#     return Response({
#         'cartItems': serializer.data,
#         'summary': {
#             'totalItems': total_items,
#             'subtotal': float(subtotal),
#             'estimatedSavings': float(estimated_savings),
#             'totalAmount': float(subtotal)
#         }
#     }, status=status.HTTP_200_OK)


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def add_to_cart(request):
#     """Add item to cart"""
#     if request.user.user_type != 'customer':
#         return Response({
#             'error': {
#                 'code': 'FORBIDDEN',
#                 'message': 'Only customers can add items to cart'
#             }
#         }, status=status.HTTP_403_FORBIDDEN)
    
#     serializer = AddToCartSerializer(data=request.data)
    
#     if serializer.is_valid():
#         listing_id = serializer.validated_data['listingId']
#         quantity = serializer.validated_data['quantity']
        
#         try:
#             listing = FoodListing.objects.get(id=listing_id)
            
#             # Check if enough quantity is available
#             if listing.quantity_available < quantity:
#                 return Response({
#                     'error': {
#                         'code': 'INSUFFICIENT_QUANTITY',
#                         'message': f'Only {listing.quantity_available} items available'
#                     }
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Check if item already exists in cart
#             cart_item, created = CartItem.objects.get_or_create(
#                 user=request.user,
#                 listing=listing,
#                 defaults={'quantity': quantity}
#             )
            
#             if not created:
#                 # Update quantity if item already exists
#                 cart_item.quantity += quantity
#                 if cart_item.quantity > listing.quantity_available:
#                     cart_item.quantity = listing.quantity_available
#                 cart_item.save()
            
#             # Get updated cart summary
#             cart_items = CartItem.objects.filter(user=request.user)
#             total_items = sum(item.quantity for item in cart_items)
#             total_amount = sum(item.total_price for item in cart_items)
            
#             return Response({
#                 'message': 'Item added to cart successfully',
#                 'cartItem': {
#                     'id': str(cart_item.id),
#                     'listingId': str(listing.id),
#                     'quantity': cart_item.quantity,
#                     'addedAt': cart_item.added_at.isoformat()
#                 },
#                 'cartSummary': {
#                     'totalItems': total_items,
#                     'totalAmount': float(total_amount)
#                 }
#             }, status=status.HTTP_200_OK)
            
#         except FoodListing.DoesNotExist:
#             return Response({
#                 'error': {
#                     'code': 'NOT_FOUND',
#                     'message': 'Listing not found'
#                 }
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             return Response({
#                 'error': {
#                     'code': 'CART_ERROR',
#                     'message': 'Failed to add item to cart',
#                     'details': [{'field': 'general', 'message': str(e)}]
#                 }
#             }, status=status.HTTP_400_BAD_REQUEST)
    
#     return Response({
#         'error': {
#             'code': 'VALIDATION_ERROR',
#             'message': 'Request validation failed',
#             'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
#         }
#     }, status=status.HTTP_400_BAD_REQUEST)


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def remove_from_cart(request):
#     """Remove item from cart"""
#     if request.user.user_type != 'customer':
#         return Response({
#             'error': {
#                 'code': 'FORBIDDEN',
#                 'message': 'Only customers can remove items from cart'
#             }
#         }, status=status.HTTP_403_FORBIDDEN)
    
#     serializer = RemoveFromCartSerializer(data=request.data, context={'request': request})
    
#     if serializer.is_valid():
#         cart_item_id = serializer.validated_data['cartItemId']
        
#         try:
#             cart_item = CartItem.objects.get(id=cart_item_id, user=request.user)
#             cart_item.delete()
            
#             # Get updated cart summary
#             cart_items = CartItem.objects.filter(user=request.user)
#             total_items = sum(item.quantity for item in cart_items)
#             total_amount = sum(item.total_price for item in cart_items)
            
#             return Response({
#                 'message': 'Item removed from cart successfully',
#                 'cartSummary': {
#                     'totalItems': total_items,
#                     'totalAmount': float(total_amount)
#                 }
#             }, status=status.HTTP_200_OK)
            
#         except CartItem.DoesNotExist:
#             return Response({
#                 'error': {
#                     'code': 'NOT_FOUND',
#                     'message': 'Cart item not found'
#                 }
#             }, status=status.HTTP_404_NOT_FOUND)
    
#     return Response({
#         'error': {
#             'code': 'VALIDATION_ERROR',
#             'message': 'Request validation failed',
#             'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
#         }
#     }, status=status.HTTP_400_BAD_REQUEST)


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def checkout_cart(request):
#     """Process cart checkout and create orders"""
#     if request.user.user_type != 'customer':
#         return Response({
#             'error': {
#                 'code': 'FORBIDDEN',
#                 'message': 'Only customers can checkout'
#             }
#         }, status=status.HTTP_403_FORBIDDEN)
    
#     serializer = CheckoutSerializer(data=request.data)
    
#     if serializer.is_valid():
#         payment_method = serializer.validated_data['paymentMethod']
#         special_instructions = serializer.validated_data.get('specialInstructions', '')
        
#         # Get cart items
#         cart_items = CartItem.objects.filter(user=request.user).select_related('listing')
        
#         if not cart_items.exists():
#             return Response({
#                 'error': {
#                     'code': 'EMPTY_CART',
#                     'message': 'Cart is empty'
#                 }
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             with transaction.atomic():
#                 # Group cart items by provider
#                 orders_by_provider = {}
                
#                 for cart_item in cart_items:
#                     provider = cart_item.listing.provider
                    
#                     if provider not in orders_by_provider:
#                         orders_by_provider[provider] = {
#                             'items': [],
#                             'total_amount': 0
#                         }
                    
#                     orders_by_provider[provider]['items'].append(cart_item)
#                     orders_by_provider[provider]['total_amount'] += cart_item.total_price
                
#                 created_orders = []
#                 total_amount = 0
#                 total_savings = 0
                
#                 # Create orders for each provider
#                 for provider, order_data in orders_by_provider.items():
#                     order = Order.objects.create(
#                         user=request.user,
#                         provider=provider,
#                         total_amount=order_data['total_amount'],
#                         payment_method=payment_method,
#                         special_instructions=special_instructions
#                     )
                    
#                     # Create order items and update listing quantities
#                     for cart_item in order_data['items']:
#                         OrderItem.objects.create(
#                             order=order,
#                             listing=cart_item.listing,
#                             quantity=cart_item.quantity,
#                             price_per_item=cart_item.listing.discounted_price
#                         )
                        
#                         # Update listing quantity
#                         listing = cart_item.listing
#                         listing.quantity_available -= cart_item.quantity
#                         listing.save()
                        
#                         # Calculate savings
#                         total_savings += listing.savings * cart_item.quantity
                    
#                     total_amount += order_data['total_amount']
#                     created_orders.append(order)
                
#                 # Clear the cart
#                 cart_items.delete()
                
#                 # Serialize orders for response
#                 orders_data = []
#                 for order in created_orders:
#                     order_items = []
#                     for item in order.items.all():
#                         order_items.append({
#                             'name': item.listing.name,
#                             'quantity': item.quantity,
#                             'price': float(item.price_per_item)
#                         })
                    
#                     orders_data.append({
#                         'id': str(order.id),
#                         'providerId': str(order.provider.id),
#                         'providerName': order.provider.provider_profile.business_name,
#                         'items': order_items,
#                         'totalAmount': float(order.total_amount),
#                         'status': order.status,
#                         'pickupWindow': '17:00-19:00',  # This should come from listings
#                         'pickupCode': order.pickup_code,
#                         'createdAt': order.created_at.isoformat()
#                     })
                
#                 return Response({
#                     'message': 'Checkout successful',
#                     'orders': orders_data,
#                     'summary': {
#                         'totalAmount': float(total_amount),
#                         'totalSavings': float(total_savings),
#                         'paymentStatus': 'completed'
#                     }
#                 }, status=status.HTTP_200_OK)
                
#         except Exception as e:
#             return Response({
#                 'error': {
#                     'code': 'CHECKOUT_ERROR',
#                     'message': 'Checkout failed',
#                     'details': [{'field': 'general', 'message': str(e)}]
#                 }
#             }, status=status.HTTP_400_BAD_REQUEST)
    
#     return Response({
#         'error': {
#             'code': 'VALIDATION_ERROR',
#             'message': 'Request validation failed',
#             'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
#         }
#     }, status=status.HTTP_400_BAD_REQUEST)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_pickup_details(request, order_id):
#     """Get pickup details for an order"""
#     try:
#         order = Order.objects.get(id=order_id, user=request.user)
#     except Order.DoesNotExist:
#         return Response({
#             'error': {
#                 'code': 'NOT_FOUND',
#                 'message': 'Order not found'
#             }
#         }, status=status.HTTP_404_NOT_FOUND)
    
#     # Get provider profile
#     provider_profile = order.provider.provider_profile
    
#     # Get order items
#     items = []
#     for item in order.items.all():
#         items.append({
#             'name': item.listing.name,
#             'quantity': item.quantity,
#             'specialInstructions': ''  # Can be added per item if needed
#         })
    
#     return Response({
#         'order': {
#             'id': str(order.id),
#             'pickupCode': order.pickup_code,
#             'status': order.status,
#             'provider': {
#                 'businessName': provider_profile.business_name,
#                 'address': provider_profile.business_address,
#                 'contact': provider_profile.business_contact,
#                 'coordinates': {'lat': 40.7128, 'lng': -74.0060}  # Placeholder
#             },
#             'items': items,
#             'pickupWindow': '17:00-19:00',  # Should be calculated from order items
#             'estimatedReady': order.created_at.isoformat(),  # Placeholder
#             'specialInstructions': order.special_instructions or ''
#         }
#     }, status=status.HTTP_200_OK)

# # Create your views here.
