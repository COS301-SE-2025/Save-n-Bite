from celery import shared_task
from django.utils import timezone
from .models import CheckoutSession, Cart, FoodListing
from django.db import transaction as db_transaction

@shared_task
def expire_checkout_sessions():
    """Expire checkout sessions and release reserved quantities"""
    expired_sessions = CheckoutSession.objects.filter(
        is_active=True,
        expires_at__lte=timezone.now()
    ).select_related('cart').prefetch_related('cart__items__food_listing')
    
    for session in expired_sessions:
        with db_transaction.atomic():
            # Release reserved quantities
            for item in session.cart.items.all():
                food_listing = item.food_listing
                food_listing.quantity_available += item.quantity
                food_listing.save(update_fields=['quantity_available'])
            
            # Deactivate session
            session.is_active = False
            session.save(update_fields=['is_active'])

@shared_task
def cleanup_expired_carts():
    """Clean up expired carts and release reserved quantities"""
    expired_carts = Cart.objects.filter(
        expires_at__lte=timezone.now()
    ).prefetch_related('items__food_listing')
    
    for cart in expired_carts:
        with db_transaction.atomic():
            # Release reserved quantities
            for item in cart.items.all():
                food_listing = item.food_listing
                food_listing.quantity_available += item.quantity
                food_listing.save(update_fields=['quantity_available'])
            
            # Clear the expired cart
            cart.items.all().delete()