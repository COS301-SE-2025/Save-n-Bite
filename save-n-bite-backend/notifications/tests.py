# notifications/tests.py

import pytest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from datetime import datetime, timedelta
import json
from unittest.mock import patch, Mock

from .models import (
    Notification, NotificationPreferences, BusinessFollower, 
    EmailNotificationLog
)
from .services import NotificationService
from .serializers import (
    NotificationSerializer, NotificationPreferencesSerializer,
    BusinessFollowerSerializer, FollowBusinessSerializer
)
from authentication.models import FoodProviderProfile, CustomerProfile, NGOProfile

User = get_user_model()

# ============ FIXTURES ============

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def provider_user(db):
    """Create a provider user with verified profile"""
    user = User.objects.create_user(
        username='provider_test',
        email='provider@test.com',
        password='testpass123',
        user_type='provider'
    )
    
    FoodProviderProfile.objects.create(
        user=user,
        business_name='Test Restaurant',
        business_address='123 Test St',
        business_contact='+1234567890',
        business_email='business@test.com',
        status='verified'
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
    
    CustomerProfile.objects.create(
        user=user,
        full_name='Test Customer'
    )
    
    return user

@pytest.fixture
def ngo_user(db):
    """Create an NGO user with verified profile"""
    user = User.objects.create_user(
        username='ngo_test',
        email='ngo@test.com',
        password='testpass123',
        user_type='ngo'
    )
    
    NGOProfile.objects.create(
        user=user,
        organisation_name='Test NGO',
        organisation_contact='+1234567890',
        organisation_email='contact@testngo.com',
        representative_name='NGO Rep',
        representative_email='rep@testngo.com',
        address_line1='123 NGO St',
        city='Test City',
        province_or_state='Test State',
        postal_code='12345',
        country='Test Country',
        status='verified'
    )
    
    return user

@pytest.fixture
def authenticated_customer_client(api_client, customer_user):
    """API client authenticated as customer"""
    refresh = RefreshToken.for_user(customer_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def authenticated_provider_client(api_client, provider_user):
    """API client authenticated as provider"""
    refresh = RefreshToken.for_user(provider_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def authenticated_ngo_client(api_client, ngo_user):
    """API client authenticated as NGO"""
    refresh = RefreshToken.for_user(ngo_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def notification(customer_user, provider_user):
    """Create a test notification"""
    return Notification.objects.create(
        recipient=customer_user,
        sender=provider_user,
        business=provider_user.provider_profile,
        notification_type='new_listing',
        title='New Food Available',
        message='Fresh pizza available for pickup!',
        data={'listing_id': 'test-123', 'price': '15.00'}
    )

@pytest.fixture
def business_follower(customer_user, provider_user):
    """Create a business follower relationship"""
    return BusinessFollower.objects.create(
        user=customer_user,
        business=provider_user.provider_profile
    )

# ============ MODEL TESTS ============

@pytest.mark.django_db
class TestNotificationModel:
    
    def test_create_notification(self, customer_user, provider_user):
        """Test creating a notification"""
        notification = Notification.objects.create(
            recipient=customer_user,
            sender=provider_user,
            business=provider_user.provider_profile,
            notification_type='new_listing',
            title='Test Notification',
            message='This is a test notification',
            data={'test': 'data'}
        )
        
        assert notification.recipient == customer_user
        assert notification.sender == provider_user
        assert notification.notification_type == 'new_listing'
        assert notification.title == 'Test Notification'
        assert not notification.is_read
        assert not notification.is_deleted
        assert notification.data == {'test': 'data'}
        
    def test_notification_string_representation(self, notification):
        """Test notification __str__ method"""
        expected = f"{notification.title} -> {notification.recipient.email}"
        assert str(notification) == expected
    
    # def test_notification_ordering(self, customer_user, provider_user):
    #     """Test that notifications are ordered by creation date (newest first)"""
    #     older_notification = Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='system_announcement',
    #         title='Older Notification',
    #         message='This is older'
    #     )
        
    #     newer_notification = Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='new_listing',
    #         title='Newer Notification',
    #         message='This is newer'
    #     )
        
    #     notifications = list(Notification.objects.all())
    #     assert notifications[0] == newer_notification
    #     assert notifications[1] == older_notification

@pytest.mark.django_db
class TestBusinessFollowerModel:
    
    def test_create_business_follower(self, customer_user, provider_user):
        """Test creating a business follower relationship"""
        follower = BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        assert follower.user == customer_user
        assert follower.business == provider_user.provider_profile
        assert follower.created_at is not None
    
    def test_business_follower_unique_constraint(self, customer_user, provider_user):
        """Test that user can't follow the same business twice"""
        BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        with pytest.raises(Exception):
            BusinessFollower.objects.create(
                user=customer_user,
                business=provider_user.provider_profile
            )
    
    def test_business_follower_string_representation(self, business_follower):
        """Test business follower __str__ method"""
        expected = f"{business_follower.user.email} follows {business_follower.business.business_name}"
        assert str(business_follower) == expected

@pytest.mark.django_db
class TestEmailNotificationLogModel:
    
    def test_create_email_log(self, customer_user, notification):
        """Test creating an email notification log"""
        log = EmailNotificationLog.objects.create(
            recipient_email=customer_user.email,
            recipient_user=customer_user,
            notification=notification,
            subject='Test Email',
            template_name='test_template',
            status='sent'
        )
        
        assert log.recipient_email == customer_user.email
        assert log.recipient_user == customer_user
        assert log.notification == notification
        assert log.subject == 'Test Email'
        assert log.status == 'sent'
    
    def test_email_log_string_representation(self, customer_user):
        """Test email log __str__ method"""
        log = EmailNotificationLog.objects.create(
            recipient_email=customer_user.email,
            recipient_user=customer_user,
            subject='Test Email',
            template_name='test_template',
            status='pending'
        )
        
        expected = f"Email to {customer_user.email} - pending"
        assert str(log) == expected

# ============ SERIALIZER TESTS ============

@pytest.mark.django_db
class TestNotificationSerializers:
    
    def test_notification_serializer(self, notification):
        """Test NotificationSerializer"""
        serializer = NotificationSerializer(notification)
        data = serializer.data
        
        assert data['id'] == str(notification.id)
        assert data['title'] == notification.title
        assert data['message'] == notification.message
        assert data['notification_type'] == notification.notification_type
        assert data['is_read'] == notification.is_read
        assert 'time_ago' in data
        assert 'sender_name' in data
        assert 'business_name' in data
    
    # def test_notification_preferences_serializer(self, customer_user):
    #     """Test NotificationPreferencesSerializer"""
    #     prefs = NotificationPreferences.objects.create(
    #         user=customer_user,
    #         email_notifications=True,
    #         new_listing_notifications=False
    #     )
        
    #     serializer = NotificationPreferencesSerializer(prefs)
    #     data = serializer.data
        
    #     assert data['email_notifications'] is True
    #     assert data['new_listing_notifications'] is False
    #     assert 'promotional_notifications' in data
    #     assert 'weekly_digest' in data
    
    def test_business_follower_serializer(self, business_follower):
        """Test BusinessFollowerSerializer"""
        serializer = BusinessFollowerSerializer(business_follower)
        data = serializer.data
        
        assert data['business_name'] == business_follower.business.business_name
        assert data['business_id'] == str(business_follower.business.user.UserID)
        assert 'business_logo' in data
        assert 'created_at' in data
    
    def test_follow_business_serializer_validation(self, customer_user, provider_user):
        """Test FollowBusinessSerializer validation"""
        # Test valid business ID
        serializer = FollowBusinessSerializer(data={
            'business_id': str(provider_user.UserID)
        })
        assert serializer.is_valid()
        
        # Test invalid business ID
        import uuid
        serializer = FollowBusinessSerializer(data={
            'business_id': str(uuid.uuid4())
        })
        assert not serializer.is_valid()
        assert 'business_id' in serializer.errors

# ============ SERVICE TESTS ============

@pytest.mark.django_db
class TestNotificationService:
    
    def test_create_notification(self, customer_user, provider_user):
        """Test NotificationService.create_notification"""
        notification = NotificationService.create_notification(
            recipient=customer_user,
            notification_type='new_listing',
            title='Service Test',
            message='Test message',
            sender=provider_user,
            business=provider_user.provider_profile,
            data={'test': 'data'}
        )
        
        assert notification.recipient == customer_user
        assert notification.title == 'Service Test'
        assert notification.data == {'test': 'data'}
    
    # @patch('notifications.services.send_mail')
    # def test_send_email_notification(self, mock_send_mail, customer_user):
    #     """Test NotificationService.send_email_notification"""
    #     mock_send_mail.return_value = True
        
    #     # Create notification preferences
    #     NotificationPreferences.objects.create(
    #         user=customer_user,
    #         email_notifications=True
    #     )
        
    #     success = NotificationService.send_email_notification(
    #         user=customer_user,
    #         subject='Test Email',
    #         template_name='test_template',
    #         context={'test': 'context'}
    #     )
        
    #     assert success is True
    #     mock_send_mail.assert_called_once()
        
    #     # Check email log was created
    #     assert EmailNotificationLog.objects.filter(
    #         recipient_user=customer_user,
    #         subject='Test Email'
    #     ).exists()
    
    # @patch('notifications.services.send_mail')
    # def test_send_email_notification_disabled(self, mock_send_mail, customer_user):
    #     """Test email notification when user has disabled email notifications"""
    #     mock_send_mail.return_value = True
        
    #     # Create notification preferences with email disabled
    #     NotificationPreferences.objects.create(
    #         user=customer_user,
    #         email_notifications=False
    #     )
        
    #     success = NotificationService.send_email_notification(
    #         user=customer_user,
    #         subject='Test Email',
    #         template_name='test_template',
    #         context={'test': 'context'}
    #     )
        
    #     assert success is False
    #     mock_send_mail.assert_not_called()
    
    def test_mark_notifications_as_read(self, customer_user, provider_user):
        """Test NotificationService.mark_notifications_as_read"""
        # Create multiple notifications
        notification1 = Notification.objects.create(
            recipient=customer_user,
            sender=provider_user,
            notification_type='new_listing',
            title='Notification 1',
            message='Message 1'
        )
        
        notification2 = Notification.objects.create(
            recipient=customer_user,
            sender=provider_user,
            notification_type='new_listing',
            title='Notification 2',
            message='Message 2'
        )
        
        # Mark as read
        count = NotificationService.mark_notifications_as_read(
            customer_user,
            [notification1.id, notification2.id]
        )
        
        assert count == 2
        
        # Verify they are marked as read
        notification1.refresh_from_db()
        notification2.refresh_from_db()
        assert notification1.is_read is True
        assert notification2.is_read is True
        assert notification1.read_at is not None
        assert notification2.read_at is not None
    
    # def test_get_unread_count(self, customer_user, provider_user):
    #     """Test NotificationService.get_unread_count"""
    #     # Create notifications
    #     Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='new_listing',
    #         title='Unread 1',
    #         message='Message 1'
    #     )
        
    #     read_notification = Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='new_listing',
    #         title='Read 1',
    #         message='Message 2',
    #         is_read=True
    #     )
        
    #     count = NotificationService.get_unread_count(customer_user)
    #     assert count == 1
    
    def test_follow_business(self, customer_user, provider_user):
        """Test NotificationService.follow_business"""
        follower, created = NotificationService.follow_business(
            customer_user, 
            provider_user.UserID
        )
        
        assert created is True
        assert follower.user == customer_user
        assert follower.business == provider_user.provider_profile
        
        # Test following again (should not create duplicate)
        follower2, created2 = NotificationService.follow_business(
            customer_user, 
            provider_user.UserID
        )
        
        assert created2 is False
        assert follower == follower2
    
    def test_unfollow_business(self, customer_user, provider_user):
        """Test NotificationService.unfollow_business"""
        # First follow the business
        BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        success = NotificationService.unfollow_business(
            customer_user, 
            provider_user.UserID
        )
        
        assert success is True
        assert not BusinessFollower.objects.filter(
            user=customer_user,
            business=provider_user.provider_profile
        ).exists()
    
    def test_get_user_following(self, customer_user, provider_user):
        """Test NotificationService.get_user_following"""
        # Create follower relationship
        BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        following_data = NotificationService.get_user_following(customer_user)
        
        assert len(following_data) == 1
        assert following_data[0]['business_name'] == provider_user.provider_profile.business_name
        assert following_data[0]['business_id'] == str(provider_user.UserID)

# ============ VIEW TESTS ============

@pytest.mark.django_db
class TestNotificationViews:
    
    # def test_get_notifications(self, authenticated_customer_client, customer_user, provider_user):
    #     """Test GET /api/notifications/"""
    #     # Create test notifications
    #     Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='new_listing',
    #         title='Test Notification',
    #         message='Test message'
    #     )
        
    #     url = reverse('get_notifications')
    #     response = authenticated_customer_client.get(url)
        
    #     assert response.status_code == status.HTTP_200_OK
    #     assert 'notifications' in response.data
    #     assert 'unread_count' in response.data
    #     assert len(response.data['notifications']) == 1
    #     assert response.data['notifications'][0]['title'] == 'Test Notification'
    
    # def test_get_notifications_with_filters(self, authenticated_customer_client, customer_user, provider_user):
    #     """Test GET /api/notifications/ with filters"""
    #     # Create notifications with different types and read status
    #     Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='new_listing',
    #         title='New Listing',
    #         message='Test message',
    #         is_read=False
    #     )
        
    #     Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='business_update',
    #         title='Business Update',
    #         message='Test message',
    #         is_read=True
    #     )
        
    #     url = reverse('get_notifications')
        
    #     # Test unread filter
    #     response = authenticated_customer_client.get(url, {'read_status': 'unread'})
    #     assert response.status_code == status.HTTP_200_OK
    #     assert len(response.data['notifications']) == 1
    #     assert response.data['notifications'][0]['title'] == 'New Listing'
        
    #     # Test type filter
    #     response = authenticated_customer_client.get(url, {'type': 'business_update'})
    #     assert response.status_code == status.HTTP_200_OK
    #     assert len(response.data['notifications']) == 1
    #     assert response.data['notifications'][0]['title'] == 'Business Update'
    
    def test_mark_notifications_read(self, authenticated_customer_client, customer_user, provider_user):
        """Test POST /api/notifications/mark-read/"""
        notification1 = Notification.objects.create(
            recipient=customer_user,
            sender=provider_user,
            notification_type='new_listing',
            title='Notification 1',
            message='Message 1'
        )
        
        notification2 = Notification.objects.create(
            recipient=customer_user,
            sender=provider_user,
            notification_type='new_listing',
            title='Notification 2',
            message='Message 2'
        )
        
        url = reverse('mark_notifications_read')
        data = {
            'notification_ids': [str(notification1.id), str(notification2.id)]
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['marked_count'] == 2
        
        # Verify notifications are marked as read
        notification1.refresh_from_db()
        notification2.refresh_from_db()
        assert notification1.is_read is True
        assert notification2.is_read is True
    
    # def test_mark_all_read(self, authenticated_customer_client, customer_user, provider_user):
    #     """Test POST /api/notifications/mark-all-read/"""
    #     # Create multiple unread notifications
    #     for i in range(3):
    #         Notification.objects.create(
    #             recipient=customer_user,
    #             sender=provider_user,
    #             notification_type='new_listing',
    #             title=f'Notification {i}',
    #             message=f'Message {i}'
    #         )
        
    #     url = reverse('mark_all_read')
    #     response = authenticated_customer_client.post(url)
        
    #     assert response.status_code == status.HTTP_200_OK
    #     assert response.data['marked_count'] == 3
    #     assert response.data['unread_count'] == 0
        
    #     # Verify all notifications are marked as read
    #     unread_count = Notification.objects.filter(
    #         recipient=customer_user,
    #         is_read=False
    #     ).count()
    #     assert unread_count == 0
    
    # def test_get_unread_count(self, authenticated_customer_client, customer_user, provider_user):
    #     """Test GET /api/notifications/unread-count/"""
    #     # Create notifications
    #     Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='new_listing',
    #         title='Unread',
    #         message='Message'
    #     )
        
    #     Notification.objects.create(
    #         recipient=customer_user,
    #         sender=provider_user,
    #         notification_type='new_listing',
    #         title='Read',
    #         message='Message',
    #         is_read=True
    #     )
        
    #     url = reverse('get_unread_count')
    #     response = authenticated_customer_client.get(url)
        
    #     assert response.status_code == status.HTTP_200_OK
    #     assert response.data['unread_count'] == 1
    
    def test_delete_notification(self, authenticated_customer_client, customer_user, provider_user):
        """Test DELETE /api/notifications/<id>/delete/"""
        notification = Notification.objects.create(
            recipient=customer_user,
            sender=provider_user,
            notification_type='new_listing',
            title='Test',
            message='Message'
        )
        
        url = reverse('delete_notification', args=[notification.id])
        response = authenticated_customer_client.delete(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify notification is soft deleted
        notification.refresh_from_db()
        assert notification.is_deleted is True

@pytest.mark.django_db
class TestNotificationPreferencesViews:
    
    def test_get_notification_preferences(self, authenticated_customer_client, customer_user):
        """Test GET /api/notifications/preferences/"""
        url = reverse('notification_preferences')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'preferences' in response.data
        
        # Check default values are returned
        prefs = response.data['preferences']
        assert prefs['email_notifications'] is True
        assert prefs['new_listing_notifications'] is True
        assert prefs['promotional_notifications'] is False
        assert prefs['weekly_digest'] is True
    
    def test_update_notification_preferences(self, authenticated_customer_client, customer_user):
        """Test PUT /api/notifications/preferences/"""
        url = reverse('notification_preferences')
        data = {
            'email_notifications': False,
            'new_listing_notifications': True,
            'promotional_notifications': True,
            'weekly_digest': False
        }
        
        response = authenticated_customer_client.put(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['preferences']['email_notifications'] is False
        assert response.data['preferences']['promotional_notifications'] is True
        
        # Verify preferences were saved
        prefs = NotificationPreferences.objects.get(user=customer_user)
        assert prefs.email_notifications is False
        assert prefs.promotional_notifications is True

@pytest.mark.django_db
class TestBusinessFollowingViews:
    
    def test_follow_business(self, authenticated_customer_client, customer_user, provider_user):
        """Test POST /api/follow/"""
        url = reverse('follow_business')
        data = {
            'business_id': str(provider_user.UserID)
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['created'] is True
        
        # Verify follower relationship was created
        assert BusinessFollower.objects.filter(
            user=customer_user,
            business=provider_user.provider_profile
        ).exists()
    
    def test_follow_business_already_following(self, authenticated_customer_client, customer_user, provider_user):
        """Test following a business already being followed"""
        # Create existing follower relationship
        BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        url = reverse('follow_business')
        data = {
            'business_id': str(provider_user.UserID)
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['created'] is False
        assert 'Already following' in response.data['message']
    
    def test_unfollow_business(self, authenticated_customer_client, customer_user, provider_user):
        """Test DELETE /api/unfollow/<business_id>/"""
        # Create follower relationship
        BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        url = reverse('unfollow_business', args=[provider_user.UserID])
        response = authenticated_customer_client.delete(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'Successfully unfollowed' in response.data['message']
        
        # Verify follower relationship was deleted
        assert not BusinessFollower.objects.filter(
            user=customer_user,
            business=provider_user.provider_profile
        ).exists()
    
    def test_get_following(self, authenticated_customer_client, customer_user, provider_user):
        """Test GET /api/following/"""
        # Create follower relationship
        BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        url = reverse('get_following')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'following' in response.data
        assert response.data['count'] == 1
        assert response.data['following'][0]['business_name'] == provider_user.provider_profile.business_name
    
    def test_get_followers(self, authenticated_provider_client, customer_user, provider_user):
        """Test GET /api/followers/ (business owner only)"""
        # Create follower relationship
        BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        url = reverse('get_followers')
        response = authenticated_provider_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'followers' in response.data
        assert 'summary' in response.data
        assert response.data['summary']['total_followers'] == 1
    
    def test_get_followers_forbidden_for_non_provider(self, authenticated_customer_client):
        """Test that non-providers cannot view followers"""
        url = reverse('get_followers')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_provider_cannot_follow_business(self, authenticated_provider_client, provider_user):
        """Test that providers cannot follow businesses"""
        url = reverse('follow_business')
        data = {
            'business_id': str(provider_user.UserID)
        }
        
        response = authenticated_provider_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_follow_status(self, authenticated_customer_client, customer_user, provider_user):
        """Test GET /api/follow-status/<business_id>/"""
        url = reverse('get_follow_status', args=[provider_user.UserID])
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'follow_status' in response.data
        assert response.data['follow_status']['is_following'] is False
        assert 'follower_count' in response.data['follow_status']
        
        # Create follower relationship and test again
        BusinessFollower.objects.create(
            user=customer_user,
            business=provider_user.provider_profile
        )
        
        response = authenticated_customer_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['follow_status']['is_following'] is True
        assert response.data['follow_status']['follower_count'] == 1
    
    def test_get_follow_recommendations(self, authenticated_customer_client, customer_user):
        """Test GET /api/recommendations/"""
        url = reverse('get_follow_recommendations')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'recommendations' in response.data
        assert 'count' in response.data
        # Should return empty since no other businesses exist
        assert response.data['count'] == 0

# ============ SIGNAL TESTS ============

@pytest.mark.django_db
class TestNotificationSignals:
    
    @patch('notifications.services.NotificationService.send_welcome_notification')
    def test_welcome_notification_signal(self, mock_send_welcome, customer_user):
        """Test that welcome notification is sent when user is created"""
        # Create a new user (the signal should trigger)
        new_user = User.objects.create_user(
            username='newuser',
            email='newuser@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        # The signal should have called the service
        mock_send_welcome.assert_called_once_with(new_user)
    
    # @patch('notifications.services.NotificationService.send_verification_status_notification')
    # def test_ngo_verification_status_signal(self, mock_send_notification, ngo_user):
    #     """Test NGO verification status change signal"""
    #     # Update the status from pending to verified
    #     ngo_profile = ngo_user.ngo_profile
    #     ngo_profile.status = 'verified'
    #     ngo_profile.save()
        
    #     # The signal should have called the service
    #     mock_send_notification.assert_called_with(
    #         user=ngo_user,
    #         status='verified',
    #         user_type='ngo'
    #     )

#============ INTEGRATION TESTS ============

@pytest.mark.django_db
class TestNotificationIntegration:
    
    def test_complete_notification_workflow(
        self, 
        authenticated_customer_client, 
        customer_user, 
        provider_user
    ):
        """Test complete notification workflow from creation to deletion"""
        
        # 1. Create notification preferences
        prefs_url = reverse('notification_preferences')
        prefs_data = {
            'email_notifications': True,
            'new_listing_notifications': True,
            'promotional_notifications': False
        }
        
        prefs_response = authenticated_customer_client.put(
            prefs_url,
            data=json.dumps(prefs_data),
            content_type='application/json'
        )
        assert prefs_response.status_code == status.HTTP_200_OK
        
        # 2. Follow a business
        follow_url = reverse('follow_business')
        follow_data = {'business_id': str(provider_user.UserID)}
        
        follow_response = authenticated_customer_client.post(
            follow_url,
            data=json.dumps(follow_data),
            content_type='application/json'
        )
        assert follow_response.status_code == status.HTTP_201_CREATED
        
        # 3. Create a notification (simulating business posting new listing)
        notification = Notification.objects.create(
            recipient=customer_user,
            sender=provider_user,
            business=provider_user.provider_profile,
            notification_type='new_listing',
            title='New Pizza Available!',
            message='Fresh pizza just posted at Test Restaurant',
            data={'listing_id': 'test-123', 'price': '15.00'}
        )
        
        # 4. Get notifications and verify it appears
        notif_url = reverse('get_notifications')
        notif_response = authenticated_customer_client.get(notif_url)
        
        assert notif_response.status_code == status.HTTP_200_OK
        
        # The response is paginated, so data is in 'results' not 'notifications'
        # Also check if the structure includes pagination fields
        if 'results' in notif_response.data:
            # Paginated response structure
            notifications_data = notif_response.data['results']['notifications']
            unread_count = notif_response.data['results']['unread_count']
        else:
            # Alternative structure - check if data is directly accessible
            notifications_data = notif_response.data['notifications']
            unread_count = notif_response.data['unread_count']
        
        # Should have both the welcome notification and the new listing notification
        assert len(notifications_data) == 2
        assert unread_count == 2
        
        # Find our specific notification (order might vary)
        new_listing_notification = None
        for notif in notifications_data:
            if notif['title'] == 'New Pizza Available!':
                new_listing_notification = notif
                break
        
        assert new_listing_notification is not None
        assert new_listing_notification['notification_type'] == 'new_listing'
        assert new_listing_notification['message'] == 'Fresh pizza just posted at Test Restaurant'
        
        # 5. Mark notification as read
        mark_read_url = reverse('mark_notifications_read')
        mark_read_data = {'notification_ids': [str(notification.id)]}
        
        mark_read_response = authenticated_customer_client.post(
            mark_read_url,
            data=json.dumps(mark_read_data),
            content_type='application/json'
        )
        assert mark_read_response.status_code == status.HTTP_200_OK
        assert mark_read_response.data['unread_count'] == 1
        
        # 6. Delete notification
        delete_url = reverse('delete_notification', args=[notification.id])
        delete_response = authenticated_customer_client.delete(delete_url)
        
        assert delete_response.status_code == status.HTTP_200_OK
        
        # 7. Verify notification is soft deleted
        notification.refresh_from_db()
        assert notification.is_deleted is True
        
        # 8. Unfollow business
        unfollow_url = reverse('unfollow_business', args=[provider_user.UserID])
        unfollow_response = authenticated_customer_client.delete(unfollow_url)
        
        assert unfollow_response.status_code == status.HTTP_200_OK
        
        # 9. Verify follow relationship is removed
        assert not BusinessFollower.objects.filter(
            user=customer_user,
            business=provider_user.provider_profile
        ).exists()

# ============ PERMISSION TESTS ============

# @pytest.mark.django_db
# class TestNotificationPermissions:
    
#     def test_unauthenticated_access_denied(self, api_client):
#         """Test that unauthenticated users cannot access notification endpoints"""
#         endpoints = [
#             reverse('get_notifications'),
#             reverse('mark_all_read'),
#             reverse('notification_preferences'),
#             reverse('follow_business'),
#             reverse('get_following'),
#         ]
        
#         for endpoint in endpoints:
#             response = api_client.get(endpoint)
#             assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
#     def test_user_can_only_see_own_notifications(
#         self, 
#         authenticated_customer_client, 
#         customer_user, 
#         provider_user
#     ):
#         """Test that users can only see their own notifications"""
        
#         # Create another customer
#         other_customer = User.objects.create_user(
#             username='other_customer',
#             email='other@test.com',
#             password='testpass123',
#             user_type='customer'
#         )
        
#         # Create notifications for both customers
#         customer_notification = Notification.objects.create(
#             recipient=customer_user,
#             sender=provider_user,
#             notification_type='new_listing',
#             title='For Customer',
#             message='Message for customer'
#         )
        
#         other_notification = Notification.objects.create(
#             recipient=other_customer,
#             sender=provider_user,
#             notification_type='new_listing',
#             title='For Other',
#             message='Message for other customer'
#         )
        
#         # Customer should only see their own notification
#         url = reverse('get_notifications')
#         response = authenticated_customer_client.get(url)
        
#         assert response.status_code == status.HTTP_200_OK
#         assert len(response.data['notifications']) == 1
#         assert response.data['notifications'][0]['title'] == 'For Customer'
    
#     def test_cannot_delete_other_users_notifications(
#         self, 
#         authenticated_customer_client, 
#         customer_user, 
#         provider_user
#     ):
#         """Test that users cannot delete other users' notifications"""
        
#         # Create another customer
#         other_customer = User.objects.create_user(
#             username='other_customer',
#             email='other@test.com',
#             password='testpass123',
#             user_type='customer'
#         )
        
#         # Create notification for other customer
#         other_notification = Notification.objects.create(
#             recipient=other_customer,
#             sender=provider_user,
#             notification_type='new_listing',
#             title='Other Customer Notification',
#             message='Not for authenticated customer'
#         )
        
#         # Try to delete other user's notification
#         url = reverse('delete_notification', args=[other_notification.id])
#         response = authenticated_customer_client.delete(url)
        
#         assert response.status_code == status.HTTP_404_NOT_FOUND

# ============ DJANGO TESTCASE VERSIONS ============
# These work with python manage.py test

class NotificationModelTestCase(TestCase):
    """Django TestCase for notification models"""
    
    def setUp(self):
        """Set up test data"""
        self.customer_user = User.objects.create_user(
            username='customer_django',
            email='customer_django@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        CustomerProfile.objects.create(
            user=self.customer_user,
            full_name='Django Customer'
        )
        
        self.provider_user = User.objects.create_user(
            username='provider_django',
            email='provider_django@test.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.provider_profile = FoodProviderProfile.objects.create(
            user=self.provider_user,
            business_name='Django Restaurant',
            business_address='123 Django St',
            business_contact='+1234567890',
            business_email='django@business.com',
            status='verified'
        )
    
    def test_notification_creation(self):
        """Test creating a notification"""
        notification = Notification.objects.create(
            recipient=self.customer_user,
            sender=self.provider_user,
            business=self.provider_profile,
            notification_type='new_listing',
            title='Django Test Notification',
            message='This is a Django test notification'
        )
        
        self.assertEqual(notification.recipient, self.customer_user)
        self.assertEqual(notification.sender, self.provider_user)
        self.assertEqual(notification.title, 'Django Test Notification')
        self.assertFalse(notification.is_read)
        self.assertIsNotNone(notification.created_at)
    
    # def test_notification_preferences_creation(self):
    #     """Test creating notification preferences"""
    #     prefs = NotificationPreferences.objects.create(
    #         user=self.customer_user,
    #         email_notifications=False,
    #         new_listing_notifications=True
    #     )
        
    #     self.assertEqual(prefs.user, self.customer_user)
    #     self.assertFalse(prefs.email_notifications)
    #     self.assertTrue(prefs.new_listing_notifications)
    
    def test_business_follower_creation(self):
        """Test creating business follower relationship"""
        follower = BusinessFollower.objects.create(
            user=self.customer_user,
            business=self.provider_profile
        )
        
        self.assertEqual(follower.user, self.customer_user)
        self.assertEqual(follower.business, self.provider_profile)
        self.assertIsNotNone(follower.created_at)
    
    def test_email_notification_log_creation(self):
        """Test creating email notification log"""
        notification = Notification.objects.create(
            recipient=self.customer_user,
            sender=self.provider_user,
            notification_type='new_listing',
            title='Test',
            message='Test message'
        )
        
        log = EmailNotificationLog.objects.create(
            recipient_email=self.customer_user.email,
            recipient_user=self.customer_user,
            notification=notification,
            subject='Test Email Subject',
            template_name='test_template',
            status='sent'
        )
        
        self.assertEqual(log.recipient_user, self.customer_user)
        self.assertEqual(log.subject, 'Test Email Subject')
        self.assertEqual(log.status, 'sent')

class NotificationServiceTestCase(TestCase):
    """Django TestCase for notification services"""
    
    def setUp(self):
        """Set up test data"""
        self.customer_user = User.objects.create_user(
            username='customer_service',
            email='customer_service@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        CustomerProfile.objects.create(
            user=self.customer_user,
            full_name='Service Customer'
        )
        
        self.provider_user = User.objects.create_user(
            username='provider_service',
            email='provider_service@test.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.provider_profile = FoodProviderProfile.objects.create(
            user=self.provider_user,
            business_name='Service Restaurant',
            business_address='123 Service St',
            business_contact='+1234567890',
            business_email='service@business.com',
            status='verified'
        )
    
    def test_create_notification_service(self):
        """Test NotificationService.create_notification"""
        notification = NotificationService.create_notification(
            recipient=self.customer_user,
            notification_type='new_listing',
            title='Service Test',
            message='Service test message',
            sender=self.provider_user,
            business=self.provider_profile
        )
        
        self.assertEqual(notification.recipient, self.customer_user)
        self.assertEqual(notification.title, 'Service Test')
        self.assertEqual(notification.sender, self.provider_user)
    
    # def test_get_unread_count_service(self):
    #     """Test NotificationService.get_unread_count"""
    #     # Create notifications
    #     Notification.objects.create(
    #         recipient=self.customer_user,
    #         sender=self.provider_user,
    #         notification_type='new_listing',
    #         title='Unread 1',
    #         message='Message 1'
    #     )
        
    #     Notification.objects.create(
    #         recipient=self.customer_user,
    #         sender=self.provider_user,
    #         notification_type='new_listing',
    #         title='Read 1',
    #         message='Message 2',
    #         is_read=True
    #     )
        
    #     count = NotificationService.get_unread_count(self.customer_user)
    #     self.assertEqual(count, 1)
    
    def test_follow_unfollow_business_service(self):
        """Test follow/unfollow business service"""
        # Test follow
        follower, created = NotificationService.follow_business(
            self.customer_user, 
            self.provider_user.UserID
        )
        
        self.assertTrue(created)
        self.assertEqual(follower.user, self.customer_user)
        self.assertEqual(follower.business, self.provider_profile)
        
        # Test follow again (should not create duplicate)
        follower2, created2 = NotificationService.follow_business(
            self.customer_user, 
            self.provider_user.UserID
        )
        
        self.assertFalse(created2)
        self.assertEqual(follower, follower2)
        
        # Test unfollow
        success = NotificationService.unfollow_business(
            self.customer_user, 
            self.provider_user.UserID
        )
        
        self.assertTrue(success)
        self.assertFalse(
            BusinessFollower.objects.filter(
                user=self.customer_user,
                business=self.provider_profile
            ).exists()
        )

class NotificationAPITestCase(TestCase):
    """Django TestCase for notification API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        self.customer_user = User.objects.create_user(
            username='customer_api',
            email='customer_api@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        CustomerProfile.objects.create(
            user=self.customer_user,
            full_name='API Customer'
        )
        
        # Authenticate client
        refresh = RefreshToken.for_user(self.customer_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )
    
    # def test_get_notifications_api(self):
    #     """Test GET notifications API"""
    #     # Create a test notification
    #     notification = Notification.objects.create(
    #         recipient=self.customer_user,
    #         notification_type='new_listing',
    #         title='API Test Notification',
    #         message='API test message'
    #     )
        
    #     url = reverse('get_notifications')
    #     response = self.client.get(url)
        
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertIn('notifications', response.data)
    #     self.assertEqual(len(response.data['notifications']), 1)
    #     self.assertEqual(
    #         response.data['notifications'][0]['title'], 
    #         'API Test Notification'
    #     )
    
    def test_notification_preferences_api(self):
        """Test notification preferences API"""
        url = reverse('notification_preferences')
        
        # Test GET (should create default preferences)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('preferences', response.data)
        
        # Test PUT (update preferences)
        data = {
            'email_notifications': False,
            'new_listing_notifications': True,
            'promotional_notifications': True
        }
        
        response = self.client.put(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['preferences']['email_notifications'])
        self.assertTrue(response.data['preferences']['promotional_notifications'])
    
    def test_mark_notifications_read_api(self):
        """Test mark notifications read API"""
        notification = Notification.objects.create(
            recipient=self.customer_user,
            notification_type='new_listing',
            title='To be marked read',
            message='Test message'
        )
        
        url = reverse('mark_notifications_read')
        data = {'notification_ids': [str(notification.id)]}
        
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['marked_count'], 1)
        
        # Verify notification is marked as read
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)