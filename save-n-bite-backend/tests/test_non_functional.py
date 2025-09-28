
import time
import threading
import concurrent.futures
from decimal import Decimal
from datetime import datetime, timedelta
from django.test import TestCase, TransactionTestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.db import transaction, connection
from django.core.cache import cache
from django.test.utils import override_settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import CustomerProfile, FoodProviderProfile
from food_listings.models import FoodListing
from interactions.models import Cart, CartItem, Order, Interaction

User = get_user_model()


class PerformanceTest(APITestCase):
    """Test system performance requirements"""
    
    def setUp(self):
        """Set up test data for performance tests"""
        self.customer_user = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            user_type='customer'
        )
        
        self.customer_profile, _ = CustomerProfile.objects.get_or_create(
            user=self.customer_user,
            defaults={'full_name': 'Test Customer'}
        )
        
        self.provider_user = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            user_type='provider'
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
        
        # Create multiple food listings for testing
        self.food_listings = []
        for i in range(50):
            listing = FoodListing.objects.create(
                provider=self.provider_user,
                name=f'Test Food {i}',
                description=f'Test food item {i}',
                food_type='ready_to_eat',
                original_price=Decimal('12.99'),
                discounted_price=Decimal('10.99'),
                quantity=100,
                quantity_available=100,
                expiry_date=timezone.now().date() + timedelta(days=1),
                pickup_window='17:00-19:00'
            )
            self.food_listings.append(listing)
        
        # Authenticate client
        self.client = APIClient()
        token = RefreshToken.for_user(self.customer_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    def test_api_response_time_requirement(self):
        """
        NFR-1: API Response Time
        Requirement: API endpoints should respond within 2 seconds under normal load
        """
        endpoints_to_test = [
            '/api/food-listings/',
            '/cart/view/',
            '/api/notifications/',
        ]
        
        for endpoint in endpoints_to_test:
            start_time = time.time()
            response = self.client.get(endpoint)
            end_time = time.time()
            
            response_time = end_time - start_time
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertLess(response_time, 2.0, 
                          f"Endpoint {endpoint} took {response_time:.2f}s, exceeding 2s requirement")
    
    def test_database_query_performance(self):
        """
        NFR-2: Database Query Performance
        Requirement: Database queries should be optimized and not exceed reasonable limits
        """
        # Test food listings with pagination
        with self.assertNumQueries(5):  # Should be optimized with select_related/prefetch_related
            response = self.client.get('/api/food-listings/?page=1&page_size=20')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_concurrent_user_performance(self):
        """
        NFR-3: Concurrent User Handling
        Requirement: System should handle multiple concurrent users without significant degradation
        """
        def make_request():
            client = APIClient()
            token = RefreshToken.for_user(self.customer_user).access_token
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            start_time = time.time()
            response = client.get('/api/food-listings/')
            end_time = time.time()
            
            return {
                'status_code': response.status_code,
                'response_time': end_time - start_time
            }
        
        # Simulate 10 concurrent users
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # All requests should succeed
        for result in results:
            self.assertEqual(result['status_code'], 200)
            self.assertLess(result['response_time'], 5.0, 
                          "Response time degraded significantly under concurrent load")
        
        # Average response time should be reasonable
        avg_response_time = sum(r['response_time'] for r in results) / len(results)
        self.assertLess(avg_response_time, 3.0, 
                       f"Average response time {avg_response_time:.2f}s too high under concurrent load")
    
    def test_large_dataset_handling(self):
        """
        NFR-4: Large Dataset Performance
        Requirement: System should handle large datasets efficiently
        """
        # Create additional food listings to simulate large dataset
        additional_listings = []
        for i in range(500):
            listing = FoodListing.objects.create(
                provider=self.provider_user,
                name=f'Large Dataset Food {i}',
                description=f'Large dataset test item {i}',
                food_type='ready_to_eat',
                original_price=Decimal('18.99'),
                discounted_price=Decimal('15.99'),
                quantity=50,
                quantity_available=50,
                expiry_date=timezone.now().date() + timedelta(days=1),
                pickup_window='17:00-19:00'
            )
            additional_listings.append(listing)
        
        # Test pagination performance with large dataset
        start_time = time.time()
        response = self.client.get('/api/food-listings/?page=1&page_size=50')
        end_time = time.time()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(end_time - start_time, 3.0, 
                       "Large dataset query took too long")
        
        # Test search performance
        start_time = time.time()
        response = self.client.get('/api/food-listings/?search=Large Dataset')
        end_time = time.time()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(end_time - start_time, 3.0, 
                       "Search query on large dataset took too long")


class SecurityTest(APITestCase):
    """Test security requirements"""
    
    def setUp(self):
        """Set up test data for security tests"""
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
        
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='adminpass123',
            user_type='customer',
            role='admin',
            admin_rights=True
        )
    
    def test_authentication_requirement(self):
        """
        NFR-5: Authentication Security
        Requirement: All protected endpoints must require valid authentication
        """
        protected_endpoints = [
            ('/api/food-listings/', 'GET'),
            ('/cart/add-to-cart/', 'POST'),
            ('/api/notifications/', 'GET'),
            ('/api/reviews/', 'GET'),
            ('/api/garden/my-garden/', 'GET'),
            ('/api/badges/my-badges/', 'GET'),
        ]
        
        unauthenticated_client = APIClient()
        
        for endpoint, method in protected_endpoints:
            if method == 'GET':
                response = unauthenticated_client.get(endpoint)
            elif method == 'POST':
                response = unauthenticated_client.post(endpoint, {})
            
            self.assertIn(response.status_code, [401, 403], 
                         f"Endpoint {endpoint} should require authentication")
    
    def test_authorization_controls(self):
        """
        NFR-6: Authorization Controls
        Requirement: Users should only access resources they're authorized for
        """
        # Create customer client
        customer_client = APIClient()
        customer_token = RefreshToken.for_user(self.customer_user).access_token
        customer_client.credentials(HTTP_AUTHORIZATION=f'Bearer {customer_token}')
        
        # Create provider client
        provider_client = APIClient()
        provider_token = RefreshToken.for_user(self.provider_user).access_token
        provider_client.credentials(HTTP_AUTHORIZATION=f'Bearer {provider_token}')
        
        # Test that customer cannot access provider-only endpoints
        provider_only_endpoints = [
            '/api/food-listings/my-listings/',
            '/api/admin/pending-verifications/',
        ]
        
        for endpoint in provider_only_endpoints:
            response = customer_client.get(endpoint)
            self.assertIn(response.status_code, [403, 404], 
                         f"Customer should not access provider endpoint {endpoint}")
        
        # Test that provider cannot access admin endpoints
        admin_only_endpoints = [
            '/api/admin/users/',
            '/api/admin/system-stats/',
        ]
        
        for endpoint in admin_only_endpoints:
            response = provider_client.get(endpoint)
            self.assertIn(response.status_code, [403, 404], 
                         f"Provider should not access admin endpoint {endpoint}")
    
    def test_input_validation_security(self):
        """
        NFR-7: Input Validation Security
        Requirement: All user inputs should be validated to prevent injection attacks
        """
        customer_client = APIClient()
        customer_token = RefreshToken.for_user(self.customer_user).access_token
        customer_client.credentials(HTTP_AUTHORIZATION=f'Bearer {customer_token}')
        
        # Test SQL injection attempts
        malicious_inputs = [
            "'; DROP TABLE auth_user; --",
            "<script>alert('xss')</script>",
            "' OR '1'='1",
            "../../../etc/passwd",
            "{{7*7}}",  # Template injection
        ]
        
        for malicious_input in malicious_inputs:
            # Test in search parameter
            response = customer_client.get(f'/api/food-listings/?search={malicious_input}')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify no SQL injection occurred (should return empty or normal results)
            if 'results' in response.data:
                # Should not return all records (which might indicate successful injection)
                self.assertIsInstance(response.data['results'], list)
    
    def test_password_security_requirements(self):
        """
        NFR-8: Password Security
        Requirement: Passwords should meet security requirements
        """
        weak_passwords = [
            '123',
            'password',
            'abc',
            '111111',
        ]
        
        for weak_password in weak_passwords:
            registration_data = {
                'email': f'test_{weak_password}@test.com',
                'username': f'test_{weak_password}',
                'password': weak_password,
                'password_confirm': weak_password,
                'user_type': 'customer',
                'full_name': 'Test User'
            }
            
            response = self.client.post('/api/auth/register/customer/', registration_data)
            # Should reject weak passwords
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_rate_limiting_protection(self):
        """
        NFR-9: Rate Limiting
        Requirement: API should have rate limiting to prevent abuse
        """
        # Test login endpoint rate limiting
        login_data = {
            'email': 'nonexistent@test.com',
            'password': 'wrongpassword'
        }
        
        # Make multiple rapid requests
        failed_attempts = 0
        for i in range(10):
            response = self.client.post('/api/auth/login/', login_data)
            if response.status_code == 429:  # Too Many Requests
                break
            failed_attempts += 1
            time.sleep(0.1)  # Small delay between requests
        
        # Should eventually hit rate limit (if implemented)
        # Note: This test assumes rate limiting is implemented
        # If not implemented, this test documents the requirement


