# scheduling/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta, date

from .models import PickupLocation, ScheduledPickup, PickupAnalytics
from food_listings.models import FoodListing
from interactions.models import Order
from authentication.models import FoodProviderProfile

from .services import (
    PickupSchedulingService, 
    PickupNotificationService, 
    PickupAnalyticsService
)

from .serializers import (
    PickupLocationSerializer, ScheduledPickupSerializer,
    SchedulePickupSerializer, PickupVerificationSerializer,
    PickupAnalyticsSerializer
)

import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class PickupPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# =============== BUSINESS VIEWS ===============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pickup_locations(request):
    """Manage pickup locations for business"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can manage pickup locations'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    if not hasattr(request.user, 'provider_profile'):
        return Response({
            'error': {
                'code': 'PROFILE_NOT_FOUND',
                'message': 'Provider profile not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)

    business = request.user.provider_profile

    if request.method == 'GET':
        locations = PickupLocation.objects.filter(
            business=business, 
            is_active=True
        ).order_by('name')
        
        serializer = PickupLocationSerializer(locations, many=True)
        
        return Response({
            'locations': serializer.data,
            'count': locations.count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = PickupLocationSerializer(
            data=request.data,
            context={'business': business}
        )
        
        if serializer.is_valid():
            try:
                location = PickupSchedulingService.create_pickup_location(
                    business, serializer.validated_data
                )
                
                response_serializer = PickupLocationSerializer(location)
                return Response({
                    'message': 'Pickup location created successfully',
                    'location': response_serializer.data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'error': {
                        'code': 'CREATION_ERROR',
                        'message': 'Failed to create pickup location',
                        'details': str(e)
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid location data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def pickup_location_detail(request, location_id):
    """Get, update, or delete a specific pickup location"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can manage pickup locations'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        location = get_object_or_404(
            PickupLocation, 
            id=location_id, 
            business=request.user.provider_profile
        )
    except PickupLocation.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Pickup location not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PickupLocationSerializer(location)
        return Response({
            'location': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = PickupLocationSerializer(
            location, 
            data=request.data, 
            partial=True,
            context={'business': request.user.provider_profile}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Pickup location updated successfully',
                'location': serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid location data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Soft delete by setting is_active to False
        location.is_active = False
        location.save()
        
        return Response({
            'message': 'Pickup location deleted successfully'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def business_schedule_overview(request):
    """Get schedule overview for business - simplified"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can view schedule overview'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    business = request.user.provider_profile
    target_date = request.query_params.get('date')
    
    if target_date:
        try:
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': {
                    'code': 'INVALID_DATE',
                    'message': 'Invalid date format. Use YYYY-MM-DD'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    else:
        target_date = timezone.now().date()
    
    try:
        overview = PickupSchedulingService.get_business_schedule_overview(business, target_date)
        
        return Response({
            'schedule_overview': overview
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Failed to retrieve schedule overview',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_order_ready(request, pickup_id):
    """Mark an order as ready for pickup and send notification"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can mark orders as ready'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        pickup = get_object_or_404(
            ScheduledPickup,
            id=pickup_id,
            location__business=request.user.provider_profile,
            status='pending'
        )
        
        # Mark as ready and send notification
        pickup.mark_ready_for_pickup()
        
        return Response({
            'message': 'Order marked as ready for pickup and customer notified',
            'pickup': {
                'id': str(pickup.id),
                'status': pickup.status,
                'actual_ready_time': pickup.actual_ready_time,
                'confirmation_code': pickup.confirmation_code,
                'pickup_deadline': pickup.pickup_deadline,
                'notification_sent': pickup.ready_notification_sent
            }
        }, status=status.HTTP_200_OK)
        
    except ScheduledPickup.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Pickup not found or already processed'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': {
                'code': 'READY_ERROR',
                'message': 'Failed to mark order as ready',
                'details': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_pickup_code(request):
    """Verify pickup confirmation code"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can verify pickup codes'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    business = request.user.provider_profile
    serializer = PickupVerificationSerializer(
        data=request.data,
        context={'business': business}
    )
    
    if serializer.is_valid():
        try:
            pickup = PickupSchedulingService.verify_pickup_code(
                serializer.validated_data['confirmation_code'],
                business
            )
            
            # Create manual response
            user = pickup.order.interaction.user
            
            pickup_data = {
                'id': str(pickup.id),
                'order': str(pickup.order.id),
                'food_listing': {
                    'id': str(pickup.food_listing.id) if pickup.food_listing else None,
                    'name': pickup.food_listing.name if pickup.food_listing else 'Unknown',
                    'description': pickup.food_listing.description if pickup.food_listing else '',
                    'quantity': sum(item.quantity for item in pickup.order.interaction.items.all())
                },
                'location': {
                    'id': str(pickup.location.id),
                    'name': pickup.location.name,
                    'address': pickup.location.address,
                    'instructions': pickup.location.instructions,
                    'contact_person': pickup.location.contact_person,
                    'contact_phone': pickup.location.contact_phone
                },
                'pickup_date': pickup.pickup_date,
                'pickup_deadline': pickup.pickup_deadline,
                'actual_ready_time': pickup.actual_ready_time,
                'status': pickup.status,
                'confirmation_code': pickup.confirmation_code,
                'customer': {
                    'id': str(user.id),
                    'full_name': PickupNotificationService._get_customer_name(user),
                    'email': user.email,
                    'phone': user.phone_number if hasattr(user, 'phone_number') else ''
                },
                'customer_notes': pickup.customer_notes,
                'business_notes': pickup.business_notes,
                'is_upcoming': pickup.is_upcoming,
                'is_today': pickup.is_today,
                'created_at': pickup.created_at,
                'updated_at': pickup.updated_at
            }
            
            return Response({
                'message': 'Pickup verified successfully',
                'pickup': pickup_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': {
                    'code': 'VERIFICATION_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid verification data',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_pickup(request, pickup_id):
    """Mark pickup as completed"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can complete pickups'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        pickup = get_object_or_404(
            ScheduledPickup,
            id=pickup_id,
            location__business=request.user.provider_profile,
            status='ready'  # Only ready orders can be completed
        )
        
        completed_pickup = PickupSchedulingService.complete_pickup(pickup)
        
        return Response({
            'message': 'Pickup completed successfully',
            'pickup': {
                'id': str(completed_pickup.id),
                'status': completed_pickup.status,
                'actual_pickup_time': completed_pickup.actual_pickup_time,
                'confirmation_code': completed_pickup.confirmation_code,
                'food_listing_name': completed_pickup.food_listing.name if completed_pickup.food_listing else 'Unknown',
                'customer_email': completed_pickup.order.interaction.user.email
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'COMPLETION_ERROR',
                'message': 'Failed to complete pickup',
                'details': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)


# =============== CUSTOMER VIEWS ===============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def schedule_pickup(request):
    """Schedule a pickup for a customer - simplified without time slots"""
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only customers and NGOs can schedule pickups'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    # Get required parameters
    order_id = request.data.get('order_id')
    location_id = request.data.get('location_id')
    customer_notes = request.data.get('customer_notes', '')
    
    if not order_id:
        return Response({
            'error': {
                'code': 'MISSING_PARAMETER',
                'message': 'order_id is required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not location_id:
        return Response({
            'error': {
                'code': 'MISSING_PARAMETER',
                'message': 'location_id is required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(
            id=order_id,
            interaction__user=request.user
        )
        
        scheduled_pickup, qr_code = PickupSchedulingService.schedule_pickup(
            order, location_id, customer_notes
        )
        
        return Response({
            'message': 'Pickup scheduled successfully',
            'pickup': {
                'id': str(scheduled_pickup.id),
                'confirmation_code': scheduled_pickup.confirmation_code,
                'pickup_date': scheduled_pickup.pickup_date,
                'pickup_deadline': scheduled_pickup.pickup_deadline,
                'status': scheduled_pickup.status,
                'location_name': scheduled_pickup.location.name,
                'customer_notes': scheduled_pickup.customer_notes
            },
            'qr_code': qr_code
        }, status=status.HTTP_201_CREATED)
        
    except Order.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Order not found or not owned by you'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': {
                'code': 'SCHEDULING_ERROR',
                'message': 'Failed to schedule pickup',
                'details': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_pickups(request):
    """Get customer's scheduled pickups"""
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only customers and NGOs can view their pickups'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    # Filter parameters
    status_filter = request.query_params.get('status')
    upcoming_only = request.query_params.get('upcoming', 'false').lower() == 'true'
    
    pickups = ScheduledPickup.objects.filter(
        order__interaction__user=request.user
    ).select_related(
        'location', 'order', 'order__interaction'
    ).order_by('-pickup_date', '-created_at')
    
    if status_filter:
        pickups = pickups.filter(status=status_filter)
    
    if upcoming_only:
        pickups = pickups.filter(
            pickup_date__gte=timezone.now().date()
        )
    
    # Pagination
    paginator = PickupPagination()
    paginated_pickups = paginator.paginate_queryset(pickups, request)
    
    # Create response data
    pickup_data = []
    for pickup in paginated_pickups:
        # Get food listing info
        food_listing = pickup.food_listing
        
        pickup_data.append({
            'id': str(pickup.id),
            'interaction_id': str(pickup.order.interaction.id),
            'pickup_date': pickup.pickup_date,
            'pickup_deadline': pickup.pickup_deadline,
            'actual_ready_time': pickup.actual_ready_time,
            'status': pickup.status,
            'confirmation_code': pickup.confirmation_code,
            'food_listing': {
                'id': str(food_listing.id) if food_listing else None,
                'name': food_listing.name if food_listing else 'Unknown',
                'description': food_listing.description if food_listing else '',
                'expiry_date': food_listing.expiry_date if food_listing else None
            },
            'business': {
                'id': str(pickup.location.business.id),
                'business_name': pickup.location.business.business_name,
                'business_address': pickup.location.business.business_address,
                'business_contact': pickup.location.business.business_contact,
                'business_hours': pickup.location.business.business_hours
            },
            'location': {
                'id': str(pickup.location.id),
                'name': pickup.location.name,
                'address': pickup.location.address,
                'instructions': pickup.location.instructions,
                'contact_person': pickup.location.contact_person,
                'contact_phone': pickup.location.contact_phone
            },
            'customer_notes': pickup.customer_notes,
            'is_upcoming': pickup.is_upcoming,
            'is_today': pickup.is_today,
            'is_overdue': pickup.is_overdue
        })
    
    return paginator.get_paginated_response({
        'pickups': pickup_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pickup_details(request, pickup_id):
    """Get detailed information about a specific pickup"""
    try:
        if request.user.user_type in ['customer', 'ngo']:
            pickup = get_object_or_404(
                ScheduledPickup,
                id=pickup_id,
                order__interaction__user=request.user
            )
        elif request.user.user_type == 'provider':
            pickup = get_object_or_404(
                ScheduledPickup,
                id=pickup_id,
                location__business=request.user.provider_profile
            )
        else:
            return Response({
                'error': {
                    'code': 'FORBIDDEN',
                    'message': 'Access denied'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get food listing and user info
        user = pickup.order.interaction.user
        food_listing = pickup.food_listing
        
        pickup_data = {
            'id': str(pickup.id),
            'order': str(pickup.order.id),
            'food_listing': {
                'id': str(food_listing.id) if food_listing else None,
                'name': food_listing.name if food_listing else 'Unknown',
                'description': food_listing.description if food_listing else '',
                'quantity': sum(item.quantity for item in pickup.order.interaction.items.all())
            },
            'location': {
                'id': str(pickup.location.id),
                'name': pickup.location.name,
                'address': pickup.location.address,
                'instructions': pickup.location.instructions,
                'contact_person': pickup.location.contact_person,
                'contact_phone': pickup.location.contact_phone
            },
            'pickup_date': pickup.pickup_date,
            'pickup_deadline': pickup.pickup_deadline,
            'estimated_ready_time': pickup.estimated_ready_time,
            'actual_ready_time': pickup.actual_ready_time,
            'actual_pickup_time': pickup.actual_pickup_time,
            'status': pickup.status,
            'confirmation_code': pickup.confirmation_code,
            'customer': {
                'id': str(user.id),
                'full_name': PickupNotificationService._get_customer_name(user),
                'email': user.email,
                'phone': user.phone_number if hasattr(user, 'phone_number') else ''
            },
            'customer_notes': pickup.customer_notes,
            'business_notes': pickup.business_notes,
            'is_upcoming': pickup.is_upcoming,
            'is_today': pickup.is_today,
            'is_overdue': pickup.is_overdue,
            'created_at': pickup.created_at,
            'updated_at': pickup.updated_at
        }
        
        return Response({
            'pickup': pickup_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Pickup not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_pickup(request, pickup_id):
    """Cancel a scheduled pickup"""
    try:
        pickup = get_object_or_404(
            ScheduledPickup,
            id=pickup_id,
            order__interaction__user=request.user,
            status__in=['pending', 'ready']
        )
        
        reason = request.data.get('reason', 'Cancelled by customer')
        cancelled_pickup = PickupSchedulingService.cancel_pickup(pickup, cancelled_by_customer=True, reason=reason)
        
        return Response({
            'message': 'Pickup cancelled successfully',
            'pickup_id': str(cancelled_pickup.id),
            'status': cancelled_pickup.status
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'CANCELLATION_ERROR',
                'message': 'Failed to cancel pickup',
                'details': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)


# =============== ANALYTICS VIEWS ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def business_analytics(request):
    """Get pickup analytics for business - simplified"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can view analytics'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    business = request.user.provider_profile
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Default to last 7 days if no dates provided
    if not start_date:
        start_date = (timezone.now().date() - timedelta(days=7)).strftime('%Y-%m-%d')
    if not end_date:
        end_date = timezone.now().date().strftime('%Y-%m-%d')
    
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return Response({
            'error': {
                'code': 'INVALID_DATE',
                'message': 'Invalid date format. Use YYYY-MM-DD'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    analytics = PickupAnalytics.objects.filter(
        business=business,
        date__range=[start_date, end_date]
    ).order_by('-date')
    
    serializer = PickupAnalyticsSerializer(analytics, many=True)
    
    return Response({
        'analytics': serializer.data,
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'count': analytics.count()
    }, status=status.HTTP_200_OK)


# =============== UTILITY ENDPOINTS ===============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_pickup_reminders(request):
    """Send pickup reminders for orders approaching deadline"""
    if request.user.user_type not in ['provider', 'admin']:
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only providers and admins can send reminders'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        reminder_count = PickupNotificationService.check_and_send_reminders()
        
        return Response({
            'message': 'Pickup reminders processed successfully',
            'reminders_sent': reminder_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'REMINDER_ERROR',
                'message': 'Failed to send reminders',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_missed_pickups(request):
    """Check for and mark missed pickups"""
    if request.user.user_type not in ['provider', 'admin']:
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only providers and admins can check missed pickups'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        missed_count = PickupNotificationService.check_and_mark_missed_pickups()
        
        return Response({
            'message': 'Missed pickups check completed',
            'missed_pickups_marked': missed_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'CHECK_ERROR',
                'message': 'Failed to check missed pickups',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def pickup_locations_public(request, business_id):
    """Get public pickup locations for a business"""
    try:        
        business = get_object_or_404(FoodProviderProfile, id=business_id)
        
        locations = PickupLocation.objects.filter(
            business=business,
            is_active=True
        ).order_by('name')
        
        # Only return basic public information
        location_data = []
        for location in locations:
            location_data.append({
                'id': location.id,
                'name': location.name,
                'address': location.address,
                'instructions': location.instructions,
                'contact_person': location.contact_person,
                'contact_phone': location.contact_phone
            })
        
        return Response({
            'business': {
                'id': business.id,
                'name': business.business_name,
                'address': business.business_address,
                'business_hours': business.business_hours
            },
            'locations': location_data,
            'count': len(location_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Business not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)