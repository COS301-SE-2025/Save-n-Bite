from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from food_listings.models import FoodListing
from datetime import datetime, timedelta
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Populates the database with sample food listings'

    def handle(self, *args, **kwargs):
        # Create a test provider if not exists
        provider, created = User.objects.get_or_create(
            email='test_provider@example.com',
            defaults={
                'username': 'test_provider',
                'is_active': True,
                'user_type': 'provider'
            }
        )

        # Sample food listings data
        listings_data = [
            {
                'name': 'Fresh Sourdough Bread',
                'description': 'Artisanal sourdough bread made with organic flour, perfect for sandwiches or toast.',
                'food_type': 'baked_goods',
                'original_price': 8.99,
                'discounted_price': 4.99,
                'quantity': 5,
                'expiry_date': datetime.now().date() + timedelta(days=2),
                'pickup_window': '15:00-17:00',
                'images': ['https://images.unsplash.com/photo-1585478259715-19c2b7f2a1e3'],
                'allergens': ['gluten', 'wheat'],
                'dietary_info': ['vegetarian', 'vegan']
            },
            {
                'name': 'Gourmet Pizza Slice',
                'description': 'Large slice of pepperoni pizza with extra cheese and fresh basil.',
                'food_type': 'ready_to_eat',
                'original_price': 6.99,
                'discounted_price': 3.99,
                'quantity': 8,
                'expiry_date': datetime.now().date() + timedelta(days=1),
                'pickup_window': '18:00-20:00',
                'images': ['https://images.unsplash.com/photo-1513104890138-7c749659a591'],
                'allergens': ['gluten', 'dairy'],
                'dietary_info': ['vegetarian']
            },
            {
                'name': 'Organic Mixed Salad',
                'description': 'Fresh mixed greens with cherry tomatoes, cucumber, and house-made vinaigrette.',
                'food_type': 'ready_to_eat',
                'original_price': 9.99,
                'discounted_price': 5.99,
                'quantity': 3,
                'expiry_date': datetime.now().date() + timedelta(days=1),
                'pickup_window': '12:00-14:00',
                'images': ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd'],
                'allergens': [],
                'dietary_info': ['vegetarian', 'vegan', 'gluten-free']
            },
            {
                'name': 'Fresh Pasta Bundle',
                'description': 'Homemade fettuccine pasta made with organic eggs and flour.',
                'food_type': 'ingredients',
                'original_price': 12.99,
                'discounted_price': 7.99,
                'quantity': 4,
                'expiry_date': datetime.now().date() + timedelta(days=3),
                'pickup_window': '16:00-18:00',
                'images': ['https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb'],
                'allergens': ['gluten', 'eggs'],
                'dietary_info': ['vegetarian']
            },
            {
                'name': 'Chocolate Croissant',
                'description': 'Buttery croissant filled with rich dark chocolate.',
                'food_type': 'baked_goods',
                'original_price': 4.99,
                'discounted_price': 2.99,
                'quantity': 6,
                'expiry_date': datetime.now().date() + timedelta(days=1),
                'pickup_window': '14:00-16:00',
                'images': ['https://images.unsplash.com/photo-1555507036-ab1f4038808a'],
                'allergens': ['gluten', 'dairy', 'nuts'],
                'dietary_info': ['vegetarian']
            },
            {
                'name': 'Grilled Chicken Wrap',
                'description': 'Grilled chicken breast with lettuce, tomato, and chipotle mayo in a whole wheat wrap.',
                'food_type': 'ready_to_eat',
                'original_price': 8.99,
                'discounted_price': 4.99,
                'quantity': 5,
                'expiry_date': datetime.now().date() + timedelta(days=1),
                'pickup_window': '13:00-15:00',
                'images': ['https://images.unsplash.com/photo-1563245372-f21724e3856d'],
                'allergens': ['gluten', 'dairy'],
                'dietary_info': []
            },
            {
                'name': 'Fresh Fruit Basket',
                'description': 'Assorted seasonal fruits including apples, oranges, and berries.',
                'food_type': 'ingredients',
                'original_price': 15.99,
                'discounted_price': 9.99,
                'quantity': 2,
                'expiry_date': datetime.now().date() + timedelta(days=4),
                'pickup_window': '10:00-12:00',
                'images': ['https://images.unsplash.com/photo-1610832958506-aa56368176cf'],
                'allergens': [],
                'dietary_info': ['vegetarian', 'vegan', 'gluten-free']
            },
            {
                'name': 'Tiramisu',
                'description': 'Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream.',
                'food_type': 'ready_to_eat',
                'original_price': 7.99,
                'discounted_price': 4.99,
                'quantity': 4,
                'expiry_date': datetime.now().date() + timedelta(days=2),
                'pickup_window': '19:00-21:00',
                'images': ['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9'],
                'allergens': ['gluten', 'dairy', 'eggs'],
                'dietary_info': ['vegetarian']
            },
            {
                'name': 'Fresh Sushi Platter',
                'description': 'Assorted sushi rolls with salmon, tuna, and California rolls.',
                'food_type': 'ready_to_eat',
                'original_price': 24.99,
                'discounted_price': 14.99,
                'quantity': 2,
                'expiry_date': datetime.now().date() + timedelta(days=1),
                'pickup_window': '17:00-19:00',
                'images': ['https://images.unsplash.com/photo-1579871494447-9811cf80d66c'],
                'allergens': ['fish', 'soy'],
                'dietary_info': []
            },
            {
                'name': 'Artisan Cheese Selection',
                'description': 'Assortment of local artisan cheeses with crackers and honey.',
                'food_type': 'ingredients',
                'original_price': 18.99,
                'discounted_price': 11.99,
                'quantity': 3,
                'expiry_date': datetime.now().date() + timedelta(days=5),
                'pickup_window': '16:00-18:00',
                'images': ['https://images.unsplash.com/photo-1452195100486-9cc805987862'],
                'allergens': ['dairy', 'gluten'],
                'dietary_info': ['vegetarian']
            }
        ]

        # Create listings
        for data in listings_data:
            FoodListing.objects.create(
                provider=provider,
                **data
            )

        self.stdout.write(self.style.SUCCESS('Successfully created sample food listings')) 