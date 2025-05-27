# transactions/tests/test_orders.py
from django.test import TestCase
from datetime import datetime, timedelta
from transactions.tests.factories import (
    OrderFactory,
    TransactionStatusHistoryFactory,
    TransactionItemFactory
)

class OrderModelTests(TestCase):
    def setUp(self):
        self.order = OrderFactory()
        self.transaction_item = TransactionItemFactory(
            transaction=self.order.transaction,
            quantity=1
        )
        self.pickup_details = "15:00 - 17:00"
        self.status_history = TransactionStatusHistoryFactory(
            transaction=self.order.transaction
        )

    def test_order_creation(self):
        """Test that an order is created correctly"""
        self.assertEqual(self.order.transaction.transaction_type, 'Purchase')
        self.assertEqual(self.order.status, 'pending')
        
    def test_order_items_property(self):
        """Test the items property of Order"""
        items = self.order.items
        self.assertEqual(items.count(), 1)
        self.assertEqual(items.first(), self.transaction_item)
        
    def test_order_str_method(self):
        """Test the __str__ method of Order"""
        expected_str = f"Order {self.order.id} - pending"
        self.assertEqual(str(self.order), expected_str)
        
    def test_order_status_choices(self):
        """Test that order status choices are correct"""
        from transactions.models import Order
        self.assertEqual(
            [choice[0] for choice in Order.Status.choices],
            ['pending', 'confirmed', 'ready', 'completed', 'cancelled']
        )
        
    def test_status_history_creation(self):
        """Test that status history is created correctly"""
        self.assertEqual(self.status_history.transaction, self.order.transaction)
        self.assertEqual(self.status_history.old_status, 'pending')
        self.assertEqual(self.status_history.new_status, 'confirmed')
        self.assertEqual(self.status_history.changed_by.user_type, 'customer')
        
    def test_status_history_str_method(self):
        """Test the __str__ method of TransactionStatusHistory"""
        expected_str = f"Status change from pending to confirmed"
        self.assertEqual(str(self.status_history), expected_str)
        
    def test_status_history_ordering(self):
        """Test that status history is ordered by changed_at descending"""
        new_status_history = TransactionStatusHistoryFactory(
            transaction=self.order.transaction,
            old_status='confirmed',
            new_status='completed'
        )
        
        history = self.order.transaction.status_history.all()
        self.assertEqual(history[0], new_status_history)
        self.assertEqual(history[1], self.status_history)
