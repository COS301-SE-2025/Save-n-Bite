# reviews/views.py

from django.contrib.auth.decorators import user_passes_test
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Count
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Review, ReviewModerationLog, BusinessReviewStats
from .serializers import (
    ReviewCreateSerializer, ReviewUpdateSerializer, ReviewDisplaySerializer,
    BusinessReviewListSerializer, BusinessReviewStatsSerializer,
    ReviewModerationSerializer, ReviewModerationActionSerializer,
    InteractionReviewStatusSerializer, ReviewSummarySerializer
)
from interactions.models import Interaction
from authentication.models import FoodProviderProfile

User = get_user_model()
logger = logging.getLogger(__name__)

class ReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

# =============== USER REVIEW ENDPOINTS ===============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    """Create a new review for a completed interaction"""
    # Only customers and NGOs can leave reviews
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only customers and organizations can leave reviews'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        try:
            review = serializer.save()
            response_serializer = ReviewDisplaySerializer(review, context={'request': request})
            
            return Response({
                'message': 'Review created successfully',
                'review': response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating review: {str(e)}")
            return Response({
                'error': {
                    'code': 'CREATION_ERROR',
                    'message': 'Failed to create review',
                    'details': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid review data',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_review(request, review_id):
    """Update an existing review"""
    try:
        review = Review.objects.get(
            id=review_id, 
            reviewer=request.user,
            status__in=['active', 'flagged']  # Can't edit deleted/censored reviews
        )
    except Review.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Review not found or cannot be edited'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = ReviewUpdateSerializer(review, data=request.data, partial=True)
    
    if serializer.is_valid():
        try:
            updated_review = serializer.save()
            response_serializer = ReviewDisplaySerializer(updated_review, context={'request': request})
            
            return Response({
                'message': 'Review updated successfully',
                'review': response_serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating review: {str(e)}")
            return Response({
                'error': {
                    'code': 'UPDATE_ERROR',
                    'message': 'Failed to update review',
                    'details': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid review data',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_reviews(request):
    """Get all reviews written by the current user"""
    reviews = Review.objects.filter(
        reviewer=request.user,
        status__in=['active', 'flagged', 'censored']  # Show user their own reviews even if censored
    ).order_by('-created_at')
    
    paginator = ReviewPagination()
    paginated_reviews = paginator.paginate_queryset(reviews, request)
    serializer = ReviewDisplaySerializer(paginated_reviews, many=True, context={'request': request})
    
    return paginator.get_paginated_response({
        'reviews': serializer.data,
        'total_count': reviews.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_interaction_review_status(request, interaction_id):
    """Check if an interaction can be reviewed or already has a review"""
    try:
        interaction = Interaction.objects.get(id=interaction_id, user=request.user)
    except Interaction.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Interaction not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    has_review = hasattr(interaction, 'review')
    can_review = (
        interaction.status == 'completed' and 
        request.user.user_type in ['customer', 'ngo']
    )
    
    data = {
        'interaction_id': interaction_id,
        'can_review': can_review,
        'has_review': has_review,
        'review_id': str(interaction.review.id) if has_review else None,
        'interaction_status': interaction.status,
        'completed_at': interaction.completed_at
    }
    
    serializer = InteractionReviewStatusSerializer(data)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review(request, review_id):
    """Soft delete a review (user can delete their own review)"""
    try:
        review = Review.objects.get(id=review_id, reviewer=request.user)
    except Review.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Review not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    review.status = 'deleted'
    review.save()
    
    return Response({
        'message': 'Review deleted successfully'
    }, status=status.HTTP_200_OK)


# =============== BUSINESS REVIEW ENDPOINTS ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_business_reviews(request):
    """Get all reviews for the authenticated business owner"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only food providers can access business reviews'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    if not hasattr(request.user, 'provider_profile'):
        return Response({
            'error': {
                'code': 'PROFILE_NOT_FOUND',
                'message': 'Provider profile not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get all active reviews for this business
    reviews = Review.objects.filter(
        business=request.user.provider_profile,
        status='active'  # Only show active reviews to business
    ).order_by('-created_at')
    
    # Apply filters
    rating_filter = request.GET.get('rating')
    if rating_filter:
        try:
            rating = int(rating_filter)
            reviews = reviews.filter(general_rating=rating)
        except ValueError:
            pass
    
    date_filter = request.GET.get('date_range')
    if date_filter:
        if date_filter == 'week':
            week_ago = timezone.now() - timedelta(days=7)
            reviews = reviews.filter(created_at__gte=week_ago)
        elif date_filter == 'month':
            month_ago = timezone.now() - timedelta(days=30)
            reviews = reviews.filter(created_at__gte=month_ago)
    
    paginator = ReviewPagination()
    paginated_reviews = paginator.paginate_queryset(reviews, request)
    serializer = BusinessReviewListSerializer(paginated_reviews, many=True)
    
    return paginator.get_paginated_response({
        'reviews': serializer.data,
        'total_count': reviews.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_business_review_stats(request):
    """Get review statistics for the authenticated business owner"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only food providers can access review statistics'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    if not hasattr(request.user, 'provider_profile'):
        return Response({
            'error': {
                'code': 'PROFILE_NOT_FOUND',
                'message': 'Provider profile not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get or create stats object
    stats, created = BusinessReviewStats.objects.get_or_create(
        business=request.user.provider_profile
    )
    
    # If stats are older than 1 hour, recalculate
    if created or (timezone.now() - stats.last_updated).seconds > 3600:
        stats.recalculate_stats()
    
    serializer = BusinessReviewStatsSerializer(stats)
    return Response({
        'stats': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interaction_review(request, interaction_id):
    """Get the review for a specific interaction (business owner only)"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only food providers can view interaction reviews'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        interaction = Interaction.objects.get(
            id=interaction_id,
            business=request.user.provider_profile
        )
    except Interaction.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Interaction not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    if not hasattr(interaction, 'review'):
        return Response({
            'has_review': False,
            'interaction_id': str(interaction_id)
        }, status=status.HTTP_200_OK)
    
    serializer = BusinessReviewListSerializer(interaction.review)
    return Response({
        'has_review': True,
        'review': serializer.data
    }, status=status.HTTP_200_OK)


# =============== ADMIN MODERATION ENDPOINTS ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_reviews_admin(request):
    """Get all reviews for admin moderation (admin only)"""
    if not (request.user.is_superuser or request.user.is_staff):
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only administrators can access this endpoint'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    reviews = Review.objects.all().order_by('-created_at')
    
    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        reviews = reviews.filter(status=status_filter)
    
    rating_filter = request.GET.get('rating')
    if rating_filter:
        try:
            rating = int(rating_filter)
            reviews = reviews.filter(general_rating=rating)
        except ValueError:
            pass
    
    business_filter = request.GET.get('business')
    if business_filter:
        reviews = reviews.filter(
            business__business_name__icontains=business_filter
        )
    
    paginator = ReviewPagination()
    paginated_reviews = paginator.paginate_queryset(reviews, request)
    serializer = ReviewModerationSerializer(paginated_reviews, many=True)
    
    return paginator.get_paginated_response({
        'reviews': serializer.data,
        'total_count': reviews.count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def moderate_review(request, review_id):
    """Moderate a review (admin only)"""
    if not (request.user.is_superuser or request.user.is_staff):
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only administrators can moderate reviews'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        review = Review.objects.get(id=review_id)
    except Review.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Review not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = ReviewModerationActionSerializer(data=request.data)
    
    if serializer.is_valid():
        action = serializer.validated_data['action']
        reason = serializer.validated_data['reason']
        moderation_notes = serializer.validated_data.get('moderation_notes', '')
        
        # Store previous status
        previous_status = review.status
        
        # Apply moderation action
        if action == 'flag':
            review.status = 'flagged'
        elif action == 'censor':
            review.status = 'censored'
        elif action == 'delete':
            review.status = 'deleted'
        elif action == 'restore':
            review.status = 'active'
        
        # Update moderation fields
        review.moderated_by = request.user
        review.moderated_at = timezone.now()
        if moderation_notes:
            review.moderation_notes = moderation_notes
        
        review.save()
        
        # Log the moderation action
        ReviewModerationLog.objects.create(
            review=review,
            moderator=request.user,
            action=action,
            reason=reason,
            previous_status=previous_status,
            new_status=review.status
        )
        
        return Response({
            'message': f'Review {action}ed successfully',
            'review_id': str(review.id),
            'new_status': review.status
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid moderation data',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_moderation_logs(request, review_id):
    """Get moderation history for a review (admin only)"""
    if not (request.user.is_superuser or request.user.is_staff):
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only administrators can view moderation logs'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        review = Review.objects.get(id=review_id)
    except Review.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Review not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    logs = review.moderation_logs.all().order_by('-created_at')
    
    logs_data = []
    for log in logs:
        logs_data.append({
            'id': str(log.id),
            'action': log.action,
            'reason': log.reason,
            'previous_status': log.previous_status,
            'new_status': log.new_status,
            'moderator': log.moderator.email,
            'created_at': log.created_at.isoformat()
        })
    
    return Response({
        'review_id': str(review_id),
        'moderation_logs': logs_data,
        'total_logs': len(logs_data)
    }, status=status.HTTP_200_OK)

def is_admin_user(user):
    """Check if user has admin permissions using Django's permission system"""
    return user.is_authenticated and (
        user.is_superuser or 
        user.is_staff or
        user.has_perm('reviews.view_review') or  # Specific permission
        user.has_perm('reviews.change_review') or
        user.has_perm('reviews.delete_review')
    )


# =============== ANALYTICS ENDPOINTS ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_review_summary(request):
    """Get review summary for the current user"""
    if request.user.user_type not in ['customer', 'ngo']:
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only customers and organizations can access review summaries'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    user_reviews = Review.objects.filter(
        reviewer=request.user,
        status__in=['active', 'flagged']
    )
    
    total_reviews = user_reviews.count()
    
    if total_reviews > 0:
        avg_rating = user_reviews.filter(
            general_rating__isnull=False
        ).aggregate(Avg('general_rating'))['general_rating__avg'] or 0
        
        # Reviews this month
        month_ago = timezone.now() - timedelta(days=30)
        reviews_this_month = user_reviews.filter(created_at__gte=month_ago).count()
        
        # Most reviewed business
        business_counts = user_reviews.values(
            'business__business_name'
        ).annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        most_reviewed_business = business_counts['business__business_name'] if business_counts else 'None'
    else:
        avg_rating = 0
        reviews_this_month = 0
        most_reviewed_business = 'None'
    
    # Recent reviews
    recent_reviews = user_reviews.order_by('-created_at')[:5]
    recent_serializer = ReviewDisplaySerializer(recent_reviews, many=True, context={'request': request})
    
    summary_data = {
        'total_reviews_written': total_reviews,
        'average_rating_given': round(avg_rating, 2),
        'reviews_this_month': reviews_this_month,
        'most_reviewed_business': most_reviewed_business,
        'recent_reviews': recent_serializer.data
    }
    
    serializer = ReviewSummarySerializer(summary_data)
    return Response({
        'summary': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_review_analytics_admin(request):
    """Get all reviews for admin moderation (admin only)"""
    if not (request.user.is_superuser or request.user.is_staff):
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only administrators can access review analytics'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Basic stats
    total_reviews = Review.objects.count()
    active_reviews = Review.objects.filter(status='active').count()
    flagged_reviews = Review.objects.filter(status='flagged').count()
    deleted_reviews = Review.objects.filter(status='deleted').count()
    
    # Recent activity
    today = timezone.now().date()
    week_ago = timezone.now() - timedelta(days=7)
    month_ago = timezone.now() - timedelta(days=30)
    
    reviews_today = Review.objects.filter(created_at__date=today).count()
    reviews_this_week = Review.objects.filter(created_at__gte=week_ago).count()
    reviews_this_month = Review.objects.filter(created_at__gte=month_ago).count()
    
    # Average rating across platform
    avg_rating = Review.objects.filter(
        status='active',
        general_rating__isnull=False
    ).aggregate(Avg('general_rating'))['general_rating__avg'] or 0
    
    # Top businesses by review count
    top_businesses = Review.objects.filter(
        status='active'
    ).values(
        'business__business_name'
    ).annotate(
        review_count=Count('id')
    ).order_by('-review_count')[:10]
    
    return Response({
        'analytics': {
            'total_reviews': total_reviews,
            'active_reviews': active_reviews,
            'flagged_reviews': flagged_reviews,
            'deleted_reviews': deleted_reviews,
            'reviews_today': reviews_today,
            'reviews_this_week': reviews_this_week,
            'reviews_this_month': reviews_this_month,
            'average_platform_rating': round(avg_rating, 2),
            'top_businesses_by_reviews': list(top_businesses)
        }
    }, status=status.HTTP_200_OK)