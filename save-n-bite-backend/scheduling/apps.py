# scheduling/apps.py

from django.apps import AppConfig


class SchedulingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'scheduling'
    verbose_name = 'Pickup Scheduling'

    def ready(self):
        """Import signals when Django starts"""
        import scheduling.signals