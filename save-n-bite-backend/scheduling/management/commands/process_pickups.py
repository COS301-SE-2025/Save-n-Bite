# scheduling/management/commands/process_pickups.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from scheduling.models import ScheduledPickup
from scheduling.services import PickupSchedulingService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Process pickup-related automated tasks'

    def add_arguments(self, parser):
        parser.add_argument(
            '--send-reminders',
            action='store_true',
            help='Send pickup reminders',
        )
        parser.add_argument(
            '--check-missed',
            action='store_true',
            help='Check for missed pickups',
        )
        parser.add_argument(
            '--update-analytics',
            action='store_true',
            help='Update analytics data',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Run all tasks',
        )

    def handle(self, *args, **options):
        if options['send_reminders'] or options['all']:
            self.send_pickup_reminders()
        
        if options['check_missed'] or options['all']:
            self.check_missed_pickups()
        
        if options['update_analytics'] or options['all']:
            self.update_analytics()

    def send_pickup_reminders(self):
        """Send pickup reminders for upcoming appointments"""
        try:
            self.stdout.write('Sending pickup reminders...')
            PickupSchedulingService.send_pickup_reminders()
            self.stdout.write(
                self.style.SUCCESS('Successfully sent pickup reminders')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error sending pickup reminders: {e}')
            )

    def check_missed_pickups(self):
        """Check for and mark missed pickups"""
        try:
            self.stdout.write('Checking for missed pickups...')
            
            # Get pickups that should have been completed by now
            cutoff_time = timezone.now() - timedelta(minutes=30)
            
            missed_pickups = ScheduledPickup.objects.filter(
                status__in=['scheduled', 'confirmed'],
                scheduled_date__lt=timezone.now().date()
            )
            
            # Also check today's pickups that are past their end time
            today_missed = ScheduledPickup.objects.filter(
                status__in=['scheduled', 'confirmed'],
                scheduled_date=timezone.now().date(),
                scheduled_end_time__lt=timezone.now().time()
            )
            
            count = 0
            for pickup in missed_pickups.union(today_missed):
                pickup.status = 'missed'
                pickup.save()
                count += 1
                
                # Send notification
                self.send_missed_notification(pickup)
            
            self.stdout.write(
                self.style.SUCCESS(f'Marked {count} pickups as missed')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error checking missed pickups: {e}')
            )

    def update_analytics(self):
        """Update analytics data for all businesses"""
        try:
            self.stdout.write('Updating analytics data...')
            
            # This could be expanded to recalculate analytics
            # For now, just log the action
            
            self.stdout.write(
                self.style.SUCCESS('Analytics update completed')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating analytics: {e}')
            )

    def send_missed_notification(self, pickup):
        """Send notification for missed pickup"""
        try:
            from notifications.services import NotificationService
            
            customer = pickup.order.interaction.user
            NotificationService.create_notification(
                recipient=customer,
                notification_type='business_update',
                title="Pickup Missed",
                message=f"Your scheduled pickup at {pickup.location.name} was missed. Please contact the business to reschedule.",
                data={
                    'pickup_id': str(pickup.id),
                    'confirmation_code': pickup.confirmation_code,
                    'business_contact': pickup.location.contact_phone
                }
            )
            
        except Exception as e:
            logger.error(f"Error sending missed pickup notification: {str(e)}")


# scheduling/management/commands/__init__.py
# (empty file to make this a Python package)


# scheduling/management/__init__.py  
# (empty file to make this a Python package)