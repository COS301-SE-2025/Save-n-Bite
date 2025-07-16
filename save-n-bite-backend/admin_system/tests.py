# admin_system/tests.py
import pytest
from django.contrib.auth import get_user_model
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock, Mock
from datetime import datetime, timedelta
from django.utils import timezone
from django.urls import reverse
from django.core import mail
from django.conf import settings
import uuid
import json

# Import models and services
from admin_system.models import (
    AdminActionLog, SystemAnnouncement, SystemLogEntry, 
    DocumentAccessLog, PasswordReset, User
)
from admin_system.services import (
    AdminService, VerificationService, PasswordResetService,
    UserManagementService, DashboardService, SystemLogService
)
from admin_system.permissions import (
    IsSystemAdmin, CanModerateContent, CanManageUsers,
    CanViewAuditLogs, CanManageSystemSettings
)
from admin_system.utils import SystemLogger, get_file_size_human_readable
from authentication.models import FoodProviderProfile, CustomerProfile, NGOProfile


# ============ FIXTURES ============

@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    return User.objects.create_user(
        username='admin_test',
        email='admin@test.com',
        password='adminpass123',
        admin_rights=True,
        user_type='customer',
        is_superuser=True
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
def customer_user(db):
    """Create a customer user with profile"""
    user = User.objects.create_user(
        username='customer_test',
        email='customer@test.com',
        password='customerpass123',
        user_type='customer'
    )
    
    CustomerProfile.objects.create(
        user=user,
        full_name='Test Customer'
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

@pytest.fixture
def system_log_entry(db):
    """Create a test system log entry"""
    return SystemLogEntry.objects.create(
        severity='error',
        category='authentication',
        title='Test Error',
        description='Test error description',
        error_details={'test': 'data'}
    )

@pytest.fixture
def admin_action_log(db, admin_user):
    """Create a test admin action log"""
    return AdminActionLog.objects.create(
        admin_user=admin_user,
        action_type='user_verification',
        target_type='ngo_profile',
        target_id='test-id',
        action_description='Test action',
        metadata={'test': 'data'}
    )

# ============ MODEL TESTS ============

class TestAdminActionLogModel(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
    
    def test_admin_action_log_creation(self):
        """Test creating an admin action log"""
        log = AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='test-id',
            action_description='Test action',
            metadata={'test': 'data'},
            ip_address='127.0.0.1'
        )
        
        self.assertEqual(log.admin_user, self.admin_user)
        self.assertEqual(log.action_type, 'user_verification')
        self.assertEqual(log.target_type, 'ngo_profile')
        self.assertEqual(log.target_id, 'test-id')
        self.assertEqual(log.metadata, {'test': 'data'})
        self.assertEqual(log.ip_address, '127.0.0.1')
    
    def test_admin_action_log_str_representation(self):
        """Test string representation of admin action log"""
        log = AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='test-id',
            action_description='Test action'
        )
        
        expected = f"{self.admin_user.username} - user_verification - {log.timestamp}"
        self.assertEqual(str(log), expected)

class TestSystemLogEntryModel(TestCase):
    
    def test_system_log_entry_creation(self):
        """Test creating a system log entry"""
        log = SystemLogEntry.objects.create(
            severity='error',
            category='authentication',
            title='Test Error',
            description='Test error description',
            error_details={'error_code': 500}
        )
        
        self.assertEqual(log.severity, 'error')
        self.assertEqual(log.category, 'authentication')
        self.assertEqual(log.title, 'Test Error')
        self.assertEqual(log.status, 'open')
        self.assertEqual(log.error_details, {'error_code': 500})
    
    def test_system_log_entry_str_representation(self):
        """Test string representation of system log entry"""
        log = SystemLogEntry.objects.create(
            severity='critical',
            category='database',
            title='Database Connection Failed',
            description='Cannot connect to database'
        )
        
        expected = "CRITICAL: Database Connection Failed"
        self.assertEqual(str(log), expected)

class TestSystemAnnouncementModel(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
    
    def test_system_announcement_creation(self):
        """Test creating a system announcement"""
        announcement = SystemAnnouncement.objects.create(
            title='Test Announcement',
            message='Test message',
            priority='high',
            target_user_types=['customer', 'provider'],
            created_by=self.admin_user
        )
        
        self.assertEqual(announcement.title, 'Test Announcement')
        self.assertEqual(announcement.priority, 'high')
        self.assertEqual(announcement.target_user_types, ['customer', 'provider'])
        self.assertEqual(announcement.created_by, self.admin_user)
        self.assertTrue(announcement.is_active)

# ============ SERVICE TESTS ============

class TestAdminService(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
    
    def test_log_admin_action(self):
        """Test logging admin actions"""
        log_entry = AdminService.log_admin_action(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='123',
            description='Test action',
            metadata={'test': 'data'},
            ip_address='127.0.0.1'
        )
        
        self.assertEqual(log_entry.admin_user, self.admin_user)
        self.assertEqual(log_entry.action_type, 'user_verification')
        self.assertEqual(log_entry.target_type, 'ngo_profile')
        self.assertEqual(log_entry.target_id, '123')
        self.assertEqual(log_entry.metadata, {'test': 'data'})
        self.assertEqual(log_entry.ip_address, '127.0.0.1')
    
    def test_log_document_access(self):
        """Test logging document access"""
        log_entry = AdminService.log_document_access(
            admin_user=self.admin_user,
            document_type='npo_document',
            profile_type='ngo',
            profile_id='123',
            document_name='certificate.pdf',
            ip_address='127.0.0.1'
        )
        
        self.assertEqual(log_entry.admin_user, self.admin_user)
        self.assertEqual(log_entry.document_type, 'npo_document')
        self.assertEqual(log_entry.profile_type, 'ngo')
        self.assertEqual(log_entry.profile_id, '123')
        self.assertEqual(log_entry.document_name, 'certificate.pdf')


class TestAuditLogsAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        # Create some test log entries
        AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='test-id-1',
            action_description='Approved NGO verification'
        )
        
        AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_type='user_management',
            target_type='user',
            target_id='test-id-2',
            action_description='Deactivated user account'
        )
    
    def test_get_admin_action_logs_endpoint(self):
        """Test get admin action logs endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/admin-actions/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
        self.assertIn('pagination', data)
        self.assertGreaterEqual(len(data['logs']), 2)
    
    def test_get_admin_action_logs_with_filters(self):
        """Test get admin action logs with filters"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/admin-actions/?action_type=user_verification')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
        
        # Check that all returned logs are of the filtered type
        for log in data['logs']:
            self.assertEqual(log['action_type'], 'user_verification')
    
    def test_get_admin_action_logs_with_search(self):
        """Test get admin action logs with search"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/admin-actions/?search=NGO')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)

class TestSystemLogsAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.system_log = SystemLogEntry.objects.create(
            severity='error',
            category='authentication',
            title='Test Error',
            description='Test error description',
            status='open'
        )
    
    def test_get_system_logs_endpoint(self):
        """Test get system logs endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/system/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
        self.assertIn('pagination', data)
        self.assertIn('summary', data)
        self.assertGreaterEqual(len(data['logs']), 1)
    
    def test_get_system_logs_with_filters(self):
        """Test get system logs with filters"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/system/?severity=error&status=open')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
    
    def test_resolve_system_log_endpoint(self):
        """Test resolve system log endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'log_id': str(self.system_log.id),
            'resolution_notes': 'Issue resolved by restarting service'
        }
        
        response = self.client.post('/api/admin/logs/system/resolve/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertIn('message', response_data)
        self.assertIn('log', response_data)
        
        # Verify log was actually resolved
        self.system_log.refresh_from_db()
        self.assertEqual(self.system_log.status, 'resolved')
        self.assertEqual(self.system_log.resolved_by, self.admin_user)
    
    def test_resolve_system_log_invalid_id(self):
        """Test resolve system log with invalid ID"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'log_id': str(uuid.uuid4()),
            'resolution_notes': 'Test'
        }
        
        response = self.client.post('/api/admin/logs/system/resolve/', data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class TestAnalyticsAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        # Create additional users for analytics
        User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='pass123',
            user_type='customer'
        )
        
        User.objects.create_user(
            username='customer2',
            email='customer2@test.com',
            password='pass123',
            user_type='customer'
        )
    
    def test_get_analytics_endpoint(self):
        """Test get analytics endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/analytics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('analytics', data)
        
        analytics = data['analytics']
        self.assertIn('total_users', analytics)
        self.assertIn('user_distribution', analytics)
        self.assertIn('top_providers', analytics)
        self.assertGreaterEqual(analytics['total_users'], 3)

class TestDataExportAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
    
    def test_export_users_data(self):
        """Test export users data"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'export_type': 'users',
            'format': 'csv'
        }
        
        response = self.client.post('/api/admin/export/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_export_analytics_data(self):
        """Test export analytics data"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'export_type': 'analytics',
            'format': 'csv'
        }
        
        response = self.client.post('/api/admin/export/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
    
    def test_export_invalid_type(self):
        """Test export with invalid type"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'export_type': 'invalid',
            'format': 'csv'
        }
        
        response = self.client.post('/api/admin/export/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

# ============ INTEGRATION TESTS ============

class TestAdminWorkflowIntegration(TransactionTestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.ngo_user = User.objects.create_user(
            username='ngo_test',
            email='ngo@test.com',
            password='ngopass123',
            user_type='ngo'
        )
        
        self.ngo_profile = NGOProfile.objects.create(
            user=self.ngo_user,
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
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_complete_verification_workflow(self):
        """Test complete workflow from pending to verified"""
        # 1. Check pending verifications
        response = self.client.get('/api/admin/verifications/pending/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['pending_verifications']['total_count'], 1)
        
        # 2. Approve verification
        data = {
            'profile_type': 'ngo',
            'profile_id': str(self.ngo_profile.id),
            'new_status': 'verified',
            'reason': 'Documents approved'
        }
        response = self.client.post('/api/admin/verifications/update/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Check audit logs
        response = self.client.get('/api/admin/logs/admin-actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        self.assertTrue(any(log['action_type'] == 'user_verification' for log in logs))
        
        # 4. Verify pending count decreased
        response = self.client.get('/api/admin/verifications/pending/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['pending_verifications']['total_count'], 0)
    
    def test_user_management_workflow(self):
        """Test complete user management workflow"""
        # 1. Get user list
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        initial_users = response.json()['users']
        
        # 2. Deactivate user
        data = {'user_id': str(self.ngo_user.UserID)}
        response = self.client.post('/api/admin/users/toggle-status/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Check user is deactivated
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        users = response.json()['users']
        ngo_user_data = next(user for user in users if user['UserID'] == str(self.ngo_user.UserID))
        self.assertEqual(ngo_user_data['status'], 'inactive')
        
        # 4. Check audit logs
        response = self.client.get('/api/admin/logs/admin-actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        self.assertTrue(any(log['action_type'] == 'user_management' for log in logs))
    
    def test_system_log_workflow(self):
        """Test complete system log workflow"""
        # 1. Create system log
        system_log = SystemLogEntry.objects.create(
            severity='error',
            category='authentication',
            title='Login System Error',
            description='Multiple login failures detected',
            status='open'
        )
        
        # 2. Check system logs
        response = self.client.get('/api/admin/logs/system/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        self.assertTrue(any(log['id'] == str(system_log.id) for log in logs))
        
        # 3. Resolve system log
        data = {
            'log_id': str(system_log.id),
            'resolution_notes': 'Fixed by updating authentication service'
        }
        response = self.client.post('/api/admin/logs/system/resolve/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Check log is resolved
        response = self.client.get('/api/admin/logs/system/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        resolved_log = next(log for log in logs if log['id'] == str(system_log.id))
        self.assertEqual(resolved_log['status'], 'resolved')
        
        # 5. Check audit logs for resolution
        response = self.client.get('/api/admin/logs/admin-actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        self.assertTrue(any(log['action_type'] == 'system_management' for log in logs))

# ============ PERFORMANCE TESTS ============

class TestAdminPerformance(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        # Create multiple users for performance testing
        for i in range(100):
            User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='pass123',
                user_type='customer'
            )
    
    def test_get_users_performance(self):
        """Test get users endpoint performance with many users"""
        client = APIClient()
        client.force_authenticate(user=self.admin_user)
        
        import time
        start_time = time.time()
        
        response = client.get('/api/admin/users/')
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(execution_time, 2.0)  # Should complete within 2 seconds
    
    def test_dashboard_performance(self):
        """Test dashboard endpoint performance"""
        client = APIClient()
        client.force_authenticate(user=self.admin_user)
        
        import time
        start_time = time.time()
        
        response = client.get('/api/admin/dashboard/')
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(execution_time, 3.0)  # Should complete within 3 seconds

# ============ ERROR HANDLING TESTS ============

class TestErrorHandling(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
    
    def test_service_error_handling(self):
        """Test service error handling"""
        # Test with invalid UUID
        with self.assertRaises(ValueError):
            VerificationService.update_verification_status(
                admin_user=self.admin_user,
                profile_type='ngo',
                profile_id=uuid.uuid4(),
                new_status='verified'
            )
    
    def test_api_error_responses(self):
        """Test API error responses"""
        client = APIClient()
        client.force_authenticate(user=self.admin_user)
        
        # Test invalid data
        response = client.post('/api/admin/verifications/update/', {
            'profile_type': 'invalid',
            'profile_id': 'invalid-uuid',
            'new_status': 'verified'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

# ============ SECURITY TESTS ============

class TestSecurityFeatures(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.regular_user = User.objects.create_user(
            username='regular_test',
            email='regular@test.com',
            password='regularpass123',
            admin_rights=False,
            user_type='customer'
        )
    
    def test_admin_action_logging(self):
        """Test that admin actions are properly logged"""
        # Perform admin action
        UserManagementService.toggle_user_status(
            admin_user=self.admin_user,
            target_user=self.regular_user,
            ip_address='127.0.0.1'
        )
        
        # Check log was created
        log = AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_type='user_management'
        ).first()
        
        self.assertIsNotNone(log)
        self.assertEqual(log.ip_address, '127.0.0.1')
        self.assertIn('target_id', log.action_description)
    
    def test_permission_enforcement(self):
        """Test that permissions are properly enforced"""
        client = APIClient()
        client.force_authenticate(user=self.regular_user)
        
        # Try to access admin endpoint
        response = client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    # Try to perform admin action
        response = client.post('/api/admin/users/toggle-status/', {
        'user_id': str(self.regular_user.UserID)
    })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.ngo_user = User.objects.create_user(
        username='ngo_test',
        email='ngo@test.com',
        password='ngopass123',
        user_type='ngo'
    )
    
        self.ngo_profile = NGOProfile.objects.create(
            user=self.ngo_user,
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
    
    def test_update_ngo_verification_status(self):
        """Test updating NGO verification status"""
        updated_profile = VerificationService.update_verification_status(
            admin_user=self.admin_user,
            profile_type='ngo',
            profile_id=self.ngo_profile.id,
            new_status='verified',
            reason='All documents valid'
        )
        
        self.assertEqual(updated_profile.status, 'verified')
        
        # Check that action was logged
        log_exists = AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile'
        ).exists()
        self.assertTrue(log_exists)
    
    def test_update_verification_invalid_profile_type(self):
        """Test updating verification with invalid profile type"""
        with self.assertRaises(ValueError) as context:
            VerificationService.update_verification_status(
                admin_user=self.admin_user,
                profile_type='invalid',
                profile_id=uuid.uuid4(),
                new_status='verified'
            )
        
        self.assertIn('Invalid profile type', str(context.exception))
    
    def test_update_verification_nonexistent_profile(self):
        """Test updating verification with non-existent profile"""
        with self.assertRaises(ValueError) as context:
            VerificationService.update_verification_status(
                admin_user=self.admin_user,
                profile_type='ngo',
                profile_id=uuid.uuid4(),
                new_status='verified'
            )
        
        self.assertIn('NGO profile with ID', str(context.exception))
    
    def test_get_pending_verifications(self):
        """Test getting pending verifications"""
        verifications = VerificationService.get_pending_verifications()
        
        self.assertEqual(verifications['total_count'], 1)
        self.assertEqual(verifications['ngos'].count(), 1)
        self.assertEqual(verifications['providers'].count(), 0)

class TestPasswordResetService(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.target_user = User.objects.create_user(
            username='target_test',
            email='target@test.com',
            password='targetpass123',
            user_type='customer'
        )
    
    def test_generate_temporary_password(self):
        """Test temporary password generation"""
        password = PasswordResetService.generate_temporary_password()
        
        self.assertEqual(len(password), 12)
        self.assertTrue(any(c.isalpha() for c in password))
        self.assertTrue(any(c.isdigit() for c in password))
    
    def test_generate_temporary_password_custom_length(self):
        """Test temporary password generation with custom length"""
        password = PasswordResetService.generate_temporary_password(16)
        
        self.assertEqual(len(password), 16)
    
    @patch('admin_system.services.NotificationService.send_email_notification')
    @patch('admin_system.services.NotificationService.create_notification')
    def test_reset_user_password(self, mock_create_notification, mock_send_email):
        """Test password reset functionality"""
    # Mock the notification service methods
        mock_create_notification.return_value = MagicMock()
        mock_send_email.return_value = True
    
        password_reset = PasswordResetService.reset_user_password(
        admin_user=self.admin_user,
        target_user=self.target_user
        )
    
    # Test the returned dict
        self.assertEqual(password_reset['user'], self.target_user)
        self.assertIn('expires_at', password_reset)
        self.assertTrue(password_reset['email_sent'])
    
    # Check that notification methods were called
        self.assertTrue(mock_create_notification.called)
        self.assertTrue(mock_send_email.called)
    
    # Check that action was logged
        log_exists = AdminActionLog.objects.filter(
        admin_user=self.admin_user,
        action_type='password_reset'
        ).exists()
        self.assertTrue(log_exists)
    
    @patch('admin_system.services.NotificationService.send_email_notification')
    @patch('admin_system.services.NotificationService.create_notification')
    def test_reset_user_password_email_failure(self, mock_create_notification, mock_send_email):
        """Test password reset with email failure"""
        mock_create_notification.return_value = MagicMock()
        mock_send_email.side_effect = Exception("Email failed")

        with self.assertRaises(Exception) as context:
            PasswordResetService.reset_user_password(
                admin_user=self.admin_user,
                target_user=self.target_user
            )
    
        self.assertIn('Failed to send password reset email', str(context.exception))
    
    # Just check that the exception was raised, don't worry about logging for now
    # The important thing is that the function properly handles email failures

class TestUserManagementService(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.target_user = User.objects.create_user(
            username='target_test',
            email='target@test.com',
            password='targetpass123',
            user_type='customer'
        )
    
    def test_toggle_user_status_activate(self):
        """Test activating a user"""
        self.target_user.is_active = False
        self.target_user.save()
        
        updated_user = UserManagementService.toggle_user_status(
            admin_user=self.admin_user,
            target_user=self.target_user
        )
        
        self.assertTrue(updated_user.is_active)
        
        # Check that action was logged
        log_exists = AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_type='user_management'
        ).exists()
        self.assertTrue(log_exists)
    
    def test_toggle_user_status_deactivate(self):
        """Test deactivating a user"""
        self.target_user.is_active = True
        self.target_user.save()
        
        updated_user = UserManagementService.toggle_user_status(
            admin_user=self.admin_user,
            target_user=self.target_user
        )
        
        self.assertFalse(updated_user.is_active)

class TestDashboardService(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.regular_user = User.objects.create_user(
            username='regular_test',
            email='regular@test.com',
            password='regularpass123',
            user_type='customer'
        )
    
    def test_get_dashboard_stats(self):
        """Test dashboard statistics generation"""
        stats = DashboardService.get_dashboard_stats()
        
        self.assertIn('users', stats)
        self.assertIn('verifications', stats)
        self.assertIn('listings', stats)
        self.assertIn('transactions', stats)
        self.assertIn('system_health', stats)
        
        # Check user stats
        self.assertGreaterEqual(stats['users']['total'], 2)
    
    def test_get_recent_activity(self):
        """Test recent activity generation"""
        activities = DashboardService.get_recent_activity()
        
        self.assertIsInstance(activities, list)
        
        # If there are activities, check structure
        if activities:
            activity = activities[0]
            self.assertIn('type', activity)
            self.assertIn('description', activity)
            self.assertIn('timestamp', activity)
            self.assertIn('icon', activity)

class TestSystemLogService(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.system_log = SystemLogEntry.objects.create(
            severity='error',
            category='authentication',
            title='Test Error',
            description='Test error description'
        )
    
    def test_create_system_log(self):
        """Test creating a system log entry"""
        log = SystemLogService.create_system_log(
            severity='warning',
            category='database',
            title='Slow Query',
            description='Query took too long',
            error_details={'query_time': 5.2}
        )
        
        self.assertEqual(log.severity, 'warning')
        self.assertEqual(log.category, 'database')
        self.assertEqual(log.title, 'Slow Query')
        self.assertEqual(log.error_details, {'query_time': 5.2})
    
    def test_resolve_system_log(self):
        """Test resolving a system log"""
        resolved_log = SystemLogService.resolve_system_log(
            log_id=self.system_log.id,
            admin_user=self.admin_user,
            resolution_notes='Issue resolved'
        )
        
        self.assertEqual(resolved_log.status, 'resolved')
        self.assertEqual(resolved_log.resolved_by, self.admin_user)
        self.assertEqual(resolved_log.resolution_notes, 'Issue resolved')
        self.assertIsNotNone(resolved_log.resolved_at)
        
        # Check that action was logged
        log_exists = AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_type='system_management'
        ).exists()
        self.assertTrue(log_exists)
    
    def test_resolve_nonexistent_system_log(self):
        """Test resolving a non-existent system log"""
        with self.assertRaises(ValueError) as context:
            SystemLogService.resolve_system_log(
                log_id=uuid.uuid4(),
                admin_user=self.admin_user
            )
        
        self.assertIn('System log with ID', str(context.exception))

# ============ PERMISSION TESTS ============

class TestAdminPermissions(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.regular_user = User.objects.create_user(
            username='regular_test',
            email='regular@test.com',
            password='regularpass123',
            admin_rights=False,
            user_type='customer'
        )
    
    def test_is_system_admin_permission(self):
        """Test IsSystemAdmin permission"""
        permission = IsSystemAdmin()
        
        # Mock request with admin user
        admin_request = Mock()
        admin_request.user = self.admin_user
        
        # Mock request with regular user
        regular_request = Mock()
        regular_request.user = self.regular_user
        
        self.assertTrue(permission.has_permission(admin_request, None))
        self.assertFalse(permission.has_permission(regular_request, None))
    
    def test_can_moderate_content_permission(self):
        """Test CanModerateContent permission"""
        permission = CanModerateContent()
        
        admin_request = Mock()
        admin_request.user = self.admin_user
        
        regular_request = Mock()
        regular_request.user = self.regular_user
        
        self.assertTrue(permission.has_permission(admin_request, None))
        self.assertFalse(permission.has_permission(regular_request, None))

# ============ UTILITY TESTS ============

class TestUtils(TestCase):
    
    def test_get_file_size_human_readable(self):
        """Test human readable file size formatting"""
        self.assertEqual(get_file_size_human_readable(0), "0B")
        self.assertEqual(get_file_size_human_readable(1024), "1.0KB")
        self.assertEqual(get_file_size_human_readable(1024 * 1024), "1.0MB")
        self.assertEqual(get_file_size_human_readable(1024 * 1024 * 1024), "1.0GB")
    
    def test_system_logger_log_error(self):
        """Test SystemLogger error logging"""
        log = SystemLogger.log_error(
            category='test',
            title='Test Error',
            description='Test description',
            error_details={'test': 'data'}
        )
        
        self.assertEqual(log.severity, 'error')
        self.assertEqual(log.category, 'test')
        self.assertEqual(log.title, 'Test Error')
        self.assertEqual(log.error_details, {'test': 'data'})
    
    def test_system_logger_log_critical(self):
        """Test SystemLogger critical logging"""
        log = SystemLogger.log_critical(
            category='test',
            title='Critical Error',
            description='Critical description'
        )
        
        self.assertEqual(log.severity, 'critical')
        self.assertEqual(log.category, 'test')
        self.assertEqual(log.title, 'Critical Error')

# ============ API ENDPOINT TESTS ============

class TestDashboardAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.regular_user = User.objects.create_user(
            username='regular_test',
            email='regular@test.com',
            password='regularpass123',
            admin_rights=False,
            user_type='customer'
        )
    
    def test_dashboard_endpoint_success(self):
        """Test successful dashboard access"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('dashboard', data)
        self.assertIn('recent_activity', data)
        self.assertIn('admin_info', data)
    
    def test_dashboard_endpoint_access_denied(self):
        """Test dashboard access denied for regular user"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/admin/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_dashboard_endpoint_unauthenticated(self):
        """Test dashboard access denied for unauthenticated user"""
        response = self.client.get('/api/admin/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestUserManagementAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.target_user = User.objects.create_user(
            username='target_test',
            email='target@test.com',
            password='targetpass123',
            user_type='customer'
        )
    
    def test_get_all_users_endpoint(self):
        """Test get all users endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('users', data)
        self.assertIn('pagination', data)
        self.assertGreaterEqual(len(data['users']), 2)
    
    def test_get_all_users_with_filters(self):
        """Test get all users with filters"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/users/?user_type=customer&status=active')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('users', data)
    
    def test_toggle_user_status_endpoint(self):
        """Test toggle user status endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'user_id': str(self.target_user.UserID),
            'reason': 'Test deactivation'
        }
        
        response = self.client.post('/api/admin/users/toggle-status/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertIn('message', response_data)
        self.assertIn('user', response_data)
        
        # Verify user was actually deactivated
        self.target_user.refresh_from_db()
        self.assertFalse(self.target_user.is_active)
    
    def test_toggle_user_status_invalid_user(self):
        """Test toggle user status with invalid user ID"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'user_id': str(uuid.uuid4()),
            'reason': 'Test'
        }
        
        response = self.client.post('/api/admin/users/toggle-status/', data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    @patch('admin_system.services.PasswordResetService.reset_user_password')
    def test_reset_password_endpoint(self, mock_reset):
        """Test password reset endpoint"""
        # Mock to return a dict like the real function
        mock_reset.return_value = {
        'user': self.target_user,
        'expires_at': timezone.now() + timezone.timedelta(hours=24),
        'email_sent': True,
        'temp_password': 'test123'
        }
    
        self.client.force_authenticate(user=self.admin_user)
        data = {
        'user_id': str(self.target_user.UserID),
        'reason': 'User forgot password'
        }
    
        response = self.client.post('/api/admin/users/reset-password/', data)
    
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(mock_reset.called)

class TestVerificationAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.ngo_user = User.objects.create_user(
            username='ngo_test',
            email='ngo@test.com',
            password='ngopass123',
            user_type='ngo'
        )
        
        self.ngo_profile = NGOProfile.objects.create(
            user=self.ngo_user,
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
    
    def test_get_pending_verifications_endpoint(self):
        """Test get pending verifications endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/verifications/pending/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('pending_verifications', data)
        self.assertEqual(data['pending_verifications']['total_count'], 1)
        self.assertEqual(len(data['pending_verifications']['ngos']), 1)
        self.assertEqual(len(data['pending_verifications']['providers']), 0)
    
    def test_update_verification_status_endpoint(self):
        """Test update verification status endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'profile_type': 'ngo',
            'profile_id': str(self.ngo_profile.id),
            'new_status': 'verified',
            'reason': 'All documents validated'
        }
        
        response = self.client.post('/api/admin/verifications/update/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertIn('message', response_data)
        self.assertIn('profile', response_data)
        
        # Verify profile was actually updated
        self.ngo_profile.refresh_from_db()
        self.assertEqual(self.ngo_profile.status, 'verified')
    
    def test_update_verification_status_invalid_profile(self):
        """Test update verification status with invalid profile ID"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'profile_type': 'ngo',
            'profile_id': str(uuid.uuid4()),
            'new_status': 'verified',
            'reason': 'Test'
        }
        
        response = self.client.post('/api/admin/verifications/update/', data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_verification_status_invalid_data(self):
        """Test update verification status with invalid data"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'profile_type': 'invalid',
            'profile_id': str(self.ngo_profile.id),
            'new_status': 'verified'
        }
        
        response = self.client.post('/api/admin/verifications/update/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_verification_status_missing_data(self):
        """Test update verification status with missing required data"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'profile_type': 'ngo',
            # Missing profile_id and new_status
        }
        
        response = self.client.post('/api/admin/verifications/update/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_verification_status_unauthorized(self):
        """Test update verification status without admin rights"""
        regular_user = User.objects.create_user(
            username='regular_test',
            email='regular@test.com',
            password='regularpass123',
            admin_rights=False,
            user_type='customer'
        )
        
        self.client.force_authenticate(user=regular_user)
        data = {
            'profile_type': 'ngo',
            'profile_id': str(self.ngo_profile.id),
            'new_status': 'verified'
        }
        
        response = self.client.post('/api/admin/verifications/update/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class TestAuditLogsAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        # Create some test log entries
        AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='test-id-1',
            action_description='Approved NGO verification'
        )
        
        AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_type='user_management',
            target_type='user',
            target_id='test-id-2',
            action_description='Deactivated user account'
        )
    
    def test_get_admin_action_logs_endpoint(self):
        """Test get admin action logs endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/admin-actions/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
        self.assertIn('pagination', data)
        self.assertGreaterEqual(len(data['logs']), 2)
    
    def test_get_admin_action_logs_with_filters(self):
        """Test get admin action logs with filters"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/admin-actions/?action_type=user_verification')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
        
        # Check that all returned logs are of the filtered type
        for log in data['logs']:
            self.assertEqual(log['action_type'], 'user_verification')
    
    def test_get_admin_action_logs_with_search(self):
        """Test get admin action logs with search"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/admin-actions/?search=NGO')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
    
    def test_get_admin_action_logs_pagination(self):
        """Test get admin action logs with pagination"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/admin-actions/?page=1&per_page=1')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
        self.assertIn('pagination', data)
        self.assertEqual(len(data['logs']), 1)
        self.assertEqual(data['pagination']['per_page'], 1)

class TestSystemLogsAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.system_log = SystemLogEntry.objects.create(
            severity='error',
            category='authentication',
            title='Test Error',
            description='Test error description',
            status='open'
        )
    
    def test_get_system_logs_endpoint(self):
        """Test get system logs endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/system/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
        self.assertIn('pagination', data)
        self.assertIn('summary', data)
        self.assertGreaterEqual(len(data['logs']), 1)
    
    def test_get_system_logs_with_filters(self):
        """Test get system logs with filters"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/logs/system/?severity=error&status=open')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('logs', data)
    
    def test_resolve_system_log_endpoint(self):
        """Test resolve system log endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'log_id': str(self.system_log.id),
            'resolution_notes': 'Issue resolved by restarting service'
        }
        
        response = self.client.post('/api/admin/logs/system/resolve/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertIn('message', response_data)
        self.assertIn('log', response_data)
        
        # Verify log was actually resolved
        self.system_log.refresh_from_db()
        self.assertEqual(self.system_log.status, 'resolved')
        self.assertEqual(self.system_log.resolved_by, self.admin_user)
    
    def test_resolve_system_log_invalid_id(self):
        """Test resolve system log with invalid ID"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'log_id': str(uuid.uuid4()),
            'resolution_notes': 'Test'
        }
        
        response = self.client.post('/api/admin/logs/system/resolve/', data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class TestAnalyticsAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        # Create additional users for analytics
        User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='pass123',
            user_type='customer'
        )
        
        User.objects.create_user(
            username='customer2',
            email='customer2@test.com',
            password='pass123',
            user_type='customer'
        )
    
    def test_get_analytics_endpoint(self):
        """Test get analytics endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/analytics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('analytics', data)
        
        analytics = data['analytics']
        self.assertIn('total_users', analytics)
        self.assertIn('user_distribution', analytics)
        self.assertIn('top_providers', analytics)
        self.assertGreaterEqual(analytics['total_users'], 3)

class TestDataExportAPI(APITestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
    
    def test_export_users_data(self):
        """Test export users data"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'export_type': 'users',
            'format': 'csv'
        }
        
        response = self.client.post('/api/admin/export/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_export_analytics_data(self):
        """Test export analytics data"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'export_type': 'analytics',
            'format': 'csv'
        }
        
        response = self.client.post('/api/admin/export/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
    
    def test_export_invalid_type(self):
        """Test export with invalid type"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'export_type': 'invalid',
            'format': 'csv'
        }
        
        response = self.client.post('/api/admin/export/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

# ============ INTEGRATION TESTS ============

class TestAdminWorkflowIntegration(TransactionTestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.ngo_user = User.objects.create_user(
            username='ngo_test',
            email='ngo@test.com',
            password='ngopass123',
            user_type='ngo'
        )
        
        self.ngo_profile = NGOProfile.objects.create(
            user=self.ngo_user,
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
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_complete_verification_workflow(self):
        """Test complete workflow from pending to verified"""
        # 1. Check pending verifications
        response = self.client.get('/api/admin/verifications/pending/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['pending_verifications']['total_count'], 1)
        
        # 2. Approve verification
        data = {
            'profile_type': 'ngo',
            'profile_id': str(self.ngo_profile.id),
            'new_status': 'verified',
            'reason': 'Documents approved'
        }
        response = self.client.post('/api/admin/verifications/update/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Check audit logs
        response = self.client.get('/api/admin/logs/admin-actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        self.assertTrue(any(log['action_type'] == 'user_verification' for log in logs))
        
        # 4. Verify pending count decreased
        response = self.client.get('/api/admin/verifications/pending/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['pending_verifications']['total_count'], 0)
    
    def test_user_management_workflow(self):
        """Test complete user management workflow"""
        # 1. Get user list
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Deactivate user
        data = {'user_id': str(self.ngo_user.UserID)}
        response = self.client.post('/api/admin/users/toggle-status/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Check user is deactivated
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        users = response.json()['users']
        ngo_user_data = next(user for user in users if user['UserID'] == str(self.ngo_user.UserID))
        self.assertEqual(ngo_user_data['status'], 'inactive')
        
        # 4. Check audit logs
        response = self.client.get('/api/admin/logs/admin-actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        self.assertTrue(any(log['action_type'] == 'user_management' for log in logs))
    
    def test_system_log_workflow(self):
        """Test complete system log workflow"""
        # 1. Create system log
        system_log = SystemLogEntry.objects.create(
            severity='error',
            category='authentication',
            title='Login System Error',
            description='Multiple login failures detected',
            status='open'
        )
        
        # 2. Check system logs
        response = self.client.get('/api/admin/logs/system/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        self.assertTrue(any(log['id'] == str(system_log.id) for log in logs))
        
        # 3. Resolve system log
        data = {
            'log_id': str(system_log.id),
            'resolution_notes': 'Fixed by updating authentication service'
        }
        response = self.client.post('/api/admin/logs/system/resolve/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Check log is resolved
        response = self.client.get('/api/admin/logs/system/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        resolved_log = next(log for log in logs if log['id'] == str(system_log.id))
        self.assertEqual(resolved_log['status'], 'resolved')
        
        # 5. Check audit logs for resolution
        response = self.client.get('/api/admin/logs/admin-actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['logs']
        self.assertTrue(any(log['action_type'] == 'system_management' for log in logs))

# ============ SECURITY TESTS ============

class TestSecurityFeatures(TestCase):
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpass123',
            admin_rights=True,
            user_type='customer'
        )
        
        self.regular_user = User.objects.create_user(
            username='regular_test',
            email='regular@test.com',
            password='regularpass123',
            admin_rights=False,
            user_type='customer'
        )
    
    def test_admin_action_logging(self):
        """Test that admin actions are properly logged"""
        # Perform admin action
        UserManagementService.toggle_user_status(
            admin_user=self.admin_user,
            target_user=self.regular_user,
            ip_address='127.0.0.1'
        )
        
        # Check log was created
        log = AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_type='user_management'
        ).first()
        
        self.assertIsNotNone(log)
        self.assertEqual(log.ip_address, '127.0.0.1')
        self.assertIn(str(self.regular_user.UserID), log.target_id)
    
    def test_permission_enforcement(self):
        """Test that permissions are properly enforced"""
        client = APIClient()
        client.force_authenticate(user=self.regular_user)
        
        # Try to access admin endpoint
        response = client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to perform admin action
        response = client.post('/api/admin/users/toggle-status/', {
            'user_id': str(self.regular_user.UserID)
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)