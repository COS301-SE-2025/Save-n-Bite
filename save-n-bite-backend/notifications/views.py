# notifications/views.py

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
            recipient=request.user,
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
            recipient=request.user,
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
            recipient=request.user
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
        preferences, created = NotificationPreferences.objects.get_or_create(
            user=request.user
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
    try:
        success = NotificationService.unfollow_business(request.user, business_id)
        
        if success:
            return Response({
                'message': 'Successfully unfollowed business'
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
        following = BusinessFollower.objects.filter(
            user=request.user
        ).select_related('business').order_by('-created_at')
        
        serializer = BusinessFollowerSerializer(following, many=True)
        
        return Response({
            'following': serializer.data,
            'count': following.count()
        }, status=status.HTTP_200_OK)
        
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
        if not hasattr(request.user, 'provider_profile'):
            return Response({
                'error': {
                    'code': 'PROFILE_ERROR',
                    'message': 'Business profile not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        followers = BusinessFollower.objects.filter(
            business=request.user.provider_profile
        ).select_related('user').order_by('-created_at')
        
        follower_data = []
        for follower in followers:
            user_data = {
                'id': follower.id,
                'user_id': follower.user.id,
                'user_type': follower.user.user_type,
                'followed_at': follower.created_at,
            }
            
            # Add user-specific data based on type
            if follower.user.user_type == 'customer' and hasattr(follower.user, 'customer_profile'):
                user_data['name'] = follower.user.customer_profile.full_name
                user_data['profile_image'] = follower.user.customer_profile.profile_image.url if follower.user.customer_profile.profile_image else None
            elif follower.user.user_type == 'ngo' and hasattr(follower.user, 'ngo_profile'):
                user_data['name'] = follower.user.ngo_profile.organisation_name
                user_data['profile_image'] = follower.user.ngo_profile.organisation_logo.url if follower.user.ngo_profile.organisation_logo else None
            
            follower_data.append(user_data)
        
        return Response({
            'followers': follower_data,
            'count': followers.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching followers: {str(e)}")
        return Response({
            'error': {
                'code': 'FETCH_ERROR',
                'message': 'Failed to fetch followers',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)