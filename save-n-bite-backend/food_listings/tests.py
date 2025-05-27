# food_listings/tests.py

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse
from django.contrib.admin.sites import AdminSite
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from datetime import date, timedelta
import json
import uuid
from unittest.mock import Mock

from .models import FoodListing
from .admin import FoodListingAdmin
from .serializers import (
    FoodListingCreateSerializer, FoodListingSerializer,
    FoodListingDetailSerializer, FoodListingUpdateSerializer,
    ProviderInfoSerializer
)
from authentication.models import User, FoodProviderProfile, CustomerProfile

# ============ FIXTURES ============

@pytest.fixture
def client():
    return Client()

@pytest.fixture
def api_client():
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
    
    # Create the actual FoodProviderProfile (not a mock)
    from authentication.models import FoodProviderProfile
    FoodProviderProfile.objects.create(
        user=user,
        business_name='Test Restaurant',
        business_address='123 Test St, Test City',
        business_contact='+1234567890',
        business_email='business@test.com',
        cipc_document='test_doc.pdf',  # This would be a file in real usage
        status='verified'
    )
    
    return user

@pytest.fixture
def customer_user(db):
    """Create a customer user"""
    user = User.objects.create_user(
        username='customer_test',
        email='customer@test.com',
        password='testpass123',
        user_type='customer'
    )
    
    # Create the actual CustomerProfile
    from authentication.models import CustomerProfile
    CustomerProfile.objects.create(
        user=user,
        full_name='Test Customer'
    )
    
    return user

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

@pytest.fixture
def food_listing(provider_user):
    """Create a sample food listing"""
    return FoodListing.objects.create(
        name='Fresh Pizza',
        description='Delicious pizza with fresh ingredients',
        food_type='ready_to_eat',
        original_price=20.00,
        discounted_price=15.00,
        quantity=5,
        quantity_available=5,
        expiry_date=date.today() + timedelta(days=1),
        pickup_window='17:00-19:00',
        provider=provider_user,
        status='active'
    )

@pytest.fixture
def expired_food_listing(provider_user):
    """Create an expired food listing"""
    return FoodListing.objects.create(
        name='Expired Bread',
        description='Day old bread',
        food_type='baked_goods',
        original_price=5.00,
        discounted_price=2.50,
        quantity=3,
        quantity_available=3,
        expiry_date=date.today() - timedelta(days=1),
        pickup_window='10:00-12:00',
        provider=provider_user,
        status='expired'
    )

# ============ MODEL TESTS ============

