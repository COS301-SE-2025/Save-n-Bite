"""
Test Configuration for Save-n-Bite Backend

This module contains configuration and utilities for running integration and E2E tests.
"""

import os
import django
from django.conf import settings
from django.test.utils import get_runner


class TestConfig:
    """Configuration class for test settings"""
    
    # Test database settings
    TEST_DATABASE = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST': {
            'NAME': ':memory:',
        }
    }
    
    # Test-specific settings
    TEST_SETTINGS = {
        'DEBUG': False,
        'TESTING': True,
        'PASSWORD_HASHERS': [
            'django.contrib.auth.hashers.MD5PasswordHasher',  # Faster for tests
        ],
        'EMAIL_BACKEND': 'django.core.mail.backends.locmem.EmailBackend',
        'CELERY_TASK_ALWAYS_EAGER': True,  # Execute tasks synchronously in tests
        'CACHES': {
            'default': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            }
        },
        'MEDIA_ROOT': '/tmp/test_media/',
        'STATIC_ROOT': '/tmp/test_static/',
    }
    
    @classmethod
    def setup_test_environment(cls):
        """Set up the test environment"""
        # Apply test-specific settings
        for key, value in cls.TEST_SETTINGS.items():
            setattr(settings, key, value)
        
        # Override database settings for tests
        settings.DATABASES['default'].update(cls.TEST_DATABASE)
    
    @classmethod
    def teardown_test_environment(cls):
        """Clean up after tests"""
        # Clean up test media files
        import shutil
        try:
            shutil.rmtree('/tmp/test_media/')
            shutil.rmtree('/tmp/test_static/')
        except FileNotFoundError:
            pass


class TestDataFactory:
    """Factory class for creating test data"""
    
    @staticmethod
    def create_test_user(user_type='customer', **kwargs):
        """Create a test user with default values"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        defaults = {
            'email': f'test_{user_type}@example.com',
            'username': f'test_{user_type}',
            'password': 'testpass123',
            'user_type': user_type,
        }
        defaults.update(kwargs)
        
        return User.objects.create_user(**defaults)
    
    @staticmethod
    def create_test_customer_profile(user=None, **kwargs):
        """Create a test customer profile"""
        from authentication.models import CustomerProfile
        
        if user is None:
            user = TestDataFactory.create_test_user('customer')
        
        defaults = {
            'full_name': 'Test Customer',
        }
        defaults.update(kwargs)
        
        profile, created = CustomerProfile.objects.get_or_create(
            user=user,
            defaults=defaults
        )
        return profile
    
    @staticmethod
    def create_test_provider_profile(user=None, **kwargs):
        """Create a test provider profile"""
        from authentication.models import FoodProviderProfile
        
        if user is None:
            user = TestDataFactory.create_test_user('provider')
        
        defaults = {
            'business_name': 'Test Restaurant',
            'business_email': 'restaurant@test.com',
            'business_address': '123 Test St',
            'business_contact': '+1234567890',
            'cipc_document': 'test_doc.pdf',
            'status': 'verified'
        }
        defaults.update(kwargs)
        
        profile, created = FoodProviderProfile.objects.get_or_create(
            user=user,
            defaults=defaults
        )
        return profile
    
    @staticmethod
    def create_test_food_listing(provider_user=None, **kwargs):
        """Create a test food listing"""
        from food_listings.models import FoodListing
        from decimal import Decimal
        from django.utils import timezone
        from datetime import timedelta
        
        if provider_user is None:
            provider_profile = TestDataFactory.create_test_provider_profile()
            provider_user = provider_profile.user
        
        defaults = {
            'provider': provider_user,
            'name': 'Test Food Item',
            'description': 'A delicious test food item',
            'food_type': 'ready_to_eat',
            'original_price': Decimal('15.99'),
            'discounted_price': Decimal('12.99'),
            'quantity': 10,
            'quantity_available': 10,
            'expiry_date': timezone.now().date() + timedelta(days=1),
            'pickup_window': '17:00-19:00'
        }
        defaults.update(kwargs)
        
        return FoodListing.objects.create(**defaults)


class TestUtilities:
    """Utility functions for testing"""
    
    @staticmethod
    def authenticate_api_client(client, user):
        """Authenticate an API client with JWT token"""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return client
    
    @staticmethod
    def create_test_file(filename='test.pdf', content=b'test content', content_type='application/pdf'):
        """Create a test file for upload testing"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        return SimpleUploadedFile(filename, content, content_type=content_type)
    
    @staticmethod
    def assert_api_error_response(test_case, response, expected_status=400):
        """Assert that an API response is a properly formatted error"""
        test_case.assertEqual(response.status_code, expected_status)
        test_case.assertIn('error', response.data.keys() or response.data)
    
    @staticmethod
    def assert_api_success_response(test_case, response, expected_status=200):
        """Assert that an API response is successful"""
        test_case.assertEqual(response.status_code, expected_status)
        test_case.assertIsInstance(response.data, dict)
    
    @staticmethod
    def measure_execution_time(func, *args, **kwargs):
        """Measure the execution time of a function"""
        import time
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        return result, end_time - start_time


class PerformanceMetrics:
    """Class for collecting and analyzing performance metrics"""
    
    def __init__(self):
        self.metrics = {}
    
    def record_metric(self, name, value, unit='ms'):
        """Record a performance metric"""
        if name not in self.metrics:
            self.metrics[name] = []
        self.metrics[name].append({'value': value, 'unit': unit})
    
    def get_average(self, name):
        """Get the average value for a metric"""
        if name not in self.metrics:
            return None
        values = [m['value'] for m in self.metrics[name]]
        return sum(values) / len(values)
    
    def get_max(self, name):
        """Get the maximum value for a metric"""
        if name not in self.metrics:
            return None
        values = [m['value'] for m in self.metrics[name]]
        return max(values)
    
    def get_min(self, name):
        """Get the minimum value for a metric"""
        if name not in self.metrics:
            return None
        values = [m['value'] for m in self.metrics[name]]
        return min(values)
    
    def generate_report(self):
        """Generate a performance report"""
        report = "Performance Metrics Report\n"
        report += "=" * 30 + "\n"
        
        for metric_name, measurements in self.metrics.items():
            if measurements:
                unit = measurements[0]['unit']
                avg = self.get_average(metric_name)
                max_val = self.get_max(metric_name)
                min_val = self.get_min(metric_name)
                
                report += f"\n{metric_name}:\n"
                report += f"  Average: {avg:.2f} {unit}\n"
                report += f"  Maximum: {max_val:.2f} {unit}\n"
                report += f"  Minimum: {min_val:.2f} {unit}\n"
                report += f"  Samples: {len(measurements)}\n"
        
        return report
