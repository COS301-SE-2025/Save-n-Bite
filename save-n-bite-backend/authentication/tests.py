from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile
from unittest.mock import patch, MagicMock

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
            # You might want to check your server logs for the full traceback