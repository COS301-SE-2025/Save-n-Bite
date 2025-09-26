# digital_garden/apps.py

from django.apps import AppConfig


class DigitalGardenConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'digital_garden'
    verbose_name = 'Digital Garden'
    
    def ready(self):
        # Import signals to ensure they're registered
        import digital_garden.signals