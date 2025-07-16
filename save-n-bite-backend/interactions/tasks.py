# tasks.py
from celery import shared_task
from django.utils import timezone
from .models import CheckoutSession

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