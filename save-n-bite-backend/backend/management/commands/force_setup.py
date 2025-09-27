# backend/management/commands/force_setup.py

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Force database setup (bypass cache and run setup commands)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-cache',
            action='store_true',
            help='Clear the setup completion cache before running',
        )
        parser.add_argument(
            '--skip-badges',
            action='store_true',
            help='Skip badge initialization',
        )
        parser.add_argument(
            '--skip-plants',
            action='store_true',
            help='Skip plant population',
        )
    
    def handle(self, *args, **options):
        if options['clear_cache']:
            cache.delete('database_setup_completed')
            self.stdout.write("Cache cleared")
        
        self.stdout.write("🚀 Force running database setup...")
        
        try:
            # Initialize badges
            if not options['skip_badges']:
                self.stdout.write("🏆 Initializing badge types...")
                call_command('init_badges')
                
                self.stdout.write("🏆 Calculating initial badges...")
                call_command('calculate_badges', initialize=True)
            
            # Populate plants
            if not options['skip_plants']:
                self.stdout.write("🌿 Populating plants...")
                call_command('populate_plants')
            
            # Mark as completed
            cache.set('database_setup_completed', True, timeout=3600)
            
            self.stdout.write(
                self.style.SUCCESS("✅ Database setup completed successfully!")
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Database setup failed: {str(e)}")
            )
            raise
