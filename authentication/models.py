# authentication/models.py - Complete Schema Implementation

from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    USER_TYPE_CHOICES = [
        ('Individual', 'Individual'),
        ('Business', 'Business'),
        ('Organisation', 'Organisation'),
        ('Admin', 'Admin'),
    ]
    
    ROLE_CHOICES = [
        ('normal', 'Normal User'),
        ('admin', 'Administrator')
    ]
    
    # Primary key from schema
    UserID = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # All fields from User table in schema
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # Django handles this automatically but it's explicit
    admin_rights = models.BooleanField(default=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    
    # Additional fields for functionality
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='normal')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email


class PaymentMethod(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CreditCard', 'Credit Card'),
        ('DebitCard', 'Debit Card'),
        ('EFT', 'Electronic Fund Transfer'),
        ('Cash', 'Cash'),
        ('Cryptocurrency', 'Cryptocurrency'),
    ]
    
    # Foreign key to User
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    billing_address = models.TextField()
    
    def __str__(self):
        return f"{self.user.username} - {self.payment_method}"


class Individual(models.Model):
    IndividualID = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='individual_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"Individual: {self.user.username}"


class Business(models.Model):
    BUSINESS_TYPE_CHOICES = [
        ('GroceryStore', 'Grocery Store'),
        ('Restaurant', 'Restaurant'),
        ('Other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    BusinessID = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='business_profile')
    business_type = models.CharField(max_length=20, choices=BUSINESS_TYPE_CHOICES, default='Restaurant')
    business_licence = models.FileField(upload_to='business_documents/')

    verified = models.BooleanField(default=False)  # ← ADD THIS LINE

    
    # Address fields from schema
    street_number = models.CharField(max_length=10)
    street = models.CharField(max_length=255)
    suburb = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    
    # Additional fields for API compatibility (from your current implementation)
    business_name = models.CharField(max_length=255)
    business_contact = models.CharField(max_length=20)
    business_email = models.EmailField()
    logo = models.ImageField(upload_to='provider_logos/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_verification')

    def save(self, *args, **kwargs):
        # Automatically set verified=True when status='verified'
        if self.status == 'verified':
            self.verified = True
        else:
            self.verified = False
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Business: {self.business_name}"
    
    def __str__(self):
        return f"Business: {self.business_name}"


class AvailableHours(models.Model):
    """Single table for business hours - stores as time range string"""
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='available_hours')
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    hours = models.CharField(max_length=20, help_text="Format: '08:00 - 16:00'")
    
    class Meta:
        unique_together = ['business', 'day_of_week']
    
    def __str__(self):
        return f"{self.business.business_name} - {self.day_of_week}: {self.hours}"


# Alternative: Separate Opening/Closing Hours (if you prefer separate fields)
class OpeningHours(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='opening_hours')
    hours = models.TimeField()
    
    def __str__(self):
        return f"{self.business.business_name} - Opens: {self.hours}"


class ClosingHours(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='closing_hours')
    hours = models.TimeField()
    
    def __str__(self):
        return f"{self.user.username} - Closes: {self.hours}"


class Organisation(models.Model):
    ORGANISATION_TYPE_CHOICES = [
        ('Charity', 'Charity'),
        ('ReligiousOrg', 'Religious Organization'),
        ('NonProfit', 'Non-Profit'),
    ]
    
    STATUS_CHOICES = [
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    OrganisationID = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='organisation_profile')
    organisation_type = models.CharField(max_length=20, choices=ORGANISATION_TYPE_CHOICES, default='NonProfit')
    verified_org = models.BooleanField(default=False)
    ngo_registration = models.FileField(upload_to='ngo_documents/')
    representative_name = models.CharField(max_length=255)
    
    # Address fields from schema
    street_number = models.CharField(max_length=10)
    street = models.CharField(max_length=255)
    suburb = models.CharField(max_length=100)
    city = models.CharField(max_length=100)

    verified_org = models.BooleanField(default=False)  # ← ADD THIS LINE

    
    # Additional fields for API compatibility
    organisation_name = models.CharField(max_length=255)
    organisation_contact = models.CharField(max_length=20)
    representative_email = models.EmailField()
    province_or_state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='South Africa')
    organisation_logo = models.ImageField(upload_to='ngo_logos/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_verification')

    def save(self, *args, **kwargs):
        if self.status == 'verified':
            self.verified_org = True
        else:
            self.verified_org = False
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Organisation: {self.organisation_name}"


class Admin(models.Model):
    AdminID = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    
    def __str__(self):
        return f"Admin: {self.user.username}"