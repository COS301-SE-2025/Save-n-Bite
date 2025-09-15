from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.core import mail
from django.test.utils import override_settings
from datetime import timedelta
from unittest.mock import patch, Mock, MagicMock
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import json
import uuid

from admin_system.models import (
    AdminActionLog, SystemAnnouncement, SystemLogEntry, 
    DocumentAccessLog, PasswordReset, AccessLog
)
from admin_system.services import (
    AdminService, VerificationService, PasswordResetService,
    UserManagementService, DashboardService, SystemLogService,
    AdminNotificationService, SimpleAnalyticsService, AnomalyDetectionService
)
from admin_system.permissions import IsSystemAdmin, CanModerateContent
from authentication.models import NGOProfile, FoodProviderProfile

User = get_user_model()


class AdminSystemModelTests(TestCase):
    """Test admin system models"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
    
    def test_admin_action_log_creation(self):
        log = AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='test-id',
            action_description='Test action'
        )
        self.assertEqual(log.admin_user, self.admin_user)
        self.assertEqual(log.action_type, 'user_verification')
        self.assertTrue(str(log.id))
    
    def test_system_announcement_creation(self):
        announcement = SystemAnnouncement.objects.create(
            title='Test Announcement',
            message='Test message',
            priority='high',
            target_user_types=['customer', 'provider'],
            created_by=self.admin_user
        )
        self.assertEqual(announcement.title, 'Test Announcement')
        self.assertEqual(announcement.priority, 'high')
        self.assertTrue(announcement.is_active)
    
    def test_system_log_entry_creation(self):
        log = SystemLogEntry.objects.create(
            severity='error',
            category='authentication',
            title='Test Error',
            description='Test error description'
        )
        self.assertEqual(log.severity, 'error')
        self.assertEqual(log.status, 'open')
        self.assertIsNotNone(log.timestamp)
    
    def test_access_log_creation(self):
        log = AccessLog.objects.create(
            user=self.admin_user,
            ip_address='192.168.1.1',
            endpoint='/admin/users/',
            method='GET',
            status_code=200
        )
        self.assertEqual(log.endpoint, '/admin/users/')
        self.assertEqual(log.status_code, 200)


class AdminServiceTests(TestCase):
    """Test AdminService functionality"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
    
    def test_log_admin_action(self):
        log = AdminService.log_admin_action(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='test-id',
            description='Test action',
            metadata={'test': 'data'},
            ip_address='192.168.1.1'
        )
        
        self.assertIsInstance(log, AdminActionLog)
        self.assertEqual(log.admin_user, self.admin_user)
        self.assertEqual(log.action_type, 'user_verification')
        self.assertEqual(log.ip_address, '192.168.1.1')
        self.assertEqual(log.metadata['test'], 'data')
    
    def test_log_document_access(self):
        log = AdminService.log_document_access(
            admin_user=self.admin_user,
            document_type='npo_document',
            profile_type='ngo',
            profile_id='test-profile-id',
            document_name='test.pdf'
        )
        
        self.assertIsInstance(log, DocumentAccessLog)
        self.assertEqual(log.document_type, 'npo_document')
        self.assertEqual(log.profile_type, 'ngo')


