from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from authentication.models import FoodProviderProfile
from food_listings.models import FoodListing
from django.contrib.postgres.fields import ArrayField
import uuid
from django.contrib.auth import get_user_model
from .utils import StatusTransition

User = get_user_model()  # Gets the active user model

class Interaction(models.Model):
    class InteractionType(models.TextChoices):
        PURCHASE = "Purchase", "Purchase"
        DONATION = "Donation", "Donation"

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        READY_FOR_PICKUP = 'ready', 'Ready for Pickup'
        CONFIRMED = 'confirmed', 'Confirmed'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        FAILED = 'failed', 'Failed'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interaction_type = models.CharField(max_length=10, choices=InteractionType.choices)
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    verification_code = models.CharField(max_length=20, blank=True)
    special_instructions = models.TextField(blank=True)
    motivation_message = models.TextField(blank=True)  # For NGO requests
    verification_documents = ArrayField(models.URLField(), blank=True, default=list)  # Can be link(s) to documents
    rejection_reason = models.TextField(blank=True)  # Set by food provider if rejected
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interactions')
    business = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE, related_name='interactions')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.interaction_type} - {self.status} - {self.total_amount}"
    
    def clean(self):
        if self.interaction_type == self.InteractionType.DONATION:
            if self.status == self.Status.REJECTED and not self.rejection_reason:
                raise ValidationError("Rejection reason required when status is rejected.")
            
        if self.pk and Interaction.objects.filter(pk=self.pk).exists():
            original = Interaction.objects.get(pk=self.pk)
            if original.status != self.status:
                try:
                    StatusTransition.validate_transition('Interaction', original.status, self.status)
                except ValidationError as e:
                    raise ValidationError({'status': str(e)})
    
    def update_status(self, new_status, commit=True):
        """Helper method to safely update status"""
        self.status = new_status
        if commit:
            self.save()
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Create status history
        if self.pk:
            original = Interaction.objects.get(pk=self.pk)
            if original.status != self.status:
                InteractionStatusHistory.objects.create(
                    interaction=self,
                    old_status=original.status,
                    new_status=self.status,
                    changed_by=getattr(self, 'changed_by', None)
                )

    @classmethod
    def get_business_history(cls, business_profile):
        """
        Returns all interactions for a business with related items and status history
        """
        return cls.objects.filter(business=business_profile).prefetch_related(
            'items',
            'status_history'
        ).order_by('-created_at')

    def get_interaction_details(self):
        """
        Returns detailed information about a specific interaction
        """
        return {
            'id': str(self.id),
            'type': self.interaction_type,
            'status': self.status,
            'total_amount': float(self.total_amount),
            'created_at': self.created_at,
            'completed_at': self.completed_at,
            'user': {
                'id': str(self.user.id),
                'email': self.user.email,
                'name': self.user.get_full_name()
            },
            'items': [{
                'name': item.name,
                'quantity': item.quantity,
                'price_per_item': float(item.price_per_item),
                'total_price': float(item.total_price),
                'expiry_date': item.expiry_date
            } for item in self.items.all()],
            'status_history': [{
                'old_status': history.old_status,
                'new_status': history.new_status,
                'changed_at': history.changed_at,
                'changed_by': history.changed_by.email if history.changed_by else None
            } for history in self.status_history.all()]
        }

class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_items(self):
        return self.items.aggregate(total=models.Sum('quantity'))['total'] or 0
    
    @property
    def subtotal(self):
        return self.items.aggregate(
            total=models.Sum(models.F('quantity') * models.F('food_listing__discounted_price'))
        )['total'] or 0
    
    def __str__(self):
        return f"Cart for {self.user.email}"
    
class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    food_listing = models.ForeignKey('food_listings.FoodListing', on_delete=models.CASCADE)  
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_price(self):
        return self.quantity * self.food_listing.discounted_price
    
    class Meta:
        unique_together = ('cart', 'food_listing')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.quantity} x {self.food_listing.name} in cart"
    
class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        READY_FOR_PICKUP = 'ready', 'Ready for Pickup'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interaction = models.OneToOneField(Interaction, on_delete=models.CASCADE, related_name='order',default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    pickup_window = models.CharField(max_length=50)
    pickup_code = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def items(self):
        return self.interaction.items.all()

    def __str__(self):
        return f"Order {self.id} - {self.status}"

    def clean(self):
        if self.pk and Order.objects.filter(pk=self.pk).exists():
            original = Order.objects.get(pk=self.pk)
            if original.status != self.status:
                try:
                    StatusTransition.validate_transition('Order', original.status, self.status)
                except ValidationError as e:
                    raise ValidationError({'status': str(e)})
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Update interaction status based on order status
        if self.status == self.Status.COMPLETED:
            self.interaction.update_status(Interaction.Status.COMPLETED)
            self.interaction.completed_at = self.updated_at
            self.interaction.save()
        elif self.status == self.Status.CANCELLED:
            self.interaction.update_status(Interaction.Status.CANCELLED)
        elif self.status == self.Status.CONFIRMED and self.interaction.status == Interaction.Status.PENDING:
            self.interaction.update_status(Interaction.Status.CONFIRMED)


class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        CARD = 'card', 'Credit/Debit Card'
        CASH = 'cash', 'Cash'
        DIGITAL_WALLET = 'digital_wallet', 'Digital Wallet'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interaction = models.OneToOneField(Interaction, on_delete=models.CASCADE, related_name='payment',default=1)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    details = models.JSONField(default=dict, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.id} - {self.method} - {self.status}"
    
    def clean(self):
        if self.pk and Payment.objects.filter(pk=self.pk).exists():
            original = Payment.objects.get(pk=self.pk)
            if original.status != self.status:
                try:
                    StatusTransition.validate_transition('Payment', original.status, self.status)
                except ValidationError as e:
                    raise ValidationError({'status': str(e)})
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Update interaction status based on payment status
        if self.status == self.Status.COMPLETED and self.interaction.status == Interaction.Status.PENDING:
            self.interaction.update_status(Interaction.Status.CONFIRMED)
        elif self.status == self.Status.FAILED:
            self.interaction.update_status(Interaction.Status.FAILED)
        elif self.status == self.Status.REFUNDED:
            self.interaction.update_status(Interaction.Status.CANCELLED)

class InteractionItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interaction = models.ForeignKey(Interaction, on_delete=models.CASCADE, related_name='items', default=1)
    food_listing = models.ForeignKey('food_listings.FoodListing', on_delete=models.PROTECT)  
    name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    price_per_item = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField()
    image_url = models.URLField(blank=True)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.price_per_item
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity} x {self.name} ({self.total_price})"
    
    def get_item_details(self):
        """
        Returns detailed information about an interaction item
        """
        return {
            'id': str(self.id),
            'name': self.name,
            'quantity': self.quantity,
            'price_per_item': float(self.price_per_item),
            'total_price': float(self.total_price),
            'expiry_date': self.expiry_date,
            'food_listing_id': str(self.food_listing.id) if self.food_listing else None,
            'image_url': self.image_url
        }

class InteractionStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    Interaction = models.ForeignKey(Interaction, on_delete=models.CASCADE, related_name='status_history', default=1)
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)  # Fixed
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = 'Interaction Status Histories'

    def __str__(self):
        return f"Status change from {self.old_status} to {self.new_status}"
    
    def get_history_details(self):
        """
        Returns formatted status history details
        """
        return {
            'id': str(self.id),
            'interaction_id': str(self.interaction.id),
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_at': self.changed_at,
            'changed_by': self.changed_by.email if self.changed_by else None,
            'notes': self.notes
        }