from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from decimal import Decimal

from interactions.models import Interaction  
# from reviews.models import Review  
from notifications.models import BusinessFollower 
from analytics.models import UserAnalytics
from analytics.services import AnalyticsService

User = get_user_model()

# 1. Update analytics on transaction (purchase or donation)
@receiver(post_save, sender=Interaction)
def update_analytics_on_transaction(sender, instance, created, **kwargs):
    if created and instance.status == 'completed':
        transaction_data = {
            'type': instance.interaction_type,  # 'purchase' or 'donation'
            'amount': float(instance.amount or 0),
            'meals_saved': getattr(instance, 'meals_saved', 1),  # Fallback if not defined
            'co2_reduction': getattr(instance, 'co2_reduction', 0.5),
            'user_type': getattr(instance.user.profile, 'type', 'individual')  # Adjust if needed
        }
        AnalyticsService.update_user_analytics(instance.user, transaction_data)

# 2. Update rating analytics on review
# @receiver(post_save, sender=Review)
# def update_rating_on_review(sender, instance, created, **kwargs):
#     provider = instance.food.provider  # Adjust if the relation is different
#     reviews = Review.objects.filter(food__provider=provider)
    
#     avg_rating = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
#     total_reviews = reviews.count()

#     analytics, _ = UserAnalytics.objects.get_or_create(user=provider)
#     analytics.average_rating = avg_rating
#     analytics.total_reviews = total_reviews
#     analytics.save()

# 3. Update follower count on follow/unfollow
@receiver(m2m_changed, sender=BusinessFollower.followers.through)
def update_follower_count(sender, instance, action, **kwargs):
    if action in ['post_add', 'post_remove']:
        analytics, _ = UserAnalytics.objects.get_or_create(user=instance.user)
        analytics.total_followers = instance.followers.count()
        analytics.save()

# 4. Create UserAnalytics record on user creation
@receiver(post_save, sender=User)
def create_user_analytics(sender, instance, created, **kwargs):
    if created:
        UserAnalytics.objects.get_or_create(user=instance, defaults={'user_type': 'individual'})