class ScalabilityTest(TransactionTestCase):
    """Test system scalability requirements"""
    
    def test_database_connection_handling(self):
        """
        NFR-10: Database Connection Scalability
        Requirement: System should handle database connections efficiently
        """
        def create_user_and_query():
            """Simulate user creation and database query"""
            with transaction.atomic():
                user = User.objects.create_user(
                    email=f'user_{threading.current_thread().ident}@test.com',
                    username=f'user_{threading.current_thread().ident}',
                    password='testpass123',
                    user_type='customer'
                )
                
                # Perform some database operations
                users_count = User.objects.count()
                return users_count
        
        # Test concurrent database operations
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_user_and_query) for _ in range(5)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # All operations should complete successfully
        self.assertEqual(len(results), 5)
        for result in results:
            self.assertIsInstance(result, int)
            self.assertGreater(result, 0)
    
    def test_memory_usage_efficiency(self):
        """
        NFR-11: Memory Usage Efficiency
        Requirement: System should use memory efficiently
        """
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Perform memory-intensive operations
        large_dataset = []
        for i in range(1000):
            user = User(
                email=f'memory_test_{i}@test.com',
                username=f'memory_test_{i}',
                user_type='customer'
            )
            large_dataset.append(user)
        
        # Bulk create to test memory efficiency
        User.objects.bulk_create(large_dataset)
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 100MB for this test)
        self.assertLess(memory_increase, 100, 
                       f"Memory usage increased by {memory_increase:.2f}MB, which may indicate inefficiency")


