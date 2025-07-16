from django.apps import AppConfig

class AdminSystemConfig(AppConfig):  # Changed from AdminPanelConfig
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_system'
    verbose_name = 'Admin System'

    def ready(self):
        pass