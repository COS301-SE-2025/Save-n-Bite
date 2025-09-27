# backend/signals.py

from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.core.management import call_command
from django.db import connection
from django.core.management.base import CommandError
from django.core.cache import cache
import logging
import os

logger = logging.getLogger(__name__)

# Flag to prevent multiple executions
_setup_completed = False


@receiver(post_migrate)
def setup_database_data(sender, **kwargs):
    """
    Automatically populate database with initial data after migrations
    """
    global _setup_completed
    
    # Only run for the main backend app to avoid running multiple times
    if sender.name == 'backend' and not _setup_completed:
        # Skip if running in test mode
        if os.environ.get('RUNNING_TESTS') == '1' or os.environ.get('DJANGO_SETTINGS_MODULE') == 'backend.test_settings':
            logger.info("Skipping database setup in test mode")
            return
            
        # Check if setup was already completed using cache
        cache_key = 'database_setup_completed'
        if cache.get(cache_key):
            logger.info("Database setup already completed (cached)")
            _setup_completed = True
            return
            
        try:
            logger.info("🌱 Running post-migration database setup...")
            
            # Check if we're in a fresh database by checking if any tables exist
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name LIKE '%badge%'
                """)
                badge_tables_exist = cursor.fetchone()[0] > 0
                
                cursor.execute("""
                    SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name LIKE '%plant%'
                """)
                plant_tables_exist = cursor.fetchone()[0] > 0
            
            # Initialize badges
            if badge_tables_exist:
                logger.info("🏆 Initializing badge types...")
                try:
                    call_command('init_badges', verbosity=0)
                    logger.info("✅ Badge types initialized")
                except CommandError as e:
                    logger.warning(f"⚠️ Badge initialization failed: {e}")
                
                logger.info("🏆 Calculating initial badges...")
                try:
                    call_command('calculate_badges', initialize=True, verbosity=0)
                    logger.info("✅ Initial badges calculated")
                except CommandError as e:
                    logger.warning(f"⚠️ Badge calculation failed: {e}")
            else:
                logger.info("⏭️ Skipping badge setup - tables not ready")
            
            # Populate plants
            if plant_tables_exist:
                logger.info("🌿 Populating plants...")
                try:
                    call_command('populate_plants', verbosity=0)
                    logger.info("✅ Plants populated")
                except CommandError as e:
                    logger.warning(f"⚠️ Plant population failed: {e}")
            else:
                logger.info("⏭️ Skipping plant population - tables not ready")
            
            logger.info("🎉 Database setup completed successfully")
            
            # Mark setup as completed
            _setup_completed = True
            cache.set(cache_key, True, timeout=3600)  # Cache for 1 hour
            
        except Exception as e:
            logger.error(f"❌ Database setup failed: {str(e)}")
            # Don't raise the exception to avoid breaking migrations
