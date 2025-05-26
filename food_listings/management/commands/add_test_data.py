from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from food_listings.models import FoodListing
from datetime import date, timedelta
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Adds test data to the database'

    def handle(self, *args, **kwargs):
        # Create a test provider if it doesn't exist
        provider, created = User.objects.get_or_create(
            email='test@provider.com',
            defaults={
                'username': 'testprovider',
                'password': 'testpass123',
                'user_type': 'provider',
                'is_active': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('Created test provider'))
        else:
            self.stdout.write(self.style.SUCCESS('Test provider already exists'))

        # Create a test food listing
        listing = FoodListing.objects.create(
            name='Test Food Item',
            description='A delicious test food item',
            food_type='ready_to_eat',
            original_price=100.00,
            discounted_price=50.00,
            quantity=10,
            quantity_available=10,
            expiry_date=date.today() + timedelta(days=2),
            pickup_window='17:00-19:00',
            images=['https://images.unsplash.com/photo-1546833999-b9f581a1996d'],
            allergens=['nuts', 'dairy'],
            dietary_info=['vegetarian'],
            status='active',
            provider=provider
        )

        self.stdout.write(self.style.SUCCESS('Created test food listing')) 