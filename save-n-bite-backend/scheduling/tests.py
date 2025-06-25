# scheduling/tests.py

import pytest
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from datetime import datetime, timedelta, time, date
from decimal import Decimal
import json
import uuid

from scheduling.models import (
    PickupLocation, FoodListingPickupSchedule, PickupTimeSlot, 
    ScheduledPickup, PickupOptimization, PickupAnalytics
)
from scheduling.services import PickupSchedulingService, PickupOptimizationService, PickupAnalyticsService
from scheduling.serializers import (
    PickupLocationSerializer, FoodListingPickupScheduleSerializer,
    PickupTimeSlotSerializer, SchedulePickupSerializer
)
from authentication.models import FoodProviderProfile, CustomerProfile
from interactions.models import Interaction, Order, InteractionItem
from food_listings.models import FoodListing

User = get_user_model()

# ============ FIXTURES ============

@pytest.fixture
def api_client():
    """API client for making requests"""
    return APIClient()

@pytest.fixture
def provider_user(db):
    """Create a provider user with profile"""
    user = User.objects.create_user(
        username='provider_test',
        email='provider@test.com',
        password='testpass123',
        user_type='provider'
    )
    
    # Create a dummy file for CIPC document (required field)
    dummy_file = SimpleUploadedFile("test_cipc.pdf", b"file_content", content_type="application/pdf")
    
    FoodProviderProfile.objects.create(
        user=user,
        business_name='Test Restaurant',
        business_address='123 Test St, Test City',
        business_contact='+1234567890',
        business_email='business@test.com',
        cipc_document=dummy_file,  # Required field for provider verification
        status='verified'  # This is crucial - provider must be verified!
    )
    
    return user

@pytest.fixture
def customer_user(db):
    """Create a customer user with profile"""
    user = User.objects.create_user(
        username='customer_test',
        email='customer@test.com',
        password='testpass123',
        user_type='customer'
    )
    
    # Only include fields that actually exist in CustomerProfile
    CustomerProfile.objects.create(
        user=user,
        full_name='Test Customer'
        # NOTE: phone_number is on User model, not CustomerProfile
    )
    
    return user

@pytest.fixture
def pickup_location(provider_user):
    """Create a pickup location"""
    return PickupLocation.objects.create(
        business=provider_user.provider_profile,
        name='Main Counter',
        address='123 Test St, Test City',
        contact_person='John Doe',
        contact_phone='+1234567890',
        instructions='Ring the bell at the counter',
        latitude=Decimal('26.2041'),
        longitude=Decimal('28.0473')
    )

@pytest.fixture
def food_listing(provider_user):
    """Create a food listing with ALL required fields"""
    return FoodListing.objects.create(
        provider=provider_user,
        name='Test Food Item',
        description='A delicious test food item',
        food_type='ready_to_eat',  # Required field
        original_price=Decimal('25.00'),
        discounted_price=Decimal('15.00'),
        quantity=10,               # Required field
        quantity_available=10,     # Required field
        expiry_date=date.today() + timedelta(days=1),
        pickup_window='17:00-19:00',
        status='active'
    )

@pytest.fixture
def pickup_schedule(food_listing, pickup_location):
    """Create a pickup schedule for a food listing"""
    return FoodListingPickupSchedule.objects.create(
        food_listing=food_listing,
        location=pickup_location,
        pickup_window='17:00-19:00',
        total_slots=4,
        max_orders_per_slot=5,
        slot_buffer_minutes=5
    )

@pytest.fixture
def pickup_time_slot(pickup_schedule):
    """Create a time slot"""
    return PickupTimeSlot.objects.create(
        pickup_schedule=pickup_schedule,
        slot_number=1,
        start_time=time(17, 0),
        end_time=time(17, 30),
        max_orders_per_slot=5,
        date=date.today() + timedelta(days=1),
        current_bookings=0,
        is_active=True
    )

@pytest.fixture
def interaction(customer_user, provider_user):
    """Create a test interaction"""
    return Interaction.objects.create(
        user=customer_user,  # Correct field name
        business=provider_user.provider_profile,
        interaction_type='Purchase',  # Required field
        total_amount=Decimal('15.00'),  # Required field
        status='confirmed'
    )

@pytest.fixture
def order(interaction, food_listing):
    """Create a test order"""
    return Order.objects.create(
        interaction=interaction,
        customer=interaction.user,  # Use the user from interaction
        business=interaction.business,
        total_amount=Decimal('15.00'),
        status='paid'
    )

@pytest.fixture
def interaction_item(interaction, food_listing):
    """Create interaction item"""
    return InteractionItem.objects.create(
        interaction=interaction,
        food_listing=food_listing,
        quantity=1,
        unit_price=food_listing.discounted_price
    )

@pytest.fixture
def scheduled_pickup(order, pickup_time_slot, pickup_location, food_listing):
    """Create a scheduled pickup"""
    return ScheduledPickup.objects.create(
        order=order,
        food_listing=food_listing,
        time_slot=pickup_time_slot,
        location=pickup_location,
        scheduled_date=date.today() + timedelta(days=1),
        scheduled_start_time=time(17, 0),
        scheduled_end_time=time(17, 30),
        status='scheduled'
    )

