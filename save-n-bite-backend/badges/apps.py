# badges/apps.py

from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class BadgesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "badges"
    
    def ready(self):
        """
        Initialize badges app when Django starts
        """
        # Import signals to ensure they're connected
        import badges.signals
        
        # Note: We don't initialize badge types here to avoid database access warnings
        # Badge types will be auto-created when first needed via the admin endpoint or views
        logger.info("Badges app ready - signals connected")