class VerificationServiceTests(TestCase):
    """Test VerificationService functionality"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.ngo_user = User.objects.create_user(
            username='ngo_user',
            email='ngo@test.com',
            password='testpass123',
            user_type='ngo'
        )
        self.ngo_profile = NGOProfile.objects.create(
            user=self.ngo_user,
            organisation_name='Test NGO',
            organisation_email='ngo@test.com',
            organisation_contact='1234567890',
            status='pending_verification'
        )
    
    @patch('admin_system.services.AdminService.log_admin_action')
    def test_update_verification_status_ngo(self, mock_log):
        updated_profile = VerificationService.update_verification_status(
            admin_user=self.admin_user,
            profile_type='ngo',
            profile_id=str(self.ngo_profile.id),
            new_status='verified',
            reason='All documents verified'
        )
        
        self.assertEqual(updated_profile.status, 'verified')
        mock_log.assert_called_once()
    
    def test_update_verification_status_invalid_profile(self):
        with self.assertRaises(ValueError):
            VerificationService.update_verification_status(
                admin_user=self.admin_user,
                profile_type='ngo',
                profile_id='non-existent-id',
                new_status='verified'
            )
    
    def test_get_pending_verifications(self):
        verifications = VerificationService.get_pending_verifications()
        
        self.assertEqual(verifications['total_count'], 1)
        self.assertEqual(len(verifications['ngos']), 1)
        self.assertEqual(verifications['ngos'][0], self.ngo_profile)


class UserManagementServiceTests(TestCase):
    """Test UserManagementService functionality"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.target_user = User.objects.create_user(
            username='target',
            email='target@test.com',
            password='testpass123',
            is_active=True
        )
    
    @patch('admin_system.services.AdminService.log_admin_action')
    def test_toggle_user_status(self, mock_log):
        updated_user = UserManagementService.toggle_user_status(
            admin_user=self.admin_user,
            target_user=self.target_user
        )
        
        self.assertFalse(updated_user.is_active)
        mock_log.assert_called_once()
        
        # Toggle back
        updated_user = UserManagementService.toggle_user_status(
            admin_user=self.admin_user,
            target_user=updated_user
        )
        self.assertTrue(updated_user.is_active)


class SystemLogServiceTests(TestCase):
    """Test SystemLogService functionality"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
    
    @patch('admin_system.services.SystemLogService._send_critical_log_email_notification')
    def test_create_system_log_critical(self, mock_email):
        log = SystemLogService.create_system_log(
            severity='critical',
            category='security',
            title='Critical Error',
            description='Critical system error occurred',
            error_details={'error': 'test'}
        )
        
        self.assertIsInstance(log, SystemLogEntry)
        self.assertEqual(log.severity, 'critical')
        mock_email.assert_called_once_with(log)
    
    def test_create_system_log_info(self):
        with patch('admin_system.services.SystemLogService._send_critical_log_email_notification') as mock_email:
            log = SystemLogService.create_system_log(
                severity='info',
                category='general',
                title='Info Message',
                description='Informational message'
            )
            
            self.assertEqual(log.severity, 'info')
            mock_email.assert_not_called()
    
    def test_resolve_system_log(self):
        log = SystemLogEntry.objects.create(
            severity='error',
            category='test',
            title='Test Error',
            description='Test description'
        )
        
        resolved_log = SystemLogService.resolve_system_log(
            log_id=log.id,
            admin_user=self.admin_user,
            resolution_notes='Fixed the issue'
        )
        
        self.assertEqual(resolved_log.status, 'resolved')
        self.assertEqual(resolved_log.resolved_by, self.admin_user)
        self.assertEqual(resolved_log.resolution_notes, 'Fixed the issue')


class DashboardServiceTests(TestCase):
    """Test DashboardService functionality"""
    
    def setUp(self):
        # Create test users
        for i in range(5):
            User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='testpass123',
                user_type='customer'
            )
    
    @patch('admin_system.services.SystemLogEntry.objects.filter')
    def test_get_dashboard_stats(self, mock_system_logs):
        mock_system_logs.return_value.count.return_value = 2
        
        stats = DashboardService.get_dashboard_stats()
        
        self.assertIn('users', stats)
        self.assertIn('verifications', stats)
        self.assertIn('listings', stats)
        self.assertIn('transactions', stats)
        self.assertIn('system_health', stats)
        
        self.assertEqual(stats['users']['total'], 5)
        self.assertIsInstance(stats['users']['growth_percentage'], (int, float))
    
    def test_get_recent_activity(self):
        activities = DashboardService.get_recent_activity()
        
        self.assertIsInstance(activities, list)
        self.assertLessEqual(len(activities), 10)
        
        if activities:
            activity = activities[0]
            self.assertIn('type', activity)
            self.assertIn('description', activity)
            self.assertIn('timestamp', activity)


class AnomalyDetectionServiceTests(TestCase):
    """Test AnomalyDetectionService functionality"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        
        # Create test access logs for anomaly detection
        for i in range(6):
            AccessLog.objects.create(
                ip_address='192.168.1.100',
                endpoint='/auth/login',
                method='POST',
                status_code=401,
                timestamp=timezone.now() - timedelta(minutes=i)
            )
    
    def test_detect_anomalies_suspicious_login(self):
        anomalies = AnomalyDetectionService.detect_anomalies()
        
        self.assertIsInstance(anomalies, list)
        
        # Should detect suspicious login activity
        suspicious_login_found = any(
            anomaly['type'] == 'Suspicious Login Activity' 
            for anomaly in anomalies
        )
        self.assertTrue(suspicious_login_found)
    
    @patch('admin_system.services.NotificationService.create_notification')
    @patch('admin_system.services.NotificationService.send_email_notification')
    def test_send_critical_anomaly_notifications(self, mock_email, mock_notification):
        anomalies = [
            {
                'type': 'Test Anomaly',
                'severity': 'Critical',
                'description': 'Test critical anomaly',
                'timestamp': timezone.now()
            }
        ]
        
        AnomalyDetectionService.send_critical_anomaly_notifications(anomalies)
        
        mock_notification.assert_called()
        mock_email.assert_called()


