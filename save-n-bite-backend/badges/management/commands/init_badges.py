# badges/management/commands/init_badges.py

from django.core.management.base import BaseCommand
from badges.services import BadgeInitializationService


class Command(BaseCommand):
    help = 'Initialize default badge types in the system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation of badge types (skip existing check)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Initializing default badge types...')
        
        try:
            created_count = BadgeInitializationService.create_default_badge_types()
            
            if created_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created {created_count} new badge types')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('All badge types already exist - no new badges created')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to initialize badge types: {str(e)}')
            )
            raise