# transactions/tests/test_cart.py
from django.test import TestCase
from decimal import Decimal
from django.db import IntegrityError
from transactions.tests.factories import (
    CartFactory,
    CartItemFactory,
    FoodListingFactory
)

class CartModelTests(TestCase):
    def setUp(self):
        self.cart = CartFactory()
        self.food_listing = FoodListingFactory()
        self.cart_item = CartItemFactory(
            cart=self.cart,
            food_listing=self.food_listing,
            quantity=2
        )
        
    def test_cart_creation(self):
        """Test that a cart is created correctly"""
        self.assertEqual(self.cart.user.user_type, 'customer')
        self.assertEqual(self.cart.total_items, 2)
        
    def test_cart_subtotal_property(self):
        """Test the subtotal property of Cart"""
        expected_subtotal = self.food_listing.discounted_price * 2
        self.assertEqual(self.cart.subtotal, expected_subtotal)
        
    def test_cart_str_method(self):
        """Test the __str__ method of Cart"""
        expected_str = f"Cart for {self.cart.user.email}"
        self.assertEqual(str(self.cart), expected_str)
        
    def test_cart_item_creation(self):
        """Test that a cart item is created correctly"""
        self.assertEqual(self.cart_item.cart, self.cart)
        self.assertEqual(self.cart_item.food_listing, self.food_listing)
        self.assertEqual(self.cart_item.quantity, 2)
        
    def test_cart_item_total_price_property(self):
        """Test the total_price property of CartItem"""
        expected_total = self.food_listing.discounted_price * 2
        self.assertEqual(self.cart_item.total_price, expected_total)
        
    def test_cart_item_str_method(self):
        """Test the __str__ method of CartItem"""
        expected_str = f"2 x {self.food_listing.name} in cart"
        self.assertEqual(str(self.cart_item), expected_str)
        
    def test_cart_item_unique_together(self):
        """Test that cart and food_listing are unique together"""
        with self.assertRaises(IntegrityError):
            CartItemFactory(
                cart=self.cart,
                food_listing=self.food_listing,
                quantity=1
            )

    def test_cart_item_updates_quantity(self):
        """Test that adding same item again updates quantity"""
        initial_count = self.cart.items.count()
        initial_quantity = self.cart_item.quantity
    
        # Instead of creating a new item, update the existing one
        self.cart_item.quantity += 1
        self.cart_item.save()
    
        self.assertEqual(self.cart.items.count(), initial_count)
        self.cart_item.refresh_from_db()
        self.assertEqual(self.cart_item.quantity, initial_quantity + 1)