from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from authentication.models import FoodProviderProfile

class AnalyticsBase(models.Model):
    """Base model for analytics with common fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class UserAnalytics(AnalyticsBase):
    """Analytics data for individual users/providers"""
    USER_TYPES = [
        ('individual', 'Individual Consumer'),
        ('provider', 'Food Provider'),
        ('organization', 'Organization'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='analytics')
    user_type = models.CharField(max_length=20, choices=USER_TYPES)
    
    # Core metrics
    total_orders = models.PositiveIntegerField(default=0)
    total_donations_given = models.PositiveIntegerField(default=0)
    total_donations_received = models.PositiveIntegerField(default=0)
    total_followers = models.PositiveIntegerField(default=0)
    
    # Ratings
    total_reviews = models.PositiveIntegerField(default=0)
    rating_sum = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    
    # Sustainability metrics
    meals_saved = models.PositiveIntegerField(default=0)
    co2_reduction_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Rewards & Gamification
    savecoins_earned = models.PositiveIntegerField(default=0)
    savecoins_spent = models.PositiveIntegerField(default=0)
    total_badges = models.PositiveIntegerField(default=0)
    
    def calculate_average_rating(self):
        if self.total_reviews > 0:
            self.average_rating = self.rating_sum / self.total_reviews
        else:
            self.average_rating = 0
        self.save()
    
    def get_percentile_rank(self):
        """Calculate user's percentile rank based on meals saved"""
        total_users = UserAnalytics.objects.filter(user_type=self.user_type).count()
        if total_users == 0:
            return 0
        
        users_below = UserAnalytics.objects.filter(
            user_type=self.user_type,
            meals_saved__lt=self.meals_saved
        ).count()
        
        percentile = (users_below / total_users) * 100
        return round(percentile, 1)
    
    def __str__(self):
        return f"Analytics for {self.user.username}"

class MonthlyAnalytics(AnalyticsBase):
    """Monthly analytics snapshots for trend analysis"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monthly_analytics')
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField()
    
    # Monthly metrics
    orders_count = models.PositiveIntegerField(default=0)
    donations_given = models.PositiveIntegerField(default=0)
    donations_received = models.PositiveIntegerField(default=0)
    new_followers = models.PositiveIntegerField(default=0)
    total_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    meals_saved_monthly = models.PositiveIntegerField(default=0)
    co2_reduced_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ('user', 'year', 'month')
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.user.username} - {self.month}/{self.year}"

class TransactionAnalytics(AnalyticsBase):
    """Analytics for individual transactions"""
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('donation', 'Donation'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(default=1)
    
    # Impact metrics
    meals_saved = models.PositiveIntegerField(default=1)
    co2_reduction = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    # Related models (you'll need to adjust these based on your actual models)
    # listing_id = models.PositiveIntegerField()  # Reference to food listing
    
    def __str__(self):
        return f"{self.transaction_type} by {self.user.username} - {self.amount}"

class ReviewAnalytics(AnalyticsBase):
    """Analytics for reviews and ratings"""
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_given')
    reviewed_user = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    
    # transaction_id = models.PositiveIntegerField()  # Reference to transaction
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update user analytics when review is saved
        user_analytics, created = UserAnalytics.objects.get_or_create(
            user=self.reviewed_user,
            defaults={'user_type': 'provider'}  # You'll need to determine this properly
        )
        user_analytics.total_reviews += 1
        user_analytics.rating_sum += self.rating
        user_analytics.calculate_average_rating()

class Badge(models.Model):
    """Badge definitions"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)  # Font awesome class or image path
    criteria_type = models.CharField(max_length=50)  # 'meals_saved', 'donations', etc.
    criteria_value = models.PositiveIntegerField()
    
    def __str__(self):
        return self.name

class UserBadge(AnalyticsBase):
    """Badges earned by users"""
    user = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'badge')
    
    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"

class SystemAnalytics(AnalyticsBase):
    """System-wide analytics"""
    date = models.DateField(unique=True, default=timezone.now)
    
    # Daily system metrics
    total_active_users = models.PositiveIntegerField(default=0)
    total_transactions = models.PositiveIntegerField(default=0)
    total_donations = models.PositiveIntegerField(default=0)
    total_sales_volume = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_meals_saved = models.PositiveIntegerField(default=0)
    total_co2_reduced = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    def __str__(self):
        return f"System Analytics - {self.date}"