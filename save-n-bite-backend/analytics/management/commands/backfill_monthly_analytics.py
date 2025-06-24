# analytics/management/commands/backfill_monthly_analytics.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from interactions.models import Interaction
from analytics.services import AnalyticsService

class Command(BaseCommand):
    help = 'Backfill monthly analytics data'

    def handle(self, *args, **options):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=365)  # 1 year back
        
        # Process all completed interactions
        interactions = Interaction.objects.filter(
            status='completed',
            created_at__gte=start_date
        )
        
        for interaction in interactions:
            # Same logic as signal handler
            try:
                meals_saved = sum(item.quantity for item in interaction.items.all())
                co2_reduction = sum(
                    item.quantity * item.food_listing.co2_saving_per_item 
                    for item in interaction.items.all()
                )
                
                transaction_data = {
                    'type': interaction.interaction_type.lower(),
                    'amount': float(interaction.total_amount),
                    'meals_saved': meals_saved,
                    'co2_reduction': float(co2_reduction),
                    'user_type': 'provider' if hasattr(interaction.user, 'provider_profile') else 'customer'
                }
                AnalyticsService.update_user_analytics(interaction.user, transaction_data)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing interaction {interaction.id}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS('Successfully backfilled monthly analytics'))