@pytest.mark.django_db
class TestFoodListingModel:
    
    def test_create_food_listing(self, provider_user):
        """Test creating a basic food listing"""
        listing = FoodListing.objects.create(
            name='Test Food',
            description='Test description',
            food_type='ready_to_eat',
            original_price=10.00,
            discounted_price=8.00,
            quantity=3,
            expiry_date=date.today() + timedelta(days=1),
            pickup_window='12:00-14:00',
            provider=provider_user
        )
        
        assert listing.name == 'Test Food'
        assert listing.status == 'active'  # Default status
        assert listing.quantity_available == 3  # Should match quantity initially
        assert str(listing.id)  # UUID should be set
        
    def test_string_representation(self, food_listing):
        """Test the __str__ method"""
        expected = f"{food_listing.name} - {food_listing.provider.provider_profile.business_name}"
        assert str(food_listing) == expected
        
    def test_savings_property(self, food_listing):
        """Test savings calculation"""
        expected_savings = food_listing.original_price - food_listing.discounted_price
        assert food_listing.savings == expected_savings
        
    def test_discount_percentage_property(self, food_listing):
        """Test discount percentage calculation"""
        # (20 - 15) / 20 * 100 = 25%
        assert food_listing.discount_percentage == 25
        
    def test_discount_percentage_zero_original_price(self, provider_user):
        """Test discount percentage when original price is zero"""
        listing = FoodListing.objects.create(
            name='Free Food',
            description='Free food',
            food_type='ready_to_eat',
            original_price=0.00,
            discounted_price=0.00,
            quantity=1,
            expiry_date=date.today() + timedelta(days=1),
            pickup_window='12:00-14:00',
            provider=provider_user
        )
        assert listing.discount_percentage == 0
        
    def test_is_available_property(self, food_listing):
        """Test is_available property"""
        assert food_listing.is_available is True
        
        # Test when quantity is zero
        food_listing.quantity_available = 0
        assert food_listing.is_available is False
        
        # Test when status is not active
        food_listing.quantity_available = 5
        food_listing.status = 'inactive'
        assert food_listing.is_available is False
        
    def test_save_method_auto_status_update(self, provider_user):
        """Test that status updates automatically when quantity_available reaches 0"""
        listing = FoodListing.objects.create(
            name='Test Food',
            description='Test description',
            food_type='ready_to_eat',
            original_price=10.00,
            discounted_price=8.00,
            quantity=1,
            quantity_available=1,
            expiry_date=date.today() + timedelta(days=1),
            pickup_window='12:00-14:00',
            provider=provider_user
        )
        
        listing.quantity_available = 0
        listing.save()
        
        assert listing.status == 'sold_out'
        
    def test_json_fields_default_values(self, provider_user):
        """Test that JSON fields have proper default values"""
        listing = FoodListing.objects.create(
            name='Test Food',
            description='Test description',
            food_type='ready_to_eat',
            original_price=10.00,
            discounted_price=8.00,
            quantity=1,
            expiry_date=date.today() + timedelta(days=1),
            pickup_window='12:00-14:00',
            provider=provider_user
        )
        
        assert listing.images == []
        assert listing.allergens == []
        assert listing.dietary_info == []

# ============ SERIALIZER TESTS ============

@pytest.mark.django_db
class TestFoodListingSerializers:
    
    def test_provider_info_serializer(self, provider_user):
        """Test ProviderInfoSerializer"""
        serializer = ProviderInfoSerializer(provider_user)
        data = serializer.data
        
        assert data['id'] == provider_user.id
        assert data['business_name'] == 'Test Restaurant'
        assert data['business_address'] == '123 Test St'
        assert 'logo' in data
        
    def test_food_listing_serializer(self, food_listing):
        """Test FoodListingSerializer"""
        serializer = FoodListingSerializer(food_listing)
        data = serializer.data
        
        assert data['id'] == str(food_listing.id)
        assert data['name'] == food_listing.name
        assert data['description'] == food_listing.description
        assert data['food_type'] == food_listing.food_type
        assert float(data['original_price']) == float(food_listing.original_price)
        assert float(data['discounted_price']) == float(food_listing.discounted_price)
        assert float(data['savings']) == float(food_listing.savings)
        assert data['discount_percentage'] == food_listing.discount_percentage
        assert data['is_available'] == food_listing.is_available
        assert 'provider' in data
        assert 'created_at' in data
        assert 'updated_at' in data

# ============ VIEW TESTS ============

