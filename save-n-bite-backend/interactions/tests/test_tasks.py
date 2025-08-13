from django.test import TestCase
from django.utils import timezone
from model_bakery import baker
from interactions.models import CheckoutSession, Cart, CartItem, FoodListing
from interactions.tasks import expire_checkout_sessions, cleanup_expired_carts
from django.db import transaction

class TasksTestCase(TestCase):
    def setUp(self):
        # Create test users with proper profiles
        self.user1 = baker.make('authentication.User', user_type='business')
        self.user2 = baker.make('authentication.User', user_type='business')
        
        # Create provider profiles to avoid notification errors
        self.provider1 = baker.make('authentication.FoodProviderProfile', user=self.user1)
        self.provider2 = baker.make('authentication.FoodProviderProfile', user=self.user2)
        
        # Create test food listing with provider
        self.food_listing = baker.make(
            'food_listings.FoodListing',
            provider=self.user1,
            quantity=10,
            quantity_available=5
        )

    def test_expire_checkout_sessions(self):
        # Create a cart and checkout session for user1
        cart1 = baker.make('interactions.Cart', user=self.user2)  # user2 is the customer
        cart_item1 = baker.make(
            'interactions.CartItem',
            cart=cart1,
            food_listing=self.food_listing,
            quantity=2
        )
        
        # Create an expired checkout session
        expired_session = baker.make(
            'interactions.CheckoutSession',
            user=self.user2,
            cart=cart1,
            is_active=True,
            expires_at=timezone.now() - timezone.timedelta(minutes=1)
        )

        # Verify initial state
        self.assertTrue(expired_session.is_active)
        food_listing = FoodListing.objects.get(id=self.food_listing.id)
        self.assertEqual(food_listing.quantity_available, 5)

        # Run the task
        expire_checkout_sessions()

        # Refresh objects from database
        expired_session.refresh_from_db()
        food_listing.refresh_from_db()

        # Verify changes
        self.assertFalse(expired_session.is_active)
        self.assertEqual(food_listing.quantity_available, 7)  # 5 + 2

    def test_expire_checkout_sessions_no_active(self):
        # Create a cart and checkout session for user2
        cart2 = baker.make('interactions.Cart', user=self.user2)
        baker.make(
            'interactions.CartItem',
            cart=cart2,
            food_listing=self.food_listing,
            quantity=1
        )
        
        # Create a non-expired checkout session
        active_session = baker.make(
            'interactions.CheckoutSession',
            user=self.user2,
            cart=cart2,
            is_active=True,
            expires_at=timezone.now() + timezone.timedelta(minutes=30)
        )

        # Run the task
        expire_checkout_sessions()

        # Verify it wasn't changed
        active_session.refresh_from_db()
        self.assertTrue(active_session.is_active)

    def test_cleanup_expired_carts(self):
        # Create a cart for user2 (expired)
        cart1 = baker.make(
            'interactions.Cart',
            user=self.user2,
            expires_at=timezone.now() - timezone.timedelta(minutes=1)
        )
        baker.make(
            'interactions.CartItem',
            cart=cart1,
            food_listing=self.food_listing,
            quantity=3
        )

        # Verify initial state
        self.assertEqual(cart1.items.count(), 1)
        food_listing = FoodListing.objects.get(id=self.food_listing.id)
        self.assertEqual(food_listing.quantity_available, 5)

        # Run the task
        cleanup_expired_carts()

        # Refresh objects from database
        cart1.refresh_from_db()
        food_listing.refresh_from_db()

        # Verify changes
        self.assertEqual(cart1.items.count(), 0)
        self.assertEqual(food_listing.quantity_available, 8)  # 5 + 3

    def test_cleanup_expired_carts_no_expired(self):
        # Create a cart for user2 (not expired)
        cart2 = baker.make(
            'interactions.Cart',
            user=self.user2,
            expires_at=timezone.now() + timezone.timedelta(minutes=30)
        )
        baker.make(
            'interactions.CartItem',
            cart=cart2,
            food_listing=self.food_listing,
            quantity=1
        )

        # Run the task
        cleanup_expired_carts()

        # Verify it wasn't changed
        cart2.refresh_from_db()
        self.assertEqual(cart2.items.count(), 1)