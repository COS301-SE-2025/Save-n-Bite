"""
Simple Non-Functional Requirements Tests for Save-n-Bite Backend

These tests verify basic non-functional requirements using the actual
system components without complex setup.
"""

import time
from decimal import Decimal
from datetime import datetime, timedelta
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import CustomerProfile, FoodProviderProfile
from food_listings.models import FoodListing
from interactions.models import Cart, CartItem, Interaction

User = get_user_model()


class BasicNFRTest(APITestCase):
    """Basic NFR test setup"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.customer_user = User.objects.create_user(
            email='nfr_customer@test.com',
            username='nfr_customer',
            password='testpass123',
            user_type='customer'
        )
        
        self.provider_user = User.objects.create_user(
            email='nfr_provider@test.com',
            username='nfr_provider',
            password='testpass123',
            user_type='provider'
        )
        
        # Create profiles
        self.customer_profile, _ = CustomerProfile.objects.get_or_create(
            user=self.customer_user,
            defaults={'full_name': 'NFR Test Customer'}
        )
        
        self.provider_profile, _ = FoodProviderProfile.objects.get_or_create(
            user=self.provider_user,
            defaults={
                'business_name': 'NFR Test Restaurant',
                'business_email': 'nfr_restaurant@test.com',
                'business_address': '123 NFR Test St',
                'business_contact': '+1234567890',
                'cipc_document': 'nfr_test_doc.pdf',
                'status': 'verified'
            }
        )
        
        # Create food listing
        self.food_listing = FoodListing.objects.create(
            provider=self.provider_user,
            name='NFR Test Burger',
            description='NFR test burger',
            food_type='ready_to_eat',
            original_price=Decimal('15.99'),
            discounted_price=Decimal('12.99'),
            quantity=100,
            quantity_available=100,
            expiry_date=timezone.now().date() + timedelta(days=1),
            pickup_window='17:00-19:00'
        )


class PerformanceNFRTest(BasicNFRTest):
    """Performance-related NFR tests"""
    
    def test_nfr_1_model_creation_performance(self):
        """
        NFR-1: Model Creation Performance
        Requirement: Model operations should complete within reasonable time
        """
        start_time = time.time()
        
        # Create multiple users and profiles
        for i in range(10):
            user = User.objects.create_user(
                email=f'perf_test_{i}@test.com',
                username=f'perf_test_{i}',
                password='testpass123',
                user_type='customer'
            )
            
            CustomerProfile.objects.get_or_create(
                user=user,
                defaults={'full_name': f'Performance Test User {i}'}
            )
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within 5 seconds
        self.assertLess(execution_time, 5.0, 
                       f"Model creation took {execution_time:.2f}s, should be < 5s")
    
    def test_nfr_2_database_query_performance(self):
        """
        NFR-2: Database Query Performance
        Requirement: Database queries should be efficient
        """
        # Create additional test data
        for i in range(20):
            FoodListing.objects.create(
                provider=self.provider_user,
                name=f'Performance Test Food {i}',
                description=f'Performance test item {i}',
                food_type='ready_to_eat',
                original_price=Decimal('10.99'),
                discounted_price=Decimal('8.99'),
                quantity=50,
                quantity_available=50,
                expiry_date=timezone.now().date() + timedelta(days=1),
                pickup_window='17:00-19:00'
            )
        
        start_time = time.time()
        
        # Query food listings
        listings = FoodListing.objects.filter(
            provider=self.provider_user,
            quantity_available__gt=0
        )[:10]
        
        # Force evaluation
        list(listings)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within 1 second
        self.assertLess(execution_time, 1.0,
                       f"Query took {execution_time:.2f}s, should be < 1s")
    
    # def test_nfr_3_concurrent_operations_simulation(self):
    #     """
    #     NFR-3: Concurrent Operations Handling
    #     Requirement: System should handle multiple operations
    #     """
    #     # Simulate concurrent cart operations
    #     start_time = time.time()
        
    #     # Create multiple carts and items
    #     for i in range(5):
    #         cart, _ = Cart.objects.get_or_create(
    #             user=self.customer_user,
    #             defaults={'expires_at': timezone.now() + timedelta(hours=24)}
    #         )
            
    #         CartItem.objects.create(
    #             cart=cart,
    #             food_listing=self.food_listing,
    #             quantity=2
    #         )
        
    #     end_time = time.time()
    #     execution_time = end_time - start_time
        
    #     # Should handle concurrent operations efficiently
    #     self.assertLess(execution_time, 3.0,
    #                    f"Concurrent operations took {execution_time:.2f}s, should be < 3s")


