# badges/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from authentication.models import FoodProviderProfile
import uuid

User = get_user_model()


class BadgeType(models.Model):
    """
    Defines the different types of badges available in the system
    """
    CATEGORY_CHOICES = [
        ('performance', 'Performance'),
        ('milestone', 'Milestone'),
        ('recognition', 'Recognition'),
        ('monthly', 'Monthly Achievement'),
        ('special', 'Special Event'),
    ]
    
    RARITY_CHOICES = [
        ('common', 'Common'),
        ('uncommon', 'Uncommon'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')
    
    # SVG badge design identifier (matches frontend asset filename)
    svg_filename = models.CharField(max_length=100, help_text="SVG file name in frontend assets")
    
    # Badge criteria
    criteria_description = models.TextField(help_text="Human-readable criteria for earning this badge")
    
    # System fields
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Ordering and display
    display_order = models.IntegerField(default=0, help_text="Order for displaying badges")
    
    class Meta:
        ordering = ['category', 'display_order', 'name']
        verbose_name = 'Badge Type'
        verbose_name_plural = 'Badge Types'
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class ProviderBadge(models.Model):
    """
    Represents a badge earned by a food provider
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_badges')
    badge_type = models.ForeignKey(BadgeType, on_delete=models.CASCADE, related_name='earned_by')
    
    # When and how the badge was earned
    earned_date = models.DateTimeField(auto_now_add=True)
    earned_reason = models.TextField(help_text="Specific reason why this badge was earned")
    
    # Badge-specific data (flexible JSON field for different badge types)
    badge_data = models.JSONField(default=dict, blank=True, help_text="Additional data specific to this badge instance")
    
    # Display settings
    is_pinned = models.BooleanField(default=False, help_text="Whether provider has pinned this badge to their profile")
    pin_order = models.IntegerField(default=0, help_text="Order of pinned badges on profile")
    
    # Monthly badges need month/year tracking
    month = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(12)])
    year = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(2024)])
    
    class Meta:
        # Prevent duplicate badges for the same provider, except for monthly badges
        unique_together = [
            ('provider', 'badge_type', 'month', 'year')
        ]
        ordering = ['-earned_date']
        verbose_name = 'Provider Badge'
        verbose_name_plural = 'Provider Badges'
        
        # Index for performance
        indexes = [
            models.Index(fields=['provider', 'is_pinned']),
            models.Index(fields=['badge_type', 'earned_date']),
            models.Index(fields=['month', 'year']),
        ]
    
    def __str__(self):
        date_suffix = ""
        if self.month and self.year:
            date_suffix = f" ({self.year}-{self.month:02d})"
        return f"{self.provider.provider_profile.business_name} - {self.badge_type.name}{date_suffix}"
    
    def save(self, *args, **kwargs):
        # For monthly badges, automatically set month/year
        if self.badge_type.category == 'monthly' and not self.month:
            now = timezone.now()
            self.month = now.month
            self.year = now.year
        super().save(*args, **kwargs)


class BadgeLeaderboard(models.Model):
    """
    Tracks leaderboard positions for ranking-based badges
    """
    LEADERBOARD_TYPES = [
        ('rating', 'Rating Leaderboard'),
        ('reviews', 'Review Count Leaderboard'),
        ('orders', 'Order Count Leaderboard'),
        ('revenue', 'Revenue Leaderboard'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    leaderboard_type = models.CharField(max_length=20, choices=LEADERBOARD_TYPES)
    
    # Time period
    month = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    year = models.IntegerField(validators=[MinValueValidator(2024)])
    
    # Rankings
    first_place = models.ForeignKey(User, on_delete=models.CASCADE, related_name='first_place_badges', null=True, blank=True)
    second_place = models.ForeignKey(User, on_delete=models.CASCADE, related_name='second_place_badges', null=True, blank=True)
    third_place = models.ForeignKey(User, on_delete=models.CASCADE, related_name='third_place_badges', null=True, blank=True)
    
    # Metrics
    first_place_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    second_place_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    third_place_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # System fields
    calculated_at = models.DateTimeField(auto_now_add=True)
    is_finalized = models.BooleanField(default=False, help_text="Whether badges have been awarded for this leaderboard")
    
    class Meta:
        unique_together = [('leaderboard_type', 'month', 'year')]
        ordering = ['-year', '-month', 'leaderboard_type']
        verbose_name = 'Badge Leaderboard'
        verbose_name_plural = 'Badge Leaderboards'
    
    def __str__(self):
        return f"{self.get_leaderboard_type_display()} - {self.year}-{self.month:02d}"


class ProviderBadgeStats(models.Model):
    """
    Aggregated statistics for provider badges for performance
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.OneToOneField(User, on_delete=models.CASCADE, related_name='badge_stats')
    
    # Badge counts by category
    total_badges = models.IntegerField(default=0)
    performance_badges = models.IntegerField(default=0)
    milestone_badges = models.IntegerField(default=0)
    recognition_badges = models.IntegerField(default=0)
    monthly_badges = models.IntegerField(default=0)
    special_badges = models.IntegerField(default=0)
    
    # Badge counts by rarity
    common_badges = models.IntegerField(default=0)
    uncommon_badges = models.IntegerField(default=0)
    rare_badges = models.IntegerField(default=0)
    epic_badges = models.IntegerField(default=0)
    legendary_badges = models.IntegerField(default=0)
    
    # Pinned badges count
    pinned_badges_count = models.IntegerField(default=0)
    
    # First badge earned
    first_badge_earned = models.DateTimeField(null=True, blank=True)
    latest_badge_earned = models.DateTimeField(null=True, blank=True)
    
    # Calculation tracking
    last_calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Provider Badge Statistics'
        verbose_name_plural = 'Provider Badge Statistics'
    
    def __str__(self):
        return f"{self.provider.provider_profile.business_name} - {self.total_badges} badges"
    
    def get_rarity_score(self):
        """Calculate a score based on badge rarity"""
        return (
            self.common_badges * 1 +
            self.uncommon_badges * 2 +
            self.rare_badges * 5 +
            self.epic_badges * 10 +
            self.legendary_badges * 25
        )