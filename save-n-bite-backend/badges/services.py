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
    Core service for managing badges, calculations, and awards
    """
    
    def __init__(self):
        self.current_time = timezone.now()
        self.current_month = self.current_time.month
        self.current_year = self.current_time.year
    
    def calculate_all_badges(self):
        """
        Calculate and award all badges for all providers
        Called by management command or scheduled task
        """
        logger.info("Starting badge calculation for all providers")
        
        # Get all active food providers - using 'Verified' status
        providers = User.objects.filter(
            user_type='provider',
            provider_profile__isnull=False,
            provider_profile__status='verified'
        ).select_related('provider_profile')
        
        logger.info(f"Found {providers.count()} providers to process")
        
        results = {
            'providers_processed': 0,
            'badges_awarded': 0,
            'errors': []
        }
        
        for provider in providers:
            try:
                logger.info(f"Processing badges for provider: {provider.email}")
                with transaction.atomic():
                    badges_awarded = self.calculate_provider_badges(provider)
                    results['badges_awarded'] += len(badges_awarded)
                    results['providers_processed'] += 1
                    logger.info(f"Awarded {len(badges_awarded)} badges to {provider.email}")
                    
            except Exception as e:
                error_msg = f"Error processing badges for {provider.email}: {str(e)}"
                logger.error(error_msg)
                results['errors'].append(error_msg)
        
        # Calculate leaderboard badges
        try:
            leaderboard_badges = self.calculate_leaderboard_badges()
            results['badges_awarded'] += leaderboard_badges
        except Exception as e:
            error_msg = f"Error calculating leaderboard badges: {str(e)}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
        
        logger.info(f"Badge calculation complete: {results}")
        return results
    
    def calculate_provider_badges(self, provider: User) -> List[ProviderBadge]:
        """
        Calculate and award badges for a specific provider
        """
        logger.info(f"🏆 Starting badge calculation for provider: {provider.email}")
        badges_awarded = []
        
        # Get provider statistics
        stats = self.get_provider_statistics(provider)
        logger.info(f"📊 Provider statistics: {stats}")
        
        # Check milestone badges
        logger.info("🔍 Checking milestone badges...")
        milestone_badges = self.check_milestone_badges(provider, stats)
        badges_awarded.extend(milestone_badges)
        logger.info(f"✅ Milestone badges awarded: {len(milestone_badges)}")
        
        # Check monthly provider badge (for current month)
        logger.info("🔍 Checking monthly provider badge...")
        monthly_badge = self.check_monthly_provider_badge(provider, stats)
        if monthly_badge:
            badges_awarded.append(monthly_badge)
            logger.info(f"✅ Monthly badge awarded: {monthly_badge}")
        
        # Check special achievement badges
        logger.info("🔍 Checking special achievement badges...")
        special_badges = self.check_special_achievement_badges(provider, stats)
        badges_awarded.extend(special_badges)
        logger.info(f"✅ Special badges awarded: {len(special_badges)}")
        
        # Update provider badge statistics
        self.update_provider_badge_stats(provider)
        
        logger.info(f"🎉 Badge calculation complete for {provider.email}: {len(badges_awarded)} total badges awarded")
        return badges_awarded
    
    def get_provider_statistics(self, provider: User) -> Dict:
        """
        Get comprehensive statistics for a provider
        """
        # Review statistics - using correct relationship from reviews app
        reviews = Review.objects.filter(business=provider.provider_profile, status='active')
        review_stats = reviews.aggregate(
            total_reviews=Count('id'),
            average_rating=Avg('general_rating'),
            rating_sum=Sum('general_rating')
        )
        
        # Order statistics - using correct relationship from interactions app
        # Order -> Interaction -> business (FoodProviderProfile) -> user (provider)
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
    
    def check_milestone_badges(self, provider: User, stats: Dict) -> List[ProviderBadge]:
        """
        Check and award milestone badges
        """
        badges_awarded = []
        
        # Define milestone thresholds with exact badge names
        milestones = {
            'First Order': {'threshold': 1, 'field': 'total_orders'},
            'Veteran Provider': {'threshold': 365, 'field': 'days_active'},
            'Review Magnet': {'threshold': 10, 'field': 'total_reviews'},
            'Customer Favorite': {'threshold': 50, 'field': 'total_reviews'},
            'Order Champion': {'threshold': 100, 'field': 'total_orders'},
            'Revenue Milestone - R1000': {'threshold': 1000, 'field': 'total_revenue'},
            'Revenue Milestone - R10000': {'threshold': 10000, 'field': 'total_revenue'},
            'Excellence Badge': {'threshold': 4.5, 'field': 'average_rating', 'min_reviews': 10},
        }
        
        for badge_name, config in milestones.items():
            try:
                # Check if badge type exists using exact name
                badge_type = BadgeType.objects.get(name=badge_name, is_active=True)
                
                # Check threshold
                current_value = stats.get(config['field'], 0)
                threshold = config['threshold']
                
                # Special handling for rating badges
                if 'min_reviews' in config:
                    if stats['total_reviews'] < config['min_reviews']:
                        continue
                
                if current_value >= threshold:
                    badge = self.award_badge(provider, badge_type, {
                        'milestone_type': badge_name.lower().replace(' ', '_'),
                        'threshold': threshold,
                        'achieved_value': float(current_value) if isinstance(current_value, Decimal) else current_value,
                        'earned_date': timezone.now().isoformat()
                    })
                    badges_awarded.append(badge)
                    
            except BadgeType.DoesNotExist:
                logger.warning(f"Badge type not found: {badge_name}")
                continue
            except Exception as e:
                logger.error(f"Error checking milestone {badge_name} for {provider.email}: {str(e)}")
                continue
        
        return badges_awarded
    
    def check_monthly_provider_badge(self, provider: User, stats: Dict) -> Optional[ProviderBadge]:
        """
        Check if provider should get monthly provider badge
        Only awarded once per month based on performance
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
            
            # Only award if provider has significant activity this month
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
        
        # Perfect rating badge (5.0 rating with at least 5 reviews)
        if stats['average_rating'] == 5.0 and stats['total_reviews'] >= 5:
            try:
                badge_type = BadgeType.objects.get(name='Perfect Rating', is_active=True)
                if not ProviderBadge.objects.filter(provider=provider, badge_type=badge_type).exists():
                    badge = self.award_badge(provider, badge_type, {
                        'rating': 5.0,
                        'review_count': stats['total_reviews']
                    })
                    badges_awarded.append(badge)
            except BadgeType.DoesNotExist:
                pass
        
        # Early adopter badge (registered in first month of platform)
        # Use timezone.now() to get a timezone-aware datetime, then set to UTC
        platform_launch = timezone.now().replace(year=2024, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        if stats['provider_since'] <= (platform_launch + timedelta(days=30)):
            try:
                badge_type = BadgeType.objects.get(name='Early Adopter', is_active=True)
                if not ProviderBadge.objects.filter(provider=provider, badge_type=badge_type).exists():
                    badge = self.award_badge(provider, badge_type, {
                        'registration_date': stats['provider_since'].isoformat()
                    })
                    badges_awarded.append(badge)
            except BadgeType.DoesNotExist:
                pass
        
        return badges_awarded
    
    def calculate_leaderboard_badges(self) -> int:
        """
        Calculate and award leaderboard-based badges (top 3 providers)
        """
        badges_awarded = 0
        
        # Calculate for current month
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Rating leaderboard
        rating_leaderboard = self.calculate_rating_leaderboard(month_start)
        badges_awarded += self.award_leaderboard_badges('rating', rating_leaderboard)
        
        # Review count leaderboard
        review_leaderboard = self.calculate_review_count_leaderboard(month_start)
        badges_awarded += self.award_leaderboard_badges('reviews', review_leaderboard)
        
        return badges_awarded
    
    def calculate_rating_leaderboard(self, month_start: datetime) -> List[Tuple[User, float]]:
        """
        Calculate rating-based leaderboard for the month
        """
        # Get providers with reviews in the current month
        providers = User.objects.filter(
            user_type='provider',
            provider_profile__isnull=False,
            provider_profile__status='verified',
            provider_profile__reviews_received__status='active',
            provider_profile__reviews_received__created_at__gte=month_start
        ).annotate(
            month_avg_rating=Avg('provider_profile__reviews_received__general_rating'),
            month_review_count=Count('provider_profile__reviews_received')
        ).filter(
            month_review_count__gte=3  # Minimum 3 reviews to qualify
        ).order_by('-month_avg_rating', '-month_review_count')[:3]
        
        return [(provider, provider.month_avg_rating) for provider in providers]
    
    def calculate_review_count_leaderboard(self, month_start: datetime) -> List[Tuple[User, int]]:
        """
        Calculate review count leaderboard for the month
        """
        providers = User.objects.filter(
            user_type='provider',
            provider_profile__isnull=False,
            provider_profile__status='verified'
        ).annotate(
            month_review_count=Count(
                'provider_profile__reviews_received',
                filter=Q(
                    provider_profile__reviews_received__status='active',
                    provider_profile__reviews_received__created_at__gte=month_start
                )
            )
        ).filter(
            month_review_count__gt=0
        ).order_by('-month_review_count')[:3]
        
        return [(provider, provider.month_review_count) for provider in providers]
    
    def award_leaderboard_badges(self, leaderboard_type: str, rankings: List[Tuple[User, float]]) -> int:
        """
        Award badges based on leaderboard rankings
        """
        badges_awarded = 0
        positions = ['First', 'Second', 'Third']
        
        for i, (provider, value) in enumerate(rankings):
            if i >= 3:  # Only top 3
                break
                
            position = positions[i]
            badge_name = f"Top Provider - {position} Place"
            
            try:
                badge_type = BadgeType.objects.get(name=badge_name, is_active=True)
                
                # Check if already earned this month
                if ProviderBadge.objects.filter(
                    provider=provider,
                    badge_type=badge_type,
                    month=self.current_month,
                    year=self.current_year
                ).exists():
                    continue
                
                self.award_badge(provider, badge_type, {
                    'position': i + 1,
                    'leaderboard_type': leaderboard_type,
                    'value': float(value),
                    'month': self.current_month,
                    'year': self.current_year
                })
                badges_awarded += 1
                
            except BadgeType.DoesNotExist:
                logger.warning(f"Badge type not found: {badge_name}")
                continue
        
        return badges_awarded
    
    def award_badge(self, provider: User, badge_type: BadgeType, badge_data: Dict) -> ProviderBadge:
        """
        Award a badge to a provider - using get_or_create like digital garden system
        """
        reason = f"Earned {badge_type.name}: {badge_type.criteria_description}"
        
        # Use get_or_create to handle duplicates gracefully (like digital garden system)
        badge, created = ProviderBadge.objects.get_or_create(
            provider=provider,
            badge_type=badge_type,
            defaults={
                'earned_reason': reason,
                'badge_data': badge_data
            }
        )
        
        if created:
            # Send notification only for newly created badges
            try:
                self.send_badge_notification(provider, badge)
            except Exception as e:
                logger.error(f"Failed to send badge notification: {str(e)}")
            
            logger.info(f"Badge awarded: {badge}")
        else:
            logger.info(f"Badge already exists: {badge}")
        
        return badge
    
    def send_badge_notification(self, provider: User, badge: ProviderBadge):
        """
        Send notification when a badge is earned
        """
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
        """
        badge_types = [
            # Performance Badges
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
            
            # Milestone Badges
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
            
            # Recognition Badges
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
            
            # Special Badges
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