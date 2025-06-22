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

class FoodProviderProfile(models.Model):
    STATUS_CHOICES = [
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile', db_column='user_id', to_field='UserID')
    business_name = models.CharField(max_length=255)
    business_address = models.TextField()
    business_contact = models.CharField(max_length=20)
    business_email = models.EmailField()
    cipc_document = models.FileField(upload_to='provider_documents/')
    logo = models.ImageField(upload_to='provider_logos/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_verification')
    
    class Meta:
        db_table = 'authentication_foodproviderprofile'
    
    def __str__(self):
        return f"Provider: {self.business_name}"