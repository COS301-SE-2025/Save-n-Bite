# reviews/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Review, BusinessReviewStats
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Review)
def update_business_stats_on_review_save(sender, instance, created, **kwargs):
    """Update business review statistics when a review is created or updated"""
    try:
        # Get or create business stats
        stats, stats_created = BusinessReviewStats.objects.get_or_create(
            business=instance.business
        )
        
        # Recalculate stats
        stats.recalculate_stats()
        
        if created:
            logger.info(f"New review created for {instance.business.business_name}, stats updated")
        else:
            logger.info(f"Review updated for {instance.business.business_name}, stats recalculated")
            
    except Exception as e:
        logger.error(f"Error updating business stats after review save: {str(e)}")


@receiver(post_delete, sender=Review)
def update_business_stats_on_review_delete(sender, instance, **kwargs):
    """Update business review statistics when a review is deleted"""
    try:
        # Get business stats if it exists
        try:
            stats = BusinessReviewStats.objects.get(business=instance.business)
            stats.recalculate_stats()
            logger.info(f"Review deleted for {instance.business.business_name}, stats updated")
        except BusinessReviewStats.DoesNotExist:
            logger.warning(f"Business stats not found for {instance.business.business_name}")
            
    except Exception as e:
        logger.error(f"Error updating business stats after review deletion: {str(e)}")


# Optional: Signal to create notification when a review is left
@receiver(post_save, sender=Review)
def notify_business_of_new_review(sender, instance, created, **kwargs):
    """Notify business when a new review is created"""
    if created and instance.status == 'active':
        try:
            # Import here to avoid circular imports
            from notifications.services import NotificationService
            
            # Create notification for the business owner
            business_user = instance.business.user
            reviewer_name = instance.reviewer.email
            
            # Get reviewer display name
            if instance.reviewer.user_type == 'customer' and hasattr(instance.reviewer, 'customer_profile'):
                reviewer_name = instance.reviewer.customer_profile.full_name
            elif instance.reviewer.user_type == 'ngo' and hasattr(instance.reviewer, 'ngo_profile'):
                reviewer_name = instance.reviewer.ngo_profile.organisation_name
            
            rating_text = f" ({instance.general_rating} stars)" if instance.general_rating else ""
            title = f"New review from {reviewer_name}"
            message = f"{reviewer_name} left a review for your business{rating_text}"
            
            NotificationService.create_notification(
                recipient=business_user,
                notification_type='business_update',
                title=title,
                message=message,
                sender=instance.reviewer,
                business=instance.business,
                data={
                    'review_id': str(instance.id),
                    'rating': instance.general_rating,
                    'interaction_id': str(instance.interaction.id),
                    'interaction_type': instance.interaction_type
                }
            )
            
            logger.info(f"Notification sent to {business_user.email} about new review")
            
        except Exception as e:
            logger.error(f"Failed to send review notification: {str(e)}")
            # Don't raise the exception to avoid breaking the review creation


# Signal to handle status changes for moderation
@receiver(post_save, sender=Review)
def handle_review_moderation_status_change(sender, instance, **kwargs):
    """Handle actions when review status changes due to moderation"""
    if hasattr(instance, '_state') and instance._state.adding:
        # This is a new review, skip
        return
    
    try:
        # Get the previous instance from database to compare status
        if instance.pk:
            try:
                old_instance = Review.objects.get(pk=instance.pk)
                
                # Check if status changed to censored or deleted
                if (old_instance.status != instance.status and 
                    instance.status in ['censored', 'deleted'] and
                    instance.moderated_by):
                    
                    # Import here to avoid circular imports
                    from notifications.services import NotificationService
                    
                    # Notify the reviewer about moderation action
                    action_text = "censored" if instance.status == 'censored' else "removed"
                    title = f"Your review has been {action_text}"
                    message = f"Your review for {instance.business.business_name} has been {action_text} by our moderation team."
                    
                    if instance.moderation_notes:
                        message += f" Reason: {instance.moderation_notes}"
                    
                    NotificationService.create_notification(
                        recipient=instance.reviewer,
                        notification_type='system_announcement',
                        title=title,
                        message=message,
                        data={
                            'review_id': str(instance.id),
                            'moderation_action': instance.status,
                            'business_name': instance.business.business_name
                        }
                    )
                    
                    logger.info(f"Moderation notification sent to {instance.reviewer.email}")
                    
            except Review.DoesNotExist:
                # Review doesn't exist in database yet, this is a new creation
                pass
                
    except Exception as e:
        logger.error(f"Error handling review moderation status change: {str(e)}")