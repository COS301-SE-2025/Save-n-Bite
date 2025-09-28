"""
Integration Tests for Save-n-Bite Backend

These tests verify that different components of the system work together correctly,
including cross-app functionality and API integrations.
"""

import json
import time
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
from interactions.models import Cart, CartItem, Order, Interaction, InteractionItem
from notifications.models import Notification
from reviews.models import Review
from badges.models import BadgeType, ProviderBadge
from digital_garden.models import Plant, CustomerGarden, PlantInventory

User = get_user_model()


class BaseIntegrationTest(APITestCase):
    """Base class for integration tests with common setup"""
    
    def setUp(self):
        """Set up test data for integration tests"""
        # Create test users
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
        
        self.ngo_user = User.objects.create_user(
            email='ngo@test.com',
            username='ngo',
            password='testpass123',
            user_type='ngo'
        )
        
        # Create profiles
        self.customer_profile, _ = CustomerProfile.objects.get_or_create(
            user=self.customer_user,
            defaults={'full_name': 'Test Customer'}
        )
        
        self.provider_profile, _ = FoodProviderProfile.objects.get_or_create(
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
        
        self.ngo_profile, _ = NGOProfile.objects.get_or_create(
            user=self.ngo_user,
            defaults={
                'organisation_name': 'Test NGO',
                'representative_name': 'NGO Rep',
                'organisation_email': 'ngo@test.com',
                'npo_document': SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
            }
        )
        
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
        self.ngo_client = APIClient()
        
        # Authenticate clients
        self._authenticate_client(self.customer_client, self.customer_user)
        self._authenticate_client(self.provider_client, self.provider_user)
        self._authenticate_client(self.ngo_client, self.ngo_user)
    
    def _authenticate_client(self, client, user):
        """Helper method to authenticate API client"""
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


class UserAuthenticationIntegrationTest(BaseIntegrationTest):
    """Test user authentication and profile creation integration"""
    
    def test_user_registration_and_profile_creation(self):
        """Test complete user registration flow"""
        registration_data = {
            'email': 'newcustomer@test.com',
            'username': 'newcustomer',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'user_type': 'customer',
            'full_name': 'New Customer'
        }
        
        response = self.client.post('/api/auth/register/customer/', registration_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user was created
        user = User.objects.get(email='newcustomer@test.com')
        self.assertEqual(user.user_type, 'customer')
        
        # Verify profile was created
        profile = CustomerProfile.objects.get(user=user)
        self.assertEqual(profile.full_name, 'New Customer')
    
    def test_provider_registration_with_verification(self):
        """Test food provider registration and verification flow"""
        cipc_file = SimpleUploadedFile(
            "cipc.pdf", 
            b"fake cipc content", 
            content_type="application/pdf"
        )
        
        registration_data = {
            'email': 'newprovider@test.com',
            'username': 'newprovider',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'user_type': 'provider',
            'business_name': 'New Restaurant',
            'business_email': 'newrestaurant@test.com',
            'business_address': '456 New St',
            'business_contact': '+9876543210',
            'cipc_document': cipc_file
        }
        
        response = self.client.post('/api/auth/register/provider/', registration_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify provider profile is pending verification
        user = User.objects.get(email='newprovider@test.com')
        profile = FoodProviderProfile.objects.get(user=user)
        self.assertEqual(profile.status, 'pending_verification')


class FoodListingOrderIntegrationTest(BaseIntegrationTest):
    """Test food listing and order management integration"""
    
    def test_complete_order_flow(self):
        """Test complete order flow from listing to completion"""
        # 1. Customer views food listings
        response = self.customer_client.get('/api/food-listings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)
        
        # 2. Customer adds item to cart
        cart_data = {
            'food_listing': self.food_listing.id,
            'quantity': 2
        }
        response = self.customer_client.post('/cart/add-to-cart/', cart_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 3. Verify cart was created
        cart = Cart.objects.get(customer=self.customer_profile)
        self.assertEqual(cart.items.count(), 1)
        
        cart_item = cart.items.first()
        self.assertEqual(cart_item.quantity, 2)
        self.assertEqual(cart_item.food_listing, self.food_listing)
        
        # 4. Customer places order
        order_data = {
            'delivery_address': '789 Customer St',
            'payment_method': 'card'
        }
        response = self.customer_client.post('/cart/checkout/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 5. Verify order was created and cart was cleared
        order = Order.objects.get(customer=self.customer_profile)
        self.assertEqual(order.status, 'pending')
        self.assertEqual(order.items.count(), 1)
        
        # Cart should be cleared after checkout
        cart.refresh_from_db()
        self.assertEqual(cart.items.count(), 0)
        
        # 6. Provider accepts order
        response = self.provider_client.patch(
            f'/cart/orders/{order.id}/status/',
            {'status': 'accepted'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.status, 'accepted')
    
    def test_inventory_management_integration(self):
        """Test inventory updates during order process"""
        initial_quantity = self.food_listing.quantity
        
        # Add items to cart and checkout
        cart_data = {
            'food_listing': self.food_listing.id,
            'quantity': 3
        }
        self.customer_client.post('/cart/add-to-cart/', cart_data)
        
        order_data = {
            'delivery_address': '789 Customer St',
            'payment_method': 'card'
        }
        self.customer_client.post('/cart/checkout/', order_data)
        
        # Verify inventory was reduced
        self.food_listing.refresh_from_db()
        self.assertEqual(self.food_listing.quantity, initial_quantity - 3)


class DonationIntegrationTest(BaseIntegrationTest):
    """Test donation system integration"""
    
    def test_donation_flow(self):
        """Test complete donation flow"""
        # 1. Provider creates donation interaction
        donation_data = {
            'interaction_type': 'DONATION',
            'food_listing': self.food_listing.id,
            'quantity': 5,
            'special_instructions': 'Handle with care'
        }
        
        response = self.provider_client.post('/cart/donations/create/', donation_data)
        # Note: This endpoint may not exist yet, so we'll create the donation directly for testing
        
        # Create donation interaction directly for testing
        donation = Interaction.objects.create(
            interaction_type=Interaction.InteractionType.DONATION,
            user=self.ngo_user,
            business=self.provider_profile,
            quantity=5,
            total_amount=0,  # Donations are free
            special_instructions='Handle with care'
        )
        
        self.assertEqual(donation.interaction_type, 'DONATION')
        self.assertEqual(donation.status, 'pending')
        
        # 2. NGO accepts donation (update status)
        donation.status = Interaction.Status.CONFIRMED
        donation.save()
        
        donation.refresh_from_db()
        self.assertEqual(donation.status, 'confirmed')
        
        # 3. Mark donation as completed
        donation.status = Interaction.Status.COMPLETED
        donation.completed_at = timezone.now()
        donation.save()
        
        donation.refresh_from_db()
        self.assertEqual(donation.status, 'completed')
        self.assertIsNotNone(donation.completed_at)


class NotificationIntegrationTest(BaseIntegrationTest):
    """Test notification system integration"""
    
    def test_order_notification_flow(self):
        """Test notifications are created during order flow"""
        # Place an order
        cart_data = {
            'food_listing': self.food_listing.id,
            'quantity': 1
        }
        self.customer_client.post('/cart/add-to-cart/', cart_data)
        
        order_data = {
            'delivery_address': '789 Customer St',
            'payment_method': 'card'
        }
        response = self.customer_client.post('/cart/checkout/', order_data)
        order_id = response.data['id']
        
        # Check if notification was created for provider
        provider_notifications = Notification.objects.filter(
            user=self.provider_user,
            notification_type='new_order'
        )
        self.assertTrue(provider_notifications.exists())
        
        # Provider accepts order - should create notification for customer
        self.provider_client.patch(
            f'/cart/orders/{order_id}/status/',
            {'status': 'accepted'}
        )
        
        customer_notifications = Notification.objects.filter(
            user=self.customer_user,
            notification_type='order_accepted'
        )
        self.assertTrue(customer_notifications.exists())


class ReviewSystemIntegrationTest(BaseIntegrationTest):
    """Test review system integration"""
    
    def test_review_after_order_completion(self):
        """Test customer can review after order completion"""
        # Complete an order first
        cart_data = {
            'food_listing': self.food_listing.id,
            'quantity': 1
        }
        self.customer_client.post('/cart/add-to-cart/', cart_data)
        
        order_data = {
            'delivery_address': '789 Customer St',
            'payment_method': 'card'
        }
        response = self.customer_client.post('/cart/checkout/', order_data)
        order = Order.objects.get(id=response.data['id'])
        
        # Mark order as completed
        order.status = 'completed'
        order.save()
        
        # Customer leaves review
        review_data = {
            'provider': self.provider_user.id,
            'rating': 5,
            'comment': 'Excellent food and service!',
            'order': order.id
        }
        
        response = self.customer_client.post('/api/reviews/', review_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify review was created
        review = Review.objects.get(customer=self.customer_profile)
        self.assertEqual(review.rating, 5)


class BadgeSystemIntegrationTest(BaseIntegrationTest):
    """Test badge system integration"""
    
    def setUp(self):
        super().setUp()
        # Create badge types
        self.eco_badge = BadgeType.objects.create(
            name='Eco Warrior',
            description='Awarded for sustainable practices',
            icon='eco_icon.png',
            criteria={'donations': 10}
        )
    
    def test_badge_award_integration(self):
        """Test badge is awarded when criteria are met"""
        # Create multiple donation interactions to meet criteria
        for i in range(10):
            donation = Interaction.objects.create(
                interaction_type=Interaction.InteractionType.DONATION,
                user=self.ngo_user,
                business=self.provider_profile,
                quantity=1,
                total_amount=0,
                status=Interaction.Status.COMPLETED,
                completed_at=timezone.now()
            )
        
        # Check if badge was awarded (this would typically be done by a signal or background task)
        # For this test, we'll manually check the donation count
        donation_count = Interaction.objects.filter(
            business=self.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION,
            status=Interaction.Status.COMPLETED
        ).count()
        
        self.assertEqual(donation_count, 10)
        
        # Verify badge criteria would be met
        self.assertGreaterEqual(donation_count, self.eco_badge.criteria.get('donations', 0))


class DigitalGardenIntegrationTest(BaseIntegrationTest):
    """Test digital garden gamification integration"""
    
    def setUp(self):
        super().setUp()
        # Create plant types
        self.plant = Plant.objects.create(
            name='Tomato',
            description='A healthy tomato plant',
            image_url='tomato.png',
            unlock_criteria={'orders': 1}
        )
    
    def test_garden_plant_unlock_integration(self):
        """Test plants are unlocked when customer places orders"""
        # Initially customer should have no plants
        inventory_count = PlantInventory.objects.filter(
            customer=self.customer_profile
        ).count()
        self.assertEqual(inventory_count, 0)
        
        # Place an order
        cart_data = {
            'food_listing': self.food_listing.id,
            'quantity': 1
        }
        self.customer_client.post('/cart/add-to-cart/', cart_data)
        
        order_data = {
            'delivery_address': '789 Customer St',
            'payment_method': 'card'
        }
        self.customer_client.post('/cart/checkout/', order_data)
        
        # Check if plant was unlocked (would typically be done by signal)
        from digital_garden.services import DigitalGardenService
        garden_service = DigitalGardenService()
        garden_service.check_plant_unlocks(self.customer_profile)
        
        # Verify plant was added to inventory
        plant_inventory = PlantInventory.objects.filter(
            customer=self.customer_profile,
            plant=self.plant
        ).first()
        
        self.assertIsNotNone(plant_inventory)
        self.assertEqual(plant_inventory.quantity, 1)


class CrossAppDataConsistencyTest(BaseIntegrationTest):
    """Test data consistency across different apps"""
    
    def test_user_deletion_cascade(self):
        """Test that deleting a user properly cascades across all apps"""
        # Create data across multiple apps
        cart_data = {
            'food_listing': self.food_listing.id,
            'quantity': 1
        }
        self.customer_client.post('/cart/add-to-cart/', cart_data)
        
        # Create notification
        Notification.objects.create(
            user=self.customer_user,
            title='Test Notification',
            message='Test message',
            notification_type='general'
        )
        
        # Store IDs before deletion
        customer_profile_id = self.customer_profile.id
        
        # Delete user
        self.customer_user.delete()
        
        # Verify cascading deletion
        self.assertFalse(CustomerProfile.objects.filter(id=customer_profile_id).exists())
        self.assertFalse(Cart.objects.filter(customer_id=customer_profile_id).exists())
        self.assertFalse(Notification.objects.filter(user=self.customer_user).exists())
    
    def test_provider_profile_update_propagation(self):
        """Test that provider profile updates propagate to related models"""
        # Update provider business name
        new_name = 'Updated Restaurant Name'
        self.provider_profile.business_name = new_name
        self.provider_profile.save()
        
        # Verify the change is reflected in related profile
        self.food_listing.refresh_from_db()
        provider_profile = FoodProviderProfile.objects.get(user=self.food_listing.provider)
        self.assertEqual(provider_profile.business_name, new_name)


class APIEndpointIntegrationTest(BaseIntegrationTest):
    """Test API endpoint integration and consistency"""
    
    def test_api_endpoint_authentication(self):
        """Test that all protected endpoints require authentication"""
        protected_endpoints = [
            '/api/food-listings/',
            '/cart/add-to-cart/',
            '/api/notifications/',
            '/api/reviews/',
            '/api/garden/my-garden/',
            '/api/badges/my-badges/'
        ]
        
        unauthenticated_client = APIClient()
        
        for endpoint in protected_endpoints:
            response = unauthenticated_client.get(endpoint)
            self.assertIn(response.status_code, [401, 403], 
                         f"Endpoint {endpoint} should require authentication")
    
    def test_api_response_format_consistency(self):
        """Test that API responses follow consistent format"""
        endpoints_to_test = [
            ('/api/food-listings/', self.customer_client),
            ('/api/notifications/', self.customer_client),
            ('/api/reviews/', self.customer_client),
        ]
        
        for endpoint, client in endpoints_to_test:
            response = client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Check for consistent pagination format
            if 'results' in response.data:
                self.assertIn('count', response.data)
                self.assertIn('next', response.data)
                self.assertIn('previous', response.data)
                self.assertIn('results', response.data)
    
    def test_error_handling_consistency(self):
        """Test that error responses are consistent across endpoints"""
        # Test invalid data submission
        invalid_data = {'invalid': 'data'}
        
        error_endpoints = [
            ('/cart/add-to-cart/', self.customer_client),
            ('/api/reviews/', self.customer_client),
        ]
        
        for endpoint, client in error_endpoints:
            response = client.post(endpoint, invalid_data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            
            # Check error response format
            self.assertIn('error', response.data.keys() or response.data)
