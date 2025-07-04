from django.apps import AppConfig


class FoodListingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'food_listings'

    def ready(self):
        import food_listings.signals  # Import the signals