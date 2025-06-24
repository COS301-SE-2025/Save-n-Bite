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

from .models import (
    PickupLocation, PickupTimeSlot, ScheduledPickup, 
    PickupOptimization, PickupAnalytics
)

from interactions.models import Order

# Import services
from .services import PickupSchedulingService, PickupOptimizationService

from .serializers import (
    PickupLocationSerializer, PickupTimeSlotSerializer,
    AvailableSlotSerializer, SchedulePickupSerializer,
    ScheduledPickupSerializer, PickupVerificationSerializer,
    QRCodeVerificationSerializer, PickupOptimizationSerializer,
    PickupAnalyticsSerializer, BusinessScheduleOverviewSerializer,
    CustomerScheduleSerializer, PickupHistorySerializer
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
        locations = PickupLocation.objects.filter(business=business, is_active=True)
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

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def pickup_location_detail(request, location_id):
    """Update or delete a specific pickup location"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can manage pickup locations'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        location = PickupLocation.objects.get(
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

    if request.method == 'PUT':
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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pickup_time_slots(request):
    """Manage pickup time slots for business"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can manage pickup time slots'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    business = request.user.provider_profile

    if request.method == 'GET':
        slots = PickupTimeSlot.objects.filter(
            business=business, 
            is_active=True
        ).select_related('location').order_by('day_of_week', 'start_time')
        
        serializer = PickupTimeSlotSerializer(slots, many=True)
        
        return Response({
            'time_slots': serializer.data,
            'count': slots.count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = PickupTimeSlotSerializer(
            data=request.data,
            context={'business': business}
        )
        
        if serializer.is_valid():
            try:
                location = get_object_or_404(
                    PickupLocation, 
                    id=request.data['location'],
                    business=business
                )
                
                time_slot = PickupSchedulingService.create_time_slot(
                    business, location, serializer.validated_data
                )
                
                response_serializer = PickupTimeSlotSerializer(time_slot)
                return Response({
                    'message': 'Time slot created successfully',
                    'time_slot': response_serializer.data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'error': {
                        'code': 'CREATION_ERROR',
                        'message': 'Failed to create time slot',
                        'details': str(e)
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid time slot data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def business_schedule_overview(request):
    """Get schedule overview for business"""
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
            target_date = timezone.now().date()
    else:
        target_date = timezone.now().date()

    # Get scheduled pickups for the date
    pickups = ScheduledPickup.objects.filter(
        location__business=business,
        scheduled_date=target_date
    ).select_related('order', 'location', 'time_slot')

    # Calculate statistics
    total_pickups = pickups.count()
    pending_pickups = pickups.filter(status__in=['scheduled', 'confirmed']).count()
    completed_pickups = pickups.filter(status='completed').count()
    missed_pickups = pickups.filter(status='missed').count()

    # Get detailed pickup information
    pickup_details = []
    for pickup in pickups:
        customer = pickup.order.interaction.user
        customer_name = 'Unknown'
        
        if customer.user_type == 'customer' and hasattr(customer, 'customer_profile'):
            customer_name = customer.customer_profile.full_name
        elif customer.user_type == 'ngo' and hasattr(customer, 'ngo_profile'):
            customer_name = customer.ngo_profile.organisation_name

        pickup_details.append({
            'pickup_id': str(pickup.id),
            'confirmation_code': pickup.confirmation_code,
            'customer_name': customer_name,
            'location_name': pickup.location.name,
            'scheduled_time': pickup.scheduled_start_time,
            'status': pickup.status,
            'order_total': float(pickup.order.interaction.total_amount),
            'items_count': pickup.order.interaction.items.count()
        })

    return Response({
        'date': target_date.isoformat(),
        'summary': {
            'total_pickups': total_pickups,
            'pending_pickups': pending_pickups,
            'completed_pickups': completed_pickups,
            'missed_pickups': missed_pickups,
            'completion_rate': round((completed_pickups / total_pickups * 100) if total_pickups > 0 else 0, 2)
        },
        'pickups': pickup_details
    }, status=status.HTTP_200_OK)

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

    serializer = PickupVerificationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            confirmation_code = serializer.validated_data['confirmation_code']
            pickup = PickupSchedulingService.verify_pickup_code(
                confirmation_code, 
                request.user.provider_profile
            )
            
            pickup_serializer = ScheduledPickupSerializer(pickup)
            return Response({
                'message': 'Pickup verified successfully',
                'pickup': pickup_serializer.data,
                'valid': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': {
                    'code': 'VERIFICATION_FAILED',
                    'message': str(e)
                },
                'valid': False
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
    """Mark a pickup as completed"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can complete pickups'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        pickup = ScheduledPickup.objects.get(
            id=pickup_id,
            location__business=request.user.provider_profile,
            status__in=['scheduled', 'confirmed']
        )
    except ScheduledPickup.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Pickup not found or cannot be completed'
            }
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        completion_data = request.data if request.data else {}
        completed_pickup = PickupSchedulingService.complete_pickup(pickup, completion_data)
        
        pickup_serializer = ScheduledPickupSerializer(completed_pickup)
        return Response({
            'message': 'Pickup completed successfully',
            'pickup': pickup_serializer.data
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_pickup_slots(request):
    """Get available pickup slots for a business"""
    business_id = request.query_params.get('business_id')
    target_date = request.query_params.get('date')
    location_id = request.query_params.get('location_id')

    if not business_id:
        return Response({
            'error': {
                'code': 'MISSING_PARAMETER',
                'message': 'business_id parameter is required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Fix: Use UserID instead of id
        business_user = User.objects.get(UserID=business_id, user_type='provider')
        business = business_user.provider_profile
    except User.DoesNotExist:
        return Response({
            'error': {
                'code': 'BUSINESS_NOT_FOUND',
                'message': 'Business not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)

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

    location = None
    if location_id:
        try:
            location = PickupLocation.objects.get(id=location_id, business=business)
        except PickupLocation.DoesNotExist:
            return Response({
                'error': {
                    'code': 'LOCATION_NOT_FOUND',
                    'message': 'Pickup location not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)

    try:
        available_slots = PickupSchedulingService.get_available_slots(
            business, target_date, location
        )
        
        serializer = AvailableSlotSerializer(available_slots, many=True)
        
        return Response({
            'date': target_date.isoformat(),
            'business_name': business.business_name,
            'available_slots': serializer.data,
            'count': len(available_slots)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting available slots: {str(e)}")
        return Response({
            'error': {
                'code': 'SLOTS_ERROR',
                'message': 'Failed to get available slots',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def schedule_pickup(request):
    """Schedule a pickup for an order"""
    # Only customers and NGOs can schedule pickups
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only customers and organizations can schedule pickups'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = SchedulePickupSerializer(
        data=request.data,
        context={'user': request.user}
    )
    
    if serializer.is_valid():
        try:
            order = Order.objects.get(
                id=serializer.validated_data['order_id'],
                interaction__user=request.user
            )
            
            pickup, qr_image = PickupSchedulingService.schedule_pickup(
                order, serializer.validated_data
            )
            
            pickup_serializer = ScheduledPickupSerializer(pickup)
            return Response({
                'message': 'Pickup scheduled successfully',
                'pickup': pickup_serializer.data,
                'qr_code': qr_image
            }, status=status.HTTP_201_CREATED)
            
        except Order.DoesNotExist:
            return Response({
                'error': {
                    'code': 'ORDER_NOT_FOUND',
                    'message': 'Order not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error scheduling pickup: {str(e)}")
            return Response({
                'error': {
                    'code': 'SCHEDULING_ERROR',
                    'message': 'Failed to schedule pickup',
                    'details': str(e)
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid scheduling data',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_pickups(request):
    """Get customer's scheduled pickups"""
    # Only customers and NGOs can view their pickups
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only customers and organizations can view their pickups'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    # Filter parameters
    status_filter = request.query_params.get('status')
    upcoming_only = request.query_params.get('upcoming', 'false').lower() == 'true'
    
    pickups = ScheduledPickup.objects.filter(
        order__interaction__user=request.user
    ).select_related(
        'order', 'location', 'location__business'
    ).order_by('-scheduled_date', '-scheduled_start_time')

    if status_filter:
        pickups = pickups.filter(status=status_filter)
    
    if upcoming_only:
        today = timezone.now().date()
        pickups = pickups.filter(
            scheduled_date__gte=today,
            status__in=['scheduled', 'confirmed']
        )

    # Pagination
    paginator = PickupPagination()
    paginated_pickups = paginator.paginate_queryset(pickups, request)
    
    # Prepare customer-friendly data
    pickup_data = []
    for pickup in paginated_pickups:
        business = pickup.location.business
        
        pickup_info = {
            'pickup_id': str(pickup.id),
            'business_name': business.business_name,
            'business_logo': business.logo.url if business.logo else None,
            'location_name': pickup.location.name,
            'location_address': pickup.location.address,
            'scheduled_date': pickup.scheduled_date,
            'scheduled_time': pickup.scheduled_start_time,
            'confirmation_code': pickup.confirmation_code,
            'status': pickup.status,
            'status_display': pickup.get_status_display(),
            'qr_code_image': PickupSchedulingService.generate_qr_code(pickup) if pickup.status in ['scheduled', 'confirmed'] else None,
            'order_total': float(pickup.order.interaction.total_amount),
            'items_count': pickup.order.interaction.items.count(),
            'is_today': pickup.is_today,
            'is_upcoming': pickup.is_upcoming,
            'contact_info': {
                'person': pickup.location.contact_person,
                'phone': pickup.location.contact_phone
            }
        }
        
        pickup_data.append(pickup_info)

    return paginator.get_paginated_response({
        'pickups': pickup_data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pickup_details(request, pickup_id):
    """Get detailed information about a specific pickup"""
    try:
        pickup = ScheduledPickup.objects.select_related(
            'order', 'location', 'location__business', 'order__interaction__user'
        ).get(id=pickup_id)
        
        # Check permissions
        if (request.user.user_type in ['customer', 'ngo'] and 
            pickup.order.interaction.user != request.user):
            return Response({
                'error': {
                    'code': 'FORBIDDEN',
                    'message': 'You can only view your own pickups'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        elif (request.user.user_type == 'provider' and 
              pickup.location.business.user != request.user):
            return Response({
                'error': {
                    'code': 'FORBIDDEN',
                    'message': 'You can only view pickups for your business'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ScheduledPickupSerializer(pickup)
        return Response({
            'pickup': serializer.data
        }, status=status.HTTP_200_OK)
        
    except ScheduledPickup.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Pickup not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def cancel_pickup(request, pickup_id):
    """Cancel a scheduled pickup"""
    try:
        pickup = ScheduledPickup.objects.get(
            id=pickup_id,
            order__interaction__user=request.user,
            status__in=['scheduled', 'confirmed']
        )
        
        # Check if pickup can still be cancelled (e.g., not too close to pickup time)
        pickup_datetime = timezone.make_aware(
            datetime.combine(pickup.scheduled_date, pickup.scheduled_start_time)
        )
        
        time_until_pickup = pickup_datetime - timezone.now()
        if time_until_pickup < timedelta(hours=1):
            return Response({
                'error': {
                    'code': 'TOO_LATE',
                    'message': 'Cannot cancel pickup less than 1 hour before scheduled time'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        pickup.status = 'cancelled'
        pickup.pickup_notes = request.data.get('reason', 'Cancelled by customer')
        pickup.save()
        
        # Send cancellation notification to business
        try:
            from notifications.services import NotificationService
            business_user = pickup.location.business.user
            
            NotificationService.create_notification(
                recipient=business_user,
                notification_type='business_update',
                title="Pickup Cancelled",
                message=f"Pickup {pickup.confirmation_code} has been cancelled by the customer.",
                data={
                    'pickup_id': str(pickup.id),
                    'cancellation_reason': pickup.pickup_notes,
                    'cancelled_at': timezone.now().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Failed to send cancellation notification: {str(e)}")
        
        return Response({
            'message': 'Pickup cancelled successfully',
            'pickup_id': str(pickup.id)
        }, status=status.HTTP_200_OK)
        
    except ScheduledPickup.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Pickup not found or cannot be cancelled'
            }
        }, status=status.HTTP_404_NOT_FOUND)

# =============== ANALYTICS VIEWS ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def business_analytics(request):
    """Get pickup analytics for business"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can view analytics'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    days_back = int(request.query_params.get('days', 7))
    
    try:
        analytics_data = PickupOptimizationService.get_business_analytics(
            request.user.provider_profile, days_back
        )
        
        return Response({
            'analytics': analytics_data,
            'generated_at': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting business analytics: {str(e)}")
        return Response({
            'error': {
                'code': 'ANALYTICS_ERROR',
                'message': 'Failed to get analytics data',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def optimization_recommendations(request):
    """Get optimization recommendations for business"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only food providers can view optimization recommendations'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    target_date = request.query_params.get('date')
    if target_date:
        try:
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        except ValueError:
            target_date = timezone.now().date()
    else:
        target_date = timezone.now().date()

    try:
        recommendations = PickupOptimizationService.optimize_schedule(
            request.user.provider_profile, target_date
        )
        
        return Response({
            'date': target_date.isoformat(),
            'recommendations': recommendations,
            'generated_at': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting optimization recommendations: {str(e)}")
        return Response({
            'error': {
                'code': 'OPTIMIZATION_ERROR',
                'message': 'Failed to get optimization recommendations',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# =============== UTILITY VIEWS ===============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_pickup_reminders(request):
    """Manually trigger pickup reminders (for testing)"""
    if not request.user.is_staff:
        return Response({
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only staff can trigger reminders'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        PickupSchedulingService.send_pickup_reminders()
        return Response({
            'message': 'Pickup reminders sent successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error sending pickup reminders: {str(e)}")
        return Response({
            'error': {
                'code': 'REMINDER_ERROR',
                'message': 'Failed to send pickup reminders',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def pickup_locations_public(request, business_id):
    """Get public pickup locations for a business"""
    try:
        # Fix: Use UserID instead of id
        business_user = User.objects.get(UserID=business_id, user_type='provider')
        business = business_user.provider_profile
        
        if business.status != 'verified':
            return Response({
                'error': {
                    'code': 'BUSINESS_NOT_VERIFIED',
                    'message': 'Business is not verified'
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        locations = PickupLocation.objects.filter(
            business=business, 
            is_active=True
        )
        
        # Return only public information
        locations_data = [
            {
                'id': str(location.id),
                'name': location.name,
                'address': location.address,
                'instructions': location.instructions,
                'contact_person': location.contact_person,
                'contact_phone': location.contact_phone
            }
            for location in locations
        ]
        
        return Response({
            'business_name': business.business_name,
            'locations': locations_data,
            'count': len(locations_data)
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': {
                'code': 'BUSINESS_NOT_FOUND',
                'message': 'Business not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)