class ReliabilityNFRTest(BasicNFRTest):
    """Reliability-related NFR tests"""
    
    def test_nfr_4_data_integrity_constraints(self):
        """
        NFR-4: Data Integrity Reliability
        Requirement: Database constraints should be enforced
        """
        # Test unique email constraint
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='nfr_customer@test.com',  # Duplicate email
                username='duplicate_user',
                password='testpass123',
                user_type='customer'
            )
    
    # def test_nfr_5_model_validation_reliability(self):
    #     """
    #     NFR-5: Model Validation Reliability
    #     Requirement: Model validation should work consistently
    #     """
    #     # Test required field validation
    #     with self.assertRaises(Exception):
    #         FoodListing.objects.create(
    #             provider=self.provider_user,
    #             # Missing required fields should cause validation error
    #             name='',  # Empty name should fail
    #             food_type='ready_to_eat',
    #             original_price=Decimal('10.00'),
    #             discounted_price=Decimal('8.00'),
    #             quantity=5,
    #             quantity_available=5,
    #             expiry_date=timezone.now().date() + timedelta(days=1),
    #             pickup_window='17:00-19:00'
    #         )
    
    def test_nfr_6_transaction_atomicity(self):
        """
        NFR-6: Transaction Reliability
        Requirement: Database transactions should be atomic
        """
        from django.db import transaction
        
        initial_count = Interaction.objects.count()
        
        try:
            with transaction.atomic():
                # Create interaction
                interaction = Interaction.objects.create(
                    interaction_type=Interaction.InteractionType.PURCHASE,
                    user=self.customer_user,
                    business=self.provider_profile,
                    quantity=1,
                    total_amount=Decimal('12.99')
                )
                
                # Force an error to test rollback
                raise Exception("Forced error for testing")
                
        except Exception:
            pass  # Expected error
        
        # Count should be unchanged due to rollback
        final_count = Interaction.objects.count()
        self.assertEqual(initial_count, final_count,
                        "Transaction should have been rolled back")


class UsabilityNFRTest(BasicNFRTest):
    """Usability-related NFR tests"""
    
    def test_nfr_7_model_string_representation(self):
        """
        NFR-7: Model Usability
        Requirement: Models should have clear string representations
        """
        # Test string representations
        user_str = str(self.customer_user)
        self.assertIn('nfr_customer@test.com', user_str)
        
        listing_str = str(self.food_listing)
        self.assertIn('NFR Test Burger', listing_str)
        
        profile_str = str(self.customer_profile)
        self.assertTrue(len(profile_str) > 0)
    
    # def test_nfr_8_model_field_accessibility(self):
    #     """
    #     NFR-8: Model Field Usability
    #     Requirement: Model fields should be easily accessible
    #     """
    #     # Test field access
    #     self.assertEqual(self.food_listing.name, 'NFR Test Burger')
    #     self.assertEqual(self.food_listing.food_type, 'ready_to_eat')
    #     self.assertEqual(self.customer_profile.full_name, 'NFR Test Customer')
    #     self.assertEqual(self.provider_profile.business_name, 'NFR Test Restaurant')


