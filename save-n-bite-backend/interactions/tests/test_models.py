from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta, date
from django.contrib.auth import get_user_model
from unittest.mock import patch

from interactions.models import (
    Interaction, Cart, CartItem, Order, Payment, InteractionItem, 
    InteractionStatusHistory, CheckoutSession
)
from authentication.models import FoodProviderProfile, CustomerProfile
from food_listings.models import FoodListing

User = get_user_model()


class InteractionModelTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.business_owner = User.objects.create_user(
            username='businessowner',
            email='owner@example.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.food_provider = FoodProviderProfile.objects.create(
            user=self.business_owner,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='restaurant@example.com',
            status='verified'
        )
        
        # FoodListing provider should be a User, not FoodProviderProfile
        self.food_listing = FoodListing.objects.create(
            name='Test Food',
            description='Test Description',
            quantity_available=10,
            original_price=50.00,
            discounted_price=25.00,
            expiry_date=date.today() + timedelta(days=7),
            provider=self.business_owner  # Use User instance, not FoodProviderProfile
        )

    def test_create_interaction(self):
        """Test creating a basic interaction"""
        interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='pending',
            total_amount=100.00
        )
        
        self.assertEqual(interaction.interaction_type, 'Purchase')
        self.assertEqual(interaction.status, 'pending')
        self.assertEqual(interaction.total_amount, 100.00)
        self.assertEqual(interaction.user, self.user)
        self.assertEqual(interaction.business, self.food_provider)
        self.assertIsNotNone(interaction.created_at)

    def test_interaction_string_representation(self):
        """Test interaction string representation"""
        interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='completed',
            total_amount=100.00
        )
        
        expected_str = f"Purchase - completed - 100.00"
        self.assertEqual(str(interaction), expected_str)

    def test_donation_requires_rejection_reason(self):
        """Test that donation rejection requires a reason"""
        interaction = Interaction(
            user=self.user,
            business=self.food_provider,
            interaction_type='Donation',
            status='rejected',
            total_amount=0.00,
            rejection_reason=''  # Empty rejection reason
        )
        
        with self.assertRaises(ValidationError) as context:
            interaction.full_clean()
        
        self.assertIn('rejection_reason', str(context.exception))

    def test_donation_with_rejection_reason(self):
        """Test that donation with rejection reason is valid"""
        interaction = Interaction(
            user=self.user,
            business=self.food_provider,
            interaction_type='Donation',
            status='rejected',
            total_amount=0.00,
            rejection_reason='Not available'
        )
        
        try:
            interaction.full_clean()
        except ValidationError:
            self.fail("Donation with rejection reason should be valid")

    def test_update_status_method(self):
        """Test the update_status helper method"""
        interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='pending',
            total_amount=100.00
        )
        
        interaction.update_status('confirmed')  # Use valid transition
        interaction.refresh_from_db()
        
        self.assertEqual(interaction.status, 'confirmed')

    def test_get_business_history(self):
        """Test getting business interaction history"""
        # Create multiple interactions
        for i in range(3):
            Interaction.objects.create(
                user=self.user,
                business=self.food_provider,
                interaction_type='Purchase',
                status='completed',
                total_amount=100.00 + i
            )
        
        business_history = Interaction.get_business_history(self.food_provider)
        self.assertEqual(business_history.count(), 3)
        self.assertEqual(business_history[0].total_amount, 102.00)  # Most recent first

    def test_get_interaction_details(self):
        """Test getting detailed interaction information"""
        interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='completed',
            total_amount=100.00
        )
        
        # Create interaction item
        InteractionItem.objects.create(
            interaction=interaction,
            food_listing=self.food_listing,
            name='Test Food',
            quantity=2,
            price_per_item=50.00,
            total_price=100.00,
            expiry_date=date.today() + timedelta(days=7)
        )
        
        details = interaction.get_interaction_details()
        
        self.assertEqual(details['id'], str(interaction.id))
        self.assertEqual(details['type'], 'Purchase')
        self.assertEqual(details['status'], 'completed')
        self.assertEqual(details['total_amount'], 100.00)
        self.assertEqual(len(details['items']), 1)
        self.assertEqual(details['items'][0]['name'], 'Test Food')

    def test_status_history_creation(self):
        """Test that status history is created when status changes"""
        interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='pending',
            total_amount=100.00
        )
        
        # Change status using valid transition
        interaction.status = 'confirmed'
        interaction.save()
        
        # Check that history was created
        self.assertEqual(interaction.status_history.count(), 1)
        history = interaction.status_history.first()
        self.assertEqual(history.old_status, 'pending')
        self.assertEqual(history.new_status, 'confirmed')


class CartModelTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.business_owner = User.objects.create_user(
            username='businessowner',
            email='owner@example.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.food_provider = FoodProviderProfile.objects.create(
            user=self.business_owner,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='restaurant@example.com',
            status='verified'
        )
        
        # FoodListing provider should be a User, not FoodProviderProfile
        self.food_listing = FoodListing.objects.create(
            name='Test Food',
            description='Test Description',
            quantity_available=10,
            original_price=50.00,
            discounted_price=25.00,
            expiry_date=date.today() + timedelta(days=7),
            provider=self.business_owner  # Use User instance, not FoodProviderProfile
        )

    def test_create_cart(self):
        """Test creating a cart for a user"""
        cart = Cart.objects.create(user=self.user)
        
        self.assertEqual(cart.user, self.user)
        self.assertIsNotNone(cart.created_at)
        self.assertIsNotNone(cart.expires_at)
        self.assertTrue(cart.expires_at > timezone.now())

    def test_cart_total_items(self):
        """Test cart total items calculation"""
        cart = Cart.objects.create(user=self.user)
        
        # Add items to cart
        CartItem.objects.create(cart=cart, food_listing=self.food_listing, quantity=2)
        
        self.assertEqual(cart.total_items, 2)

    def test_cart_subtotal(self):
        """Test cart subtotal calculation"""
        cart = Cart.objects.create(user=self.user)
        
        # Add items to cart
        CartItem.objects.create(cart=cart, food_listing=self.food_listing, quantity=2)
        
        expected_subtotal = 2 * 25.00  # quantity * discounted_price
        self.assertEqual(cart.subtotal, expected_subtotal)

    def test_cart_is_expired(self):
        """Test cart expiration check"""
        cart = Cart.objects.create(user=self.user)
        
        # Cart should not be expired initially
        self.assertFalse(cart.is_expired())
        
        # Set expiration to past
        cart.expires_at = timezone.now() - timedelta(hours=1)
        cart.save()
        
        self.assertTrue(cart.is_expired())

    def test_cart_clean_max_items(self):
        """Test cart validation for maximum items"""
        cart = Cart.objects.create(user=self.user)
        
        # Create a food listing with large quantity
        large_listing = FoodListing.objects.create(
            name='Large Quantity Food',
            description='Test',
            quantity_available=100,
            original_price=10.00,
            discounted_price=5.00,
            expiry_date=date.today() + timedelta(days=7),
            provider=self.business_owner  # Use User instance
        )
        
        # Try to add more than MAX_ITEMS - this should be caught in CartItem validation
        # The cart clean method checks total items in cart, not individual item quantity
        CartItem.objects.create(cart=cart, food_listing=large_listing, quantity=30)
        CartItem.objects.create(cart=cart, food_listing=self.food_listing, quantity=25)
        
        # The cart should have 55 items total, which exceeds MAX_ITEMS of 50
        with self.assertRaises(ValidationError):
            cart.full_clean()

    def test_cart_string_representation(self):
        """Test cart string representation"""
        cart = Cart.objects.create(user=self.user)
        expected_str = f"Cart for {self.user.email}"
        self.assertEqual(str(cart), expected_str)


class CartItemModelTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.business_owner = User.objects.create_user(
            username='businessowner',
            email='owner@example.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.food_provider = FoodProviderProfile.objects.create(
            user=self.business_owner,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='restaurant@example.com',
            status='verified'
        )
        
        # FoodListing provider should be a User, not FoodProviderProfile
        self.food_listing = FoodListing.objects.create(
            name='Test Food',
            description='Test Description',
            quantity_available=10,
            original_price=50.00,
            discounted_price=25.00,
            expiry_date=date.today() + timedelta(days=7),
            provider=self.business_owner  # Use User instance, not FoodProviderProfile
        )
        
        self.cart = Cart.objects.create(user=self.user)

    def test_create_cart_item(self):
        """Test creating a cart item"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            food_listing=self.food_listing,
            quantity=2
        )
        
        self.assertEqual(cart_item.cart, self.cart)
        self.assertEqual(cart_item.food_listing, self.food_listing)
        self.assertEqual(cart_item.quantity, 2)
        self.assertIsNotNone(cart_item.added_at)

    def test_cart_item_total_price(self):
        """Test cart item total price calculation"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            food_listing=self.food_listing,
            quantity=3
        )
        
        expected_total = 3 * 25.00  # quantity * discounted_price
        self.assertEqual(cart_item.total_price, expected_total)

    def test_cart_item_clean_quantity_validation(self):
        """Test cart item quantity validation"""
        # Try to add more than available quantity
        with self.assertRaises(ValidationError):
            item = CartItem(cart=self.cart, food_listing=self.food_listing, quantity=15)
            item.full_clean()

    def test_cart_item_string_representation(self):
        """Test cart item string representation"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            food_listing=self.food_listing,
            quantity=2
        )
        
        expected_str = f"2 x {self.food_listing.name} in cart"
        self.assertEqual(str(cart_item), expected_str)

    def test_unique_together_constraint(self):
        """Test that cart and food_listing combination must be unique"""
        CartItem.objects.create(
            cart=self.cart,
            food_listing=self.food_listing,
            quantity=2
        )
        
        # Try to create another item with same cart and food_listing
        with self.assertRaises(Exception):  # Should raise IntegrityError or ValidationError
            CartItem.objects.create(
                cart=self.cart,
                food_listing=self.food_listing,
                quantity=3
            )


class OrderModelTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.business_owner = User.objects.create_user(
            username='businessowner',
            email='owner@example.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.food_provider = FoodProviderProfile.objects.create(
            user=self.business_owner,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='restaurant@example.com',
            status='verified'
        )
        
        self.interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='pending',
            total_amount=100.00
        )

    def test_create_order(self):
        """Test creating an order"""
        order = Order.objects.create(
            interaction=self.interaction,
            status='pending',
            pickup_window='12:00-13:00',
            pickup_code='TEST123'
        )
        
        self.assertEqual(order.interaction, self.interaction)
        self.assertEqual(order.status, 'pending')
        self.assertEqual(order.pickup_window, '12:00-13:00')
        self.assertEqual(order.pickup_code, 'TEST123')

    def test_order_items_property(self):
        """Test order items property"""
        order = Order.objects.create(
            interaction=self.interaction,
            status='pending',
            pickup_window='12:00-13:00',
            pickup_code='TEST123'
        )
        
        # Create interaction items
        food_listing = FoodListing.objects.create(
            name='Test Food',
            description='Test Description',
            quantity_available=10,
            original_price=50.00,
            discounted_price=25.00,
            expiry_date=date.today() + timedelta(days=7),
            provider=self.business_owner  # Use User instance
        )
        
        InteractionItem.objects.create(
            interaction=self.interaction,
            food_listing=food_listing,
            name='Test Food',
            quantity=2,
            price_per_item=50.00,
            total_price=100.00,
            expiry_date=date.today() + timedelta(days=7)
        )
        
        self.assertEqual(order.items.count(), 1)

    def test_order_string_representation(self):
        """Test order string representation"""
        order = Order.objects.create(
            interaction=self.interaction,
            status='pending',
            pickup_window='12:00-13:00',
            pickup_code='TEST123'
        )
        
        expected_str = f"Order {order.id} - pending"
        self.assertEqual(str(order), expected_str)

    def test_order_status_updates_interaction(self):
        """Test that order status updates interaction status"""
        order = Order.objects.create(
            interaction=self.interaction,
            status='pending',
            pickup_window='12:00-13:00',
            pickup_code='TEST123'
        )
        
        # Update order status to confirmed (valid transition)
        order.status = 'confirmed'
        order.save()
        
        # Refresh interaction from database
        self.interaction.refresh_from_db()
        self.assertEqual(self.interaction.status, 'confirmed')


class PaymentModelTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.business_owner = User.objects.create_user(
            username='businessowner',
            email='owner@example.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.food_provider = FoodProviderProfile.objects.create(
            user=self.business_owner,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='restaurant@example.com',
            status='verified'
        )
        
        self.interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='pending',
            total_amount=100.00
        )

    def test_create_payment(self):
        """Test creating a payment"""
        payment = Payment.objects.create(
            interaction=self.interaction,
            method='card',
            amount=100.00,
            status='pending'
        )
        
        self.assertEqual(payment.interaction, self.interaction)
        self.assertEqual(payment.method, 'card')
        self.assertEqual(payment.amount, 100.00)
        self.assertEqual(payment.status, 'pending')

    def test_payment_string_representation(self):
        """Test payment string representation"""
        payment = Payment.objects.create(
            interaction=self.interaction,
            method='card',
            amount=100.00,
            status='completed'
        )
        
        expected_str = f"Payment {payment.id} - card - completed"
        self.assertEqual(str(payment), expected_str)

    def test_payment_status_updates_interaction(self):
        """Test that payment status updates interaction status"""
        payment = Payment.objects.create(
            interaction=self.interaction,
            method='card',
            amount=100.00,
            status='pending'
        )
        
        # Update payment status to completed
        payment.status = 'completed'
        payment.save()
        
        # Refresh interaction from database
        self.interaction.refresh_from_db()
        self.assertEqual(self.interaction.status, 'confirmed')


class InteractionItemModelTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.business_owner = User.objects.create_user(
            username='businessowner',
            email='owner@example.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.food_provider = FoodProviderProfile.objects.create(
            user=self.business_owner,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='restaurant@example.com',
            status='verified'
        )
        
        self.interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='pending',
            total_amount=100.00
        )
        
        # FoodListing provider should be a User, not FoodProviderProfile
        self.food_listing = FoodListing.objects.create(
            name='Test Food',
            description='Test Description',
            quantity_available=10,
            original_price=50.00,
            discounted_price=25.00,
            expiry_date=date.today() + timedelta(days=7),
            provider=self.business_owner  # Use User instance, not FoodProviderProfile
        )

    def test_create_interaction_item(self):
        """Test creating an interaction item"""
        item = InteractionItem.objects.create(
            interaction=self.interaction,
            food_listing=self.food_listing,
            name='Test Food',
            quantity=2,
            price_per_item=50.00,
            total_price=100.00,
            expiry_date=date.today() + timedelta(days=7)
        )
        
        self.assertEqual(item.interaction, self.interaction)
        self.assertEqual(item.food_listing, self.food_listing)
        self.assertEqual(item.name, 'Test Food')
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.price_per_item, 50.00)
        self.assertEqual(item.total_price, 100.00)

    def test_interaction_item_total_price_calculation(self):
        """Test that total price is calculated automatically"""
        item = InteractionItem(
            interaction=self.interaction,
            food_listing=self.food_listing,
            name='Test Food',
            quantity=3,
            price_per_item=50.00,
            expiry_date=date.today() + timedelta(days=7)
        )
        
        # Total price should be calculated on save
        item.save()
        self.assertEqual(item.total_price, 150.00)

    def test_interaction_item_string_representation(self):
        """Test interaction item string representation"""
        item = InteractionItem.objects.create(
            interaction=self.interaction,
            food_listing=self.food_listing,
            name='Test Food',
            quantity=2,
            price_per_item=50.00,
            total_price=100.00,
            expiry_date=date.today() + timedelta(days=7)
        )
        
        expected_str = f"2 x Test Food (100.00)"
        self.assertEqual(str(item), expected_str)

    def test_get_item_details(self):
        """Test getting item details"""
        item = InteractionItem.objects.create(
            interaction=self.interaction,
            food_listing=self.food_listing,
            name='Test Food',
            quantity=2,
            price_per_item=50.00,
            total_price=100.00,
            expiry_date=date.today() + timedelta(days=7)
        )
        
        details = item.get_item_details()
        
        self.assertEqual(details['name'], 'Test Food')
        self.assertEqual(details['quantity'], 2)
        self.assertEqual(details['price_per_item'], 50.00)
        self.assertEqual(details['total_price'], 100.00)
        self.assertEqual(details['food_listing_id'], str(self.food_listing.id))


class InteractionStatusHistoryModelTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.business_owner = User.objects.create_user(
            username='businessowner',
            email='owner@example.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.food_provider = FoodProviderProfile.objects.create(
            user=self.business_owner,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='restaurant@example.com',
            status='verified'
        )
        
        self.interaction = Interaction.objects.create(
            user=self.user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='pending',
            total_amount=100.00
        )

    def test_create_status_history(self):
        """Test creating status history"""
        history = InteractionStatusHistory.objects.create(
            interaction=self.interaction,
            old_status='pending',
            new_status='completed',
            changed_by=self.user
        )
        
        self.assertEqual(history.interaction, self.interaction)
        self.assertEqual(history.old_status, 'pending')
        self.assertEqual(history.new_status, 'completed')
        self.assertEqual(history.changed_by, self.user)
        self.assertIsNotNone(history.changed_at)

    def test_status_history_string_representation(self):
        """Test status history string representation"""
        history = InteractionStatusHistory.objects.create(
            interaction=self.interaction,
            old_status='pending',
            new_status='completed',
            changed_by=self.user
        )
        
        expected_str = f"Status change from pending to completed"
        self.assertEqual(str(history), expected_str)

    def test_get_history_details(self):
        """Test getting history details"""
        history = InteractionStatusHistory.objects.create(
            interaction=self.interaction,
            old_status='pending',
            new_status='completed',
            changed_by=self.user,
            notes='Test notes'
        )
        
        details = history.get_history_details()
        
        self.assertEqual(details['old_status'], 'pending')
        self.assertEqual(details['new_status'], 'completed')
        self.assertEqual(details['changed_by'], self.user.email)
        self.assertEqual(details['notes'], 'Test notes')
        self.assertEqual(details['interaction_id'], str(self.interaction.id))


class CheckoutSessionModelTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.cart = Cart.objects.create(user=self.user)

    def test_create_checkout_session(self):
        """Test creating a checkout session"""
        session = CheckoutSession.objects.create(
            user=self.user,
            cart=self.cart,
            expires_at=timezone.now() + timedelta(hours=1)
        )
        
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.cart, self.cart)
        self.assertTrue(session.is_active)
        self.assertIsNotNone(session.session_id)

    def test_checkout_session_is_expired(self):
        """Test checkout session expiration check"""
        session = CheckoutSession.objects.create(
            user=self.user,
            cart=self.cart,
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        
        # Should not be expired initially
        self.assertFalse(session.is_expired())
        
        # Set expiration to past
        session.expires_at = timezone.now() - timedelta(minutes=5)
        session.save()
        
        self.assertTrue(session.is_expired())