# conftest.py
import pytest
import sys
import os
from unittest.mock import patch
sys.path.insert(0, os.path.abspath('.'))

def pytest_configure(config):
    """Configure pytest with Django settings"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'truly_final_settings')
    # Django is already configured by pytest-django plugin
    pass

@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests"""
    pass

@pytest.fixture(autouse=True) 
def disable_signals():
    """Disable problematic signals during tests"""
    with patch('django.db.models.signals.post_save.send'):
        yield

@pytest.fixture
def user_factory():
    """Factory for creating test users"""
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    def create_user(**kwargs):
        defaults = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'user_type': 'customer'
        }
        defaults.update(kwargs)
        
        password = defaults.pop('password')
        user = User.objects.create_user(password=password, **defaults)
        return user
    
    return create_user

@pytest.fixture
def provider_user(user_factory):
    """Create a food provider user with correct profile fields"""
    from authentication.models import FoodProviderProfile
    
    # Create base user
    user = user_factory(
        username='provider@test.com',
        email='provider@test.com',
        user_type='provider'
    )
    
    # Create provider profile with correct field names
    profile = FoodProviderProfile.objects.create(
        user=user,
        business_name='Test Restaurant',
        business_address='123 Test Street, Test City',
        business_contact='+1234567890',
        business_email='business@test.com',
        cipc_document='test_doc.pdf',
        status='verified'
    )
    
    return user, profile

@pytest.fixture 
def pickup_location(provider_user):
    """Create a pickup location with proper business relationship"""
    from scheduling.models import PickupLocation
    
    user, profile = provider_user
    
    return PickupLocation.objects.create(
        business=profile,
        name='Test Location',
        address='123 Test Street, Test City',
        contact_person='John Doe',
        contact_phone='+1234567890',
        instructions='Test pickup instructions',
        latitude=40.7128,
        longitude=-74.0060
    )

@pytest.fixture
def customer_user(user_factory):
    """Create a customer user"""
    from authentication.models import CustomerProfile
    
    user = user_factory(
        username='customer@test.com',
        email='customer@test.com',
        user_type='customer'
    )
    
    # Create customer profile
    CustomerProfile.objects.create(
        user=user,
        full_name='Test Customer'
    )
    
    return user