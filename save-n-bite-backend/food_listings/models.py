# food_listings/models.py

from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class FoodListing(models.Model):
    FOOD_TYPE_CHOICES = [
        ('ready_to_eat', 'Ready to Eat'),
        ('ingredients', 'Ingredients'),
        ('baked_goods', 'Baked Goods'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('sold_out', 'Sold Out'),
        ('expired', 'Expired'),
        ('inactive', 'Inactive'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Information
    name = models.CharField(max_length=255)
    description = models.TextField()
    food_type = models.CharField(max_length=20, choices=FOOD_TYPE_CHOICES)
    
    # Pricing
    original_price = models.DecimalField(max_digits=10, decimal_places=2)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Quantity and Availability
    quantity = models.PositiveIntegerField()
    quantity_available = models.PositiveIntegerField()  # Tracks remaining quantity
    
    # Dates
    expiry_date = models.DateField()
    pickup_window = models.CharField(max_length=50)  # e.g., "17:00-19:00"
    
    # Images (we'll store multiple images as a JSON field for simplicity)
    images = models.JSONField(default=list, blank=True)  # URLs to images
    
    # Additional Information
    allergens = models.JSONField(default=list, blank=True)  # List of allergens
    dietary_info = models.JSONField(default=list, blank=True)  # vegetarian, vegan, etc.
    
    # Status and Provider
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    provider = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='food_listings',
        limit_choices_to={'user_type': 'provider'}
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['food_type']),
            models.Index(fields=['status']),
            models.Index(fields=['expiry_date']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.provider.provider_profile.business_name}"
    
    @property
    def savings(self):
        """Calculate savings amount"""
        return self.original_price - self.discounted_price
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage"""
        if self.original_price > 0:
            return round(((self.original_price - self.discounted_price) / self.original_price) * 100)
        return 0
    
    @property
    def is_available(self):
        """Check if listing is available for purchase"""
        return self.status == 'active' and self.quantity_available > 0
    
    def save(self, *args, **kwargs):
        # Initialize quantity_available if not set
        if not self.quantity_available:
            self.quantity_available = self.quantity
        
        # Auto-update status based on quantity
        if self.quantity_available <= 0 and self.status == 'active':
            self.status = 'sold_out'
        
        super().save(*args, **kwargs)