class ScalabilityNFRTest(BasicNFRTest):
    """Scalability-related NFR tests"""
    
    def test_nfr_9_large_dataset_handling(self):
        """
        NFR-9: Large Dataset Scalability
        Requirement: System should handle larger datasets efficiently
        """
        start_time = time.time()
        
        # Create a larger dataset
        listings = []
        for i in range(100):
            listing = FoodListing(
                provider=self.provider_user,
                name=f'Scalability Test Food {i}',
                description=f'Scalability test item {i}',
                food_type='ready_to_eat',
                original_price=Decimal('15.99'),
                discounted_price=Decimal('12.99'),
                quantity=10,
                quantity_available=10,
                expiry_date=timezone.now().date() + timedelta(days=1),
                pickup_window='17:00-19:00'
            )
            listings.append(listing)
        
        # Bulk create for efficiency
        FoodListing.objects.bulk_create(listings)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should handle bulk operations efficiently
        self.assertLess(execution_time, 5.0,
                       f"Bulk creation took {execution_time:.2f}s, should be < 5s")
        
        # Verify all items were created
        count = FoodListing.objects.filter(provider=self.provider_user).count()
        self.assertGreaterEqual(count, 100)
    
    # def test_nfr_10_memory_efficiency(self):
    #     """
    #     NFR-10: Memory Usage Efficiency
    #     Requirement: Operations should be memory efficient
    #     """
    #     import psutil
    #     import os
        
    #     process = psutil.Process(os.getpid())
    #     initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
    #     # Perform memory-intensive operations
    #     large_queryset = FoodListing.objects.all()
        
    #     # Process in chunks to test memory efficiency
    #     for chunk in [large_queryset[i:i+10] for i in range(0, len(large_queryset), 10)]:
    #         list(chunk)  # Force evaluation
        
    #     final_memory = process.memory_info().rss / 1024 / 1024  # MB
    #     memory_increase = final_memory - initial_memory
        
    #     # Memory increase should be reasonable (< 100MB for this test)
    #     self.assertLess(memory_increase, 100,
    #                    f"Memory increased by {memory_increase:.2f}MB, should be < 100MB")


class SystemIntegrationNFRTest(BasicNFRTest):
    """System integration NFR tests"""
    
    def test_nfr_11_component_integration_reliability(self):
        """
        NFR-11: Component Integration Reliability
        Requirement: Components should integrate reliably
        """
        # Test complete workflow integration
        cart, _ = Cart.objects.get_or_create(
            user=self.customer_user,
            defaults={'expires_at': timezone.now() + timedelta(hours=24)}
        )
        
        cart_item = CartItem.objects.create(
            cart=cart,
            food_listing=self.food_listing,
            quantity=2
        )
        
        interaction = Interaction.objects.create(
            interaction_type=Interaction.InteractionType.PURCHASE,
            user=self.customer_user,
            business=self.provider_profile,
            quantity=cart_item.quantity,
            total_amount=cart_item.total_price
        )
        
        # Verify integration
        self.assertEqual(cart.user, self.customer_user)
        self.assertEqual(cart_item.cart, cart)
        self.assertEqual(interaction.user, self.customer_user)
        self.assertEqual(interaction.business, self.provider_profile)
    
    def test_nfr_12_system_consistency(self):
        """
        NFR-12: System Consistency
        Requirement: System state should remain consistent
        """
        initial_listing_count = FoodListing.objects.count()
        initial_user_count = User.objects.count()
        
        # Perform operations
        new_user = User.objects.create_user(
            email='consistency_test@test.com',
            username='consistency_test',
            password='testpass123',
            user_type='provider'
        )
        
        new_listing = FoodListing.objects.create(
            provider=new_user,
            name='Consistency Test Food',
            description='Testing system consistency',
            food_type='ready_to_eat',
            original_price=Decimal('10.00'),
            discounted_price=Decimal('8.00'),
            quantity=5,
            quantity_available=5,
            expiry_date=timezone.now().date() + timedelta(days=1),
            pickup_window='17:00-19:00'
        )
        
        # Verify counts increased correctly
        final_listing_count = FoodListing.objects.count()
        final_user_count = User.objects.count()
        
        self.assertEqual(final_listing_count, initial_listing_count + 1)
        self.assertEqual(final_user_count, initial_user_count + 1)
        
        # Verify relationships
        self.assertEqual(new_listing.provider, new_user)
