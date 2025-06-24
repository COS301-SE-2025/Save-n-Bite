from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Interaction
from analytics.models import TransactionAnalytics, MonthlyAnalytics, UserAnalytics
from django.utils import timezone
from decimal import Decimal

@receiver(post_save, sender=Interaction)
def create_transaction_analytics(sender, instance, created, **kwargs):
    if instance.interaction_type == Interaction.InteractionType.PURCHASE:
        # Create TransactionAnalytics record
        TransactionAnalytics.objects.update_or_create(
            interaction=instance,
            defaults={
                'user': instance.user,
                'transaction_type': 'purchase',
                'amount': instance.total_amount,
                'quantity': instance.quantity,
                'meals_saved': sum(item.quantity for item in instance.items.all()),
                'food_listing': instance.items.first().food_listing if instance.items.exists() else None,
                'original_price': instance.items.first().food_listing.original_price if instance.items.exists() else 0,
                'discounted_price': instance.items.first().food_listing.discounted_price if instance.items.exists() else 0,
                'savings': instance.items.first().food_listing.original_price - instance.items.first().food_listing.discounted_price if instance.items.exists() else 0
            }
        )
        
        # Update MonthlyAnalytics
        month = instance.created_at.month
        year = instance.created_at.year
        MonthlyAnalytics.objects.update_or_create(
            user=instance.user,
            year=year,
            month=month,
            defaults={
                'orders_count': F('orders_count') + 1,
                'total_sales': F('total_sales') + instance.total_amount,
                'meals_saved': F('meals_saved') + sum(item.quantity for item in instance.items.all()),
                'listings_sold': F('listings_sold') + instance.items.count()
            }
        )
        
        # Update UserAnalytics
        UserAnalytics.objects.update_or_create(
            user=instance.user,
            defaults={
                'total_orders': F('total_orders') + 1,
                'total_spent': F('total_spent') + instance.total_amount,
                'meals_saved': F('meals_saved') + sum(item.quantity for item in instance.items.all()),
                'listings_sold': F('listings_sold') + instance.items.count()
            }
        )