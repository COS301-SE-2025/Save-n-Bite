# tasks.py
from celery import shared_task
from django.utils import timezone
from .models import CheckoutSession
from .models import Cart
from django.db import transaction as db_transaction

@shared_task
def expire_checkout_sessions():
    expired_sessions = CheckoutSession.objects.filter(
        is_active=True,
        expires_at__lte=timezone.now()
    )
    
    for session in expired_sessions:
        # Release reserved items
        for item in session.cart.items.all():
            item.food_listing.quantity += item.quantity
            item.food_listing.save()
        
        session.is_active = False
        session.save()

@shared_task
def cleanup_expired_carts():
    expired_carts = Cart.objects.filter(
        expires_at__lte=timezone.now()
    ).prefetch_related('items')
    
    for cart in expired_carts:
        with db_transaction.atomic():
            # Release reserved quantities
            for item in cart.items.all():
                item.food_listing.quantity_available += item.quantity
                item.food_listing.save()
            
            # Clear the expired cart
            cart.items.all().delete()