class AdminNotificationServiceTests(TestCase):
    """Test AdminNotificationService functionality"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.customer_user = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='testpass123',
            user_type='customer'
        )
    
    def test_get_target_users_all(self):
        users = AdminNotificationService._get_target_users('all')
        self.assertEqual(len(users), 1)  # Only customer, not admin
    
    def test_get_target_users_customers(self):
        users = AdminNotificationService._get_target_users('customers')
        self.assertEqual(len(users), 1)
        self.assertEqual(users[0].user_type, 'customer')
    
    def test_get_target_users_invalid(self):
        with self.assertRaises(ValueError):
            AdminNotificationService._get_target_users('invalid_audience')
    
    @patch('admin_system.services.NotificationService.create_notification')
    @patch('admin_system.services.NotificationService.send_email_notification')
    @patch('admin_system.services.AdminService.log_admin_action')
    def test_send_custom_notification(self, mock_log, mock_email, mock_notification):
        mock_notification.return_value = Mock()
        mock_email.return_value = True
        
        stats = AdminNotificationService.send_custom_notification(
            admin_user=self.admin_user,
            subject='Test Notification',
            body='Test message body',
            target_audience='customers'
        )
        
        self.assertEqual(stats['total_users'], 1)
        self.assertEqual(stats['notifications_sent'], 1)
        self.assertEqual(stats['emails_sent'], 1)
        mock_log.assert_called_once()


class AdminPermissionTests(TestCase):
    """Test admin permission classes"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123',
            admin_rights=False
        )
        self.mock_request = Mock()
        self.mock_view = Mock()
    
    def test_is_system_admin_permission_valid_admin(self):
        self.mock_request.user = self.admin_user
        permission = IsSystemAdmin()
        
        self.assertTrue(permission.has_permission(self.mock_request, self.mock_view))
    
    def test_is_system_admin_permission_invalid_user(self):
        self.mock_request.user = self.regular_user
        permission = IsSystemAdmin()
        
        self.assertFalse(permission.has_permission(self.mock_request, self.mock_view))
    
    def test_can_moderate_content_permission(self):
        self.mock_request.user = self.admin_user
        permission = CanModerateContent()
        
        self.assertTrue(permission.has_permission(self.mock_request, self.mock_view))


