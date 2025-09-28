"""
End-to-End Tests for Save-n-Bite Backend

These tests simulate complete user journeys and workflows from start to finish,
testing the entire system as a black box.
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

User = get_user_model()


class CustomerJourneyE2ETest(APITestCase):
    """End-to-end test for complete customer journey"""
    
    def setUp(self):
        """Set up test environment"""
        self.client = APIClient()
        
        # Create provider and food listing
        self.provider_user = User.objects.create_user(
            email='restaurant@test.com',
            username='restaurant',
            password='testpass123',
            user_type='provider'
        )
        
        self.provider_profile, _ = FoodProviderProfile.objects.get_or_create(
            user=self.provider_user,
            defaults={
                'business_name': 'Test Restaurant',
                'business_email': 'restaurant@test.com',
                'business_address': '123 Restaurant St',
                'business_contact': '+1234567890',
                'cipc_document': 'test_doc.pdf',
                'status': 'verified'
            }
        )
        
        self.food_listing = FoodListing.objects.create(
            provider=self.provider_user,
            name='Delicious Burger',
            description='A mouth-watering burger',
            food_type='ready_to_eat',
            original_price=Decimal('25.99'),
            discounted_price=Decimal('19.99'),
            quantity=20,
            quantity_available=20,
            expiry_date=timezone.now().date() + timedelta(days=1),
            pickup_window='17:00-19:00'
        )
    
    def test_complete_customer_journey(self):
        """Test complete customer journey from registration to order completion"""
        
        # 1. Customer Registration
        registration_data = {
            'email': 'customer@test.com',
            'username': 'customer',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'user_type': 'customer',
            'full_name': 'Test Customer'
        }
        
        response = self.client.post('/api/auth/register/customer/', registration_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Customer Login
        login_data = {
            'email': 'customer@test.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract token and authenticate client
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # 3. Browse Food Listings
        response = self.client.get('/api/food-listings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)
        
        # 4. Add Item to Cart
        cart_data = {
            'food_listing': self.food_listing.id,
            'quantity': 2
        }
        response = self.client.post('/cart/add-to-cart/', cart_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 5. View Cart
        response = self.client.get('/cart/view/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
        
        # 6. Checkout
        order_data = {
            'delivery_address': '456 Customer Ave',
            'payment_method': 'card',
            'special_instructions': 'Please ring doorbell'
        }
        response = self.client.post('/cart/checkout/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        order_id = response.data['id']
        
        # 7. Check Order Status
        response = self.client.get(f'/cart/orders/{order_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'pending')
        
        # 8. Provider accepts order (simulate provider action)
        provider_client = APIClient()
        provider_token = RefreshToken.for_user(self.provider_user).access_token
        provider_client.credentials(HTTP_AUTHORIZATION=f'Bearer {provider_token}')
        
        response = provider_client.patch(
            f'/cart/orders/{order_id}/status/',
            {'status': 'accepted'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 9. Check updated order status
        response = self.client.get(f'/cart/orders/{order_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'accepted')
        
        # 10. Mark order as completed (simulate provider action)
        response = provider_client.patch(
            f'/cart/orders/{order_id}/status/',
            {'status': 'completed'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 11. Leave a review
        review_data = {
            'provider': self.provider_user.id,
            'rating': 5,
            'comment': 'Amazing food and fast delivery!',
            'order': order_id
        }
        
        response = self.client.post('/api/reviews/', review_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 12. Check notifications
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should have notifications about order status changes


class ProviderJourneyE2ETest(APITestCase):
    """End-to-end test for food provider journey"""
    
    def test_provider_onboarding_and_operations(self):
        """Test complete provider journey from registration to order management"""
        
        # 1. Provider Registration
        cipc_file = SimpleUploadedFile(
            "cipc.pdf", 
            b"fake cipc content", 
            content_type="application/pdf"
        )
        
        registration_data = {
            'email': 'newrestaurant@test.com',
            'username': 'newrestaurant',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'user_type': 'provider',
            'business_name': 'New Restaurant',
            'business_email': 'newrestaurant@test.com',
            'business_address': '789 Business St',
            'business_contact': '+9876543210',
            'cipc_document': cipc_file
        }
        
        response = self.client.post('/api/auth/register/provider/', registration_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Provider Login
        login_data = {
            'email': 'newrestaurant@test.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # 3. Check verification status (should be pending)
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Note: In real scenario, admin would verify the provider
        
        # 4. Simulate admin verification
        provider_user = User.objects.get(email='newrestaurant@test.com')
        provider_profile = FoodProviderProfile.objects.get(user=provider_user)
        provider_profile.status = 'verified'
        provider_profile.save()
        
        # 5. Create food listing
        listing_data = {
            'name': 'Chocolate Cake',
            'description': 'Rich chocolate cake',
            'food_type': 'baked_goods',
            'original_price': '15.99',
            'discounted_price': '12.99',
            'quantity': 5,
            'expiry_date': (timezone.now().date() + timedelta(days=2)).isoformat(),
            'pickup_window': '16:00-18:00'
        }
        
        response = self.client.post('/api/food-listings/', listing_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        listing_id = response.data['id']
        
        # 7. View own listings
        response = self.client.get('/api/food-listings/my-listings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # 8. Update listing
        update_data = {
            'price': '14.99',
            'quantity': 8
        }
        
        response = self.client.patch(f'/api/food-listings/{listing_id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['price']), 14.99)


class NGOJourneyE2ETest(APITestCase):
    """End-to-end test for NGO journey"""
    
    def setUp(self):
        """Set up test environment"""
        # Create provider with food listing for donations
        self.provider_user = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            user_type='provider'
        )
        
        self.provider_profile, _ = FoodProviderProfile.objects.get_or_create(
            user=self.provider_user,
            defaults={
                'business_name': 'Generous Restaurant',
                'business_email': 'generous@test.com',
                'business_address': '123 Generous St',
                'business_contact': '+1234567890',
                'cipc_document': 'test_doc.pdf',
                'status': 'verified'
            }
        )
        
        self.food_listing = FoodListing.objects.create(
            provider=self.provider_user,
            name='Surplus Meals',
            description='Healthy surplus meals',
            food_type='ready_to_eat',
            original_price=Decimal('15.00'),
            discounted_price=Decimal('0.00'),
            quantity=50,
            quantity_available=50,
            expiry_date=timezone.now().date() + timedelta(hours=6),
            pickup_window='18:00-20:00'
        )
    
    def test_ngo_donation_workflow(self):
        """Test complete NGO workflow for accepting donations"""
        
        # 1. NGO Registration
        npo_file = SimpleUploadedFile(
            "npo.pdf", 
            b"fake npo content", 
            content_type="application/pdf"
        )
        
        registration_data = {
            'email': 'helpinghands@test.com',
            'username': 'helpinghands',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'user_type': 'ngo',
            'organisation_name': 'Helping Hands NGO',
            'representative_name': 'Jane Doe',
            'organisation_email': 'helpinghands@test.com',
            'npo_document': npo_file
        }
        
        response = self.client.post('/api/auth/register/ngo/', registration_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. NGO Login
        login_data = {
            'email': 'helpinghands@test.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # 3. Provider creates donation (simulate provider action)
        provider_client = APIClient()
        provider_token = RefreshToken.for_user(self.provider_user).access_token
        provider_client.credentials(HTTP_AUTHORIZATION=f'Bearer {provider_token}')
        
        donation_data = {
            'food_listing': self.food_listing.id,
            'quantity': 25,
            'pickup_location': 'Restaurant Back Door',
            'pickup_time_start': (timezone.now() + timedelta(hours=1)).isoformat(),
            'pickup_time_end': (timezone.now() + timedelta(hours=3)).isoformat(),
            'special_instructions': 'Please bring insulated bags'
        }
        
        response = provider_client.post('/cart/donations/create/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        donation_id = response.data['id']
        
        # 4. NGO views available donations
        response = self.client.get('/cart/donations/available/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)
        
        # 5. NGO accepts donation
        response = self.client.post(f'/cart/donations/{donation_id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 6. NGO views accepted donations
        response = self.client.get('/cart/donations/my-donations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # 7. NGO marks donation as collected
        response = self.client.patch(
            f'/cart/donations/{donation_id}/status/',
            {'status': 'completed'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AdminWorkflowE2ETest(APITestCase):
    """End-to-end test for admin workflows"""
    
    def setUp(self):
        """Set up admin user"""
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='adminpass123',
            user_type='customer',
            role='admin',
            admin_rights=True
        )
        
        # Create pending provider for verification
        self.pending_provider = User.objects.create_user(
            email='pending@test.com',
            username='pending',
            password='testpass123',
            user_type='provider'
        )
        
        self.pending_profile, _ = FoodProviderProfile.objects.get_or_create(
            user=self.pending_provider,
            defaults={
                'business_name': 'Pending Restaurant',
                'business_email': 'pending@test.com',
                'business_address': '456 Pending St',
                'business_contact': '+1111111111',
                'cipc_document': 'pending_doc.pdf',
                'status': 'pending_verification'
            }
        )
    
    def test_admin_provider_verification_workflow(self):
        """Test admin workflow for verifying providers"""
        
        # 1. Admin Login
        login_data = {
            'email': 'admin@test.com',
            'password': 'adminpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # 2. View pending verifications
        response = self.client.get('/api/admin/pending-verifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)
        
        # 3. Approve provider
        approval_data = {
            'status': 'verified',
            'admin_notes': 'Documents verified successfully'
        }
        
        response = self.client.patch(
            f'/api/admin/providers/{self.pending_profile.id}/verify/',
            approval_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Verify provider status was updated
        self.pending_profile.refresh_from_db()
        self.assertEqual(self.pending_profile.status, 'verified')
        
        # 5. Check that notification was sent to provider
        notifications = Notification.objects.filter(
            user=self.pending_provider,
            notification_type='verification_approved'
        )
        self.assertTrue(notifications.exists())


class SystemIntegrationE2ETest(APITestCase):
    """Test system-wide integration scenarios"""
    
    def test_multi_user_concurrent_operations(self):
        """Test system behavior with multiple users performing operations"""
        
        # Create multiple users
        customers = []
        for i in range(3):
            user = User.objects.create_user(
                email=f'customer{i}@test.com',
                username=f'customer{i}',
                password='testpass123',
                user_type='customer'
            )
            profile, _ = CustomerProfile.objects.get_or_create(
                user=user,
                defaults={'full_name': f'Customer {i}'}
            )
            customers.append((user, profile))
        
        # Create provider and food listing
        provider_user = User.objects.create_user(
            email='busy_restaurant@test.com',
            username='busy_restaurant',
            password='testpass123',
            user_type='provider'
        )
        
        provider_profile, _ = FoodProviderProfile.objects.get_or_create(
            user=provider_user,
            defaults={
                'business_name': 'Busy Restaurant',
                'business_email': 'busy@test.com',
                'business_address': '789 Busy St',
                'business_contact': '+9999999999',
                'cipc_document': 'busy_doc.pdf',
                'status': 'verified'
            }
        )
        
        food_listing = FoodListing.objects.create(
            provider=provider_user,
            name='Special Dish',
            description='Limited quantity special dish',
            food_type='ready_to_eat',
            original_price=Decimal('19.99'),
            discounted_price=Decimal('15.99'),
            quantity=5,  # Limited quantity
            quantity_available=5,
            expiry_date=timezone.now().date() + timedelta(days=1),
            pickup_window='17:00-19:00'
        )
        
        # Simulate concurrent orders from multiple customers
        successful_orders = 0
        
        for user, profile in customers:
            client = APIClient()
            token = RefreshToken.for_user(user).access_token
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            # Try to add to cart and checkout
            cart_data = {
                'food_listing': food_listing.id,
                'quantity': 2
            }
            
            response = client.post('/cart/add-to-cart/', cart_data)
            if response.status_code == status.HTTP_201_CREATED:
                order_data = {
                    'delivery_address': f'Customer {customers.index((user, profile))} Address',
                    'payment_method': 'card'
                }
                
                checkout_response = client.post('/cart/checkout/', order_data)
                if checkout_response.status_code == status.HTTP_201_CREATED:
                    successful_orders += 1
        
        # Verify inventory management worked correctly
        food_listing.refresh_from_db()
        expected_remaining = max(0, 5 - (successful_orders * 2))
        self.assertEqual(food_listing.quantity, expected_remaining)
        
        # Verify only valid number of orders were created
        total_orders = Order.objects.filter(
            items__food_listing=food_listing
        ).count()
        self.assertEqual(total_orders, successful_orders)
