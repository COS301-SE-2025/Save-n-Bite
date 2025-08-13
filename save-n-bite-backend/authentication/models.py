# authentication/models.py - Updated with Azure Blob Storage

from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from blob_storage import (
    get_customer_profile_storage, get_ngo_document_storage, get_ngo_logo_storage,
    get_provider_document_storage, get_provider_logo_storage, get_provider_banner_storage,
    customer_profile_image_path, ngo_document_path, ngo_logo_path,
    provider_cipc_path, provider_logo_path, provider_banner_path
)

class User(AbstractUser):
    USER_TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('provider', 'Food Provider'),
        ('ngo', 'NGO'),
    ]
    
    ROLE_CHOICES = [
        ('normal', 'Normal User'),
        ('admin', 'Administrator'),
    ]
    
    # Use the original database column name and include all existing fields
    UserID = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='UserID')
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    profile_picture = models.CharField(max_length=100, null=True, blank=True)
    admin_rights = models.BooleanField(default=False)
    user_type = models.CharField(max_length=20)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='normal')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Password reset functionality
    has_temporary_password = models.BooleanField(default=False)
    password_must_change = models.BooleanField(default=False)
    temp_password_created_at = models.DateTimeField(null=True, blank=True)
    
    # Account status tracking
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    
    # Admin-specific fields
    admin_notes = models.TextField(blank=True, help_text="Admin notes about this user")
    deactivation_reason = models.CharField(max_length=255, blank=True)
    deactivated_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='deactivated_users'
    )
    deactivated_at = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'authentication_user'
    
    def __str__(self):
        return self.email

    @property
    def id(self):
        """Alias for UserID to maintain compatibility"""
        return self.UserID
    
    def get_full_name(self):
        """Get user's full name based on user type"""
        if self.user_type == 'customer' and hasattr(self, 'customer_profile'):
            return self.customer_profile.full_name
        elif self.user_type == 'ngo' and hasattr(self, 'ngo_profile'):
            return self.ngo_profile.representative_name
        elif self.user_type == 'provider' and hasattr(self, 'provider_profile'):
            return self.provider_profile.business_name
        return self.username
    
    def can_login(self):
        """Check if user can login (not locked, active, etc.)"""
        from django.utils import timezone
        
        if not self.is_active:
            return False, "Account is deactivated"
        
        if self.account_locked_until and self.account_locked_until > timezone.now():
            return False, "Account is temporarily locked"
        
        if self.password_must_change:
            return True, "Password must be changed"
        
        return True, "OK"
    
    def increment_failed_login(self):
        """Increment failed login attempts and lock if needed"""
        from django.utils import timezone
        self.failed_login_attempts += 1
        
        if self.failed_login_attempts >= 5:
            self.account_locked_until = timezone.now() + timezone.timedelta(minutes=30)
        
        self.save()
    
    def reset_failed_login_attempts(self):
        """Reset failed login attempts after successful login"""
        self.failed_login_attempts = 0
        self.account_locked_until = None
        self.save()
    
    def set_temporary_password(self, temp_password):
        """Set a temporary password that must be changed"""
        from django.utils import timezone
        self.set_password(temp_password)
        self.has_temporary_password = True
        self.password_must_change = True
        self.temp_password_created_at = timezone.now()
        self.save()
    
    def complete_password_change(self):
        """Mark temporary password as changed"""
        self.has_temporary_password = False
        self.password_must_change = False
        self.temp_password_created_at = None
        self.save()
    
    def deactivate_account(self, admin_user, reason=""):
        """Deactivate account with admin tracking"""
        from django.utils import timezone
        self.is_active = False
        self.deactivation_reason = reason
        self.deactivated_by = admin_user
        self.deactivated_at = timezone.now()
        self.save()
    
    def reactivate_account(self):
        """Reactivate account"""
        self.is_active = True
        self.deactivation_reason = ""
        self.deactivated_by = None
        self.deactivated_at = None
        self.save()


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile', db_column='user_id', to_field='UserID')
    full_name = models.CharField(max_length=255)
    
    # UPDATED: Use Azure Blob Storage for profile images
    profile_image = models.ImageField(
        upload_to=customer_profile_image_path,
        storage=get_customer_profile_storage,
        null=True, 
        blank=True,
        help_text="Profile image (max 5MB)"
    )
    
    class Meta:
        db_table = 'authentication_customerprofile'
    
    def __str__(self):
        return f"Customer: {self.full_name}"


