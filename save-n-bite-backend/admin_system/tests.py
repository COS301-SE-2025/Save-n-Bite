# admin_panel/tests.py
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from unittest.mock import patch, MagicMock
import uuid

from admin_system.models import AdminActionLog, SystemLogEntry, PasswordReset
from admin_system.services import (
    AdminService, VerificationService, PasswordResetService,
    UserManagementService, DashboardService
)
from authentication.models import NGOProfile, FoodProviderProfile, CustomerProfile

User = get_user_model()

# ============ FIXTURES ============

@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    return User.objects.create_user(
        username='admin_test',
        email='admin@test.com',
        password='adminpass123',
        admin_rights=True,
        user_type='customer'
    )

@pytest.fixture
def regular_user(db):
    """Create a regular user"""
    return User.objects.create_user(
        username='regular_test',
        email='regular@test.com',
        password='regularpass123',
        admin_rights=False,
        user_type='customer'
    )

@pytest.fixture
def ngo_user(db):
    """Create an NGO user with profile"""
    user = User.objects.create_user(
        username='ngo_test',
        email='ngo@test.com',
        password='ngopass123',
        user_type='ngo'
    )
    
    NGOProfile.objects.create(
        user=user,
        organisation_name='Test NGO',
        organisation_contact='+1234567890',
        organisation_email='ngo@test.com',
        representative_name='John Doe',
        representative_email='john@test.com',
        address_line1='123 Test St',
        city='Test City',
        province_or_state='Test Province',
        postal_code='12345',
        country='Test Country',
        status='pending_verification'
    )
    
    return user

@pytest.fixture
def provider_user(db):
    """Create a provider user with profile"""
    user = User.objects.create_user(
        username='provider_test',
        email='provider@test.com',
        password='providerpass123',
        user_type='provider'
    )
    
    FoodProviderProfile.objects.create(
        user=user,
        business_name='Test Restaurant',
        business_address='456 Business Ave',
        business_contact='+1234567890',
        business_email='business@test.com',
        status='pending_verification'
    )
    
    return user

@pytest.fixture
def authenticated_admin_client(admin_user):
    """Create an authenticated admin API client"""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client

@pytest.fixture
def authenticated_regular_client(regular_user):
    """Create an authenticated regular user API client"""
    client = APIClient()
    client.force_authenticate(user=regular_user)
    return client

# ============ PERMISSION TESTS ============

