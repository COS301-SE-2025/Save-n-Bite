from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum, Count, F, Q
from django.core.validators import MinValueValidator

User = get_user_model()

class AnalyticsBase(models.Model):
    """Base model for analytics with common fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class UserAnalytics(AnalyticsBase):
    """Analytics data for individual users/providers"""
    USER_TYPES = [
        ('customer', 'Customer'),
        ('provider', 'Food Provider'),
        ('ngo', 'NGO'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='analytics'
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='customer')
    
    # Core metrics
    total_orders = models.PositiveIntegerField(default=0)
    total_donations_given = models.PositiveIntegerField(default=0)
    total_donations_received = models.PositiveIntegerField(default=0)
    total_followers = models.PositiveIntegerField(default=0)
    
    # Financial metrics
    total_spent = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    total_saved = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Ratings
    total_reviews = models.PositiveIntegerField(default=0)
    rating_sum = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    
    # Sustainability metrics
    meals_saved = models.PositiveIntegerField(default=0)
    co2_reduction_kg = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Provider-specific metrics
    total_listings = models.PositiveIntegerField(default=0)
    listings_sold = models.PositiveIntegerField(default=0)
    listings_donated = models.PositiveIntegerField(default=0)
    
    def calculate_average_rating(self):
        """Recalculate average rating"""
        if self.total_reviews > 0:
            self.average_rating = self.rating_sum / Decimal(self.total_reviews)
        else:
            self.average_rating = Decimal('0.00')
        self.save(update_fields=['average_rating'])
    
    def get_percentile_rank(self, metric='meals_saved'):
        """Calculate user's percentile rank based on specified metric"""
        total_users = UserAnalytics.objects.filter(user_type=self.user_type).count()
        if total_users == 0:
            return 0
        
        users_below = UserAnalytics.objects.filter(
            user_type=self.user_type,
            **{f'{metric}__lt': getattr(self, metric)}
        ).count()
        
        percentile = (users_below / total_users) * 100
        return round(percentile, 1)
    
    def __str__(self):
        return f"Analytics for {self.user.email}"

class MonthlyAnalytics(AnalyticsBase):
    """Monthly analytics snapshots for trend analysis"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='monthly_analytics'
    )
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField()
    
    # Monthly metrics
    orders_count = models.PositiveIntegerField(default=0)
    donations_given = models.PositiveIntegerField(default=0)
    donations_received = models.PositiveIntegerField(default=0)
    new_followers = models.PositiveIntegerField(default=0)
    
    # Financial metrics
    total_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_savings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Impact metrics
    meals_saved = models.PositiveIntegerField(default=0)
    co2_reduced = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Provider-specific
    new_listings = models.PositiveIntegerField(default=0)
    listings_sold = models.PositiveIntegerField(default=0)
    listings_donated = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ('user', 'year', 'month')
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.user.email} - {self.month}/{self.year}"

class TransactionAnalytics(AnalyticsBase):
    """Detailed analytics for each transaction"""
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('donation', 'Donation'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transaction_analytics'
    )
    interaction = models.ForeignKey(
        'interactions.Interaction',
        on_delete=models.CASCADE,
        related_name='analytics_records',
        null=True,  # Temporary for migration
        blank=True
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='purchase')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(default=1)
    
    # Impact metrics
    meals_saved = models.PositiveIntegerField(default=1)
    co2_reduction = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    # Link to food listing
    food_listing = models.ForeignKey(
        'food_listings.FoodListing',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Financial details
    original_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    savings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Calculate savings if not set
        if not hasattr(self, 'savings'):
            self.savings = self.original_price - self.discounted_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.transaction_type} by {self.user.email} - {self.amount}"

class Badge(models.Model):
    """Badge definitions for gamification"""
    BADGE_TYPES = [
        ('meals_saved', 'Meals Saved'),
        ('donations', 'Donations Made'),
        ('listings', 'Listings Created'),
        ('savings', 'Total Savings'),
        ('streak', 'Activity Streak'),
        ('rating', 'High Rating'),
    ]
    
    TIERS = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=100, default='fa-trophy')
    badge_type = models.CharField(
        max_length=20, 
        choices=BADGE_TYPES,
        default='meals_saved'
    )
    tier = models.CharField(
        max_length=10, 
        choices=TIERS,
        default='bronze'
    )
    threshold = models.PositiveIntegerField(default=1)
    xp_reward = models.PositiveIntegerField(default=10)
    
    class Meta:
        ordering = ['badge_type', 'threshold']
        unique_together = ('badge_type', 'tier', 'threshold')
    
    def __str__(self):
        return f"{self.tier.title()} {self.name}"

class UserBadge(AnalyticsBase):
    """Badges earned by users"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='badges_earned'
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name='awarded_users'
    )
    
    class Meta:
        unique_together = ('user', 'badge')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.badge.name}"