@pytest.mark.django_db
class TestProviderViews:
    
    def test_get_provider_listings_success(self, authenticated_provider_client, food_listing):
        """Test provider can get their listings"""
        url = reverse('food_listings:provider_listings')
        response = authenticated_provider_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'listings' in data
        assert 'totalCount' in data
        assert data['totalCount'] == 1
        assert len(data['listings']) == 1
        assert data['listings'][0]['id'] == str(food_listing.id)
        
    def test_get_provider_listings_forbidden_for_customer(self, authenticated_customer_client):
        """Test customer cannot access provider listings"""
        url = reverse('food_listings:provider_listings')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert data['error']['code'] == 'FORBIDDEN'
        
    def test_create_food_listing_success(self, authenticated_provider_client, provider_user):
        """Test provider can create a food listing"""
        url = reverse('food_listings:create_listing')
        data = {
            'name': 'New Pizza',
            'description': 'Delicious cheese pizza',
            'food_type': 'ready_to_eat',
            'original_price': 18.00,
            'discounted_price': 14.00,
            'quantity': 8,
            'expiry_date': (date.today() + timedelta(days=1)).isoformat(),
            'pickup_window': '19:00-21:00',
            'allergens': ['gluten', 'dairy'],
            'dietary_info': ['vegetarian']
        }
        
        response = authenticated_provider_client.post(
            url, 
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()
        assert response_data['message'] == 'Listing created successfully'
        assert 'listing' in response_data
        
        # Verify listing was created in database
        listing = FoodListing.objects.get(id=response_data['listing']['id'])
        assert listing.name == data['name']
        assert listing.provider == provider_user
        
    def test_create_food_listing_validation_error(self, authenticated_provider_client):
        """Test create listing with invalid data"""
        url = reverse('food_listings:create_listing')
        data = {
            'name': '',  # Required field
            'description': 'Test description',
            'food_type': 'invalid_type',  # Invalid choice
            'original_price': 'not_a_number',  # Invalid type
            'discounted_price': 14.00,
            'quantity': -1,  # Invalid quantity
            'expiry_date': 'invalid_date',
            'pickup_window': '19:00-21:00'
        }
        
        response = authenticated_provider_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        response_data = response.json()
        assert response_data['error']['code'] == 'VALIDATION_ERROR'
        assert 'details' in response_data['error']
        
    def test_update_food_listing_success(self, authenticated_provider_client, food_listing):
        """Test provider can update their listing"""
        url = reverse('food_listings:update_listing', args=[food_listing.id])
        data = {
            'name': 'Updated Pizza Name',
            'description': 'Updated description',
            'original_price': 22.00,
            'discounted_price': 18.00
        }
        
        response = authenticated_provider_client.put(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data['message'] == 'Listing updated successfully'
        
        # Verify update in database
        food_listing.refresh_from_db()
        assert food_listing.name == 'Updated Pizza Name'
        assert float(food_listing.original_price) == 22.00

@pytest.mark.django_db
class TestCustomerViews:
    
    def test_browse_food_listings_success(self, api_client, food_listing):
        """Test browsing food listings without authentication"""
        url = reverse('food_listings:browse_listings')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'listings' in data
        assert 'pagination' in data
        assert 'filters' in data
        assert len(data['listings']) == 1
        assert data['listings'][0]['id'] == str(food_listing.id)
        
    def test_browse_food_listings_filtering(self, api_client, food_listing, provider_user):
        """Test filtering food listings"""
        # Create additional listing with different type
        FoodListing.objects.create(
            name='Fresh Bread',
            description='Homemade bread',
            food_type='baked_goods',
            original_price=8.00,
            discounted_price=6.00,
            quantity=3,
            quantity_available=3,
            expiry_date=date.today() + timedelta(days=1),
            pickup_window='10:00-12:00',
            provider=provider_user,
            status='active'
        )
        
        url = reverse('food_listings:browse_listings')
        
        # Test type filtering
        response = api_client.get(url, {'type': 'ready_to_eat'})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data['listings']) == 1
        assert data['listings'][0]['food_type'] == 'ready_to_eat'
        
    def test_browse_food_listings_excludes_expired(self, api_client, food_listing, expired_food_listing):
        """Test that expired listings are excluded"""
        url = reverse('food_listings:browse_listings')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Should only return active, non-expired listing
        assert len(data['listings']) == 1
        assert data['listings'][0]['id'] == str(food_listing.id)
        
    def test_get_food_listing_details_success(self, api_client, food_listing):
        """Test getting detailed food listing"""
        url = reverse('food_listings:listing_details', args=[food_listing.id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'listing' in data
        listing_data = data['listing']
        assert listing_data['id'] == str(food_listing.id)
        assert listing_data['name'] == food_listing.name
        assert 'provider' in listing_data

# ============ ADMIN TESTS ============

@pytest.mark.django_db
class TestFoodListingAdmin:
    
    def test_list_display(self, food_listing):
        """Test admin list display configuration"""
        admin = FoodListingAdmin(FoodListing, AdminSite())
        
        expected_fields = [
            'name', 'provider', 'food_type', 'discounted_price', 
            'quantity_available', 'status', 'expiry_date', 'created_at'
        ]
        
        assert admin.list_display == expected_fields
        
    def test_list_filter(self):
        """Test admin list filter configuration"""
        admin = FoodListingAdmin(FoodListing, AdminSite())
        
        expected_filters = ['food_type', 'status', 'created_at', 'expiry_date']
        assert admin.list_filter == expected_filters
        
    def test_search_fields(self):
        """Test admin search fields configuration"""
        admin = FoodListingAdmin(FoodListing, AdminSite())
        
        expected_search = [
            'name', 'provider__email', 'provider__provider_profile__business_name'
        ]
        assert admin.search_fields == expected_search

# ============ PERMISSION TESTS ============

@pytest.mark.django_db
class TestPermissions:
    
    def test_unauthenticated_access_to_provider_endpoints(self, api_client):
        """Test that unauthenticated users cannot access provider endpoints"""
        provider_urls = [
            reverse('food_listings:provider_listings'),
            reverse('food_listings:create_listing'),
        ]
        
        for url in provider_urls:
            response = api_client.get(url)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            
    def test_customer_cannot_access_provider_endpoints(self, authenticated_customer_client):
        """Test that customers cannot access provider-only endpoints"""
        provider_urls = [
            reverse('food_listings:provider_listings'),
            reverse('food_listings:create_listing'),
        ]
        
        for url in provider_urls:
            if url == reverse('food_listings:create_listing'):
                response = authenticated_customer_client.post(url, data={})
            else:
                response = authenticated_customer_client.get(url)
            assert response.status_code == status.HTTP_403_FORBIDDEN
            
    def test_public_access_to_customer_endpoints(self, api_client, food_listing):
        """Test that customer endpoints are publicly accessible"""
        customer_urls = [
            reverse('food_listings:browse_listings'),
            reverse('food_listings:listing_details', args=[food_listing.id]),
        ]
        
        for url in customer_urls:
            response = api_client.get(url)
            assert response.status_code == status.HTTP_200_OK

# ============ INTEGRATION TESTS ============

@pytest.mark.django_db
class TestIntegrationWorkflows:
    
    def test_complete_provider_workflow(self, authenticated_provider_client, provider_user):
        """Test complete provider workflow: create, list, update listing"""
        
        # 1. Create a listing
        create_url = reverse('food_listings:create_listing')
        create_data = {
            'name': 'Integration Test Pizza',
            'description': 'Test pizza for integration',
            'food_type': 'ready_to_eat',
            'original_price': 20.00,
            'discounted_price': 16.00,
            'quantity': 5,
            'expiry_date': (date.today() + timedelta(days=1)).isoformat(),
            'pickup_window': '18:00-20:00',
            'allergens': ['gluten'],
            'dietary_info': ['vegetarian']
        }
        
        create_response = authenticated_provider_client.post(
            create_url,
            data=json.dumps(create_data),
            content_type='application/json'
        )
        
        assert create_response.status_code == status.HTTP_201_CREATED
        listing_id = create_response.json()['listing']['id']
        
        # 2. List provider's listings
        list_url = reverse('food_listings:provider_listings')
        list_response = authenticated_provider_client.get(list_url)
        
        assert list_response.status_code == status.HTTP_200_OK
        list_data = list_response.json()
        assert list_data['totalCount'] == 1
        assert list_data['listings'][0]['id'] == listing_id
        
        # 3. Update the listing
        update_url = reverse('food_listings:update_listing', args=[listing_id])
        update_data = {
            'name': 'Updated Integration Test Pizza',
            'description': 'Updated test pizza description',
            'original_price': 22.00,
            'discounted_price': 18.00,
            'status': 'active'
        }
        
        update_response = authenticated_provider_client.put(
            update_url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        assert update_response.status_code == status.HTTP_200_OK
        
        # 4. Verify the update
        listing = FoodListing.objects.get(id=listing_id)
        assert listing.name == 'Updated Integration Test Pizza'
        assert float(listing.original_price) == 22.00
        assert float(listing.discounted_price) == 18.00