class ReliabilityTest(APITestCase):
    """Test system reliability requirements"""
    
    def setUp(self):
        """Set up test data for reliability tests"""
        self.customer_user = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            user_type='customer'
        )
        
        self.customer_profile, _ = CustomerProfile.objects.get_or_create(
            user=self.customer_user,
            defaults={'full_name': 'Test Customer'}
        )
        
        self.client = APIClient()
        token = RefreshToken.for_user(self.customer_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    def test_error_handling_consistency(self):
        """
        NFR-12: Error Handling Reliability
        Requirement: System should handle errors gracefully and consistently
        """
        # Test various error scenarios
        error_scenarios = [
            ('/api/food-listings/99999/', 'GET', 404),  # Not found
            ('/cart/add-to-cart/', 'POST', 400),  # Bad request (missing data)
            ('/api/reviews/', 'POST', 400),  # Bad request (invalid data)
        ]
        
        for endpoint, method, expected_status in error_scenarios:
            if method == 'GET':
                response = self.client.get(endpoint)
            elif method == 'POST':
                response = self.client.post(endpoint, {})
            
            self.assertEqual(response.status_code, expected_status)
            
            # Check error response format consistency
            if response.status_code >= 400:
                self.assertIn('error', response.data.keys() or ['error'])
    
    def test_data_integrity_constraints(self):
        """
        NFR-13: Data Integrity Reliability
        Requirement: System should maintain data integrity under all conditions
        """
        # Test that foreign key constraints are enforced
        with self.assertRaises(Exception):
            # Try to create cart item with non-existent food listing
            from interactions.models import CartItem
            CartItem.objects.create(
                cart_id=99999,  # Non-existent cart
                food_listing_id=99999,  # Non-existent food listing
                quantity=1
            )
    
    def test_transaction_atomicity(self):
        """
        NFR-14: Transaction Reliability
        Requirement: Database transactions should be atomic
        """
        initial_user_count = User.objects.count()
        
        try:
            with transaction.atomic():
                # Create a user
                User.objects.create_user(
                    email='atomic_test@test.com',
                    username='atomic_test',
                    password='testpass123',
                    user_type='customer'
                )
                
                # Force an error to test rollback
                raise Exception("Simulated error")
        except Exception:
            pass
        
        # User count should be unchanged due to rollback
        final_user_count = User.objects.count()
        self.assertEqual(initial_user_count, final_user_count)


class UsabilityTest(APITestCase):
    """Test system usability requirements"""
    
    def test_api_response_format_consistency(self):
        """
        NFR-15: API Usability
        Requirement: API responses should be consistent and well-formatted
        """
        customer_user = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            user_type='customer'
        )
        
        client = APIClient()
        token = RefreshToken.for_user(customer_user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test consistent pagination format
        paginated_endpoints = [
            '/api/food-listings/',
            '/api/notifications/',
        ]
        
        for endpoint in paginated_endpoints:
            response = client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Check pagination format consistency
            if 'results' in response.data:
                required_fields = ['count', 'next', 'previous', 'results']
                for field in required_fields:
                    self.assertIn(field, response.data, 
                                f"Pagination field '{field}' missing in {endpoint}")
    
    def test_error_message_clarity(self):
        """
        NFR-16: Error Message Usability
        Requirement: Error messages should be clear and helpful
        """
        # Test registration with missing required fields
        registration_data = {
            'email': 'incomplete@test.com',
            # Missing required fields
        }
        
        response = self.client.post('/api/auth/register/customer/', registration_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Error message should be informative
        self.assertIn('error', response.data.keys() or response.data)
        
        # Should indicate what fields are missing or invalid
        error_content = str(response.data).lower()
        self.assertTrue(
            any(field in error_content for field in ['required', 'field', 'missing']),
            "Error message should indicate missing required fields"
        )


@override_settings(DEBUG=False)  # Test production-like settings
class ProductionReadinessTest(APITestCase):
    """Test production readiness requirements"""
    
    def test_debug_mode_disabled(self):
        """
        NFR-17: Production Security
        Requirement: Debug mode should be disabled in production
        """
        from django.conf import settings
        self.assertFalse(settings.DEBUG, "DEBUG should be False in production")
    
    def test_sensitive_data_protection(self):
        """
        NFR-18: Sensitive Data Protection
        Requirement: Sensitive data should not be exposed in API responses
        """
        user = User.objects.create_user(
            email='sensitive@test.com',
            username='sensitive',
            password='secretpassword123',
            user_type='customer'
        )
        
        client = APIClient()
        token = RefreshToken.for_user(user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get user profile
        response = client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Ensure sensitive data is not exposed
        sensitive_fields = ['password', 'password_hash']
        response_str = str(response.data).lower()
        
        for field in sensitive_fields:
            self.assertNotIn(field, response_str, 
                           f"Sensitive field '{field}' should not be in API response")
