# reviews/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from interactions.models import Interaction
from authentication.models import FoodProviderProfile
import uuid

User = get_user_model()

class Review(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('flagged', 'Flagged'),
        ('censored', 'Censored'),
        ('deleted', 'Deleted'),
    ]
    
    REVIEW_SOURCE_CHOICES = [
        ('popup', 'Post-completion Popup'),
        ('history', 'Interaction History'),
    ]

    # Primary identifiers
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core relationships
    interaction = models.OneToOneField(
        Interaction, 
        on_delete=models.CASCADE, 
        related_name='review'
    )
    reviewer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='reviews_written'
    )
    business = models.ForeignKey(
        FoodProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='reviews_received'
    )
    
    # Review content - all can be blank/null
    general_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text="Overall rating for the interaction (1-5 stars)"
    )
    general_comment = models.TextField(
        blank=True,
        null=True,
        help_text="General comment about the interaction"
    )
    food_review = models.TextField(
        blank=True,
        null=True,
        help_text="Specific review about the food items"
    )
    business_review = models.TextField(
        blank=True,
        null=True,
        help_text="Specific review about the business/service"
    )
    
    # Metadata
    review_source = models.CharField(
        max_length=10, 
        choices=REVIEW_SOURCE_CHOICES,
        default='popup'
    )
    
    # Moderation
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='active'
    )
    moderation_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes from moderators"
    )
    moderated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews_moderated',
        limit_choices_to={'admin_rights': True}
    )
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Cache fields for performance (denormalized data from interaction)
    interaction_type = models.CharField(max_length=20)  # Purchase/Donation
    interaction_total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    food_items_snapshot = models.JSONField(
        default=list,
        help_text="Snapshot of food items from the interaction"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', '-created_at']),
            models.Index(fields=['reviewer', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['general_rating']),
        ]
    
    def __str__(self):
        rating_str = f"{self.general_rating}★" if self.general_rating else "No rating"
        return f"Review by {self.reviewer.email} for {self.business.business_name} - {rating_str}"
    
    def clean(self):
        """Ensure at least one review field is provided"""
        from django.core.exceptions import ValidationError
        
        if not any([
            self.general_rating,
            self.general_comment,
            self.food_review,
            self.business_review
        ]):
            raise ValidationError(
                "At least one review field (rating, general comment, food review, or business review) must be provided."
            )
    
    def save(self, *args, **kwargs):
        # Cache interaction data for performance
        if self.interaction:
            self.interaction_type = self.interaction.interaction_type
            self.interaction_total_amount = self.interaction.total_amount
            self.business = self.interaction.business
            
            # Create snapshot of food items
            food_items = []
            for item in self.interaction.items.all():
                food_items.append({
                    'name': item.name,
                    'quantity': item.quantity,
                    'price_per_item': float(item.price_per_item),
                    'total_price': float(item.total_price),
                    'expiry_date': item.expiry_date.isoformat() if item.expiry_date else None
                })
            self.food_items_snapshot = food_items
        
        super().save(*args, **kwargs)
    
    @property
    def is_visible(self):
        """Check if review should be visible to public"""
        return self.status in ['active', 'flagged']
    
    @property
    def has_content(self):
        """Check if review has any meaningful content"""
        return any([
            self.general_rating,
            self.general_comment and self.general_comment.strip(),
            self.food_review and self.food_review.strip(),
            self.business_review and self.business_review.strip()
        ])


class ReviewModerationLog(models.Model):
    """Log of all moderation actions taken on reviews"""
    ACTION_CHOICES = [
        ('flag', 'Flagged'),
        ('censor', 'Censored'),
        ('delete', 'Deleted'),
        ('restore', 'Restored'),
        ('note_added', 'Note Added'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='moderation_logs')
    moderator = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        limit_choices_to={'admin_rights': True}
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.TextField(help_text="Reason for the moderation action")
    previous_status = models.CharField(max_length=10)
    new_status = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} by {self.moderator.email} on review {self.review.id}"


class BusinessReviewStats(models.Model):
    """Cached statistics for business reviews - updated via signals"""
    business = models.OneToOneField(
        FoodProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='review_stats'
    )
    
    # Basic stats
    total_reviews = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00,
        help_text="Average rating (0.00-5.00)"
    )
    
    # Rating distribution
    rating_1_count = models.PositiveIntegerField(default=0)
    rating_2_count = models.PositiveIntegerField(default=0)
    rating_3_count = models.PositiveIntegerField(default=0)
    rating_4_count = models.PositiveIntegerField(default=0)
    rating_5_count = models.PositiveIntegerField(default=0)
    
    # Additional stats
    highest_rating = models.PositiveIntegerField(default=0)
    lowest_rating = models.PositiveIntegerField(default=0)
    
    # Recent activity
    reviews_this_month = models.PositiveIntegerField(default=0)
    reviews_this_week = models.PositiveIntegerField(default=0)
    
    # Timestamps
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Business Review Statistics"
        verbose_name_plural = "Business Review Statistics"
    
    def __str__(self):
        return f"Review stats for {self.business.business_name}"
    
    @property
    def rating_distribution(self):
        """Return rating distribution as percentages"""
        if self.total_reviews == 0:
            return [0, 0, 0, 0, 0]
        
        return [
            round((self.rating_1_count / self.total_reviews) * 100, 1),
            round((self.rating_2_count / self.total_reviews) * 100, 1),
            round((self.rating_3_count / self.total_reviews) * 100, 1),
            round((self.rating_4_count / self.total_reviews) * 100, 1),
            round((self.rating_5_count / self.total_reviews) * 100, 1),
        ]
    
    def recalculate_stats(self):
        """Recalculate all statistics from scratch"""
        from django.db.models import Avg, Count, Max, Min
        from django.utils import timezone
        from datetime import timedelta
        
        # Get all active reviews for this business
        active_reviews = Review.objects.filter(
            business=self.business,
            status='active',
            general_rating__isnull=False
        )
        
        # Basic stats
        self.total_reviews = active_reviews.count()
        
        if self.total_reviews > 0:
            avg_rating = active_reviews.aggregate(avg=Avg('general_rating'))['avg']
            self.average_rating = round(avg_rating, 2) if avg_rating else 0.00
            
            # Min/Max ratings
            self.highest_rating = active_reviews.aggregate(max=Max('general_rating'))['max'] or 0
            self.lowest_rating = active_reviews.aggregate(min=Min('general_rating'))['min'] or 0
            
            # Rating distribution
            for i in range(1, 6):
                count = active_reviews.filter(general_rating=i).count()
                setattr(self, f'rating_{i}_count', count)
        else:
            self.average_rating = 0.00
            self.highest_rating = 0
            self.lowest_rating = 0
            for i in range(1, 6):
                setattr(self, f'rating_{i}_count', 0)
        
        # Recent activity
        now = timezone.now()
        month_ago = now - timedelta(days=30)
        week_ago = now - timedelta(days=7)
        
        self.reviews_this_month = active_reviews.filter(created_at__gte=month_ago).count()
        self.reviews_this_week = active_reviews.filter(created_at__gte=week_ago).count()
        
        self.save()