class SystemAnalytics(AnalyticsBase):
    """System-wide aggregated analytics"""
    date = models.DateField(unique=True, default=timezone.now)
    
    # User metrics
    total_users = models.PositiveIntegerField(default=0)
    new_users = models.PositiveIntegerField(default=0)
    active_users = models.PositiveIntegerField(default=0)
    
    # Transaction metrics
    total_transactions = models.PositiveIntegerField(default=0)
    total_purchases = models.PositiveIntegerField(default=0)
    total_donations = models.PositiveIntegerField(default=0)
    
    # Financial metrics
    total_sales_volume = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_savings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Impact metrics
    total_meals_saved = models.PositiveIntegerField(default=0)
    total_co2_reduced = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Listing metrics
    total_listings = models.PositiveIntegerField(default=0)
    active_listings = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name_plural = "System Analytics"
        ordering = ['-date']
    
    @classmethod
    def update_daily_metrics(cls):
        """Update all daily system metrics"""
        from interactions.models import Interaction
        from food_listings.models import FoodListing
        
        today = timezone.now().date()
        analytics, created = cls.objects.get_or_create(date=today)
        
        # User metrics
        analytics.total_users = User.objects.count()
        analytics.new_users = User.objects.filter(date_joined__date=today).count()
        analytics.active_users = Interaction.objects.filter(
            created_at__date=today
        ).values('user').distinct().count()
        
        # Transaction metrics
        transactions = Interaction.objects.filter(created_at__date=today)
        transaction_data = transactions.aggregate(
            total=Count('id'),
            purchases=Count('id', filter=Q(interaction_type='purchase')),
            donations=Count('id', filter=Q(interaction_type='donation')),
            sales_volume=Sum('total_amount', filter=Q(interaction_type='purchase')),
            savings=Sum(
                models.F('items__food_listing__original_price') - 
                models.F('items__food_listing__discounted_price'),
                filter=Q(interaction_type='purchase')
            ),
            meals_saved=Sum('items__quantity'),
            co2_reduced=Sum(
                models.F('items__quantity') * 
                models.F('items__food_listing__co2_saving_per_item')
            )
        )
        
        # Update metrics
        analytics.total_transactions = transaction_data['total'] or 0
        analytics.total_purchases = transaction_data['purchases'] or 0
        analytics.total_donations = transaction_data['donations'] or 0
        analytics.total_sales_volume = transaction_data['sales_volume'] or 0
        analytics.total_savings = transaction_data['savings'] or 0
        analytics.total_meals_saved = transaction_data['meals_saved'] or 0
        analytics.total_co2_reduced = transaction_data['co2_reduced'] or 0
        
        # Listing metrics
        listing_data = FoodListing.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(status='active'))
        )
        analytics.total_listings = listing_data['total'] or 0
        analytics.active_listings = listing_data['active'] or 0
        
        analytics.save()
    
    def __str__(self):
        return f"System Analytics - {self.date}"