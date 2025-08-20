# food_listings/models.py - Updated with Azure Blob Storage

from django.db import models
from django.contrib.auth import get_user_model
import uuid
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from blob_storage import get_food_listing_storage, food_listing_image_path

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
        ('removed', 'Removed'),  # FOR ADMIN REMOVAL
        ('flagged', 'Flagged'), # FOR ADMINS
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
    
    # UPDATED: Images stored in Azure Blob Storage
    # We'll store image URLs in a JSON field for simplicity
    images = models.JSONField(default=list, blank=True)  # URLs to images in blob storage
    
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
    
    # ADMIN FUNCTIONALITY:
    admin_flagged = models.BooleanField(default=False)
    admin_removal_reason = models.TextField(blank=True)
    removed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='removed_listings'
    )
    removed_at = models.DateTimeField(null=True, blank=True)
    
    # ADMIN METHODS:
    def admin_remove(self, admin_user, reason=""):
        """Remove listing by admin"""
        from django.utils import timezone
        self.status = 'removed'
        self.admin_removal_reason = reason
        self.removed_by = admin_user
        self.removed_at = timezone.now()
        self.save()
    
    def admin_flag(self, admin_user, reason=""):
        """Flag listing for review"""
        self.status = 'flagged'
        self.admin_flagged = True
        self.admin_removal_reason = reason
        self.save()
    
    def admin_restore(self):
        """Restore removed/flagged listing"""
        self.status = 'active'
        self.admin_flagged = False
        self.admin_removal_reason = ""
        self.removed_by = None
        self.removed_at = None
        self.save()
    
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

    @property
    def is_expired(self):
        return self.expiry_date and self.expiry_date < timezone.now().date()
    
    def clean(self):
        if self.is_expired:
            raise ValidationError('Cannot create or modify expired food listing')
    
    # NEW METHODS for image management with blob storage
    def add_image_from_base64(self, base64_data, filename=None):
        """
        Add an image to the listing from base64 data
        Uploads to Azure Blob Storage and stores URL in images field
        """
        import base64
        from django.core.files.base import ContentFile
        from blob_storage import get_food_listing_storage
        import uuid
        
        try:
            # Parse base64 data
            if base64_data.startswith('data:'):
                format_part, data_part = base64_data.split(';base64,')
                ext = format_part.split('/')[-1]
            else:
                data_part = base64_data
                ext = 'jpg'  # Default extension
            
            # Generate filename if not provided
            if not filename:
                filename = f"{uuid.uuid4()}.{ext}"
            
            # Decode base64 data
            image_data = base64.b64decode(data_part)
            image_file = ContentFile(image_data, name=filename)
            
            # Upload to blob storage
            storage = get_food_listing_storage()
            file_path = food_listing_image_path(self, filename)
            saved_name = storage.save(file_path, image_file)
            
            # Get the URL
            image_url = storage.url(saved_name)
            
            # Add to images list
            if not isinstance(self.images, list):
                self.images = []
            
            self.images.append(image_url)
            self.save()
            
            return image_url
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to add image to listing {self.id}: {str(e)}")
            raise
    
    def remove_image(self, image_url):
        """Remove an image from the listing and delete from blob storage"""
        if not isinstance(self.images, list):
            return False
        
        if image_url in self.images:
            try:
                # Remove from blob storage
                from blob_storage import get_food_listing_storage
                storage = get_food_listing_storage()
                
                # Extract blob name from URL
                blob_name = image_url.split('/')[-1]
                storage.delete(blob_name)
                
                # Remove from images list
                self.images.remove(image_url)
                self.save()
                
                return True
                
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to remove image from listing {self.id}: {str(e)}")
                return False
        
        return False
    
    def get_primary_image(self):
        """Get the primary (first) image URL"""
        if isinstance(self.images, list) and len(self.images) > 0:
            return self.images[0]
        return None
    
    def get_image_count(self):
        """Get the number of images"""
        if isinstance(self.images, list):
            return len(self.images)
        return 0