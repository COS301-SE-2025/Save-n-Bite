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
        CONFIRMED = 'confirmed', 'Confirmed'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        FAILED = 'failed', 'Failed'

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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interactions')
    business = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE, related_name='interactions')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.interaction_type} - {self.status} - {self.total_amount}"
    
    def clean(self):
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

class PickupDetails(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='pickup_details')
    scheduled_time = models.DateTimeField()
    actual_time = models.DateTimeField(null=True, blank=True)
    location = models.TextField()
    contact_person = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=20)
    is_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Pickup for {self.order} at {self.scheduled_time}"

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