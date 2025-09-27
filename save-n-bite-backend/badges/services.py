# badges/services.py

from django.db import transaction
from django.db.models import Avg, Count, Sum, Q, F
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta

from .models import BadgeType, ProviderBadge, BadgeLeaderboard, ProviderBadgeStats
from authentication.models import FoodProviderProfile
from reviews.models import Review
from interactions.models import Order
from notifications.services import NotificationService

logger = logging.getLogger(__name__)
User = get_user_model()


class BadgeService:
    """
    Core service for managing badges with automatic awarding logic
    """
    
    def __init__(self):
        self.current_time = timezone.now()
        self.current_month = self.current_time.month
        self.current_year = self.current_time.year
    
    def process_order_completion(self, order: Order) -> List[ProviderBadge]:
        """
        Process badge awards when an order is completed
        Similar to digital garden's process_order_completion
        """
        # Get provider from order
        provider = order.interaction.business.user
        
        if provider.user_type != 'provider':
            return []
        
        badges_awarded = []
        
        with transaction.atomic():
            # Update provider statistics first
            stats = self.update_provider_stats(provider)
            
            # Check for milestone badges that could be triggered by order completion
            milestone_badges = self.check_milestone_badges_on_order(provider, stats, order)
            badges_awarded.extend(milestone_badges)
            
            # Check for monthly badges (only at end of month or when criteria met)
            monthly_badge = self.check_monthly_provider_badge(provider, stats)
            if monthly_badge:
                badges_awarded.append(monthly_badge)
            
            # Update cached badge statistics
            self.update_provider_badge_stats(provider)
        
        # Send notifications for new badges
        for badge in badges_awarded:
            self.send_badge_notification(provider, badge)
        
        logger.info(
            f"Order {order.id} completion awarded {len(badges_awarded)} badges to {provider.email}"
        )
        
        return badges_awarded
    
    def process_review_creation(self, review: Review) -> List[ProviderBadge]:
        """
        Process badge awards when a review is created/updated
        """
        provider = review.business.user
        
        if provider.user_type != 'provider':
            return []
        
        badges_awarded = []
        
        with transaction.atomic():
            # Update provider statistics
            stats = self.update_provider_stats(provider)
            
            # Check for review-related milestone badges
            review_badges = self.check_review_milestone_badges(provider, stats, review)
            badges_awarded.extend(review_badges)
            
            # Check for rating-based badges
            rating_badges = self.check_rating_based_badges(provider, stats)
            badges_awarded.extend(rating_badges)
            
            # Update cached badge statistics
            self.update_provider_badge_stats(provider)
        
        # Send notifications for new badges
        for badge in badges_awarded:
            self.send_badge_notification(provider, badge)
        
        logger.info(
            f"Review {review.id} awarded {len(badges_awarded)} badges to {provider.email}"
        )
        
        return badges_awarded
    
    def update_provider_stats(self, provider: User) -> Dict:
        """
        Calculate current statistics for a provider
        """
        # Review statistics
        reviews = Review.objects.filter(business=provider.provider_profile, status='active')
        review_stats = reviews.aggregate(
            total_reviews=Count('id'),
            average_rating=Avg('general_rating'),
            rating_sum=Sum('general_rating')
        )
        
        # Order statistics
        orders = Order.objects.filter(
            interaction__business=provider.provider_profile,
            status='completed'
        )
        
        total_orders = orders.count()
        total_revenue = orders.aggregate(
            revenue=Sum('interaction__total_amount')
        )['revenue'] or Decimal('0.00')
        
        # Monthly statistics (current month)
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_orders = orders.filter(interaction__created_at__gte=current_month_start)
        monthly_reviews = reviews.filter(created_at__gte=current_month_start)
        
        # Time-based statistics
        provider_since = provider.date_joined
        days_active = (timezone.now() - provider_since).days
        
        return {
            'total_reviews': review_stats['total_reviews'] or 0,
            'average_rating': review_stats['average_rating'] or 0,
            'rating_sum': review_stats['rating_sum'] or 0,
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'monthly_orders': monthly_orders.count(),
            'monthly_reviews': monthly_reviews.count(),
            'monthly_revenue': monthly_orders.aggregate(revenue=Sum('interaction__total_amount'))['revenue'] or Decimal('0.00'),
            'days_active': days_active,
            'provider_since': provider_since,
        }
    
    def check_milestone_badges_on_order(self, provider: User, stats: Dict, order: Order) -> List[ProviderBadge]:
        """
        Check for milestone badges triggered by order completion
        """
        badges_awarded = []
        
        # Order-based milestones
        order_milestones = [
            ('First Order', 1),
            ('Order Champion', 100),
        ]
        
        for badge_name, threshold in order_milestones:
            if stats['total_orders'] == threshold:  # Exact match for immediate awarding
                badge = self.award_milestone_badge(
                    provider, badge_name, 'orders', threshold, stats['total_orders'], order
                )
                if badge:
                    badges_awarded.append(badge)
        
        # Revenue-based milestones
        revenue_milestones = [
            ('Revenue Milestone - R1000', Decimal('1000')),
            ('Revenue Milestone - R10000', Decimal('10000')),
        ]
        
        for badge_name, threshold in revenue_milestones:
            # Check if just crossed the threshold with this order
            order_amount = order.interaction.total_amount
            previous_revenue = stats['total_revenue'] - order_amount
            
            if previous_revenue < threshold <= stats['total_revenue']:
                badge = self.award_milestone_badge(
                    provider, badge_name, 'revenue', float(threshold), float(stats['total_revenue']), order
                )
                if badge:
                    badges_awarded.append(badge)
        
        # Special badges
        special_badges = self.check_special_achievement_badges(provider, stats)
        badges_awarded.extend(special_badges)
        
        return badges_awarded
    
    def check_review_milestone_badges(self, provider: User, stats: Dict, review: Review) -> List[ProviderBadge]:
        """
        Check for milestone badges triggered by review creation
        """
        badges_awarded = []
        
        # Review count milestones
        review_milestones = [
            ('Review Magnet', 10),
            ('Customer Favorite', 50),
        ]
        
        for badge_name, threshold in review_milestones:
            if stats['total_reviews'] == threshold:  # Exact match for immediate awarding
                badge = self.award_milestone_badge(
                    provider, badge_name, 'reviews', threshold, stats['total_reviews'], review=review
                )
                if badge:
                    badges_awarded.append(badge)
        
        return badges_awarded
    
    def check_rating_based_badges(self, provider: User, stats: Dict) -> List[ProviderBadge]:
        """
        Check for rating-based badges (can be earned/lost as ratings change)
        """
        badges_awarded = []
        
        # Perfect rating badge
        if stats['average_rating'] == 5.0 and stats['total_reviews'] >= 5:
            badge = self.award_rating_badge(
                provider, 'Perfect Rating', 5.0, stats['total_reviews']
            )
            if badge:
                badges_awarded.append(badge)
        
        # Excellence badge  
        if stats['average_rating'] >= 4.5 and stats['total_reviews'] >= 10:
            badge = self.award_rating_badge(
                provider, 'Excellence Badge', stats['average_rating'], stats['total_reviews']
            )
            if badge:
                badges_awarded.append(badge)
        
        return badges_awarded
    
    def check_monthly_provider_badge(self, provider: User, stats: Dict) -> Optional[ProviderBadge]:
        """
        Check if provider should get monthly provider badge
        """
        try:
            badge_type = BadgeType.objects.get(name='Provider of the Month', is_active=True)
            
            # Check if already earned this month
            if ProviderBadge.objects.filter(
                provider=provider, 
                badge_type=badge_type,
                month=self.current_month,
                year=self.current_year
            ).exists():
                return None
            
            # Award if provider has significant activity this month
            if (stats['monthly_orders'] >= 10 and 
                stats['monthly_reviews'] >= 3 and 
                stats['average_rating'] >= 4.0):
                
                return self.award_badge(provider, badge_type, {
                    'monthly_orders': stats['monthly_orders'],
                    'monthly_reviews': stats['monthly_reviews'],
                    'monthly_rating': float(stats['average_rating']),
                    'month': self.current_month,
                    'year': self.current_year
                })
                
        except BadgeType.DoesNotExist:
            logger.warning("Monthly provider badge type not found: Provider of the Month")
        except Exception as e:
            logger.error(f"Error checking monthly badge for {provider.email}: {str(e)}")
        
        return None
    
    def check_special_achievement_badges(self, provider: User, stats: Dict) -> List[ProviderBadge]:
        """
        Check for special achievement badges
        """
        badges_awarded = []
        
        # Early adopter badge (registered in first month of platform)
        platform_launch = timezone.now().replace(year=2024, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        if stats['provider_since'] <= (platform_launch + timedelta(days=30)):
            badge = self.award_special_badge(
                provider, 'Early Adopter', {
                    'registration_date': stats['provider_since'].isoformat()
                }
            )
            if badge:
                badges_awarded.append(badge)
        
        return badges_awarded
    
    def award_milestone_badge(self, provider: User, badge_name: str, milestone_type: str, 
                             threshold: int, achieved_value: int, order: Order = None, 
                             review: Review = None) -> Optional[ProviderBadge]:
        """
        Award a milestone badge if not already earned
        """
        try:
            badge_type = BadgeType.objects.get(name=badge_name, is_active=True)
            
            # Check if already earned (milestone badges are one-time only)
            if ProviderBadge.objects.filter(provider=provider, badge_type=badge_type).exists():
                return None
            
            badge_data = {
                'milestone_type': milestone_type,
                'threshold': threshold,
                'achieved_value': achieved_value,
                'earned_date': timezone.now().isoformat()
            }
            
            if order:
                badge_data['triggering_order_id'] = str(order.id)
            if review:
                badge_data['triggering_review_id'] = str(review.id)
            
            return self.award_badge(provider, badge_type, badge_data)
            
        except BadgeType.DoesNotExist:
            logger.warning(f"Badge type not found: {badge_name}")
            return None
    
    def award_rating_badge(self, provider: User, badge_name: str, rating: float, 
                          review_count: int) -> Optional[ProviderBadge]:
        """
        Award a rating-based badge if not already earned
        """
        try:
            badge_type = BadgeType.objects.get(name=badge_name, is_active=True)
            
            # Check if already earned (rating badges are one-time achievements)
            if ProviderBadge.objects.filter(provider=provider, badge_type=badge_type).exists():
                return None
            
            badge_data = {
                'rating': rating,
                'review_count': review_count,
                'earned_date': timezone.now().isoformat()
            }
            
            return self.award_badge(provider, badge_type, badge_data)
            
        except BadgeType.DoesNotExist:
            logger.warning(f"Badge type not found: {badge_name}")
            return None
    
    def award_special_badge(self, provider: User, badge_name: str, 
                           badge_data: Dict) -> Optional[ProviderBadge]:
        """
        Award a special badge if not already earned
        """
        try:
            badge_type = BadgeType.objects.get(name=badge_name, is_active=True)
            
            # Check if already earned
            if ProviderBadge.objects.filter(provider=provider, badge_type=badge_type).exists():
                return None
            
            return self.award_badge(provider, badge_type, badge_data)
            
        except BadgeType.DoesNotExist:
            logger.warning(f"Badge type not found: {badge_name}")
            return None
    
    def award_badge(self, provider: User, badge_type: BadgeType, badge_data: Dict) -> ProviderBadge:
        """
        Award a badge to a provider
        """
        reason = f"Earned {badge_type.name}: {badge_type.criteria_description}"
        
        badge = ProviderBadge.objects.create(
            provider=provider,
            badge_type=badge_type,
            earned_reason=reason,
            badge_data=badge_data
        )
        
        logger.info(f"Badge awarded: {badge}")
        return badge
    
    def send_badge_notification(self, provider: User, badge: ProviderBadge):
        """
        Send notification when a badge is earned
        """
        try:
            NotificationService.create_notification(
                recipient=provider,
                notification_type='badge_earned',
                title=f"🏆 Badge Earned: {badge.badge_type.name}!",
                message=f"Congratulations! You've earned the {badge.badge_type.name} badge. {badge.badge_type.description}",
                data={
                    'badge_id': str(badge.id),
                    'badge_type': badge.badge_type.name,
                    'badge_category': badge.badge_type.category,
                    'badge_rarity': badge.badge_type.rarity,
                    'earned_date': badge.earned_date.isoformat(),
                    'celebration_worthy': True
                }
            )
        except Exception as e:
            logger.error(f"Failed to send badge notification: {str(e)}")
    
    def update_provider_badge_stats(self, provider: User):
        """
        Update cached badge statistics for a provider
        """
        stats, created = ProviderBadgeStats.objects.get_or_create(provider=provider)
        
        # Get all badges for this provider
        badges = ProviderBadge.objects.filter(provider=provider)
        
        # Update totals
        stats.total_badges = badges.count()
        
        # Update by category
        stats.performance_badges = badges.filter(badge_type__category='performance').count()
        stats.milestone_badges = badges.filter(badge_type__category='milestone').count()
        stats.recognition_badges = badges.filter(badge_type__category='recognition').count()
        stats.monthly_badges = badges.filter(badge_type__category='monthly').count()
        stats.special_badges = badges.filter(badge_type__category='special').count()
        
        # Update by rarity
        stats.common_badges = badges.filter(badge_type__rarity='common').count()
        stats.uncommon_badges = badges.filter(badge_type__rarity='uncommon').count()
        stats.rare_badges = badges.filter(badge_type__rarity='rare').count()
        stats.epic_badges = badges.filter(badge_type__rarity='epic').count()
        stats.legendary_badges = badges.filter(badge_type__rarity='legendary').count()
        
        # Update pinned badges
        stats.pinned_badges_count = badges.filter(is_pinned=True).count()
        
        # Update dates
        first_badge = badges.order_by('earned_date').first()
        latest_badge = badges.order_by('-earned_date').first()
        
        stats.first_badge_earned = first_badge.earned_date if first_badge else None
        stats.latest_badge_earned = latest_badge.earned_date if latest_badge else None
        
        stats.save()
    
    def pin_badge(self, provider: User, badge_id: str) -> bool:
        """
        Pin a badge to provider's profile
        """
        try:
            badge = ProviderBadge.objects.get(id=badge_id, provider=provider)
            
            # Count current pinned badges
            pinned_count = ProviderBadge.objects.filter(provider=provider, is_pinned=True).count()
            
            if pinned_count >= 5:  # Maximum 5 pinned badges
                return False
            
            badge.is_pinned = True
            badge.pin_order = pinned_count + 1
            badge.save()
            
            # Update stats
            self.update_provider_badge_stats(provider)
            return True
            
        except ProviderBadge.DoesNotExist:
            return False
    
    def unpin_badge(self, provider: User, badge_id: str) -> bool:
        """
        Unpin a badge from provider's profile
        """
        try:
            badge = ProviderBadge.objects.get(id=badge_id, provider=provider)
            
            if not badge.is_pinned:
                return False
            
            old_order = badge.pin_order
            badge.is_pinned = False
            badge.pin_order = 0
            badge.save()
            
            # Reorder remaining pinned badges
            ProviderBadge.objects.filter(
                provider=provider,
                is_pinned=True,
                pin_order__gt=old_order
            ).update(pin_order=F('pin_order') - 1)
            
            # Update stats
            self.update_provider_badge_stats(provider)
            return True
            
        except ProviderBadge.DoesNotExist:
            return False
    
    def get_provider_badges(self, provider: User, category: str = None) -> Dict:
        """
        Get all badges for a provider with optional filtering
        """
        badges_query = ProviderBadge.objects.filter(provider=provider).select_related('badge_type')
        
        if category:
            badges_query = badges_query.filter(badge_type__category=category)
        
        badges = badges_query.order_by('-earned_date')
        pinned_badges = badges.filter(is_pinned=True).order_by('pin_order')
        
        # Get or create stats
        stats, _ = ProviderBadgeStats.objects.get_or_create(provider=provider)
        
        return {
            'all_badges': badges,
            'pinned_badges': pinned_badges,
            'stats': stats,
            'total_count': badges.count(),
            'categories': {
                'performance': badges.filter(badge_type__category='performance').count(),
                'milestone': badges.filter(badge_type__category='milestone').count(),
                'recognition': badges.filter(badge_type__category='recognition').count(),
                'monthly': badges.filter(badge_type__category='monthly').count(),
                'special': badges.filter(badge_type__category='special').count(),
            }
        }
    
    def get_badge_leaderboard(self, limit: int = 10) -> List[Dict]:
        """
        Get top providers by badge score for public leaderboard
        """
        stats = ProviderBadgeStats.objects.filter(
            total_badges__gt=0,
            provider__provider_profile__status='verified'
        ).select_related('provider', 'provider__provider_profile').order_by(
            '-total_badges', '-latest_badge_earned'
        )[:limit]
        
        leaderboard = []
        for i, stat in enumerate(stats, 1):
            leaderboard.append({
                'rank': i,
                'provider_name': stat.provider.provider_profile.business_name,
                'provider_id': str(stat.provider.UserID),
                'total_badges': stat.total_badges,
                'rarity_score': stat.get_rarity_score(),
                'latest_badge_date': stat.latest_badge_earned,
                'badge_breakdown': {
                    'legendary': stat.legendary_badges,
                    'epic': stat.epic_badges,
                    'rare': stat.rare_badges,
                    'uncommon': stat.uncommon_badges,
                    'common': stat.common_badges,
                }
            })
        
        return leaderboard


class BadgeInitializationService:
    """
    Service to initialize default badge types in the system
    """
    
    @staticmethod
    def create_default_badge_types():
        """
        Create all the default badge types for the system
        This should be called during deployment or app initialization
        """
        badge_types = [
            # Performance Badges (will be implemented later via leaderboard calculations)
            {
                'name': 'Top Provider - First Place',
                'description': 'Achieved the highest rating among all providers this month',
                'category': 'performance',
                'rarity': 'legendary',
                'svg_filename': 'top_provider_gold.svg',
                'criteria_description': 'Highest average rating with minimum 3 reviews in a month',
                'display_order': 1
            },
            {
                'name': 'Top Provider - Second Place',
                'description': 'Achieved the second highest rating among all providers this month',
                'category': 'performance',
                'rarity': 'epic',
                'svg_filename': 'top_provider_silver.svg',
                'criteria_description': 'Second highest average rating with minimum 3 reviews in a month',
                'display_order': 2
            },
            {
                'name': 'Top Provider - Third Place',
                'description': 'Achieved the third highest rating among all providers this month',
                'category': 'performance',
                'rarity': 'rare',
                'svg_filename': 'top_provider_bronze.svg',
                'criteria_description': 'Third highest average rating with minimum 3 reviews in a month',
                'display_order': 3
            },
            
            # Monthly Badges
            {
                'name': 'Provider of the Month',
                'description': 'Outstanding performance and customer satisfaction this month',
                'category': 'monthly',
                'rarity': 'epic',
                'svg_filename': 'provider_of_month.svg',
                'criteria_description': 'Minimum 10 orders, 3 reviews, and 4.0+ rating in a month',
                'display_order': 10
            },
            
            # Milestone Badges (automatically awarded)
            {
                'name': 'First Order',
                'description': 'Completed your very first order on Save n Bite',
                'category': 'milestone',
                'rarity': 'common',
                'svg_filename': 'first_order.svg',
                'criteria_description': 'Complete 1 order',
                'display_order': 20
            },
            {
                'name': 'Veteran Provider',
                'description': 'Been serving customers for over a year',
                'category': 'milestone',
                'rarity': 'rare',
                'svg_filename': 'veteran_provider.svg',
                'criteria_description': 'Active on platform for 365+ days',
                'display_order': 21
            },
            {
                'name': 'Review Magnet',
                'description': 'Attracted your first 10 customer reviews',
                'category': 'milestone',
                'rarity': 'uncommon',
                'svg_filename': 'review_magnet.svg',
                'criteria_description': 'Receive 10 reviews',
                'display_order': 22
            },
            {
                'name': 'Customer Favorite',
                'description': 'Beloved by customers with 50+ reviews',
                'category': 'milestone',
                'rarity': 'rare',
                'svg_filename': 'customer_favorite.svg',
                'criteria_description': 'Receive 50 reviews',
                'display_order': 23
            },
            {
                'name': 'Order Champion',
                'description': 'Completed 100 orders successfully',
                'category': 'milestone',
                'rarity': 'epic',
                'svg_filename': 'order_champion.svg',
                'criteria_description': 'Complete 100 orders',
                'display_order': 24
            },
            {
                'name': 'Revenue Milestone - R1000',
                'description': 'Generated R1000 in total revenue',
                'category': 'milestone',
                'rarity': 'uncommon',
                'svg_filename': 'revenue_1k.svg',
                'criteria_description': 'Generate R1000+ total revenue',
                'display_order': 25
            },
            {
                'name': 'Revenue Milestone - R10000',
                'description': 'Generated R10000 in total revenue',
                'category': 'milestone',
                'rarity': 'epic',
                'svg_filename': 'revenue_10k.svg',
                'criteria_description': 'Generate R10000+ total revenue',
                'display_order': 26
            },
            
            # Recognition Badges (automatically awarded)
            {
                'name': 'Excellence Badge',
                'description': 'Maintaining exceptional quality with 4.5+ star rating',
                'category': 'recognition',
                'rarity': 'epic',
                'svg_filename': 'excellence_badge.svg',
                'criteria_description': '4.5+ average rating with minimum 10 reviews',
                'display_order': 30
            },
            {
                'name': 'Perfect Rating',
                'description': 'Achieved and maintained a perfect 5.0 star rating',
                'category': 'recognition',
                'rarity': 'legendary',
                'svg_filename': 'perfect_rating.svg',
                'criteria_description': '5.0 average rating with minimum 5 reviews',
                'display_order': 31
            },
            
            # Special Badges (automatically awarded)
            {
                'name': 'Early Adopter',
                'description': 'One of the first providers to join Save n Bite',
                'category': 'special',
                'rarity': 'legendary',
                'svg_filename': 'early_adopter.svg',
                'criteria_description': 'Registered within first month of platform launch',
                'display_order': 40
            },
            {
                'name': 'Community Builder',
                'description': 'Helping build the Save n Bite community',
                'category': 'special',
                'rarity': 'rare',
                'svg_filename': 'community_builder.svg',
                'criteria_description': 'Special recognition for community contributions',
                'display_order': 41
            },
        ]
        
        created_count = 0
        for badge_data in badge_types:
            badge_type, created = BadgeType.objects.get_or_create(
                name=badge_data['name'],
                defaults=badge_data
            )
            if created:
                created_count += 1
                logger.info(f"Created badge type: {badge_type.name}")
        
        logger.info(f"Badge initialization complete. Created {created_count} new badge types.")
        return created_count