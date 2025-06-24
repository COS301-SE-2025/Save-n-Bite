from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Tuple, Optional
import calendar

from .models import (
    UserAnalytics, MonthlyAnalytics, TransactionAnalytics, 
    Badge, UserBadge, SystemAnalytics
)

class AnalyticsService:
    """Service class for analytics calculations and data processing"""
    
    @staticmethod
    def get_user_dashboard_data(user) -> Dict:
        """Get comprehensive dashboard data for a user"""
        user_analytics, created = UserAnalytics.objects.get_or_create(
            user=user,
            defaults={'user_type': 'individual'}  # Default, should be determined properly
        )
        
        current_month = timezone.now().month
        current_year = timezone.now().year
        last_month = current_month - 1 if current_month > 1 else 12
        last_month_year = current_year if current_month > 1 else current_year - 1
        
        # Get current and last month data
        current_month_data = MonthlyAnalytics.objects.filter(
            user=user, year=current_year, month=current_month
        ).first()
        last_month_data = MonthlyAnalytics.objects.filter(
            user=user, year=last_month_year, month=last_month
        ).first()
        
        dashboard_data = {
            'total_orders': {
                'current': user_analytics.total_orders,
                'change': AnalyticsService._calculate_change(
                    current_month_data.orders_count if current_month_data else 0,
                    last_month_data.orders_count if last_month_data else 0
                )
            },
            'donations': {
                'current': user_analytics.total_donations_given,
                'change': AnalyticsService._calculate_change(
                    current_month_data.donations_given if current_month_data else 0,
                    last_month_data.donations_given if last_month_data else 0
                )
            },
            'followers': {
                'current': user_analytics.total_followers,
                'change': AnalyticsService._calculate_change(
                    current_month_data.new_followers if current_month_data else 0,
                    last_month_data.new_followers if last_month_data else 0
                )
            },
            'average_rating': {
                'rating': float(user_analytics.average_rating),
                'total_reviews': user_analytics.total_reviews
            },
            'sustainability_impact': {
                'meals_saved': user_analytics.meals_saved,
                'co2_reduced': float(user_analytics.co2_reduction_kg)
            },
            'percentile_rank': user_analytics.get_percentile_rank()
        }
        
        return dashboard_data
    
    @staticmethod
    def get_orders_per_month_data(user, months: int = 12) -> List[Dict]:
        """Get orders per month data for line graph"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=months * 30)
        
        monthly_data = MonthlyAnalytics.objects.filter(
            user=user,
            created_at__gte=start_date
        ).order_by('year', 'month')
        
        # Create a complete dataset with zeros for missing months
        result = []
        current_date = start_date.replace(day=1)
        
        while current_date <= end_date:
            month_data = monthly_data.filter(
                year=current_date.year,
                month=current_date.month
            ).first()
            
            result.append({
                'month': calendar.month_name[current_date.month][:3],
                'year': current_date.year,
                'orders': month_data.orders_count if month_data else 0,
                'sales': float(month_data.total_sales) if month_data else 0
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return result[-months:]  # Return only the requested number of months
    
    @staticmethod
    def get_sales_vs_donations_data(user) -> Dict:
        """Get sales vs donations split data"""
        current_year = timezone.now().year
        
        transactions = TransactionAnalytics.objects.filter(
            user=user,
            created_at__year=current_year
        )
        
        sales_data = transactions.filter(transaction_type='purchase').aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        donations_data = transactions.filter(transaction_type='donation').aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        return {
            'sales': {
                'amount': float(sales_data['total'] or 0),
                'count': sales_data['count'] or 0
            },
            'donations': {
                'amount': float(donations_data['total'] or 0),
                'count': donations_data['count'] or 0
            }
        }
    
    @staticmethod
    def get_followers_over_time_data(user, months: int = 6) -> List[Dict]:
        """Get new followers over time for bar graph"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=months * 30)
        
        monthly_data = MonthlyAnalytics.objects.filter(
            user=user,
            created_at__gte=start_date
        ).order_by('year', 'month')
        
        result = []
        current_date = start_date.replace(day=1)
        
        while current_date <= end_date:
            month_data = monthly_data.filter(
                year=current_date.year,
                month=current_date.month
            ).first()
            
            result.append({
                'month': calendar.month_name[current_date.month][:3],
                'year': current_date.year,
                'new_followers': month_data.new_followers if month_data else 0
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return result[-months:]
    
    @staticmethod
    def update_user_analytics(user, transaction_data: Dict):
        """Update user analytics after a transaction"""
        user_analytics, created = UserAnalytics.objects.get_or_create(
            user=user,
            defaults={'user_type': transaction_data.get('user_type', 'individual')}
        )
        
        transaction_type = transaction_data.get('type')
        
        if transaction_type == 'purchase':
            user_analytics.total_orders += 1
        elif transaction_type == 'donation':
            user_analytics.total_donations_given += 1
        
        # Update sustainability metrics
        meals_saved = transaction_data.get('meals_saved', 1)
        co2_reduction = transaction_data.get('co2_reduction', 0.5)  # Default 0.5kg per meal
        
        user_analytics.meals_saved += meals_saved
        user_analytics.co2_reduction_kg += Decimal(str(co2_reduction))
        
        user_analytics.save()
        
        # Update monthly analytics
        AnalyticsService.update_monthly_analytics(user, transaction_data)
        
        # Check for new badges
        AnalyticsService.check_and_award_badges(user)
    
    @staticmethod
    def update_monthly_analytics(user, transaction_data: Dict):
        """Update monthly analytics"""
        now = timezone.now()
        monthly_analytics, created = MonthlyAnalytics.objects.get_or_create(
            user=user,
            year=now.year,
            month=now.month,
            defaults={}
        )
        
        transaction_type = transaction_data.get('type')
        
        if transaction_type == 'purchase':
            monthly_analytics.orders_count += 1
            monthly_analytics.total_sales += Decimal(str(transaction_data.get('amount', 0)))
        elif transaction_type == 'donation':
            monthly_analytics.donations_given += 1
        
        #monthly_analytics.meals_saved_monthly += transaction_data.get('meals_saved', 1)
        #monthly_analytics.co2_reduced_monthly += Decimal(str(transaction_data.get('co2_reduction', 0.5)))
        
        monthly_analytics.save()
    
    @staticmethod
    def check_and_award_badges(user):
        """Check and award badges based on user achievements"""
        user_analytics = UserAnalytics.objects.get(user=user)
        
        # Define badge criteria
        badge_criteria = [
            ('First Saver', 'meals_saved', 1),
            ('Meal Hero', 'meals_saved', 10),
            ('Sustainability Champion', 'meals_saved', 50),
            ('Eco Warrior', 'meals_saved', 100),
            ('Planet Protector', 'co2_reduction_kg', 10),
            ('Green Guardian', 'co2_reduction_kg', 50),
            ('Generous Giver', 'total_donations_given', 5),
            ('Community Leader', 'total_followers', 10),
        ]
        
        for badge_name, criteria_field, threshold in badge_criteria:
            # Check if user has achieved the threshold
            current_value = getattr(user_analytics, criteria_field, 0)
            
            if current_value >= threshold:
                # Check if badge already exists
                badge, created = Badge.objects.get_or_create(
                    name=badge_name,
                    defaults={
                        'description': f'Awarded for {criteria_field.replace("_", " ")} >= {threshold}',
                        'icon': 'fas fa-award',
                        'criteria_type': criteria_field,
                        'criteria_value': threshold
                    }
                )
                
                # Award badge if not already earned
                user_badge, badge_created = UserBadge.objects.get_or_create(
                    user=user,
                    badge=badge
                )
                
                if badge_created:
                    user_analytics.total_badges += 1
                    user_analytics.save()
    
    @staticmethod
    def get_leaderboard_data(user_type: str = 'all', period: str = 'monthly') -> List[Dict]:
        """Get leaderboard data for gamification"""
        queryset = UserAnalytics.objects.all()
        
        if user_type != 'all':
            queryset = queryset.filter(user_type=user_type)
        
        if period == 'monthly':
            # Get current month data
            current_month = timezone.now().month
            current_year = timezone.now().year
            
            monthly_leaders = MonthlyAnalytics.objects.filter(
                year=current_year,
                month=current_month
            ).order_by('-meals_saved_monthly')[:10]
            
            leaderboard = []
            for idx, monthly_data in enumerate(monthly_leaders, 1):
                user_analytics = UserAnalytics.objects.get(user=monthly_data.user)
                leaderboard.append({
                    'rank': idx,
                    'username': monthly_data.user.username,
                    'meals_saved': monthly_data.meals_saved_monthly,
                    'co2_reduced': float(monthly_data.co2_reduced_monthly),
                    'badges': user_analytics.total_badges
                })
        else:
            # All-time leaderboard
            leaders = queryset.order_by('-meals_saved')[:10]
            leaderboard = []
            for idx, user_analytics in enumerate(leaders, 1):
                leaderboard.append({
                    'rank': idx,
                    'username': user_analytics.user.username,
                    'meals_saved': user_analytics.meals_saved,
                    'co2_reduced': float(user_analytics.co2_reduction_kg),
                    'badges': user_analytics.total_badges
                })
        
        return leaderboard
    
    @staticmethod
    def _calculate_change(current: int, previous: int) -> Dict:
        """Calculate percentage change between two values"""
        if previous == 0:
            if current > 0:
                return {'percentage': 100, 'direction': 'increase'}
            else:
                return {'percentage': 0, 'direction': 'stable'}
        
        change = ((current - previous) / previous) * 100
        direction = 'increase' if change > 0 else 'decrease' if change < 0 else 'stable'
        
        return {
            'percentage': abs(round(change, 1)),
            'direction': direction
        }