class TestAdminPermissions:
    
    def test_admin_dashboard_access_allowed(self, authenticated_admin_client):
        """Test that admin can access dashboard"""
        response = authenticated_admin_client.get('/api/admin/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert 'dashboard' in response.json()
    
    def test_admin_dashboard_access_denied_regular_user(self, authenticated_regular_client):
        """Test that regular user cannot access dashboard"""
        response = authenticated_regular_client.get('/api/admin/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_dashboard_access_denied_unauthenticated(self):
        """Test that unauthenticated user cannot access dashboard"""
        client = APIClient()
        response = client.get('/api/admin/dashboard/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

# ============ SERVICE TESTS ============

class TestAdminService:
    
    def test_log_admin_action(self, admin_user):
        """Test logging admin actions"""
        log_entry = AdminService.log_admin_action(
            admin_user=admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='123',
            description='Test action',
            metadata={'test': 'data'}
        )
        
        assert log_entry.admin_user == admin_user
        assert log_entry.action_type == 'user_verification'
        assert log_entry.target_type == 'ngo_profile'
        assert log_entry.target_id == '123'
        assert log_entry.metadata == {'test': 'data'}

class TestVerificationService:
    
    def test_update_ngo_verification_status(self, admin_user, ngo_user):
        """Test updating NGO verification status"""
        ngo_profile = ngo_user.ngo_profile
        
        updated_profile = VerificationService.update_verification_status(
            admin_user=admin_user,
            profile_type='ngo',
            profile_id=ngo_profile.id,
            new_status='verified',
            reason='All documents valid'
        )
        
        assert updated_profile.status == 'verified'
        
        # Check that action was logged
        log_exists = AdminActionLog.objects.filter(
            admin_user=admin_user,
            action_type='user_verification',
            target_type='ngo_profile'
        ).exists()
        assert log_exists
    
    def test_update_provider_verification_status(self, admin_user, provider_user):
        """Test updating provider verification status"""
        provider_profile = provider_user.provider_profile
        
        updated_profile = VerificationService.update_verification_status(
            admin_user=admin_user,
            profile_type='provider',
            profile_id=provider_profile.id,
            new_status='verified',
            reason='Business license verified'
        )
        
        assert updated_profile.status == 'verified'
    
    def test_update_verification_invalid_profile_type(self, admin_user):
        """Test updating verification with invalid profile type"""
        with pytest.raises(ValueError, match="Invalid profile type"):
            VerificationService.update_verification_status(
                admin_user=admin_user,
                profile_type='invalid',
                profile_id=uuid.uuid4(),
                new_status='verified'
            )
    
    def test_get_pending_verifications(self, ngo_user, provider_user):
        """Test getting pending verifications"""
        verifications = VerificationService.get_pending_verifications()
        
        assert verifications['total_count'] == 2
        assert verifications['ngos'].count() == 1
        assert verifications['providers'].count() == 1

#class TestPasswordResetService:
    
    # def test_generate_temporary_password(self):
    #     """Test temporary password generation"""
    #     password = PasswordResetService.generate_temporary_password()
        
    #     assert len(password) == 12
    #     assert any(c.isalpha() for c in password)
    #     assert any(c.isdigit() for c in password)
    
    # @patch('admin_panel.services.send_mail')
    # def test_reset_user_password(self, mock_send_mail, admin_user, regular_user):
    #     """Test password reset functionality"""
    #     mock_send_mail.return_value = True
        
    #     password_reset = PasswordResetService.reset_user_password(
    #         admin_user=admin_user,
    #         target_user=regular_user
    #     )
        
    #     assert password_reset.target_user == regular_user
    #     assert password_reset.reset_by == admin_user
    #     assert mock_send_mail.called
        
    #     # Check that action was logged
    #     log_exists = AdminActionLog.objects.filter(
    #         admin_user=admin_user,
    #         action_type='password_reset'
    #     ).exists()
    #     assert log_exists

class TestUserManagementService:
    def test_toggle_user_status_activate(self, admin_user, regular_user):
        """Test activating a user"""
        regular_user.is_active = False
        regular_user.save()
        
        updated_user = UserManagementService.toggle_user_status(
            admin_user=admin_user,
            target_user=regular_user
        )
        
        assert updated_user.is_active == True
        
        # Check that action was logged
        log_exists = AdminActionLog.objects.filter(
            admin_user=admin_user,
            action_type='user_management'
        ).exists()
        assert log_exists
    
    def test_toggle_user_status_deactivate(self, admin_user, regular_user):
        """Test deactivating a user"""
        regular_user.is_active = True
        regular_user.save()
        
        updated_user = UserManagementService.toggle_user_status(
            admin_user=admin_user,
            target_user=regular_user
        )
        
        assert updated_user.is_active == False

class TestDashboardService:
    
    def test_get_dashboard_stats(self, admin_user, regular_user, ngo_user, provider_user):
        """Test dashboard statistics generation"""
        stats = DashboardService.get_dashboard_stats()
        
        assert 'users' in stats
        assert 'verifications' in stats
        assert 'listings' in stats
        assert 'transactions' in stats
        assert 'system_health' in stats
        
        # Check user stats
        assert stats['users']['total'] >= 4  # admin, regular, ngo, provider
        assert stats['verifications']['pending_total'] == 2  # ngo + provider
    
    def test_get_recent_activity(self, ngo_user, provider_user):
        """Test recent activity generation"""
        activities = DashboardService.get_recent_activity()
        
        assert isinstance(activities, list)
        assert len(activities) >= 0  # Could be empty or have activities
        
        # If there are activities, check structure
        if activities:
            activity = activities[0]
            assert 'type' in activity
            assert 'description' in activity
            assert 'timestamp' in activity
            assert 'icon' in activity

# ============ API ENDPOINT TESTS ============

class TestDashboardAPI:
    
    def test_dashboard_endpoint(self, authenticated_admin_client):
        """Test dashboard API endpoint"""
        response = authenticated_admin_client.get('/api/admin/dashboard/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'dashboard' in data
        assert 'recent_activity' in data
        assert 'admin_info' in data

class TestUserManagementAPI:
    
    def test_get_all_users(self, authenticated_admin_client):
        """Test get all users endpoint"""
        response = authenticated_admin_client.get('/api/admin/users/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'users' in data
        assert 'pagination' in data
    
    def test_toggle_user_status_endpoint(self, authenticated_admin_client, regular_user):
        """Test toggle user status endpoint"""
        data = {
            'user_id': str(regular_user.UserID),
            'reason': 'Test deactivation'
        }
        
        response = authenticated_admin_client.post('/api/admin/users/toggle-status/', data)
        
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert 'message' in response_data
        assert 'user' in response_data
    
    # @patch('admin_panel.services.PasswordResetService.reset_user_password')
    # def test_reset_password_endpoint(self, mock_reset, authenticated_admin_client, regular_user):
    #     """Test password reset endpoint"""
    #     mock_reset.return_value = MagicMock()
    #     mock_reset.return_value.expires_at.isoformat.return_value = '2024-01-01T00:00:00'
        
    #     data = {
    #         'user_id': str(regular_user.UserID),
    #         'reason': 'User forgot password'
    #     }
        
    #     response = authenticated_admin_client.post('/api/admin/users/reset-password/', data)
        
    #     assert response.status_code == status.HTTP_200_OK
    #     assert mock_reset.called

class TestVerificationAPI:
    
    def test_get_pending_verifications_endpoint(self, authenticated_admin_client, ngo_user, provider_user):
        """Test get pending verifications endpoint"""
        response = authenticated_admin_client.get('/api/admin/verifications/pending/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'pending_verifications' in data
        assert data['pending_verifications']['total_count'] == 2
    
    def test_update_verification_status_endpoint(self, authenticated_admin_client, ngo_user):
        """Test update verification status endpoint"""
        data = {
            'profile_type': 'ngo',
            'profile_id': str(ngo_user.ngo_profile.id),
            'new_status': 'verified',
            'reason': 'All documents validated'
        }
        
        response = authenticated_admin_client.post('/api/admin/verifications/update/', data)
        
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert 'message' in response_data
        assert 'profile' in response_data

class TestAnalyticsAPI:
    
    def test_analytics_endpoint(self, authenticated_admin_client):
        """Test analytics endpoint"""
        response = authenticated_admin_client.get('/api/admin/analytics/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'analytics' in data
        
        analytics = data['analytics']
        assert 'total_users' in analytics
        assert 'user_distribution' in analytics
        assert 'top_providers' in analytics

class TestAuditLogsAPI:
    
    def test_admin_action_logs_endpoint(self, authenticated_admin_client, admin_user):
        """Test admin action logs endpoint"""
        # Create a test log entry
        AdminService.log_admin_action(
            admin_user=admin_user,
            action_type='user_verification',
            target_type='test',
            target_id='123',
            description='Test log entry'
        )
        
        response = authenticated_admin_client.get('/api/admin/logs/admin-actions/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'logs' in data
        assert 'pagination' in data
        assert len(data['logs']) >= 1

# ============ INTEGRATION TESTS ============

class TestAdminWorkflow:
    
    def test_complete_verification_workflow(self, authenticated_admin_client, ngo_user):
        """Test complete workflow from pending to verified"""
        # 1. Check pending verifications
        response = authenticated_admin_client.get('/api/admin/verifications/pending/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['pending_verifications']['total_count'] >= 1
        
        # 2. Approve verification
        data = {
            'profile_type': 'ngo',
            'profile_id': str(ngo_user.ngo_profile.id),
            'new_status': 'verified',
            'reason': 'Documents approved'
        }
        response = authenticated_admin_client.post('/api/admin/verifications/update/', data)
        assert response.status_code == status.HTTP_200_OK
        
        # 3. Check audit logs
        response = authenticated_admin_client.get('/api/admin/logs/admin-actions/')
        assert response.status_code == status.HTTP_200_OK
        logs = response.json()['logs']
        assert any(log['action_type'] == 'user_verification' for log in logs)
    
    def test_user_management_workflow(self, authenticated_admin_client, regular_user):
        """Test complete user management workflow"""
        # 1. Get user list
        response = authenticated_admin_client.get('/api/admin/users/')
        assert response.status_code == status.HTTP_200_OK
        
        # 2. Deactivate user
        data = {'user_id': str(regular_user.UserID)}
        response = authenticated_admin_client.post('/api/admin/users/toggle-status/', data)
        assert response.status_code == status.HTTP_200_OK
        
        # 3. Check audit logs
        response = authenticated_admin_client.get('/api/admin/logs/admin-actions/')
        assert response.status_code == status.HTTP_200_OK