class NGOProfile(models.Model):
    STATUS_CHOICES = [
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ngo_profile', db_column='user_id', to_field='UserID')
    organisation_name = models.CharField(max_length=255)
    organisation_contact = models.CharField(max_length=20)
    organisation_email = models.EmailField()
    representative_name = models.CharField(max_length=255)
    representative_email = models.EmailField()

    # Split address fields
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    province_or_state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)

    # UPDATED: Use Azure Blob Storage for documents and logos
    npo_document = models.FileField(
        upload_to=ngo_document_path,
        storage=get_ngo_document_storage,
        help_text="NPO registration document (PDF, max 10MB)"
    )
    
    organisation_logo = models.ImageField(
        upload_to=ngo_logo_path,
        storage=get_ngo_logo_storage,
        null=True, 
        blank=True,
        help_text="Organisation logo (max 5MB)"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_verification')

    class Meta:
        db_table = 'authentication_ngoprofile'

    def __str__(self):
        return f"NGO: {self.organisation_name}"


class FoodProviderProfile(models.Model):
    STATUS_CHOICES = [
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    # Existing fields (keep these unchanged)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile', db_column='user_id', to_field='UserID')
    business_name = models.CharField(max_length=255)
    business_address = models.TextField()
    business_contact = models.CharField(max_length=20)
    business_email = models.EmailField()
    
    # UPDATED: Use Azure Blob Storage for documents and images
    cipc_document = models.FileField(
        upload_to=provider_cipc_path,
        storage=get_provider_document_storage,
        help_text="CIPC registration document (PDF, max 10MB)"
    )
    
    logo = models.ImageField(
        upload_to=provider_logo_path,
        storage=get_provider_logo_storage,
        null=True, 
        blank=True,
        help_text="Business logo (max 5MB)"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_verification')
    
    # Existing location fields
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    geocoded_at = models.DateTimeField(null=True, blank=True)
    geocoding_failed = models.BooleanField(default=False)
    geocoding_error = models.TextField(blank=True)
    
    # Existing optional business info
    business_hours = models.CharField(max_length=255, blank=True, help_text="e.g., 'Mon-Fri: 9AM-6PM'")
    phone_number = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # UPDATED: Use Azure Blob Storage for banner
    banner = models.ImageField(
        upload_to=provider_banner_path,
        storage=get_provider_banner_storage,
        null=True, 
        blank=True,
        help_text="Banner image for business profile page (recommended size: 1200x400px, max 5MB)"
    )
    
    business_description = models.TextField(
        max_length=1000,
        blank=True,
        help_text="Tell customers about your business, cuisine, values, or specialties"
    )
    
    business_tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Custom tags to describe your business (e.g., ['Bakery', 'Vegan Options', 'Organic'])"
    )
    
    # Additional tracking fields for the new features
    banner_updated_at = models.DateTimeField(null=True, blank=True)
    description_updated_at = models.DateTimeField(null=True, blank=True)
    tags_updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'authentication_foodproviderprofile'
    
    def __str__(self):
        return f"Provider: {self.business_name}"
    
    def save(self, *args, **kwargs):
        from django.utils import timezone
        
        # Track when new features are updated
        if self.pk:  # Only for existing instances
            try:
                old_instance = FoodProviderProfile.objects.get(pk=self.pk)
                
                # Check if banner was updated
                if old_instance.banner != self.banner:
                    self.banner_updated_at = timezone.now()
                
                # Check if description was updated
                if old_instance.business_description != self.business_description:
                    self.description_updated_at = timezone.now()
                
                # Check if tags were updated
                if old_instance.business_tags != self.business_tags:
                    self.tags_updated_at = timezone.now()
                    
            except FoodProviderProfile.DoesNotExist:
                pass
        
        # Auto-geocode address when saving if coordinates are missing
        if self.business_address and (not self.latitude or not self.longitude):
            self.geocode_address()
        
        super().save(*args, **kwargs)
    
    def geocode_address(self):
        """
        Free geocoding using Nominatim (OpenStreetMap's service)
        NO API KEY REQUIRED!
        """
        from django.utils import timezone
        import requests
        import logging
        import time
        
        logger = logging.getLogger(__name__)
        
        try:
            # Use Nominatim - completely free geocoding service
            base_url = 'https://nominatim.openstreetmap.org/search'
            params = {
                'q': self.business_address,
                'format': 'json',
                'countrycodes': 'za',  # Restrict to South Africa
                'limit': 1,
                'addressdetails': 1
            }
            
            # Required User-Agent header for Nominatim
            headers = {
                'User-Agent': 'SaveNBite/1.0 (savenbite@gmail.com)'
            }
            
            response = requests.get(base_url, params=params, headers=headers, timeout=10)
            data = response.json()
            
            if data and len(data) > 0:
                result = data[0]
                self.latitude = float(result['lat'])
                self.longitude = float(result['lon'])
                self.geocoded_at = timezone.now()
                self.geocoding_failed = False
                self.geocoding_error = ''
                
                logger.info(f"Successfully geocoded {self.business_name}: {self.latitude}, {self.longitude}")
                
                # Respect Nominatim rate limit (1 request per second)
                time.sleep(1)
                
            else:
                self.geocoding_failed = True
                self.geocoding_error = "No results found for address"
                logger.warning(f"No geocoding results for {self.business_name}")
                
        except Exception as e:
            self.geocoding_failed = True
            self.geocoding_error = f"Geocoding error: {str(e)}"
            logger.error(f"Geocoding exception for {self.business_name}: {str(e)}")
    
    @property
    def coordinates(self):
        """Return coordinates for Leaflet maps"""
        if self.latitude and self.longitude:
            return {
                'lat': float(self.latitude),
                'lng': float(self.longitude)
            }
        return None
    
    @property
    def openstreetmap_url(self):
        """Generate OpenStreetMap URL for directions"""
        if self.coordinates:
            return f"https://www.openstreetmap.org/directions?from=&to={self.latitude},{self.longitude}"
        elif self.business_address:
            from urllib.parse import quote
            return f"https://www.openstreetmap.org/search?query={quote(self.business_address)}"
        return None
    
    # NEW METHODS for business tags functionality
    def add_tag(self, tag):
        """Add a business tag if it doesn't already exist"""
        if not isinstance(self.business_tags, list):
            self.business_tags = []
        
        tag = tag.strip().title()  # Standardize formatting
        if tag and tag not in self.business_tags:
            self.business_tags.append(tag)
            self.save()
            return True
        return False
    
    def remove_tag(self, tag):
        """Remove a business tag"""
        if not isinstance(self.business_tags, list):
            return False
        
        tag = tag.strip().title()
        if tag in self.business_tags:
            self.business_tags.remove(tag)
            self.save()
            return True
        return False
    
    def get_tag_display(self):
        """Get formatted tags for display"""
        if not isinstance(self.business_tags, list):
            return []
        return [tag.strip().title() for tag in self.business_tags if tag.strip()]
    
    @classmethod
    def get_popular_tags(cls, limit=20):
        """Get most popular business tags across all providers"""
        from django.db.models import Q
        from collections import Counter
        
        # Get all tags from verified providers
        providers = cls.objects.filter(status='verified').exclude(business_tags__isnull=True)
        
        all_tags = []
        for provider in providers:
            if isinstance(provider.business_tags, list):
                all_tags.extend([tag.strip().title() for tag in provider.business_tags if tag.strip()])
        
        # Count and return most popular
        tag_counts = Counter(all_tags)
        return [{'tag': tag, 'count': count} for tag, count in tag_counts.most_common(limit)]
    
    def has_complete_profile(self):
        """Check if business profile is complete with new fields"""
        required_fields = [
            self.business_name,
            self.business_email,
            self.business_address,
            self.business_contact
        ]
        
        # Check if core fields are filled
        if not all(required_fields):
            return False
        
        # Consider profile more complete if they have description and tags
        has_description = bool(self.business_description and self.business_description.strip())
        has_tags = bool(self.business_tags and len(self.business_tags) > 0)
        
        return has_description or has_tags  # At least one should be filled for a "complete" profile