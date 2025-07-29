# authentication/models.py - Complete with all profile models

from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

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
    phone_number = models.CharField(max_length=20, null=True, blank=True)  # Existing field
    profile_picture = models.CharField(max_length=100, null=True, blank=True)  # Existing field  
    admin_rights = models.BooleanField(default=False)  # Existing field
    user_type = models.CharField(max_length=20)  # Match database varchar(20)
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
        
        # Check if account is active
        if not self.is_active:
            return False, "Account is deactivated"
        
        # Check if account is temporarily locked
        if self.account_locked_until and self.account_locked_until > timezone.now():
            return False, "Account is temporarily locked"
        
        # Check if password must be changed
        if self.password_must_change:
            return True, "Password must be changed"  # Allow login but force change
        
        return True, "OK"
    
    def increment_failed_login(self):
        """Increment failed login attempts and lock if needed"""
        from django.utils import timezone
        self.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts for 30 minutes
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
    profile_image = models.ImageField(upload_to='customer_profiles/', null=True, blank=True)
    
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

    npo_document = models.FileField(upload_to='ngo_documents/')
    organisation_logo = models.ImageField(upload_to='ngo_logos/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_verification')

    class Meta:
        db_table = 'authentication_ngoprofile'

    def __str__(self):
        return f"NGO: {self.organisation_name}"

# authentication/models.py - Add these fields to your existing FoodProviderProfile

class FoodProviderProfile(models.Model):
    STATUS_CHOICES = [
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    # Your existing fields (keep these unchanged)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile', db_column='user_id', to_field='UserID')
    business_name = models.CharField(max_length=255)
    business_address = models.TextField()
    business_contact = models.CharField(max_length=20)
    business_email = models.EmailField()
    cipc_document = models.FileField(upload_to='provider_documents/')
    logo = models.ImageField(upload_to='provider_logos/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_verification')
    
    # ADD THESE NEW FIELDS FOR MAPS
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    geocoded_at = models.DateTimeField(null=True, blank=True)
    geocoding_failed = models.BooleanField(default=False)
    geocoding_error = models.TextField(blank=True)
    
    # Optional business info for better maps
    business_hours = models.CharField(max_length=255, blank=True, help_text="e.g., 'Mon-Fri: 9AM-6PM'")
    phone_number = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    class Meta:
        db_table = 'authentication_foodproviderprofile'
    
    def __str__(self):
        return f"Provider: {self.business_name}"
    
    def save(self, *args, **kwargs):
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