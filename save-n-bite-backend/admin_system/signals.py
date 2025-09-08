from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SystemLogEntry
from .services import SystemLogService
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=SystemLogEntry)
def system_log_created(sender, instance, created, **kwargs):
    """Send email notification when critical system logs are created"""
    if created and instance.severity in ['critical', 'error', 'warning']:
        try:
            # Send email notification to admins
            SystemLogService._send_critical_log_email_notification(instance)
            logger.info(f"System log email notification triggered for {instance.severity} log: {instance.title}")
        except Exception as e:
            logger.error(f"Failed to send system log email notification: {str(e)}")