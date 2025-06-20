# interactions/tests/test_checkout.py
from django.test import TestCase
from decimal import Decimal
from datetime import datetime
from interactions.tests.factories import (
    InteractionFactory,
    InteractionItemFactory,
    PaymentFactory,
    FoodListingFactory
)

class CheckoutModelTests(TestCase):
    def setUp(self):
        self.interaction = InteractionFactory()
        self.food_listing = FoodListingFactory()
        self.interaction_item = InteractionItemFactory(
            interaction=self.interaction,
            food_listing=self.food_listing,
            quantity=2
        )
        self.payment = PaymentFactory(interaction=self.interaction)

    def test_interaction_creation(self):
        """Test that a interaction is created correctly"""
        self.assertEqual(self.interaction.interaction_type, 'Purchase')
        self.assertEqual(self.interaction.status, 'pending')
        self.assertEqual(self.interaction.user.user_type, 'customer')
        self.assertEqual(self.interaction.business.user.user_type, 'provider')
        
    def test_interaction_total_amount_calculation(self):
        """Test that interaction total_amount matches items"""
        expected_total = self.interaction_item.total_price
        self.assertEqual(self.interaction.total_amount, expected_total)
        
    def test_interaction_str_method(self):
        """Test the __str__ method of Interaction"""
        expected_str = f"Purchase - pending - {self.interaction.total_amount}"
        self.assertEqual(str(self.interaction), expected_str)
        
    def test_interaction_choices(self):
        """Test that interaction type and status choices are correct"""
        from interactions.models import Interaction
        self.assertEqual(
            [choice[0] for choice in Interaction.InteractionType.choices],
            ['Purchase', 'Donation']
        )
        self.assertEqual(
            [choice[0] for choice in Interaction.Status.choices],
            ['pending', 'confirmed', 'completed', 'cancelled', 'failed']
        )

    def test_interaction_item_creation(self):
        """Test that a interaction item is created correctly"""
        self.assertEqual(self.interaction_item.interaction, self.interaction)
        self.assertEqual(self.interaction_item.food_listing, self.food_listing)
        self.assertEqual(self.interaction_item.quantity, 2)
        self.assertEqual(self.interaction_item.price_per_item, self.food_listing.discounted_price)
        
    def test_interaction_item_save_method(self):
        """Test that the save method calculates total_price correctly"""
        new_item = InteractionItemFactory.build(
            interaction=self.interaction,
            food_listing=self.food_listing,
            quantity=3,
            price_per_item=Decimal('5.00')
        )
        new_item.save()
        self.assertEqual(new_item.total_price, Decimal('15.00'))
        
    def test_interaction_item_str_method(self):
        """Test the __str__ method of InteractionItem"""
        expected_str = f"2 x {self.food_listing.name} ({self.interaction_item.total_price})"
        self.assertEqual(str(self.interaction_item), expected_str)

    def test_payment_creation(self):
        """Test that a payment is created correctly"""
        self.assertEqual(self.payment.interaction, self.interaction)
        self.assertEqual(self.payment.method, 'card')
        self.assertEqual(self.payment.amount, self.interaction.total_amount)
        self.assertEqual(self.payment.status, 'pending')
        
    def test_payment_str_method(self):
        """Test the __str__ method of Payment"""
        expected_str = f"Payment {self.payment.id} - card - pending"
        self.assertEqual(str(self.payment), expected_str)
        
    def test_payment_method_choices(self):
        """Test that payment method choices are correct"""
        from interactions.models import Payment
        self.assertEqual(
            [choice[0] for choice in Payment.PaymentMethod.choices],
            ['card', 'cash', 'digital_wallet']
        )
        
    def test_payment_status_choices(self):
        """Test that payment status choices are correct"""
        from interactions.models import Payment
        self.assertEqual(
            [choice[0] for choice in Payment.Status.choices],
            ['pending', 'completed', 'failed', 'refunded']
        )
