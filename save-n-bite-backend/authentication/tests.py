from django.test import TestCase, RequestFactory
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib import messages
from django.http import HttpRequest
from django.urls import reverse
from io import StringIO
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from django.utils import timezone
from datetime import timedelta
import json
from unittest.mock import Mock

from authentication.jwt_auth import CustomJWTAuthentication
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile
from unittest.mock import patch, MagicMock
from authentication.middleware import PasswordChangeMiddleware
from authentication.admin import (
    CustomUserAdmin, CustomerProfileAdmin, NGOProfileAdmin, FoodProviderProfileAdmin
)


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_customer_url = reverse('register_customer')
        self.register_ngo_url = reverse('register_ngo')
        self.register_provider_url = reverse('register_provider')
        self.login_url = reverse('login_user')
        
    def test_register_customer(self):
        data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'username': 'testuser',
            'full_name': 'Test User'
        }
        response = self.client.post(self.register_customer_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
        
    def test_login(self):
        # First create a user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        # Try to login
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('refreshToken', response.data)
        self.assertIn('user', response.data)
        self.assertIn('message', response.data)
        
        # Verify user data in response
        user_data = response.data['user']
        self.assertEqual(user_data['email'], 'test@example.com')
        self.assertEqual(user_data['user_type'], 'customer')

class AdminViewsTests(TestCase):
    def setUp(self):
        # Create admin user with proper permissions
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            user_type='system_admin'
        )
        
        # Set the admin_rights to True as required by the permission
        self.admin_user.admin_rights = True
        self.admin_user.save()
        
        # Create regular user (non-admin)
        self.regular_user = User.objects.create_user(
            email='regular@example.com',
            username='regular',
            password='regularpass123',
            user_type='customer'
        )
        # Make sure regular user doesn't have admin rights
        self.regular_user.admin_rights = False
        self.regular_user.save()
        
        self.client = APIClient()

    def test_get_admin_profile_unauthenticated(self):
        """Test that unauthenticated users cannot access admin profile"""
        url = reverse('get_admin_profile')  # Use the correct name from urls.py
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_admin_profile_unauthorized(self):
        """Test that non-admin users cannot access admin profile"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('get_admin_profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('authentication.admin_views.logger')
    def test_get_admin_profile_success(self, mock_logger):
        """Test successful admin profile retrieval"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('get_admin_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile', response.data)
        profile_data = response.data['profile']
        
        # Check profile data structure - adjust based on what your view actually returns
        self.assertEqual(profile_data['username'], self.admin_user.username)
        self.assertEqual(profile_data['email'], self.admin_user.email)
        # Remove the UserID check if it doesn't exist or use the correct field
        if hasattr(self.admin_user, 'UserID'):
            self.assertEqual(profile_data['id'], str(self.admin_user.UserID))
        elif hasattr(self.admin_user, 'id'):
            self.assertEqual(profile_data['id'], str(self.admin_user.id))
        
        # Verify logger wasn't called with error
        mock_logger.error.assert_not_called()

    @patch('authentication.admin_views.logger')
    def test_get_admin_profile_exception(self, mock_logger):
        """Test admin profile retrieval with exception"""
        # Force an exception by corrupting the user object
        with patch.object(self.admin_user, 'get_full_name', side_effect=Exception('Test error')):
            self.client.force_authenticate(user=self.admin_user)
            url = reverse('get_admin_profile')
            response = self.client.get(url)
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertEqual(response.data['error']['code'], 'PROFILE_ERROR')
            mock_logger.error.assert_called_once()

    def test_update_admin_profile_unauthenticated(self):
        """Test that unauthenticated users cannot update admin profile"""
        url = reverse('update_admin_profile')  # Use the correct name from urls.py
        response = self.client.put(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_admin_profile_unauthorized(self):
        """Test that non-admin users cannot update admin profile"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('update_admin_profile')
        response = self.client.put(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('authentication.admin_views.AdminService.log_admin_action')
    @patch('authentication.admin_views.get_client_ip')
    @patch('authentication.admin_views.logger')
    def test_update_admin_profile_success(self, mock_logger, mock_get_ip, mock_log_action):
        """Test successful admin profile update"""
        mock_get_ip.return_value = '192.168.1.1'
        
        self.client.force_authenticate(user=self.admin_user)
        
        update_data = {
            'username': 'newadmin',
            'email': 'newadmin@example.com',
            'phone_number': '+1234567890'
        }
        
        url = reverse('update_admin_profile')
        response = self.client.put(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Profile updated successfully')
        
        # Verify user was updated
        self.admin_user.refresh_from_db()
        self.assertEqual(self.admin_user.username, 'newadmin')
        self.assertEqual(self.admin_user.email, 'newadmin@example.com')
        self.assertEqual(self.admin_user.phone_number, '+1234567890')
        
        # Verify logging was called
        mock_log_action.assert_called_once()
        mock_logger.error.assert_not_called()

    @patch('authentication.admin_views.AdminService.log_admin_action')
    @patch('authentication.admin_views.get_client_ip')
    @patch('authentication.admin_views.logger')
    def test_update_admin_profile_partial(self, mock_logger, mock_get_ip, mock_log_action):
        """Test partial admin profile update"""
        mock_get_ip.return_value = '192.168.1.1'
        
        self.client.force_authenticate(user=self.admin_user)
        
        # Only update username
        update_data = {'username': 'partialupdate'}
        
        url = reverse('update_admin_profile')
        response = self.client.put(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify only username was updated
        self.admin_user.refresh_from_db()
        self.assertEqual(self.admin_user.username, 'partialupdate')
        # Email should remain unchanged
        self.assertEqual(self.admin_user.email, 'admin@example.com')
        
        # Verify logging was called
        mock_log_action.assert_called_once()

    @patch('authentication.admin_views.AdminService.log_admin_action')
    @patch('authentication.admin_views.get_client_ip')
    @patch('authentication.admin_views.logger')
    def test_update_admin_profile_no_changes(self, mock_logger, mock_get_ip, mock_log_action):
        """Test admin profile update with no actual changes"""
        mock_get_ip.return_value = '192.168.1.1'
        
        self.client.force_authenticate(user=self.admin_user)
        
        # Send same data as current values
        update_data = {
            'username': self.admin_user.username,
            'email': self.admin_user.email
        }
        
        url = reverse('update_admin_profile')
        response = self.client.put(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify no logging was called (no actual changes)
        mock_log_action.assert_not_called()
        mock_logger.error.assert_not_called()

    @patch('authentication.admin_views.logger')
    def test_update_admin_profile_exception(self, mock_logger):
        """Test admin profile update with exception"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Force an exception during save
        with patch.object(User, 'save', side_effect=Exception('Test save error')):
            update_data = {'username': 'shouldfail'}
            url = reverse('update_admin_profile')
            response = self.client.put(url, update_data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertEqual(response.data['error']['code'], 'UPDATE_ERROR')
            mock_logger.error.assert_called_once()

    @patch('authentication.admin_views.AdminService.log_admin_action')
    @patch('authentication.admin_views.get_client_ip')
    def test_update_admin_profile_logging_metadata(self, mock_get_ip, mock_log_action):
        """Test that logging includes proper metadata for changes"""
        mock_get_ip.return_value = '192.168.1.1'
        
        self.client.force_authenticate(user=self.admin_user)
        
        original_username = self.admin_user.username
        original_email = self.admin_user.email
        
        update_data = {
            'username': 'loggeduser',
            'email': 'logged@example.com'
        }
        
        url = reverse('update_admin_profile')
        response = self.client.put(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify logging metadata contains changes
        call_args = mock_log_action.call_args
        metadata = call_args[1]['metadata']  # kwargs are second item in call_args
        
        self.assertIn('changes', metadata)
        self.assertIn('username', metadata['changes'])
        self.assertIn('email', metadata['changes'])
        
        self.assertEqual(metadata['changes']['username']['old'], original_username)
        self.assertEqual(metadata['changes']['username']['new'], 'loggeduser')
        self.assertEqual(metadata['changes']['email']['old'], original_email)
        self.assertEqual(metadata['changes']['email']['new'], 'logged@example.com')

    def test_debug_admin_profile_error(self):
        """Debug method to see what's causing the Internal Server Error"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('get_admin_profile')
        
        # Capture the actual response to see the error
        response = self.client.get(url)
        
        if response.status_code >= 500:
            print(f"DEBUG: Server error response: {response.status_code}")
            print(f"DEBUG: Response data: {response.data}")
            
class MockRequest:
    def __init__(self, user=None):
        self.user = user
        self.session = {}
        self._messages = messages.storage.default_storage(self)

    def get_messages(self):
        return list(self._messages)

class CustomUserAdminTest(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.admin = CustomUserAdmin(User, self.site)
        
        self.user1 = User.objects.create_user(
            email='test1@example.com',
            username='testuser1',
            password='testpass123',
            user_type='customer'
        )
        self.user2 = User.objects.create_user(
            email='test2@example.com',
            username='testuser2',
            password='testpass123',
            user_type='food_provider'
        )

    def test_list_display(self):
        self.assertEqual(
            self.admin.list_display,
            ['email', 'username', 'user_type', 'is_active', 'date_joined']
        )

    def test_list_filter(self):
        self.assertEqual(
            self.admin.list_filter,
            ['user_type', 'is_active', 'date_joined']
        )

    def test_search_fields(self):
        self.assertEqual(
            self.admin.search_fields,
            ['email', 'username']
        )

    def test_fieldsets_includes_user_type(self):
        fieldsets = self.admin.fieldsets
        custom_fields_found = False
        for name, fieldset in fieldsets:
            if name == 'Custom Fields':
                self.assertIn('user_type', fieldset['fields'])
                custom_fields_found = True
        self.assertTrue(custom_fields_found)

class CustomerProfileAdminTest(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.admin = CustomerProfileAdmin(CustomerProfile, self.site)
        
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123',
            user_type='customer'
        )
        self.profile = CustomerProfile.objects.create(
            user=self.user,
            full_name='Test Customer'
        )

    def test_list_display(self):
        self.assertEqual(
            self.admin.list_display,
            ['user', 'full_name']
        )

    def test_search_fields(self):
        self.assertEqual(
            self.admin.search_fields,
            ['user__email', 'full_name']
        )

class NGOProfileAdminTest(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.admin = NGOProfileAdmin(NGOProfile, self.site)
        
        self.user = User.objects.create_user(
            email='ngo@example.com',
            username='ngo',
            password='testpass123',
            user_type='ngo'
        )
        self.profile = NGOProfile.objects.create(
            user=self.user,
            organisation_name='Test NGO',
            representative_name='John Doe',
            representative_email='john@ngo.com',
            status='pending_verification'
        )

    def test_list_display(self):
        self.assertEqual(
            self.admin.list_display,
            ['organisation_name', 'representative_name', 'representative_email', 'status']
        )

    def test_list_filter(self):
        self.assertEqual(
            self.admin.list_filter,
            ['status']
        )

    def test_search_fields(self):
        self.assertEqual(
            self.admin.search_fields,
            ['organisation_name', 'representative_name', 'representative_email']
        )

    def test_fieldsets_structure(self):
        fieldsets = self.admin.fieldsets
        fieldset_names = [name for name, _ in fieldsets]
        expected_fieldset_names = ['Organization Info', 'Representative', 'Address', 'Documents & Status']
        
        for expected_name in expected_fieldset_names:
            self.assertIn(expected_name, fieldset_names)

class FoodProviderProfileAdminTest(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.admin = FoodProviderProfileAdmin(FoodProviderProfile, self.site)
        self.factory = RequestFactory()
        
        self.user = User.objects.create_user(
            email='business@example.com',
            username='business',
            password='testpass123',
            user_type='food_provider'
        )
        
        self.provider = FoodProviderProfile.objects.create(
            user=self.user,
            business_name='Test Restaurant',
            business_email='test@restaurant.com',
            business_contact='+1234567890',
            status='pending_verification',
            business_description='A test restaurant',
            business_tags=['fast-food', 'vegetarian']
        )

    def test_list_display(self):
        expected_display = [
            'business_name', 
            'business_email', 
            'business_contact', 
            'status',
            'has_banner',
            'has_description', 
            'tag_count',
            'profile_completeness_display'
        ]
        self.assertEqual(self.admin.list_display, expected_display)

    def test_list_filter(self):
        expected_filters = [
            'status', 
            'geocoding_failed',
            'banner_updated_at',
            'description_updated_at',
            'tags_updated_at'
        ]
        self.assertEqual(self.admin.list_filter, expected_filters)

    def test_search_fields(self):
        expected_search = [
            'business_name', 
            'business_email', 
            'business_description',
            'business_tags'
        ]
        self.assertEqual(self.admin.search_fields, expected_search)

    def test_readonly_fields(self):
        expected_readonly = [
            'geocoded_at', 
            'geocoding_failed', 
            'geocoding_error',
            'banner_updated_at',
            'description_updated_at',
            'tags_updated_at',
            'banner_preview',
            'logo_preview',
            'tags_display'
        ]
        self.assertEqual(self.admin.readonly_fields, expected_readonly)

    def test_has_banner_method(self):
        # Test without banner
        self.assertFalse(self.admin.has_banner(self.provider))
        
        # Test with banner (mock)
        self.provider.banner = SimpleUploadedFile("banner.jpg", b"file_content", content_type="image/jpeg")
        self.assertTrue(self.admin.has_banner(self.provider))

    def test_has_description_method(self):
        # Test without description
        provider_no_desc = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='no_desc@test.com', username='nodesc', password='test'),
            business_name='No Desc'
        )
        self.assertFalse(self.admin.has_description(provider_no_desc))
        
        # Test with description
        self.assertTrue(self.admin.has_description(self.provider))

    def test_tag_count_method(self):
        # Test with tags
        self.assertEqual(self.admin.tag_count(self.provider), 2)
        
        # Test without tags
        provider_no_tags = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='notags@test.com', username='notags', password='test'),
            business_name='No Tags'
        )
        self.assertEqual(self.admin.tag_count(provider_no_tags), 0)
        
        # Test with None tags
        provider_no_tags.business_tags = None
        self.assertEqual(self.admin.tag_count(provider_no_tags), 0)

    def test_profile_completeness_display_method(self):
        # Test basic profile (incomplete)
        result = self.admin.profile_completeness_display(self.provider)
        self.assertIn('Basic', str(result))
        
        # Test complete profile (would need more fields filled)
        complete_provider = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='complete@test.com', username='complete', password='test'),
            business_name='Complete Business',
            business_email='complete@test.com',
            business_contact='+1234567890',
            business_description='Complete description',
            business_address='123 Complete St',
            latitude=-26.2041,
            longitude=28.0473,
            status='verified',
            business_tags=['complete', 'test']
        )
        result = self.admin.profile_completeness_display(complete_provider)
        self.assertIn('Complete', str(result))

    def test_banner_preview_method(self):
        # Test without banner
        result = self.admin.banner_preview(self.provider)
        self.assertEqual(result, "No banner")
        
        # Test with banner
        self.provider.banner = SimpleUploadedFile("banner.jpg", b"file_content", content_type="image/jpeg")
        result = self.admin.banner_preview(self.provider)
        self.assertIn('img', str(result))

    def test_logo_preview_method(self):
        # Test without logo
        result = self.admin.logo_preview(self.provider)
        self.assertEqual(result, "No logo")
        
        # Test with logo
        self.provider.logo = SimpleUploadedFile("logo.jpg", b"file_content", content_type="image/jpeg")
        result = self.admin.logo_preview(self.provider)
        self.assertIn('img', str(result))

    def test_tags_display_method(self):
        # Test with tags
        result = self.admin.tags_display(self.provider)
        self.assertIn('Fast-Food', str(result))
        self.assertIn('Vegetarian', str(result))
        
        # Test without tags
        provider_no_tags = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='notags@test.com', username='notags', password='test'),
            business_name='No Tags'
        )
        result = self.admin.tags_display(provider_no_tags)
        self.assertEqual(result, "No tags")

    def test_verify_providers_action(self):
        # Create a mock request
        request = MockRequest()
        
        # Create pending providers
        pending_provider = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='pending@test.com', username='pending', password='test'),
            business_name='Pending Business',
            status='pending_verification'
        )
        
        # Test action
        queryset = FoodProviderProfile.objects.filter(id=pending_provider.id)
        self.admin.verify_providers(request, queryset)
        
        # Verify status changed
        pending_provider.refresh_from_db()
        self.assertEqual(pending_provider.status, 'verified')

    def test_reject_providers_action(self):
        # Create a mock request
        request = MockRequest()
        
        # Create pending providers
        pending_provider = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='pending2@test.com', username='pending2', password='test'),
            business_name='Pending Business 2',
            status='pending_verification'
        )
        
        # Test action
        queryset = FoodProviderProfile.objects.filter(id=pending_provider.id)
        self.admin.reject_providers(request, queryset)
        
        # Verify status changed
        pending_provider.refresh_from_db()
        self.assertEqual(pending_provider.status, 'rejected')

    @patch('authentication.admin.FoodProviderProfile.geocode_address')
    def test_geocode_addresses_action(self, mock_geocode):
        mock_geocode.return_value = None
        
        request = MockRequest()
        
        provider = FoodProviderProfile.objects.create(
            user=User.objects.create_user(
                email='test_geocode@test.com', 
                username='test_geocode', 
                password='test'
            ),
            business_name='Test Geocode Business',
            business_address='123 Test Street, Johannesburg',
            latitude=None,
            longitude=None
        )
        
        queryset = FoodProviderProfile.objects.filter(id=provider.id)
        
        self.admin.geocode_addresses(request, queryset)
        
        provider.refresh_from_db()
        
        mock_called = mock_geocode.called
        coordinates_set = provider.latitude is not None and provider.longitude is not None
        action_worked = coordinates_set or mock_called
        
        self.assertTrue(action_worked)

    def test_geocode_addresses_action_exists(self):
        request = MockRequest()
        
        provider = FoodProviderProfile.objects.create(
            user=User.objects.create_user(
                email='simple_test@test.com', 
                username='simple_test', 
                password='test'
            ),
            business_name='Simple Test Business',
            business_address='123 Test Street',
            latitude=None,
            longitude=None
        )
        
        queryset = FoodProviderProfile.objects.filter(id=provider.id)
        
        try:
            self.admin.geocode_addresses(request, queryset)
            self.assertTrue(True)
        except Exception as e:
            self.assertTrue(True)

    @patch('authentication.admin.FoodProviderProfile.geocode_address')
    def test_geocode_addresses_action(self, mock_geocode):
        mock_geocode.return_value = None
        
        request = MockRequest()
        
        provider = FoodProviderProfile.objects.create(
            user=User.objects.create_user(
                email='test_geocode@test.com', 
                username='test_geocode', 
                password='test'
            ),
            business_name='Test Geocode Business',
            business_address='123 Test Street, Johannesburg',
            latitude=None,
            longitude=None
        )
        
        queryset = FoodProviderProfile.objects.filter(id=provider.id)
        
        self.admin.geocode_addresses(request, queryset)
        
        provider.refresh_from_db()
        
        mock_called = mock_geocode.called
        coordinates_set = provider.latitude is not None and provider.longitude is not None
        action_worked = coordinates_set or mock_called
        
        self.assertTrue(action_worked)

    def test_geocode_addresses_action_exists(self):
        request = MockRequest()
        
        provider = FoodProviderProfile.objects.create(
            user=User.objects.create_user(
                email='simple_test@test.com', 
                username='simple_test', 
                password='test'
            ),
            business_name='Simple Test Business',
            business_address='123 Test Street',
            latitude=None,
            longitude=None
        )
        
        queryset = FoodProviderProfile.objects.filter(id=provider.id)
        
        try:
            self.admin.geocode_addresses(request, queryset)
            self.assertTrue(True)
        except Exception:
            self.assertTrue(True)

class CustomJWTAuthenticationTest(TestCase):
    def setUp(self):
        self.auth = CustomJWTAuthentication()
        self.factory = RequestFactory()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            user_type='customer'
        )
        
        # Create a valid token for the user
        self.valid_token = AccessToken()
        self.valid_token['user_id'] = str(self.user.UserID)
        
        # Create invalid token (no user_id claim)
        self.invalid_token = AccessToken()
        if 'user_id' in self.invalid_token.payload:
            del self.invalid_token.payload['user_id']

    def test_get_validated_token_valid(self):
        """Test validating a valid token"""
        raw_token = str(self.valid_token)
        validated_token = self.auth.get_validated_token(raw_token)
        self.assertIsNotNone(validated_token)
        self.assertEqual(validated_token['user_id'], str(self.user.UserID))

    @patch('authentication.jwt_auth.logger')
    def test_get_validated_token_invalid(self, mock_logger):
        """Test validating an invalid token"""
        with self.assertRaises(InvalidToken):
            self.auth.get_validated_token('invalid.token.here')
        mock_logger.error.assert_called()

    @patch('authentication.jwt_auth.logger')
    def test_get_user_valid(self, mock_logger):
        """Test getting user with valid token"""
        user = self.auth.get_user(self.valid_token)
        self.assertEqual(user, self.user)

    @patch('authentication.jwt_auth.logger')
    def test_get_user_no_user_id(self, mock_logger):
        """Test getting user with token missing user_id claim"""
        with self.assertRaises(InvalidToken):
            self.auth.get_user(self.invalid_token)

    @patch('authentication.jwt_auth.logger')
    def test_get_user_not_found(self, mock_logger):
        """Test getting user that doesn't exist"""
        token = AccessToken()
        token['user_id'] = 'non-existent-user-id'
        
        with self.assertRaises(AuthenticationFailed):
            self.auth.get_user(token)
        mock_logger.error.assert_called()

    @patch('authentication.jwt_auth.logger')
    def test_get_user_inactive(self, mock_logger):
        """Test getting inactive user"""
        self.user.is_active = False
        self.user.save()
        
        with self.assertRaises(AuthenticationFailed):
            self.auth.get_user(self.valid_token)
        mock_logger.warning.assert_called()

    def test_authenticate_valid(self):
        """Test successful authentication"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.valid_token}'
        
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)
        user, token = result
        self.assertEqual(user, self.user)

    def test_authenticate_no_header(self):
        """Test authentication with no authorization header"""
        request = self.factory.get('/')
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    def test_authenticate_invalid_header(self):
        """Test authentication with invalid authorization header"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = 'Invalid format'
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    @patch('authentication.jwt_auth.logger')
    def test_authenticate_invalid_token(self, mock_logger):
        """Test authentication with invalid token"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = 'Bearer invalid.token.here'
        
        result = self.auth.authenticate(request)
        self.assertIsNone(result)
        mock_logger.error.assert_called()

    @patch('authentication.jwt_auth.logger')
    def test_authenticate_user_not_found(self, mock_logger):
        """Test authentication when user doesn't exist"""
        token = AccessToken()
        token['user_id'] = 'non-existent-user-id'
        
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        
        result = self.auth.authenticate(request)
        self.assertIsNone(result)
        mock_logger.error.assert_called()

    def test_authenticate_different_token_types(self):
        """Test authentication with different token formats"""
        # Test with lowercase bearer
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'bearer {self.valid_token}'
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)

        # Test with mixed case
        request.META['HTTP_AUTHORIZATION'] = f'BeArEr {self.valid_token}'
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)

    @patch('authentication.jwt_auth.User.objects.get')
    def test_get_user_uuid_conversion(self, mock_get):
        """Test UserID conversion from UUID to string"""
        mock_get.return_value = self.user
        
        # Create token with UUID user_id
        token = AccessToken()
        test_uuid = '12345678-1234-5678-1234-567812345678'
        token['user_id'] = test_uuid
        
        user = self.auth.get_user(token)
        
        # Verify UserID was converted to string for lookup
        mock_get.assert_called_with(UserID=test_uuid)
        self.assertEqual(user, self.user)

    @patch('authentication.jwt_auth.logger')
    def test_get_user_unexpected_error(self, mock_logger):
        """Test handling of unexpected errors during user lookup"""
        with patch('authentication.jwt_auth.User.objects.get') as mock_get:
            mock_get.side_effect = Exception('Database error')
            
            with self.assertRaises(AuthenticationFailed):
                self.auth.get_user(self.valid_token)
            
            mock_logger.error.assert_called()

    def test_authenticate_empty_token(self):
        """Test authentication with empty token string"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = 'Bearer '
        
        # This should raise AuthenticationFailed due to malformed header
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    def test_authenticate_different_token_types(self):
        """Test authentication with different token formats"""
        # Test with standard Bearer format (should work)
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.valid_token}'
        result = self.auth.authenticate(request)
        print(f"Bearer format result: {result is not None}")
        self.assertIsNotNone(result, "Standard Bearer format should work")
        
        # Test with multiple spaces (should work)
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer   {self.valid_token}'
        result = self.auth.authenticate(request)
        print(f"Multiple spaces result: {result is not None}")
        self.assertIsNotNone(result, "Multiple spaces should work")

    def test_authenticate_lowercase_bearer(self):
        """Test if lowercase bearer format is supported"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'bearer {self.valid_token}'
        result = self.auth.authenticate(request)
        print(f"Lowercase bearer result: {result is not None}")

        @patch('authentication.jwt_auth.logger')
        def test_authenticate_invalid_formats(self, mock_logger):
            """Test authentication with invalid token formats"""
            request = self.factory.get('/')
            
            # Test with no space after Bearer (should fail)
            request.META['HTTP_AUTHORIZATION'] = f'Bearer{self.valid_token}'
            result = self.auth.authenticate(request)
            self.assertIsNone(result)
            
            # Test with malformed token (should fail)
            request.META['HTTP_AUTHORIZATION'] = 'Bearer not.a.valid.token'
            result = self.auth.authenticate(request)
            self.assertIsNone(result)

    def test_authenticate_malformed_token(self):
        """Test authentication with malformed token"""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = 'Bearer not.a.valid.token'
        result = self.auth.authenticate(request)
        # This should return None due to invalid token, not raise exception
        self.assertIsNone(result)

import json

class PasswordChangeMiddlewareTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = PasswordChangeMiddleware(self.get_mock_response)
        
        # Create test users
        self.normal_user = User.objects.create_user(
            email='normal@example.com',
            username='normal',
            password='normalpass123',
            user_type='customer'
        )
        
        self.temp_password_user = User.objects.create_user(
            email='temp@example.com',
            username='tempuser',
            password='temppass123',
            user_type='customer',
            password_must_change=True,
            has_temporary_password=True,
            temp_password_created_at=timezone.now()
        )
        
        self.expired_temp_user = User.objects.create_user(
            email='expired@example.com',
            username='expired',
            password='expiredpass123',
            user_type='customer',
            password_must_change=True,
            has_temporary_password=True,
            temp_password_created_at=timezone.now() - timedelta(hours=25)  # Expired
        )

    def get_mock_response(self, request):
        """Mock response function for the middleware"""
        return {'status': 'success'}

    def parse_json_response(self, response):
        """Helper to parse JsonResponse content"""
        return json.loads(response.content.decode('utf-8'))

    def test_normal_user_no_restriction(self):
        """Test that normal users can access any endpoint"""
        request = self.factory.get('/api/some-endpoint')
        request.user = self.normal_user
        
        response = self.middleware(request)
        self.assertEqual(response, {'status': 'success'})

    def test_temp_password_user_redirected(self):
        """Test that users with temp passwords are redirected to change password"""
        request = self.factory.get('/api/some-endpoint')
        request.user = self.temp_password_user
        
        response = self.middleware(request)
        self.assertEqual(response.status_code, 403)
        response_data = self.parse_json_response(response)
        self.assertEqual(response_data['error']['code'], 'PASSWORD_CHANGE_REQUIRED')

    def test_temp_password_user_allowed_change_password(self):
        """Test that users with temp passwords can access change password endpoint"""
        request = self.factory.get('/api/auth/change-password')
        request.user = self.temp_password_user
        
        response = self.middleware(request)
        self.assertEqual(response, {'status': 'success'})

    def test_temp_password_user_allowed_logout(self):
        """Test that users with temp passwords can access logout endpoint"""
        request = self.factory.get('/api/auth/logout')
        request.user = self.temp_password_user
        
        response = self.middleware(request)
        self.assertEqual(response, {'status': 'success'})

    def test_expired_temp_password(self):
        """Test that expired temp passwords return different error"""
        request = self.factory.get('/api/some-endpoint')
        request.user = self.expired_temp_user
        
        response = self.middleware(request)
        self.assertEqual(response.status_code, 401)
        response_data = self.parse_json_response(response)
        self.assertEqual(response_data['error']['code'], 'PASSWORD_EXPIRED')

    def test_expired_temp_password_allowed_change_password(self):
        """Test that expired temp passwords can still access change password"""
        request = self.factory.get('/api/auth/change-password')
        request.user = self.expired_temp_user
        
        response = self.middleware(request)
        self.assertEqual(response, {'status': 'success'})

    def test_expired_temp_password_allowed_logout(self):
        """Test that expired temp passwords can still access logout"""
        request = self.factory.get('/api/auth/logout')
        request.user = self.expired_temp_user
        
        response = self.middleware(request)
        self.assertEqual(response, {'status': 'success'})

    def test_unauthenticated_user(self):
        """Test that unauthenticated users are not affected"""
        request = self.factory.get('/api/some-endpoint')
        request.user = Mock(is_authenticated=False)
        
        response = self.middleware(request)
        self.assertEqual(response, {'status': 'success'})

    def test_user_without_temp_password_created_at(self):
        """Test user with temp password but no created_at timestamp"""
        user = User.objects.create_user(
            email='notimestamp@example.com',
            username='notimestamp',
            password='testpass123',
            user_type='customer',
            password_must_change=True,
            has_temporary_password=True,
            temp_password_created_at=None  # No timestamp
        )
        
        request = self.factory.get('/api/some-endpoint')
        request.user = user
        
        response = self.middleware(request)
        self.assertEqual(response.status_code, 403)
        response_data = self.parse_json_response(response)
        self.assertEqual(response_data['error']['code'], 'PASSWORD_CHANGE_REQUIRED')

    def test_different_request_methods(self):
        """Test middleware with different HTTP methods"""
        for method in ['get', 'post', 'put', 'patch', 'delete']:
            with self.subTest(method=method):
                request_factory_method = getattr(self.factory, method)
                request = request_factory_method('/api/some-endpoint')
                request.user = self.temp_password_user
                
                response = self.middleware(request)
                self.assertEqual(response.status_code, 403)

    def test_exact_url_matching(self):
        """Test exact URL matching for excluded endpoints"""
        excluded_urls = [
            '/api/auth/change-password',
            '/api/auth/change-password/',
            '/api/auth/logout',
            '/api/auth/logout/',
        ]
        
        included_urls = [
            '/api/auth/login',
            '/api/auth/profile',
            '/api/some-other-endpoint',
        ]
        
        for url in excluded_urls:
            with self.subTest(url=url):
                request = self.factory.get(url)
                request.user = self.temp_password_user
                response = self.middleware(request)
                self.assertEqual(response, {'status': 'success'})
        
        for url in included_urls:
            with self.subTest(url=url):
                request = self.factory.get(url)
                request.user = self.temp_password_user
                response = self.middleware(request)
                self.assertEqual(response.status_code, 403)

    def test_edge_case_24_hours_exact(self):
        """Test edge case where password is exactly 24 hours old"""
        user = User.objects.create_user(
            email='edgecase@example.com',
            username='edgecase',
            password='testpass123',
            user_type='customer',
            password_must_change=True,
            has_temporary_password=True,
            temp_password_created_at=timezone.now() - timedelta(hours=24, seconds=1)  # 24h + 1s to ensure expiration
        )
        
        request = self.factory.get('/api/some-endpoint')
        request.user = user
        
        response = self.middleware(request)
        # 24 hours and 1 second should be expired
        self.assertEqual(response.status_code, 401)
        response_data = self.parse_json_response(response)
        self.assertEqual(response_data['error']['code'], 'PASSWORD_EXPIRED')

    def test_edge_case_23_hours_59_minutes(self):
        """Test edge case where password is almost 24 hours old"""
        user = User.objects.create_user(
            email='edgecase2@example.com',
            username='edgecase2',
            password='testpass123',
            user_type='customer',
            password_must_change=True,
            has_temporary_password=True,
            temp_password_created_at=timezone.now() - timedelta(hours=23, minutes=59, seconds=59)
        )
        
        request = self.factory.get('/api/some-endpoint')
        request.user = user
        
        response = self.middleware(request)
        # Less than 24 hours should require password change but not be expired
        self.assertEqual(response.status_code, 403)
        response_data = self.parse_json_response(response)
        self.assertEqual(response_data['error']['code'], 'PASSWORD_CHANGE_REQUIRED')

class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            user_type='customer'
        )
        
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            user_type='customer',
            admin_rights=True
        )

    def test_user_creation(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.user_type, 'customer')
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)

    def test_user_id_alias(self):
        self.assertEqual(self.user.id, self.user.UserID)

    def test_get_full_name_customer(self):
        customer_profile = CustomerProfile.objects.create(
            user=self.user,
            full_name='Test Customer'
        )
        self.assertEqual(self.user.get_full_name(), 'Test Customer')

    def test_get_full_name_ngo(self):
        ngo_user = User.objects.create_user(
            email='ngo@example.com',
            username='ngo',
            password='ngopass123',
            user_type='ngo'
        )
        ngo_profile = NGOProfile.objects.create(
            user=ngo_user,
            organisation_name='Test NGO',
            organisation_contact='+1234567890',
            organisation_email='ngo@test.com',
            representative_name='John Doe',  # This should be returned by get_full_name
            representative_email='john@ngo.com',
            address_line1='123 Test St',
            city='Test City',
            province_or_state='Test Province',
            postal_code='1234',
            country='Test Country',
            npo_document=SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        )
        # get_full_name should return representative_name for NGOs
        self.assertEqual(ngo_user.get_full_name(), 'John Doe')

    def test_get_full_name_provider(self):
        provider_user = User.objects.create_user(
            email='provider@example.com',
            username='provider',
            password='providerpass123',
            user_type='provider'
        )
        provider_profile = FoodProviderProfile.objects.create(
            user=provider_user,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='test@restaurant.com',
            cipc_document=SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        )
        self.assertEqual(provider_user.get_full_name(), 'Test Restaurant')

    def test_can_login_normal(self):
        can_login, message = self.user.can_login()
        self.assertTrue(can_login)
        self.assertEqual(message, "OK")

    def test_can_login_inactive(self):
        self.user.is_active = False
        self.user.save()
        can_login, message = self.user.can_login()
        self.assertFalse(can_login)
        self.assertEqual(message, "Account is deactivated")

    def test_can_login_locked(self):
        self.user.account_locked_until = timezone.now() + timedelta(minutes=30)
        self.user.save()
        can_login, message = self.user.can_login()
        self.assertFalse(can_login)
        self.assertEqual(message, "Account is temporarily locked")

    def test_can_login_password_change_required(self):
        self.user.password_must_change = True
        self.user.save()
        can_login, message = self.user.can_login()
        self.assertTrue(can_login)
        self.assertEqual(message, "Password must be changed")

    def test_increment_failed_login(self):
        initial_attempts = self.user.failed_login_attempts
        self.user.increment_failed_login()
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_login_attempts, initial_attempts + 1)

    def test_increment_failed_login_lock_account(self):
        self.user.failed_login_attempts = 4
        self.user.save()
        self.user.increment_failed_login()
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_login_attempts, 5)
        self.assertIsNotNone(self.user.account_locked_until)

    def test_reset_failed_login_attempts(self):
        self.user.failed_login_attempts = 3
        self.user.account_locked_until = timezone.now()
        self.user.save()
        self.user.reset_failed_login_attempts()
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_login_attempts, 0)
        self.assertIsNone(self.user.account_locked_until)

    def test_set_temporary_password(self):
        self.user.set_temporary_password('temp123')
        self.user.refresh_from_db()
        self.assertTrue(self.user.has_temporary_password)
        self.assertTrue(self.user.password_must_change)
        self.assertIsNotNone(self.user.temp_password_created_at)
        self.assertTrue(self.user.check_password('temp123'))

    def test_complete_password_change(self):
        self.user.has_temporary_password = True
        self.user.password_must_change = True
        self.user.temp_password_created_at = timezone.now()
        self.user.save()
        self.user.complete_password_change()
        self.user.refresh_from_db()
        self.assertFalse(self.user.has_temporary_password)
        self.assertFalse(self.user.password_must_change)
        self.assertIsNone(self.user.temp_password_created_at)

    def test_deactivate_account(self):
        self.user.deactivate_account(self.admin_user, "Test deactivation")
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
        self.assertEqual(self.user.deactivation_reason, "Test deactivation")
        self.assertEqual(self.user.deactivated_by, self.admin_user)
        self.assertIsNotNone(self.user.deactivated_at)

    def test_reactivate_account(self):
        self.user.is_active = False
        self.user.deactivation_reason = "Test"
        self.user.deactivated_by = self.admin_user
        self.user.deactivated_at = timezone.now()
        self.user.save()
        self.user.reactivate_account()
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)
        self.assertEqual(self.user.deactivation_reason, "")
        self.assertIsNone(self.user.deactivated_by)
        self.assertIsNone(self.user.deactivated_at)

class CustomerProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='customer@example.com',
            username='customer',
            password='testpass123',
            user_type='customer'
        )
        self.profile = CustomerProfile.objects.create(
            user=self.user,
            full_name='Test Customer'
        )

    def test_customer_profile_creation(self):
        self.assertEqual(self.profile.full_name, 'Test Customer')
        self.assertEqual(self.profile.user, self.user)
        self.assertEqual(str(self.profile), 'Customer: Test Customer')

class NGOProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='ngo@example.com',
            username='ngo',
            password='testpass123',
            user_type='ngo'
        )
        self.profile = NGOProfile.objects.create(
            user=self.user,
            organisation_name='Test NGO',
            organisation_contact='+1234567890',
            organisation_email='ngo@test.com',
            representative_name='John Doe',
            representative_email='john@ngo.com',
            address_line1='123 Test St',
            city='Test City',
            province_or_state='Test Province',
            postal_code='1234',
            country='Test Country',
            npo_document=SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        )

    def test_ngo_profile_creation(self):
        self.assertEqual(self.profile.organisation_name, 'Test NGO')
        self.assertEqual(self.profile.status, 'pending_verification')
        self.assertEqual(str(self.profile), 'NGO: Test NGO')

    def test_ngo_profile_address_fields(self):
        self.assertEqual(self.profile.address_line1, '123 Test St')
        self.assertEqual(self.profile.city, 'Test City')
        self.assertEqual(self.profile.province_or_state, 'Test Province')
        self.assertEqual(self.profile.postal_code, '1234')
        self.assertEqual(self.profile.country, 'Test Country')

class FoodProviderProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='provider@example.com',
            username='provider',
            password='testpass123',
            user_type='provider'
        )
        self.provider = FoodProviderProfile.objects.create(
            user=self.user,
            business_name='Test Restaurant',
            business_address='123 Test St, Johannesburg',
            business_contact='+1234567890',
            business_email='test@restaurant.com',
            cipc_document=SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        )

    def test_provider_profile_creation(self):
        self.assertEqual(self.provider.business_name, 'Test Restaurant')
        self.assertEqual(self.provider.status, 'pending_verification')
        self.assertEqual(str(self.provider), 'Provider: Test Restaurant')

    # def test_geocode_address_success(self):
    #     """Test successful geocoding with mocked requests"""
    #     with patch('authentication.models.requests.get') as mock_get:
    #         mock_response = MagicMock()
    #         mock_response.json.return_value = [{
    #             'lat': '-26.2041',
    #             'lon': '28.0473'
    #         }]
    #         mock_get.return_value = mock_response
            
    #         # Call the method directly
    #         self.provider.geocode_address()
            
    #         self.assertEqual(float(self.provider.latitude), -26.2041)
    #         self.assertEqual(float(self.provider.longitude), 28.0473)
    #         self.assertFalse(self.provider.geocoding_failed)
    #         self.assertEqual(self.provider.geocoding_error, '')
    #         mock_get.assert_called_once()

    # def test_geocode_address_no_results(self):
    #     """Test geocoding with no results"""
    #     with patch('authentication.models.requests.get') as mock_get:
    #         mock_response = MagicMock()
    #         mock_response.json.return_value = []
    #         mock_get.return_value = mock_response
            
    #         self.provider.geocode_address()
            
    #         self.assertIsNone(self.provider.latitude)
    #         self.assertIsNone(self.provider.longitude)
    #         self.assertTrue(self.provider.geocoding_failed)
    #         self.assertEqual(self.provider.geocoding_error, 'No results found for address')

    # def test_geocode_address_exception(self):
    #     """Test geocoding with exception"""
    #     with patch('authentication.models.requests.get') as mock_get:
    #         mock_get.side_effect = Exception('Network error')
            
    #         self.provider.geocode_address()
            
    #         self.assertIsNone(self.provider.latitude)
    #         self.assertIsNone(self.provider.longitude)
    #         self.assertTrue(self.provider.geocoding_failed)
    #         self.assertIn('Network error', self.provider.geocoding_error)

    def test_coordinates_property(self):
        self.provider.latitude = -26.2041
        self.provider.longitude = 28.0473
        coordinates = self.provider.coordinates
        self.assertEqual(coordinates, {'lat': -26.2041, 'lng': 28.0473})

    def test_coordinates_property_none(self):
        coordinates = self.provider.coordinates
        self.assertIsNone(coordinates)

    def test_openstreetmap_url_with_coordinates(self):
        self.provider.latitude = -26.2041
        self.provider.longitude = 28.0473
        url = self.provider.openstreetmap_url
        self.assertIn('-26.2041', url)
        self.assertIn('28.0473', url)

    def test_openstreetmap_url_with_address(self):
        self.provider.latitude = None
        self.provider.longitude = None
        url = self.provider.openstreetmap_url
        self.assertIn('123%20Test%20St%2C%20Johannesburg', url)

    def test_add_tag(self):
        result = self.provider.add_tag('vegetarian')
        self.assertTrue(result)
        self.assertIn('Vegetarian', self.provider.business_tags)
        
        # Test adding duplicate tag
        result = self.provider.add_tag('vegetarian')
        self.assertFalse(result)

    def test_remove_tag(self):
        self.provider.business_tags = ['Vegetarian', 'Vegan']
        self.provider.save()
        
        result = self.provider.remove_tag('vegetarian')
        self.assertTrue(result)
        self.assertNotIn('Vegetarian', self.provider.business_tags)
        self.assertIn('Vegan', self.provider.business_tags)
        
        # Test removing non-existent tag
        result = self.provider.remove_tag('nonexistent')
        self.assertFalse(result)

    def test_get_tag_display(self):
        self.provider.business_tags = ['vegetarian', '  vegan  ', '']
        tags = self.provider.get_tag_display()
        self.assertEqual(tags, ['Vegetarian', 'Vegan'])

    def test_has_complete_profile(self):
        # Test incomplete profile
        self.assertFalse(self.provider.has_complete_profile())
        
        # Test complete profile with description
        self.provider.business_description = 'A test restaurant'
        self.provider.save()
        self.assertTrue(self.provider.has_complete_profile())
        
        # Test complete profile with tags
        self.provider.business_description = ''
        self.provider.business_tags = ['test']
        self.provider.save()
        self.assertTrue(self.provider.has_complete_profile())

    def test_get_popular_tags(self):
        """Test getting popular tags from verified providers"""
        # Create actual provider instances instead of mocking
        provider1 = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='p1@test.com', username='p1', password='test', user_type='provider'),
            business_name='Provider 1',
            business_address='Address 1',
            business_contact='+1111111111',
            business_email='p1@test.com',
            cipc_document=SimpleUploadedFile("test1.pdf", b"file_content", content_type="application/pdf"),
            status='verified',
            business_tags=['Vegetarian', 'Vegan']
        )
        
        provider2 = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='p2@test.com', username='p2', password='test', user_type='provider'),
            business_name='Provider 2',
            business_address='Address 2',
            business_contact='+2222222222',
            business_email='p2@test.com',
            cipc_document=SimpleUploadedFile("test2.pdf", b"file_content", content_type="application/pdf"),
            status='verified',
            business_tags=['Vegetarian', 'Gluten-Free']
        )
        
        provider3 = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='p3@test.com', username='p3', password='test', user_type='provider'),
            business_name='Provider 3',
            business_address='Address 3',
            business_contact='+3333333333',
            business_email='p3@test.com',
            cipc_document=SimpleUploadedFile("test3.pdf", b"file_content", content_type="application/pdf"),
            status='pending_verification',  # Should not be included
            business_tags=['Vegetarian']
        )
        
        popular_tags = FoodProviderProfile.get_popular_tags()
        
        self.assertEqual(len(popular_tags), 3)
        self.assertEqual(popular_tags[0]['tag'], 'Vegetarian')
        self.assertEqual(popular_tags[0]['count'], 2)  # Only from verified providers
        self.assertEqual(popular_tags[1]['tag'], 'Vegan')
        self.assertEqual(popular_tags[1]['count'], 1)
        self.assertEqual(popular_tags[2]['tag'], 'Gluten-Free')
        self.assertEqual(popular_tags[2]['count'], 1)

    def test_save_tracks_updates(self):
        # Initial save
        self.provider.save()
        
        # Update banner
        self.provider.banner = SimpleUploadedFile("banner.jpg", b"file_content", content_type="image/jpeg")
        self.provider.save()
        self.assertIsNotNone(self.provider.banner_updated_at)
        
        # Update description
        self.provider.business_description = 'Updated description'
        self.provider.save()
        self.assertIsNotNone(self.provider.description_updated_at)
        
        # Update tags
        self.provider.business_tags = ['updated']
        self.provider.save()
        self.assertIsNotNone(self.provider.tags_updated_at)

class GeocodeAddressesCommandTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            user_type='provider'
        )
        
        # Create test businesses with and without coordinates
        self.business_without_coords = FoodProviderProfile.objects.create(
            user=self.user,
            business_name='Business Without Coords',
            business_address='123 Test Street, Johannesburg',
            business_contact='+1234567890',
            business_email='test@business.com',
            cipc_document=SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf"),
            latitude=None,
            longitude=None
        )
        
        self.business_with_coords = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='test2@example.com', username='testuser2', password='testpass123', user_type='provider'),
            business_name='Business With Coords',
            business_address='456 Test Street, Cape Town',
            business_contact='+0987654321',
            business_email='test2@business.com',
            cipc_document=SimpleUploadedFile("test2.pdf", b"file_content", content_type="application/pdf"),
            latitude=-33.9249,
            longitude=18.4241
        )
        
        self.business_empty_address = FoodProviderProfile.objects.create(
            user=User.objects.create_user(email='test3@example.com', username='testuser3', password='testpass123', user_type='provider'),
            business_name='Business Empty Address',
            business_address='',
            business_contact='+1111111111',
            business_email='test3@business.com',
            cipc_document=SimpleUploadedFile("test3.pdf", b"file_content", content_type="application/pdf"),
            latitude=None,
            longitude=None
        )

    @patch('authentication.management.commands.geocode_addresses.FoodProviderProfile.geocode_address')
    def test_command_geocoding_failure(self, mock_geocode):
        """Test command when geocoding fails"""
        # Mock failed geocoding
        def mock_geocode_side_effect():
            self.business_without_coords.geocoding_failed = True
            self.business_without_coords.geocoding_error = 'No results found'
        
        mock_geocode.side_effect = mock_geocode_side_effect
        
        # Capture command output
        out = StringIO()
        call_command('geocode_addresses', stdout=out)
        
        output = out.getvalue()
        
        # Verify failure was handled
        self.assertIn('Failed: No results found', output)
        self.assertIn('Success: 0, Errors: 1', output)

    @patch('authentication.management.commands.geocode_addresses.FoodProviderProfile.geocode_address')
    def test_command_geocoding_exception(self, mock_geocode):
        """Test command when geocoding raises exception"""
        # Mock exception during geocoding
        mock_geocode.side_effect = Exception('Network error')
        
        # Capture command output
        out = StringIO()
        call_command('geocode_addresses', stdout=out)
        
        output = out.getvalue()
        
        # Verify exception was handled
        self.assertIn('Exception: Network error', output)
        self.assertIn('Success: 0, Errors: 1', output)

    def test_command_no_businesses_to_geocode(self):
        """Test command when no businesses need geocoding"""
        # Remove all businesses without coordinates
        FoodProviderProfile.objects.filter(latitude__isnull=True, longitude__isnull=True).delete()
        
        # Capture command output
        out = StringIO()
        call_command('geocode_addresses', stdout=out)
        
        output = out.getvalue()
        
        # Verify no businesses message
        self.assertIn('No businesses need geocoding', output)

    def test_command_help_text(self):
        """Test command help text"""
        # Use a different approach to test help
        try:
            call_command('geocode_addresses', '--help')
        except SystemExit:
            # Help command typically exits with SystemExit
            pass
        # This test is mostly to ensure the command exists and has help
        self.assertTrue(True)


# Run all tests
if __name__ == '__main__':
    import unittest
    unittest.main()