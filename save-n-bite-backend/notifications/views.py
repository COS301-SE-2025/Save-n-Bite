# notifications/views.py - Complete fixed version

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Notification, NotificationPreferences, BusinessFollower
from .serializers import (
    NotificationSerializer, 
    NotificationPreferencesSerializer,
    BusinessFollowerSerializer,
    FollowBusinessSerializer,
    MarkNotificationReadSerializer
)
from .services import NotificationService
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get paginated notifications for authenticated user"""
    try:
        notifications = Notification.objects.filter(
            recipient=request.user,  # This works because of the custom JWT auth
            is_deleted=False
        ).order_by('-created_at')

        # Filter by read/unread status if specified
        read_status = request.query_params.get('read_status')
        if read_status == 'unread':
            notifications = notifications.filter(is_read=False)
        elif read_status == 'read':
            notifications = notifications.filter(is_read=True)

        # Filter by notification type if specified
        notification_type = request.query_params.get('type')
        if notification_type:
            notifications = notifications.filter(notification_type=notification_type)

        paginator = NotificationPagination()
        paginated_notifications = paginator.paginate_queryset(notifications, request)
        serializer = NotificationSerializer(paginated_notifications, many=True)

        return paginator.get_paginated_response({
            'notifications': serializer.data,
            'unread_count': NotificationService.get_unread_count(request.user)
        })

    except Exception as e:
        logger.error(f"Error fetching notifications for user {request.user.email}: {str(e)}")
        return Response({
            'error': {
                'code': 'FETCH_ERROR',
                'message': 'Failed to fetch notifications',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    """Mark specified notifications as read"""
    serializer = MarkNotificationReadSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            notification_ids = serializer.validated_data['notification_ids']
            count = NotificationService.mark_notifications_as_read(request.user, notification_ids)
            
            return Response({
                'message': f'{count} notifications marked as read',
                'marked_count': count,
                'unread_count': NotificationService.get_unread_count(request.user)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error marking notifications as read: {str(e)}")
            return Response({
                'error': {
                    'code': 'UPDATE_ERROR',
                    'message': 'Failed to mark notifications as read',
                    'details': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid request data',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """Mark all notifications as read for authenticated user"""
    try:
        count = Notification.objects.filter(
            recipient=request.user,  # This works because of the custom JWT auth
            is_read=False,
            is_deleted=False
        ).update(is_read=True)
        
        return Response({
            'message': 'All notifications marked as read',
            'marked_count': count,
            'unread_count': 0
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return Response({
            'error': {
                'code': 'UPDATE_ERROR',
                'message': 'Failed to mark all notifications as read',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """Get count of unread notifications"""
    try:
        count = NotificationService.get_unread_count(request.user)
        return Response({
            'unread_count': count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching unread count: {str(e)}")
        return Response({
            'error': {
                'code': 'FETCH_ERROR',
                'message': 'Failed to fetch unread count',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """Soft delete a notification"""
    try:
        notification = get_object_or_404(
            Notification, 
            id=notification_id, 
            recipient=request.user  # This works because of the custom JWT auth
        )
        
        notification.is_deleted = True
        notification.save()
        
        return Response({
            'message': 'Notification deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        return Response({
            'error': {
                'code': 'DELETE_ERROR',
                'message': 'Failed to delete notification',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def notification_preferences(request):
    """Get or update user notification preferences"""
    try:
        # This now works because of the custom JWT auth
        preferences, created = NotificationPreferences.objects.get_or_create(
            user=request.user,
            defaults={
                'email_notifications': True,
                'new_listing_notifications': True,
                'promotional_notifications': False,
                'weekly_digest': True
            }
        )
        
        if request.method == 'GET':
            serializer = NotificationPreferencesSerializer(preferences)
            return Response({
                'preferences': serializer.data
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            serializer = NotificationPreferencesSerializer(
                preferences, 
                data=request.data, 
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'message': 'Notification preferences updated successfully',
                    'preferences': serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response({
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid preferences data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error handling notification preferences: {str(e)}")
        return Response({
            'error': {
                'code': 'PREFERENCES_ERROR',
                'message': 'Failed to handle notification preferences',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_business(request):
    """Follow a business to receive notifications"""
    # Only customers and NGOs can follow businesses
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only customers and organizations can follow businesses'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = FollowBusinessSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            business_id = serializer.validated_data['business_id']
            follower, created = NotificationService.follow_business(request.user, business_id)
            
            if created:
                message = 'Successfully followed business'
                status_code = status.HTTP_201_CREATED
            else:
                message = 'Already following this business'
                status_code = status.HTTP_200_OK
            
            return Response({
                'message': message,
                'follower_id': follower.id,
                'created': created
            }, status=status_code)
            
        except ValueError as e:
            return Response({
                'error': {
                    'code': 'BUSINESS_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error following business: {str(e)}")
            return Response({
                'error': {
                    'code': 'FOLLOW_ERROR',
                    'message': 'Failed to follow business',
                    'details': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid request data',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unfollow_business(request, business_id):
    """Unfollow a business"""
    # Only customers and NGOs can unfollow businesses
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only customers and organizations can unfollow businesses'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        success = NotificationService.unfollow_business(request.user, business_id)
        
        if success:
            return Response({
                'message': 'Successfully unfollowed business',
                'business_id': str(business_id),
                'action': 'unfollowed'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': {
                    'code': 'NOT_FOLLOWING',
                    'message': 'You are not following this business'
                }
            }, status=status.HTTP_404_NOT_FOUND)
            
    except ValueError as e:
        return Response({
            'error': {
                'code': 'BUSINESS_ERROR',
                'message': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error unfollowing business: {str(e)}")
        return Response({
            'error': {
                'code': 'UNFOLLOW_ERROR',
                'message': 'Failed to unfollow business',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_following(request):
    """Get list of businesses user is following"""
    try:
        following_data = NotificationService.get_user_following(request.user)
        
        return Response({
            'following': following_data,
            'count': len(following_data),
            'message': f'Retrieved {len(following_data)} businesses you are following'
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': {
                'code': 'SERVICE_ERROR',
                'message': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error fetching following list: {str(e)}")
        return Response({
            'error': {
                'code': 'FETCH_ERROR',
                'message': 'Failed to fetch following list',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_followers(request):
    """Get list of followers for a business (business owners only)"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only business owners can view their followers'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        followers_data = NotificationService.get_business_followers(request.user)
        
        return Response({
            'followers': followers_data['followers'],
            'summary': followers_data['summary'],
            'count': followers_data['summary']['total_followers'],
            'message': f'Retrieved {followers_data["summary"]["total_followers"]} followers for your business'
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': {
                'code': 'SERVICE_ERROR',
                'message': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error fetching followers: {str(e)}")
        return Response({
            'error': {
                'code': 'FETCH_ERROR',
                'message': 'Failed to fetch followers',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_follow_status(request, business_id):
    """Get follow status for a specific business"""
    try:
        status_data = NotificationService.get_follow_status(request.user, business_id)
        
        return Response({
            'follow_status': status_data
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': {
                'code': 'BUSINESS_ERROR',
                'message': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error checking follow status: {str(e)}")
        return Response({
            'error': {
                'code': 'STATUS_ERROR',
                'message': 'Failed to check follow status',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_follow_recommendations(request):
    """Get recommended businesses to follow"""
    # Only customers and NGOs should get recommendations
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'recommendations': [],
            'count': 0,
            'message': 'Follow recommendations are only available for customers and organizations'
        }, status=status.HTTP_200_OK)
    
    try:
        limit = int(request.query_params.get('limit', 5))
        limit = min(limit, 20)  # Cap at 20 recommendations
        
        recommendations = NotificationService.get_follow_recommendations(request.user, limit)
        
        return Response({
            'recommendations': recommendations,
            'count': len(recommendations),
            'message': f'Found {len(recommendations)} recommended businesses'
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': {
                'code': 'SERVICE_ERROR',
                'message': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return Response({
            'error': {
                'code': 'RECOMMENDATIONS_ERROR',
                'message': 'Failed to get recommendations',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)