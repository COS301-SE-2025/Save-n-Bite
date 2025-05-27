# transactions/tests/test_checkout.py
from django.test import TestCase
from decimal import Decimal
from datetime import datetime
from transactions.tests.factories import (
    TransactionFactory,
    TransactionItemFactory,
    PaymentFactory,
    FoodListingFactory
)

class CheckoutModelTests(TestCase):
    def setUp(self):
        self.transaction = TransactionFactory()
        self.food_listing = FoodListingFactory()
        self.transaction_item = TransactionItemFactory(
            transaction=self.transaction,
            food_listing=self.food_listing,
            quantity=2
        )
        self.payment = PaymentFactory(transaction=self.transaction)

    def test_transaction_creation(self):
        """Test that a transaction is created correctly"""
        self.assertEqual(self.transaction.transaction_type, 'Purchase')
        self.assertEqual(self.transaction.status, 'pending')
        self.assertEqual(self.transaction.user.user_type, 'customer')
        self.assertEqual(self.transaction.business.user.user_type, 'provider')
        
    def test_transaction_total_amount_calculation(self):
        """Test that transaction total_amount matches items"""
        expected_total = self.transaction_item.total_price
        self.assertEqual(self.transaction.total_amount, expected_total)
        
    def test_transaction_str_method(self):
        """Test the __str__ method of Transaction"""
        expected_str = f"Purchase - pending - {self.transaction.total_amount}"
        self.assertEqual(str(self.transaction), expected_str)
        
    def test_transaction_choices(self):
        """Test that transaction type and status choices are correct"""
        from transactions.models import Transaction
        self.assertEqual(
            [choice[0] for choice in Transaction.TransactionType.choices],
            ['Purchase', 'Donation']
        )
        self.assertEqual(
            [choice[0] for choice in Transaction.Status.choices],
            ['pending', 'confirmed', 'completed', 'cancelled', 'failed']
        )

    def test_transaction_item_creation(self):
        """Test that a transaction item is created correctly"""
        self.assertEqual(self.transaction_item.transaction, self.transaction)
        self.assertEqual(self.transaction_item.food_listing, self.food_listing)
        self.assertEqual(self.transaction_item.quantity, 2)
        self.assertEqual(self.transaction_item.price_per_item, self.food_listing.discounted_price)
        
    def test_transaction_item_save_method(self):
        """Test that the save method calculates total_price correctly"""
        new_item = TransactionItemFactory.build(
            transaction=self.transaction,
            food_listing=self.food_listing,
            quantity=3,
            price_per_item=Decimal('5.00')
        )
        new_item.save()
        self.assertEqual(new_item.total_price, Decimal('15.00'))
        
    def test_transaction_item_str_method(self):
        """Test the __str__ method of TransactionItem"""
        expected_str = f"2 x {self.food_listing.name} ({self.transaction_item.total_price})"
        self.assertEqual(str(self.transaction_item), expected_str)

    def test_payment_creation(self):
        """Test that a payment is created correctly"""
        self.assertEqual(self.payment.transaction, self.transaction)
        self.assertEqual(self.payment.method, 'card')
        self.assertEqual(self.payment.amount, self.transaction.total_amount)
        self.assertEqual(self.payment.status, 'pending')
        
    def test_payment_str_method(self):
        """Test the __str__ method of Payment"""
        expected_str = f"Payment {self.payment.id} - card - pending"
        self.assertEqual(str(self.payment), expected_str)
        
    def test_payment_method_choices(self):
        """Test that payment method choices are correct"""
        from transactions.models import Payment
        self.assertEqual(
            [choice[0] for choice in Payment.PaymentMethod.choices],
            ['card', 'cash', 'digital_wallet']
        )
        
    def test_payment_status_choices(self):
        """Test that payment status choices are correct"""
        from transactions.models import Payment
        self.assertEqual(
            [choice[0] for choice in Payment.Status.choices],
            ['pending', 'completed', 'failed', 'refunded']
        )
