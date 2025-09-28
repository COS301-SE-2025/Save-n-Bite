# badges/views.py

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.core.paginator import Paginator
import logging

from .models import BadgeType, ProviderBadge, ProviderBadgeStats, BadgeLeaderboard
from .services import BadgeService
from .serializers import (
    BadgeTypeSerializer, ProviderBadgeSerializer, ProviderBadgeStatsSerializer,
    BadgePinSerializer, ProviderBadgeSummarySerializer, BadgeLeaderboardSerializer,
    BadgeLeaderboardRankingSerializer, ProviderBadgeProfileSerializer
)

logger = logging.getLogger(__name__)
User = get_user_model()


class BadgeTypeListView(ListAPIView):
    """
    Get all available badge types (public endpoint)
    """
    queryset = BadgeType.objects.filter(is_active=True).order_by('category', 'display_order')
    serializer_class = BadgeTypeSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        rarity = self.request.query_params.get('rarity')
        
        if category:
            queryset = queryset.filter(category=category)
        if rarity:
            queryset = queryset.filter(rarity=rarity)
            
        return queryset


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_badges(request):
    """
    Get all badges for the authenticated provider
    """
    if request.user.user_type != 'provider':
        return Response({
            'error': 'Only food providers can have badges'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        badge_service = BadgeService()
        badge_data = badge_service.get_provider_badges(request.user)
        
        # Serialize the data
        all_badges = ProviderBadgeSerializer(badge_data['all_badges'], many=True)
        pinned_badges = ProviderBadgeSerializer(badge_data['pinned_badges'], many=True)
        stats = ProviderBadgeStatsSerializer(badge_data['stats'])
        
        return Response({
            'provider_info': {
                'provider_id': str(request.user.UserID),
                'business_name': request.user.provider_profile.business_name
            },
            'badges': {
                'all_badges': all_badges.data,
                'pinned_badges': pinned_badges.data,
                'total_count': badge_data['total_count'],
                'categories': badge_data['categories']
            },
            'stats': stats.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching badges for {request.user.email}: {str(e)}")
        return Response({
            'error': 'Failed to fetch badges'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_provider_badges(request, provider_id):
    """
    Get public badges for a specific provider (for profile viewing)
    """
    try:
        provider = User.objects.get(UserID=provider_id, user_type='provider')
        
        # Only show pinned badges publicly, or all if it's the provider themselves
        if request.user.is_authenticated and request.user == provider:
            badges = ProviderBadge.objects.filter(provider=provider).select_related('badge_type')
        else:
            badges = ProviderBadge.objects.filter(
                provider=provider, 
                is_pinned=True
            ).select_related('badge_type').order_by('pin_order')
        
        # Get stats
        try:
            stats = ProviderBadgeStats.objects.get(provider=provider)
        except ProviderBadgeStats.DoesNotExist:
            stats = None
        
        serializer = ProviderBadgeProfileSerializer(badges, many=True)
        stats_serializer = ProviderBadgeStatsSerializer(stats) if stats else None
        
        return Response({
            'provider_info': {
                'provider_id': str(provider.UserID),
                'business_name': provider.provider_profile.business_name
            },
            'badges': serializer.data,
            'stats': stats_serializer.data if stats_serializer else None,
            'is_own_profile': request.user.is_authenticated and request.user == provider
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'Provider not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching provider badges: {str(e)}")
        return Response({
            'error': 'Failed to fetch provider badges'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BadgePinView(APIView):
    """
    Pin or unpin badges to/from provider profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type != 'provider':
            return Response({
                'error': 'Only food providers can manage badges'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BadgePinSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        badge_id = serializer.validated_data['badge_id']
        pin_action = serializer.validated_data['pin_action']
        
        badge_service = BadgeService()
        
        if pin_action == 'pin':
            success = badge_service.pin_badge(request.user, str(badge_id))
            if not success:
                return Response({
                    'error': 'Could not pin badge. You may have reached the maximum of 5 pinned badges.'
                }, status=status.HTTP_400_BAD_REQUEST)
            message = 'Badge pinned successfully'
        else:
            success = badge_service.unpin_badge(request.user, str(badge_id))
            if not success:
                return Response({
                    'error': 'Could not unpin badge or badge was not pinned'
                }, status=status.HTTP_400_BAD_REQUEST)
            message = 'Badge unpinned successfully'
        
        # Return updated badge data
        updated_data = badge_service.get_provider_badges(request.user)
        pinned_badges = ProviderBadgeSerializer(updated_data['pinned_badges'], many=True)
        
        return Response({
            'message': message,
            'pinned_badges': pinned_badges.data,
            'pinned_count': updated_data['pinned_badges'].count()
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_badge_leaderboard(request):
    """
    Get public badge leaderboard (top providers by badges)
    """
    try:
        limit = int(request.query_params.get('limit', 10))
        limit = min(max(limit, 1), 50)  # Between 1 and 50
        
        badge_service = BadgeService()
        leaderboard_data = badge_service.get_badge_leaderboard(limit)
        
        serializer = BadgeLeaderboardRankingSerializer(leaderboard_data, many=True)
        
        return Response({
            'leaderboard': serializer.data,
            'total_providers': len(leaderboard_data),
            'generated_at': timezone.now()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error generating badge leaderboard: {str(e)}")
        return Response({
            'error': 'Failed to generate leaderboard'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_monthly_leaderboards(request):
    """
    Get historical monthly leaderboards
    """
    try:
        year = request.query_params.get('year', timezone.now().year)
        month = request.query_params.get('month', timezone.now().month)
        
        leaderboards = BadgeLeaderboard.objects.filter(
            year=year,
            month=month,
            is_finalized=True
        ).select_related('first_place', 'second_place', 'third_place')
        
        serializer = BadgeLeaderboardSerializer(leaderboards, many=True)
        
        return Response({
            'leaderboards': serializer.data,
            'month': int(month),
            'year': int(year)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching monthly leaderboards: {str(e)}")
        return Response({
            'error': 'Failed to fetch monthly leaderboards'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def refresh_my_badges(request):
    """
    Manually refresh badges for the authenticated provider
    This can be used for testing or if a provider suspects they should have more badges
    """
    if request.user.user_type != 'provider':
        return Response({
            'error': 'Only food providers can refresh badges'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        badge_service = BadgeService()
        
        # Update stats and check for any missed badges
        stats = badge_service.update_provider_stats(request.user)
        
        # Check milestone badges
        milestone_badges = badge_service.check_milestone_badges_on_order(request.user, stats, None)
        review_badges = badge_service.check_review_milestone_badges(request.user, stats, None)
        rating_badges = badge_service.check_rating_based_badges(request.user, stats)
        special_badges = badge_service.check_special_achievement_badges(request.user, stats)
        
        all_new_badges = milestone_badges + review_badges + rating_badges + special_badges
        
        # Update badge stats
        badge_service.update_provider_badge_stats(request.user)
        
        # Send notifications for any new badges
        for badge in all_new_badges:
            badge_service.send_badge_notification(request.user, badge)
        
        return Response({
            'message': 'Badge refresh completed',
            'badges_awarded': len(all_new_badges),
            'new_badges': ProviderBadgeSerializer(all_new_badges, many=True).data if all_new_badges else []
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error refreshing badges for {request.user.email}: {str(e)}")
        return Response({
            'error': 'Failed to refresh badges'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_badge_categories(request):
    """
    Get all badge categories with counts
    """
    try:
        categories = BadgeType.objects.filter(is_active=True).values('category').distinct()
        
        category_data = []
        for category in categories:
            cat_name = category['category']
            badge_count = BadgeType.objects.filter(category=cat_name, is_active=True).count()
            
            category_data.append({
                'category': cat_name,
                'display_name': dict(BadgeType.CATEGORY_CHOICES)[cat_name],
                'badge_count': badge_count
            })
        
        return Response({
            'categories': category_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching badge categories: {str(e)}")
        return Response({
            'error': 'Failed to fetch badge categories'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_badge_rarities(request):
    """
    Get all badge rarities with counts
    """
    try:
        rarities = BadgeType.objects.filter(is_active=True).values('rarity').distinct()
        
        rarity_data = []
        for rarity in rarities:
            rarity_name = rarity['rarity']
            badge_count = BadgeType.objects.filter(rarity=rarity_name, is_active=True).count()
            
            rarity_data.append({
                'rarity': rarity_name,
                'display_name': dict(BadgeType.RARITY_CHOICES)[rarity_name],
                'badge_count': badge_count
            })
        
        return Response({
            'rarities': rarity_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching badge rarities: {str(e)}")
        return Response({
            'error': 'Failed to fetch badge rarities'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_badge(request, badge_id):
    """
    Provide SVG download information for a badge
    """
    if request.user.user_type != 'provider':
        return Response({
            'error': 'Only food providers can download badges'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        badge = ProviderBadge.objects.select_related('badge_type').get(
            id=badge_id, 
            provider=request.user
        )
        
        # Return badge information for frontend to handle SVG download
        return Response({
            'badge_info': {
                'id': str(badge.id),
                'name': badge.badge_type.name,
                'svg_filename': badge.badge_type.svg_filename,
                'description': badge.badge_type.description,
                'earned_date': badge.earned_date,
                'provider_name': request.user.provider_profile.business_name
            },
            'download_url': f"/public/assets/images/badges/{badge.badge_type.svg_filename}",
            'message': 'Badge information retrieved successfully'
        }, status=status.HTTP_200_OK)
        
    except ProviderBadge.DoesNotExist:
        return Response({
            'error': 'Badge not found or does not belong to you'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error downloading badge: {str(e)}")
        return Response({
            'error': 'Failed to retrieve badge information'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_badge_progress(request):
    """
    Get progress towards earning badges for the authenticated provider
    """
    if request.user.user_type != 'provider':
        return Response({
            'error': 'Only food providers can view badge progress'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        badge_service = BadgeService()
        stats = badge_service.update_provider_stats(request.user)
        
        # Get earned badge types
        earned_badges = ProviderBadge.objects.filter(
            provider=request.user
        ).values_list('badge_type__name', flat=True)
        
        # Define progress for milestone badges
        milestone_progress = [
            {
                'badge_name': 'First Order',
                'current_value': stats['total_orders'],
                'target_value': 1,
                'progress_percentage': min(100, (stats['total_orders'] / 1) * 100),
                'is_earned': 'First Order' in earned_badges
            },
            {
                'badge_name': 'Review Magnet',
                'current_value': stats['total_reviews'],
                'target_value': 10,
                'progress_percentage': min(100, (stats['total_reviews'] / 10) * 100),
                'is_earned': 'Review Magnet' in earned_badges
            },
            {
                'badge_name': 'Customer Favorite',
                'current_value': stats['total_reviews'],
                'target_value': 50,
                'progress_percentage': min(100, (stats['total_reviews'] / 50) * 100),
                'is_earned': 'Customer Favorite' in earned_badges
            },
            {
                'badge_name': 'Order Champion',
                'current_value': stats['total_orders'],
                'target_value': 100,
                'progress_percentage': min(100, (stats['total_orders'] / 100) * 100),
                'is_earned': 'Order Champion' in earned_badges
            },
            {
                'badge_name': 'Excellence Badge',
                'current_value': round(stats['average_rating'], 2),
                'target_value': 4.5,
                'progress_percentage': min(100, (stats['average_rating'] / 4.5) * 100) if stats['total_reviews'] >= 10 else 0,
                'is_earned': 'Excellence Badge' in earned_badges,
                'additional_requirement': f"Need {max(0, 10 - stats['total_reviews'])} more reviews" if stats['total_reviews'] < 10 else None
            },
            {
                'badge_name': 'Perfect Rating',
                'current_value': round(stats['average_rating'], 2),
                'target_value': 5.0,
                'progress_percentage': min(100, (stats['average_rating'] / 5.0) * 100) if stats['total_reviews'] >= 5 else 0,
                'is_earned': 'Perfect Rating' in earned_badges,
                'additional_requirement': f"Need {max(0, 5 - stats['total_reviews'])} more reviews" if stats['total_reviews'] < 5 else None
            }
        ]
        
        return Response({
            'provider_stats': {
                'total_orders': stats['total_orders'],
                'total_reviews': stats['total_reviews'],
                'average_rating': round(stats['average_rating'], 2),
                'total_revenue': float(stats['total_revenue']),
                'days_active': stats['days_active']
            },
            'milestone_progress': milestone_progress,
            'next_achievable_badges': [p for p in milestone_progress if not p['is_earned'] and p['progress_percentage'] > 50]
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching badge progress for {request.user.email}: {str(e)}")
        return Response({
            'error': 'Failed to fetch badge progress'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Admin endpoints for initialization (optional)
@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_initialize_badge_types(request):
    """
    Admin endpoint to initialize default badge types
    """
    try:
        from .services import BadgeInitializationService
        created_count = BadgeInitializationService.create_default_badge_types()
        
        return Response({
            'message': 'Badge types initialization completed',
            'created_count': created_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error initializing badge types: {str(e)}")
        return Response({
            'error': 'Failed to initialize badge types'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)