@pytest.fixture
def authenticated_provider_client(api_client, provider_user):
    """API client authenticated as provider"""
    refresh = RefreshToken.for_user(provider_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def authenticated_customer_client(api_client, customer_user):
    """API client authenticated as customer"""
    refresh = RefreshToken.for_user(customer_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

# ============ HELPER FUNCTIONS ============

def create_test_order(time_slot):
    """Helper function to create test order"""
    user = User.objects.create_user(
        username=f'test_user_{uuid.uuid4().hex[:8]}',
        email=f'test_{uuid.uuid4().hex[:8]}@test.com',
        password='testpass123',
        user_type='customer'
    )
    
    CustomerProfile.objects.create(
        user=user,
        full_name='Test Customer'
        # NOTE: phone_number is on User model, not CustomerProfile
    )
    
    interaction = Interaction.objects.create(
        user=user,  # Correct field name
        business=time_slot.pickup_schedule.location.business,
        interaction_type='Purchase',  # Required field
        total_amount=Decimal('15.00'),  # Required field
        status='confirmed'
    )
    
    return Order.objects.create(
        interaction=interaction,
        customer=user,
        business=time_slot.pickup_schedule.location.business,
        total_amount=Decimal('15.00'),
        status='paid'
    )

# ============ MODEL TESTS ============

@pytest.mark.django_db
class TestPickupLocationModel:
    """Test PickupLocation model"""

    def test_create_pickup_location(self, provider_user):
        """Test creating a pickup location"""
        location = PickupLocation.objects.create(
            business=provider_user.provider_profile,
            name='Side Entrance',
            address='123 Test St, Test City',
            contact_person='Jane Smith',
            contact_phone='+0987654321',
            instructions='Use the side door',
            latitude=Decimal('26.2041'),
            longitude=Decimal('28.0473')
        )
        
        assert location.name == 'Side Entrance'
        assert location.business == provider_user.provider_profile
        assert location.is_active is True
        assert str(location) == f"{provider_user.provider_profile.business_name} - Side Entrance"

    def test_pickup_location_unique_constraint(self, provider_user):
        """Test unique constraint on business + name"""
        # Create first location
        PickupLocation.objects.create(
            business=provider_user.provider_profile,
            name='Main Counter',
            address='123 Test St',
            contact_person='John',
            contact_phone='+1234567890'
        )
        
        # Try to create another with same name for same business
        with pytest.raises(IntegrityError):
            PickupLocation.objects.create(
                business=provider_user.provider_profile,
                name='Main Counter',  # Same name
                address='456 Test Ave',
                contact_person='Jane',
                contact_phone='+0987654321'
            )

# ============ SIMPLE VIEW TESTS ============

@pytest.mark.django_db
class TestPickupLocationViews:
    """Test pickup location views"""

    def test_get_pickup_locations(self, authenticated_provider_client, pickup_location):
        """Test getting pickup locations"""
        url = reverse('scheduling:pickup_locations')
        response = authenticated_provider_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Check for either 'results' or 'locations' in response
        assert 'count' in response.data
        locations_key = 'results' if 'results' in response.data else 'locations'
        assert locations_key in response.data
        assert len(response.data[locations_key]) >= 1

    def test_create_pickup_location(self, authenticated_provider_client):
        """Test creating pickup location"""
        url = reverse('scheduling:pickup_locations')
        data = {
            'name': 'API Location',
            'address': '999 API St',
            'contact_person': 'API Person',
            'contact_phone': '+3333333333',
            'instructions': 'API instructions'
        }
        
        response = authenticated_provider_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        # Check for either direct field or nested structure
        if 'name' in response.data:
            assert response.data['name'] == 'API Location'
        elif 'location' in response.data:
            assert response.data['location']['name'] == 'API Location'
        else:
            # Just verify the location was created
            assert PickupLocation.objects.filter(name='API Location').exists()

@pytest.mark.django_db
class TestBasicFunctionality:
    """Test basic app functionality without complex dependencies"""
    
    def test_food_listing_creation(self, provider_user):
        """Test that food listings can be created with all required fields"""
        listing = FoodListing.objects.create(
            provider=provider_user,
            name='Test Item',
            description='A test item',
            food_type='ready_to_eat',
            original_price=Decimal('20.00'),
            discounted_price=Decimal('15.00'),
            quantity=5,
            quantity_available=5,
            expiry_date=date.today() + timedelta(days=1),
            pickup_window='17:00-19:00',
            status='active'
        )
        
        assert listing.name == 'Test Item'
        assert listing.quantity == 5
        assert listing.quantity_available == 5
        assert listing.food_type == 'ready_to_eat'

    def test_customer_profile_creation(self, customer_user):
        """Test that customer profiles are created correctly"""
        assert customer_user.customer_profile.full_name == 'Test Customer'
        assert customer_user.user_type == 'customer'

    def test_provider_verification_status(self, provider_user):
        """Test that provider is verified"""
        assert provider_user.provider_profile.status == 'verified'
        assert provider_user.user_type == 'provider'

if __name__ == '__main__':
    print("Running Save n Bite Scheduling App Tests...")
    print("Use: python -m pytest scheduling/tests.py -v --tb=short")
    print("=" * 50)