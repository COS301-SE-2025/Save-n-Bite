# admin_panel/apps.py
from django.apps import AppConfig

class AdminPanelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_panel'
    verbose_name = 'Admin Panel'

    def ready(self):
        # Import signals if needed
        pass