class AdminAPITestCase(APITestCase):
    """Base class for admin API tests"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
        self.client = APIClient()
    
    def authenticate_admin(self):
        self.client.force_authenticate(user=self.admin_user)
    
    def authenticate_user(self):
        self.client.force_authenticate(user=self.regular_user)


class AdminDashboardAPITests(AdminAPITestCase):
    """Test admin dashboard API endpoints"""
    
    @patch('admin_system.views.DashboardService.get_dashboard_stats')
    @patch('admin_system.views.DashboardService.get_recent_activity')
    @patch('admin_system.views.AnomalyDetectionService.detect_anomalies')
    def test_admin_dashboard_success(self, mock_anomalies, mock_activity, mock_stats):
        mock_stats.return_value = {
            'users': {'total': 10, 'active': 8, 'recent_signups': 2, 'growth_percentage': 5.0},
            'verifications': {'pending_total': 3, 'pending_ngos': 1, 'pending_providers': 2},
            'listings': {'total': 50, 'active': 45, 'new_this_week': 5, 'growth_percentage': 10.0},
            'transactions': {'total': 100, 'completed': 95, 'recent': 10, 'growth_percentage': 15.0},
            'system_health': {'open_issues': 2, 'critical_issues': 0}
        }
        mock_activity.return_value = []
        mock_anomalies.return_value = []
        
        self.authenticate_admin()
        url = reverse('admin_system:admin_dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('dashboard', response.data)
        self.assertIn('recent_activity', response.data)
        self.assertIn('admin_info', response.data)
    
    def test_admin_dashboard_unauthorized(self):
        self.authenticate_user()
        url = reverse('admin_system:admin_dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class UserManagementAPITests(AdminAPITestCase):
    """Test user management API endpoints"""
    
    def test_get_all_users_success(self):
        self.authenticate_admin()
        url = reverse('admin_system:get_all_users')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('users', response.data)
        self.assertIn('pagination', response.data)
    
    def test_get_all_users_with_filters(self):
        self.authenticate_admin()
        url = reverse('admin_system:get_all_users')
        response = self.client.get(url, {'search': 'admin', 'user_type': 'customer'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    @patch('admin_system.views.UserManagementService.toggle_user_status')
    def test_toggle_user_status_success(self, mock_toggle):
        mock_toggle.return_value = self.regular_user
        self.authenticate_admin()
        
        url = reverse('admin_system:toggle_user_status')
        data = {'user_id': str(self.regular_user.UserID)}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_toggle.assert_called_once()
    
    def test_toggle_user_status_invalid_data(self):
        self.authenticate_admin()
        url = reverse('admin_system:toggle_user_status')
        response = self.client.post(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VerificationAPITests(AdminAPITestCase):
    """Test verification API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.ngo_user = User.objects.create_user(
            username='ngo_user',
            email='ngo@test.com',
            password='testpass123',
            user_type='ngo'
        )
        self.ngo_profile = NGOProfile.objects.create(
            user=self.ngo_user,
            organisation_name='Test NGO',
            organisation_email='ngo@test.com',
            organisation_contact='1234567890',
            status='pending_verification'
        )
    
    def test_get_pending_verifications_success(self):
        self.authenticate_admin()
        url = reverse('admin_system:get_pending_verifications')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('pending_verifications', response.data)
        self.assertEqual(len(response.data['pending_verifications']['ngos']), 1)
    
    @patch('admin_system.views.VerificationService.update_verification_status')
    def test_update_verification_status_success(self, mock_update):
        mock_update.return_value = self.ngo_profile
        self.authenticate_admin()
        
        url = reverse('admin_system:update_verification_status')
        data = {
            'profile_type': 'ngo',
            'profile_id': str(self.ngo_profile.id),
            'new_status': 'verified',
            'reason': 'All documents verified'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_update.assert_called_once()


class SystemLogAPITests(AdminAPITestCase):
    """Test system log API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.system_log = SystemLogEntry.objects.create(
            severity='error',
            category='test',
            title='Test Error',
            description='Test error description'
        )
    
    def test_get_system_logs_success(self):
        self.authenticate_admin()
        url = reverse('admin_system:get_system_logs')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('logs', response.data)
        self.assertIn('summary', response.data)
    
    @patch('admin_system.views.SystemLogService.resolve_system_log')
    def test_resolve_system_log_success(self, mock_resolve):
        mock_resolve.return_value = self.system_log
        self.authenticate_admin()
        
        url = reverse('admin_system:resolve_system_log')
        data = {
            'log_id': str(self.system_log.id),
            'resolution_notes': 'Issue resolved'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_resolve.assert_called_once()


class AnalyticsAPITests(AdminAPITestCase):
    """Test analytics API endpoints"""
    
    @patch('admin_system.views.SimpleAnalyticsService.get_analytics_data')
    @patch('admin_system.views.AnomalyDetectionService.detect_anomalies')
    def test_get_simple_analytics_success(self, mock_anomalies, mock_analytics):
        mock_analytics.return_value = {
            'total_users': 100,
            'new_users_week': 10,
            'new_users_month': 25,
            'user_growth_percentage': 5.0,
            'total_listings': 50,
            'active_listings': 45,
            'new_listings_week': 5,
            'listing_growth_percentage': 10.0,
            'total_transactions': 200,
            'completed_transactions': 190,
            'transaction_success_rate': 95.0,
            'user_distribution': {'customer': '60.0%', 'provider': '30.0%', 'ngo': '10.0%'},
            'top_providers': []
        }
        mock_anomalies.return_value = []
        
        self.authenticate_admin()
        url = reverse('admin_system:get_simple_analytics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('analytics', response.data)


class SecurityAPITests(AdminAPITestCase):
    """Test security and anomaly detection API endpoints"""
    
    @patch('admin_system.views.AnomalyDetectionService.detect_anomalies')
    @patch('admin_system.views.AdminService.log_admin_action')
    def test_get_security_anomalies_success(self, mock_log, mock_detect):
        mock_detect.return_value = [
            {
                'type': 'Suspicious Login Activity',
                'severity': 'High',
                'description': 'Multiple failed login attempts',
                'timestamp': timezone.now()
            }
        ]
        
        self.authenticate_admin()
        url = reverse('admin_system:get_security_anomalies')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('anomalies', response.data)
        self.assertIn('summary', response.data)
        mock_log.assert_called_once()


class NotificationAPITests(AdminAPITestCase):
    """Test notification API endpoints"""
    
    @patch('admin_system.views.AdminNotificationService.send_custom_notification')
    def test_send_custom_notification_success(self, mock_send):
        mock_send.return_value = {
            'total_users': 5,
            'notifications_sent': 5,
            'emails_sent': 5,
            'emails_failed': 0,
            'target_audience': 'all'
        }
        
        self.authenticate_admin()
        url = reverse('admin_system:send_custom_notification')
        data = {
            'subject': 'Test Notification',
            'body': 'This is a test notification message.',
            'target_audience': 'all'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        mock_send.assert_called_once()
    
    def test_send_custom_notification_invalid_data(self):
        self.authenticate_admin()
        url = reverse('admin_system:send_custom_notification')
        data = {'subject': ''}  # Invalid empty subject
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DataExportAPITests(AdminAPITestCase):
    """Test data export API endpoints"""
    
    @patch('admin_system.views.AdminService.log_admin_action')
    def test_export_users_data_success(self, mock_log):
        self.authenticate_admin()
        url = reverse('admin_system:export_data')
        data = {'export_type': 'users', 'format': 'csv'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        mock_log.assert_called_once()
    
    def test_export_analytics_data_success(self):
        self.authenticate_admin()
        url = reverse('admin_system:export_data')
        data = {'export_type': 'analytics', 'format': 'csv'}
        
        with patch('admin_system.views.DashboardService.get_dashboard_stats') as mock_stats:
            mock_stats.return_value = {
                'users': {'total': 10, 'active': 8},
                'listings': {'total': 20, 'active': 18},
                'transactions': {'total': 50, 'completed': 45}
            }
            
            response = self.client.post(url, data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)


class MiddlewareTests(TestCase):
    """Test admin access logging middleware"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.client = APIClient()
    
    def test_admin_access_logging(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # Make request to admin endpoint
        url = reverse('admin_system:get_all_users')
        response = self.client.get(url)
        
        # Check if access log was created
        self.assertTrue(
            AccessLog.objects.filter(
                user=self.admin_user,
                endpoint__contains='/admin/'
            ).exists()
        )


class IntegrationTests(TransactionTestCase):
    """Integration tests for complete admin workflows"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_complete_user_verification_workflow(self):
        # Create NGO user and profile
        ngo_user = User.objects.create_user(
            username='ngo_test',
            email='ngo@test.com',
            password='testpass123',
            user_type='ngo'
        )
        ngo_profile = NGOProfile.objects.create(
            user=ngo_user,
            organisation_name='Test NGO',
            organisation_email='ngo@test.com',
            organisation_contact='1234567890',
            status='pending_verification'
        )
        
        # Step 1: Get pending verifications
        url = reverse('admin_system:get_pending_verifications')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['pending_verifications']['ngos']), 1)
        
        # Step 2: Update verification status
        url = reverse('admin_system:update_verification_status')
        data = {
            'profile_type': 'ngo',
            'profile_id': str(ngo_profile.id),
            'new_status': 'verified',
            'reason': 'All documents verified'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 3: Verify the change was logged
        self.assertTrue(
            AdminActionLog.objects.filter(
                admin_user=self.admin_user,
                action_type='user_verification',
                target_type='ngo_profile'
            ).exists()
        )
        
        # Step 4: Verify profile status changed
        ngo_profile.refresh_from_db()
        self.assertEqual(ngo_profile.status, 'verified')
    
    @patch('admin_system.services.NotificationService.create_notification')
    @patch('admin_system.services.NotificationService.send_email_notification')
    def test_complete_password_reset_workflow(self, mock_email, mock_notification):
        mock_notification.return_value = Mock()
        mock_email.return_value = True
        
        # Create target user
        target_user = User.objects.create_user(
            username='target',
            email='target@test.com',
            password='oldpass123'
        )
        
        # Step 1: Reset password
        url = reverse('admin_system:reset_user_password')
        data = {'user_id': str(target_user.UserID)}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 2: Verify user flags were set
        target_user.refresh_from_db()
        self.assertTrue(target_user.password_must_change)
        self.assertTrue(target_user.has_temporary_password)
        
        # Step 3: Verify admin action was logged
        self.assertTrue(
            AdminActionLog.objects.filter(
                admin_user=self.admin_user,
                action_type='password_reset',
                target_type='user'
            ).exists()
        )
        
        # Step 4: Verify notification was sent
        mock_notification.assert_called_once()
        mock_email.assert_called_once()
    
    def test_complete_system_log_workflow(self):
        # Step 1: Create system log
        log = SystemLogEntry.objects.create(
            severity='error',
            category='test',
            title='Test Error',
            description='Test error for workflow'
        )
        
        # Step 2: Get system logs
        url = reverse('admin_system:get_system_logs')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['logs']) >= 1)
        
        # Step 3: Resolve the log
        url = reverse('admin_system:resolve_system_log')
        data = {
            'log_id': str(log.id),
            'resolution_notes': 'Issue has been resolved'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 4: Verify log was resolved
        log.refresh_from_db()
        self.assertEqual(log.status, 'resolved')
        self.assertEqual(log.resolved_by, self.admin_user)
        self.assertEqual(log.resolution_notes, 'Issue has been resolved')
    
    @patch('admin_system.services.AdminNotificationService.send_custom_notification')
    def test_complete_notification_workflow(self, mock_send):
        mock_send.return_value = {
            'total_users': 1,
            'notifications_sent': 1,
            'emails_sent': 1,
            'emails_failed': 0,
            'target_audience': 'customers'
        }
        
        # Create customer user
        customer = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        # Step 1: Get audience counts
        url = reverse('admin_system:get_audience_counts')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['audience_counts']['customers'], 0)
        
        # Step 2: Send custom notification
        url = reverse('admin_system:send_custom_notification')
        data = {
            'subject': 'Important Update',
            'body': 'This is an important system update.',
            'target_audience': 'customers'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 3: Verify notification service was called
        mock_send.assert_called_once_with(
            admin_user=self.admin_user,
            subject='Important Update',
            body='This is an important system update.',
            target_audience='customers',
            ip_address=None
        )
        
        # Step 4: Verify admin action was logged
        self.assertTrue(
            AdminActionLog.objects.filter(
                admin_user=self.admin_user,
                action_type='custom_notification'
            ).exists()
        )
    
    def test_complete_analytics_workflow(self):
        # Create test data
        for i in range(3):
            User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='testpass123',
                user_type='customer'
            )
        
        # Step 1: Get dashboard analytics
        url = reverse('admin_system:admin_dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('dashboard', response.data)
        
        # Step 2: Get detailed analytics
        url = reverse('admin_system:get_simple_analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('analytics', response.data)
        
        # Step 3: Export analytics data
        url = reverse('admin_system:export_data')
        data = {'export_type': 'analytics', 'format': 'csv'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
    
    def test_complete_security_workflow(self):
        # Step 1: Create suspicious access logs
        for i in range(6):
            AccessLog.objects.create(
                ip_address='192.168.1.100',
                endpoint='/auth/login',
                method='POST',
                status_code=401,
                timestamp=timezone.now() - timedelta(minutes=i)
            )
        
        # Step 2: Check for anomalies
        url = reverse('admin_system:get_security_anomalies')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('anomalies', response.data)
        
        # Step 3: Verify anomalies were detected
        anomalies = response.data['anomalies']
        self.assertTrue(len(anomalies) > 0)
        
        # Step 4: Verify security check was logged
        self.assertTrue(
            AdminActionLog.objects.filter(
                admin_user=self.admin_user,
                action_type='security_check'
            ).exists()
        )


class AdminLoginTests(APITestCase):
    """Test admin login check functionality"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123',
            admin_rights=False
        )
    
    def test_admin_login_check_valid_admin(self):
        url = reverse('admin_system:admin_login_check')
        data = {'email': 'admin@test.com'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('admin_info', response.data)
        self.assertTrue(response.data['admin_info']['admin_rights'])
    
    def test_admin_login_check_invalid_user(self):
        url = reverse('admin_system:admin_login_check')
        data = {'email': 'user@test.com'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_admin_login_check_missing_email(self):
        url = reverse('admin_system:admin_login_check')
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_admin_login_check_nonexistent_email(self):
        url = reverse('admin_system:admin_login_check')
        data = {'email': 'nonexistent@test.com'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class BlobUtilsTests(TestCase):
    """Test blob storage utilities"""
    
    @override_settings(ENVIRONMENT='development')
    def test_get_secure_image_url_development(self):
        from admin_system.blob_utils import BlobStorageHelper
        
        # Test with mock image field
        mock_image = Mock()
        mock_image.url = 'test-image.jpg'
        
        url = BlobStorageHelper.get_secure_image_url(mock_image)
        self.assertIn('127.0.0.1:10000', url)
        self.assertIn('test-image.jpg', url)
    
    def test_get_secure_image_url_no_image(self):
        from admin_system.blob_utils import BlobStorageHelper
        
        url = BlobStorageHelper.get_secure_image_url(None)
        self.assertIn('No Image', url)
        self.assertTrue(url.startswith('data:image/svg+xml'))
    
    def test_get_secure_image_url_string_input(self):
        from admin_system.blob_utils import BlobStorageHelper
        
        url = BlobStorageHelper.get_secure_image_url('test-image.jpg')
        self.assertIn('test-image.jpg', url)


class UtilsTests(TestCase):
    """Test utility functions"""
    
    def test_get_client_ip_with_forwarded_header(self):
        from admin_system.utils import get_client_ip
        
        mock_request = Mock()
        mock_request.META = {
            'HTTP_X_FORWARDED_FOR': '192.168.1.1, 10.0.0.1',
            'REMOTE_ADDR': '127.0.0.1'
        }
        
        ip = get_client_ip(mock_request)
        self.assertEqual(ip, '192.168.1.1')
    
    def test_get_client_ip_without_forwarded_header(self):
        from admin_system.utils import get_client_ip
        
        mock_request = Mock()
        mock_request.META = {'REMOTE_ADDR': '127.0.0.1'}
        
        ip = get_client_ip(mock_request)
        self.assertEqual(ip, '127.0.0.1')
    
    def test_admin_required_decorator_valid_admin(self):
        from admin_system.utils import admin_required
        
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
        
        @admin_required
        def test_view(request):
            return "success"
        
        mock_request = Mock()
        mock_request.user = admin_user
        
        result = test_view(mock_request)
        self.assertEqual(result, "success")
    
    def test_admin_required_decorator_invalid_user(self):
        from admin_system.utils import admin_required
        from rest_framework.response import Response
        
        regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123',
            admin_rights=False
        )
        
        @admin_required
        def test_view(request):
            return "success"
        
        mock_request = Mock()
        mock_request.user = regular_user
        
        result = test_view(mock_request)
        self.assertIsInstance(result, Response)
        self.assertEqual(result.status_code, status.HTTP_403_FORBIDDEN)


class SignalTests(TestCase):
    """Test signal handlers"""
    
    @patch('admin_system.services.SystemLogService._send_critical_log_email_notification')
    def test_system_log_signal_critical(self, mock_email):
        # Create critical system log (should trigger signal)
        SystemLogEntry.objects.create(
            severity='critical',
            category='test',
            title='Critical Test',
            description='Critical test error'
        )
        
        mock_email.assert_called_once()
    
    @patch('admin_system.services.SystemLogService._send_critical_log_email_notification')
    def test_system_log_signal_info(self, mock_email):
        # Create info system log (should not trigger signal)
        SystemLogEntry.objects.create(
            severity='info',
            category='test',
            title='Info Test',
            description='Info test message'
        )
        
        mock_email.assert_not_called()


class ModelStringRepresentationTests(TestCase):
    """Test model __str__ methods"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
    
    def test_admin_action_log_str(self):
        log = AdminActionLog.objects.create(
            admin_user=self.admin_user,
            action_type='user_verification',
            target_type='ngo_profile',
            target_id='test-id',
            action_description='Test action'
        )
        
        expected = f"{self.admin_user.username} - user_verification - {log.timestamp}"
        self.assertEqual(str(log), expected)
    
    def test_system_announcement_str(self):
        announcement = SystemAnnouncement.objects.create(
            title='Test Announcement',
            message='Test message',
            priority='high',
            created_by=self.admin_user
        )
        
        expected = "Test Announcement - high"
        self.assertEqual(str(announcement), expected)
    
    def test_system_log_entry_str(self):
        log = SystemLogEntry.objects.create(
            severity='error',
            category='test',
            title='Test Error',
            description='Test description'
        )
        
        expected = "ERROR: Test Error"
        self.assertEqual(str(log), expected)
    
    def test_access_log_str(self):
        log = AccessLog.objects.create(
            user=self.admin_user,
            ip_address='192.168.1.1',
            endpoint='/admin/users/',
            method='GET',
            status_code=200
        )
        
        expected = f"{self.admin_user.username} - /admin/users/ - {log.timestamp}"
        self.assertEqual(str(log), expected)


class EdgeCaseTests(TestCase):
    """Test edge cases and error conditions"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            admin_rights=True
        )
    
    def test_admin_service_log_with_none_values(self):
        # Test logging with None IP address
        log = AdminService.log_admin_action(
            admin_user=self.admin_user,
            action_type='test',
            target_type='test',
            target_id='test',
            description='Test with None IP',
            ip_address=None
        )
        
        self.assertIsNone(log.ip_address)
        self.assertEqual(log.metadata, {})
    
    def test_verification_service_with_invalid_profile_type(self):
        with self.assertRaises(ValueError):
            VerificationService.update_verification_status(
                admin_user=self.admin_user,
                profile_type='invalid_type',
                profile_id='test-id',
                new_status='verified'
            )
    
    def test_anomaly_detection_with_no_logs(self):
        # Test anomaly detection when no access logs exist
        anomalies = AnomalyDetectionService.detect_anomalies()
        self.assertIsInstance(anomalies, list)
        self.assertEqual(len(anomalies), 0)
    
    def test_dashboard_service_with_missing_models(self):
        # Test dashboard service when optional models don't exist
        with patch('admin_system.services.logger') as mock_logger:
            stats = DashboardService.get_dashboard_stats()
            
            self.assertIn('users', stats)
            self.assertIn('listings', stats)
            self.assertIn('transactions', stats)
            # Should handle missing models gracefully
    
    def test_system_log_service_error_handling(self):
        # Test system log creation with invalid data
        with patch('admin_system.models.SystemLogEntry.objects.create') as mock_create:
            mock_create.side_effect = Exception("Database error")
            
            result = SystemLogService.create_system_log(
                severity='error',
                category='test',
                title='Test',
                description='Test'
            )
            
            self.assertIsNone(result)