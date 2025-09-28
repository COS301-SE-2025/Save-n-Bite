# Create directory: authentication/management/commands/
# Create file: authentication/management/commands/geocode_addresses.py

from django.core.management.base import BaseCommand
from authentication.models import FoodProviderProfile

class Command(BaseCommand):
    help = 'Geocode all business addresses using free Nominatim service'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-geocoding even if coordinates exist',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=20,
            help='Limit number of addresses to process (default: 20)',
        )

    def handle(self, *args, **options):
        force = options['force']
        limit = options['limit']

        # Get businesses that need geocoding
        if force:
            businesses = FoodProviderProfile.objects.filter(
                business_address__isnull=False
            ).exclude(business_address='')[:limit]
        else:
            businesses = FoodProviderProfile.objects.filter(
                business_address__isnull=False,
                latitude__isnull=True,
                longitude__isnull=True
            ).exclude(business_address='')[:limit]

        total = businesses.count()
        self.stdout.write(f'Found {total} businesses to geocode using free Nominatim service')

        if total == 0:
            self.stdout.write(
                self.style.SUCCESS('No businesses need geocoding')
            )
            return

        success_count = 0
        error_count = 0

        for i, business in enumerate(businesses, 1):
            self.stdout.write(f'Processing {i}/{total}: {business.business_name}')
            
            try:
                # Call the geocoding method
                business.geocode_address()
                business.save()
                
                if business.latitude and business.longitude:
                    success_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✓ Geocoded: {business.latitude}, {business.longitude}'
                        )
                    )
                else:
                    error_count += 1
                    # Provide a default error message to satisfy tests even if geocoding_error is empty
                    msg = business.geocoding_error or 'No results found'
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⚠ Failed: {msg}'
                        )
                    )
                
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Exception: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nFree geocoding complete! Success: {success_count}, Errors: {error_count}'
            )
        )