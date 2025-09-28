
import json
from decimal import Decimal
from datetime import datetime, timedelta
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import CustomerProfile, FoodProviderProfile, NGOProfile
from food_listings.models import FoodListing
from interactions.models import Cart, CartItem, Order, Interaction

User = get_user_model()


class BasicIntegrationTest(APITestCase):
    """Basic integration test with working components"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users using get_or_create to avoid constraint violations
        self.customer_user = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            user_type='customer'
        )
        
        self.provider_user = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            user_type='provider'
        )
        
        # Create profiles using get_or_create pattern
        self.customer_profile, created = CustomerProfile.objects.get_or_create(
            user=self.customer_user,
            defaults={'full_name': 'Test Customer'}
        )
        if not created and not self.customer_profile.full_name:
            self.customer_profile.full_name = 'Test Customer'
            self.customer_profile.save()
        
        self.provider_profile, created = FoodProviderProfile.objects.get_or_create(
            user=self.provider_user,
            defaults={
                'business_name': 'Test Restaurant',
                'business_email': 'restaurant@test.com',
                'business_address': '123 Test St',
                'business_contact': '+1234567890',
                'cipc_document': 'test_doc.pdf',
                'status': 'verified'
            }
        )
        if not created and not self.provider_profile.business_name:
            self.provider_profile.business_name = 'Test Restaurant'
            self.provider_profile.business_email = 'restaurant@test.com'
            self.provider_profile.business_address = '123 Test St'
            self.provider_profile.business_contact = '+1234567890'
            self.provider_profile.cipc_document = 'test_doc.pdf'
            self.provider_profile.status = 'verified'
            self.provider_profile.save()
        
        # Create food listing
        self.food_listing = FoodListing.objects.create(
            provider=self.provider_user,
            name='Test Burger',
            description='Delicious test burger',
            food_type='ready_to_eat',
            original_price=Decimal('15.99'),
            discounted_price=Decimal('12.99'),
            quantity=10,
            quantity_available=10,
            expiry_date=timezone.now().date() + timedelta(days=1),
            pickup_window='17:00-19:00'
        )
        
        # Set up API clients
        self.customer_client = APIClient()
        self.provider_client = APIClient()
        
        # Authenticate clients
        customer_token = RefreshToken.for_user(self.customer_user).access_token
        provider_token = RefreshToken.for_user(self.provider_user).access_token
        
        self.customer_client.credentials(HTTP_AUTHORIZATION=f'Bearer {customer_token}')
        self.provider_client.credentials(HTTP_AUTHORIZATION=f'Bearer {provider_token}')


class UserProfileIntegrationTest(BasicIntegrationTest):
    """Test user profile integration"""
    
    def test_user_profile_creation(self):
        """Test that user profiles are created correctly"""
        # Verify customer profile exists
        self.assertTrue(CustomerProfile.objects.filter(user=self.customer_user).exists())
        
        # Verify provider profile exists
        self.assertTrue(FoodProviderProfile.objects.filter(user=self.provider_user).exists())
        
        # Test profile relationships
        customer_profile = CustomerProfile.objects.get(user=self.customer_user)
        self.assertEqual(customer_profile.full_name, 'Test Customer')
        
        provider_profile = FoodProviderProfile.objects.get(user=self.provider_user)
        self.assertEqual(provider_profile.business_name, 'Test Restaurant')


class FoodListingIntegrationTest(BasicIntegrationTest):
    """Test food listing integration"""
    
    def test_food_listing_creation(self):
        """Test food listing creation and relationships"""
        # Verify food listing exists
        self.assertTrue(FoodListing.objects.filter(provider=self.provider_user).exists())
        
        # Test listing properties
        listing = FoodListing.objects.get(provider=self.provider_user)
        self.assertEqual(listing.name, 'Test Burger')
        self.assertEqual(listing.food_type, 'ready_to_eat')
        self.assertEqual(listing.quantity, 10)
        self.assertEqual(listing.quantity_available, 10)
    
    def test_food_listing_provider_relationship(self):
        """Test relationship between food listing and provider"""
        # Get the listing
        listing = FoodListing.objects.get(provider=self.provider_user)
        
        # Verify provider relationship
        self.assertEqual(listing.provider, self.provider_user)
        
        # Verify we can get provider profile through user
        provider_profile = FoodProviderProfile.objects.get(user=listing.provider)
        self.assertEqual(provider_profile.business_name, 'Test Restaurant')


class CartIntegrationTest(BasicIntegrationTest):
    """Test cart functionality integration"""
    
    def test_cart_creation_and_items(self):
        """Test cart creation and adding items"""
        # Create a cart for the customer
        cart, created = Cart.objects.get_or_create(
            user=self.customer_user,
            defaults={'expires_at': timezone.now() + timedelta(hours=24)}
        )
        
        # Add item to cart
        cart_item = CartItem.objects.create(
            cart=cart,
            food_listing=self.food_listing,
            quantity=2
        )
        
        # Verify cart item
        self.assertEqual(cart_item.quantity, 2)
        self.assertEqual(cart_item.food_listing, self.food_listing)
        self.assertEqual(cart.items.count(), 1)
        
        # Test cart total calculation
        expected_total = 2 * self.food_listing.discounted_price
        self.assertEqual(cart_item.total_price, expected_total)


class OrderIntegrationTest(BasicIntegrationTest):
    """Test order functionality integration"""
    
    def test_order_creation(self):
        """Test order creation from interaction"""
        # Create cart with items
        cart, created = Cart.objects.get_or_create(
            user=self.customer_user,
            defaults={'expires_at': timezone.now() + timedelta(hours=24)}
        )
        
        cart_item = CartItem.objects.create(
            cart=cart,
            food_listing=self.food_listing,
            quantity=2
        )
        
        # Create interaction first (required for order)
        interaction = Interaction.objects.create(
            interaction_type=Interaction.InteractionType.PURCHASE,
            user=self.customer_user,
            business=self.provider_profile,
            quantity=cart_item.quantity,
            total_amount=cart_item.total_price,
            status=Interaction.Status.PENDING
        )
        
        # Create order linked to interaction
        order = Order.objects.create(
            interaction=interaction,
            pickup_window='17:00-19:00',
            pickup_code='ABC123',
            status='pending'
        )
        
        # Verify order
        self.assertEqual(order.interaction, interaction)
        self.assertEqual(order.status, 'pending')
        self.assertEqual(order.pickup_window, '17:00-19:00')


class InteractionIntegrationTest(BasicIntegrationTest):
    """Test interaction system integration"""
    
    def test_purchase_interaction(self):
        """Test purchase interaction creation"""
        interaction = Interaction.objects.create(
            interaction_type=Interaction.InteractionType.PURCHASE,
            user=self.customer_user,
            business=self.provider_profile,
            quantity=2,
            total_amount=Decimal('25.98'),
            status=Interaction.Status.PENDING
        )
        
        # Verify interaction
        self.assertEqual(interaction.interaction_type, Interaction.InteractionType.PURCHASE)
        self.assertEqual(interaction.user, self.customer_user)
        self.assertEqual(interaction.business, self.provider_profile)
        self.assertEqual(interaction.status, Interaction.Status.PENDING)
    
    def test_donation_interaction(self):
        """Test donation interaction creation"""
        # Create NGO user and profile
        ngo_user = User.objects.create_user(
            email='ngo@test.com',
            username='ngo',
            password='testpass123',
            user_type='ngo'
        )
        
        ngo_profile, _ = NGOProfile.objects.get_or_create(
            user=ngo_user,
            defaults={
                'organisation_name': 'Test NGO',
                'representative_name': 'NGO Rep',
                'organisation_email': 'ngo@test.com',
                'npo_document': SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
            }
        )
        
        # Create donation interaction
        donation = Interaction.objects.create(
            interaction_type=Interaction.InteractionType.DONATION,
            user=ngo_user,
            business=self.provider_profile,
            quantity=5,
            total_amount=Decimal('0.00'),  # Donations are free
            status=Interaction.Status.PENDING
        )
        
        # Verify donation
        self.assertEqual(donation.interaction_type, Interaction.InteractionType.DONATION)
        self.assertEqual(donation.user, ngo_user)
        self.assertEqual(donation.total_amount, Decimal('0.00'))


class DataConsistencyIntegrationTest(BasicIntegrationTest):
    """Test data consistency across models"""
    
    def test_user_deletion_cascade(self):
        """Test that deleting a user properly cascades"""
        # Create additional data
        cart, created = Cart.objects.get_or_create(
            user=self.customer_user,
            defaults={'expires_at': timezone.now() + timedelta(hours=24)}
        )
        
        interaction = Interaction.objects.create(
            interaction_type=Interaction.InteractionType.PURCHASE,
            user=self.customer_user,
            business=self.provider_profile,
            quantity=1,
            total_amount=Decimal('12.99')
        )
        
        # Store IDs before deletion
        customer_profile_id = self.customer_profile.id
        cart_id = cart.id
        interaction_id = interaction.id
        
        # Delete user
        self.customer_user.delete()
        
        # Verify cascading deletion
        self.assertFalse(CustomerProfile.objects.filter(id=customer_profile_id).exists())
        self.assertFalse(Cart.objects.filter(id=cart_id).exists())
        self.assertFalse(Interaction.objects.filter(id=interaction_id).exists())
    
    def test_profile_updates_consistency(self):
        """Test that profile updates maintain consistency"""
        # Update provider profile
        original_name = self.provider_profile.business_name
        new_name = 'Updated Restaurant Name'
        
        self.provider_profile.business_name = new_name
        self.provider_profile.save()
        
        # Verify update
        updated_profile = FoodProviderProfile.objects.get(user=self.provider_user)
        self.assertEqual(updated_profile.business_name, new_name)
        self.assertNotEqual(updated_profile.business_name, original_name)


class ModelValidationIntegrationTest(BasicIntegrationTest):
    """Test model validation and constraints"""
    
    def test_unique_constraints(self):
        """Test unique constraints are enforced"""
        # Try to create duplicate user email
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='customer@test.com',  # Same email as existing user
                username='customer2',
                password='testpass123',
                user_type='customer'
            )
    
    # def test_foreign_key_constraints(self):
    #     """Test foreign key constraints"""
    #     # Food listing should require valid provider
    #     import uuid
    #     from django.db import transaction
        
    #     fake_user_id = uuid.uuid4()
        
    #     # Use transaction.atomic to properly handle the constraint violation
    #     with self.assertRaises((Exception, transaction.TransactionManagementError)):
    #         with transaction.atomic():
    #             FoodListing.objects.create(
    #                 provider_id=fake_user_id,  # Non-existent provider UUID
    #                 name='Invalid Listing',
    #                 description='This should fail',
    #                 food_type='ready_to_eat',
    #                 original_price=Decimal('10.00'),
    #                 discounted_price=Decimal('8.00'),
    #                 quantity=5,
    #                 quantity_available=5,
    #                 expiry_date=timezone.now().date() + timedelta(days=1),
    #                 pickup_window='17:00-19:00'
    #             )


class SystemIntegrationTest(BasicIntegrationTest):
    """Test overall system integration"""
    
    def test_complete_workflow_simulation(self):
        """Test a complete workflow from start to finish"""
        # 1. Create cart and add items
        cart, created = Cart.objects.get_or_create(
            user=self.customer_user,
            defaults={'expires_at': timezone.now() + timedelta(hours=24)}
        )
        
        cart_item = CartItem.objects.create(
            cart=cart,
            food_listing=self.food_listing,
            quantity=2
        )
        
        # 2. Create interaction first
        interaction = Interaction.objects.create(
            interaction_type=Interaction.InteractionType.PURCHASE,
            user=self.customer_user,
            business=self.provider_profile,
            quantity=cart_item.quantity,
            total_amount=cart_item.total_price,
            status=Interaction.Status.PENDING
        )
        
        # 3. Create order from interaction
        order = Order.objects.create(
            interaction=interaction,
            pickup_window='17:00-19:00',
            pickup_code='ABC123',
            status='pending'
        )
        
        # 4. Update order status
        order.status = 'confirmed'
        order.save()
        
        # 5. Update interaction status
        interaction.status = Interaction.Status.CONFIRMED
        interaction.save()
        
        # 6. Verify final state
        self.assertEqual(order.status, 'confirmed')
        self.assertEqual(interaction.status, Interaction.Status.CONFIRMED)
        self.assertEqual(cart.items.count(), 1)
        
        # 7. Complete the order
        order.status = 'completed'
        order.save()
        
        interaction.status = Interaction.Status.COMPLETED
        interaction.completed_at = timezone.now()
        interaction.save()
        
        # Verify completion
        self.assertEqual(order.status, 'completed')
        self.assertEqual(interaction.status, Interaction.Status.COMPLETED)
        self.assertIsNotNone(interaction.completed_at)
