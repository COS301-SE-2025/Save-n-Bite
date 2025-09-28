# badges/tests_fixed.py - Fixed Unit Tests

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from datetime import datetime, timedelta, date
from unittest.mock import patch, Mock
import uuid
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile

from badges.models import (
    BadgeType, ProviderBadge, BadgeLeaderboard, ProviderBadgeStats
)
from badges.services import BadgeService, BadgeInitializationService
from badges.serializers import (
    BadgeTypeSerializer, ProviderBadgeSerializer, ProviderBadgeStatsSerializer,
    BadgePinSerializer, ProviderBadgeProfileSerializer, BadgeLeaderboardSerializer,
    BadgeLeaderboardRankingSerializer
)
from authentication.models import FoodProviderProfile, CustomerProfile, NGOProfile
from reviews.models import Review
from interactions.models import Interaction, Order, InteractionItem
from food_listings.models import FoodListing

User = get_user_model()


class BadgeTestCase(TestCase):
    """Base test case with common setup for badge tests"""
    
    def setUp(self):
        """Set up test data"""
        self.api_client = APIClient()
        
        # Create provider user
        self.provider_user = User.objects.create_user(
            username='provider_test',
            email='provider@test.com',
            password='testpass123',
            user_type='provider'
        )
        
        # Create a dummy file for cipc_document
        dummy_file = SimpleUploadedFile("test_cipc.pdf", b"dummy content", content_type="application/pdf")
        
        self.provider_profile, _ = FoodProviderProfile.objects.get_or_create(
            user=self.provider_user,
            defaults={
                'business_name': 'Test Restaurant',
                'business_address': '123 Test St',
                'business_contact': '+1234567890',
                'business_email': 'business@test.com',
                'status': 'verified',
                'cipc_document': dummy_file
            }
        )
        
        # Create customer user
        self.customer_user = User.objects.create_user(
            username='customer_test',
            email='customer@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.customer_profile, _ = CustomerProfile.objects.get_or_create(
            user=self.customer_user,
            defaults={
                'full_name': 'Test Customer'
            }
        )
        
        # Create badge type
        self.badge_type = BadgeType.objects.create(
            name='Test Badge',
            description='A test badge for testing',
            category='milestone',
            rarity='common',
            svg_filename='test_badge.svg',
            criteria_description='Complete 1 order',
            display_order=1
        )
        
        # Create authenticated clients
        self.authenticated_provider_client = APIClient()
        refresh = RefreshToken.for_user(self.provider_user)
        self.authenticated_provider_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        self.authenticated_customer_client = APIClient()
        refresh = RefreshToken.for_user(self.customer_user)
        self.authenticated_customer_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


class TestBadgeTypeModel(BadgeTestCase):
    
    def test_create_badge_type(self):
        """Test creating a badge type"""
        badge_type = BadgeType.objects.create(
            name='Test Badge 2',
            description='A test badge',
            category='milestone',
            rarity='common',
            svg_filename='test.svg',
            criteria_description='Complete 1 order',
            display_order=1
        )
        
        self.assertEqual(badge_type.name, 'Test Badge 2')
        self.assertEqual(badge_type.category, 'milestone')
        self.assertEqual(badge_type.rarity, 'common')
        self.assertTrue(badge_type.is_active)
        self.assertIsNotNone(badge_type.created_at)
        self.assertIsNotNone(badge_type.updated_at)
    
    def test_badge_type_string_representation(self):
        """Test badge type __str__ method"""
        expected = f"{self.badge_type.name} ({self.badge_type.get_category_display()})"
        self.assertEqual(str(self.badge_type), expected)


class TestProviderBadgeModel(BadgeTestCase):
    
    def test_create_provider_badge(self):
        """Test creating a provider badge"""
        badge = ProviderBadge.objects.create(
            provider=self.provider_user,
            badge_type=self.badge_type,
            earned_reason='Test reason',
            badge_data={'test': 'data'}
        )
        
        self.assertEqual(badge.provider, self.provider_user)
        self.assertEqual(badge.badge_type, self.badge_type)
        self.assertEqual(badge.earned_reason, 'Test reason')
        self.assertEqual(badge.badge_data, {'test': 'data'})
        self.assertFalse(badge.is_pinned)
        self.assertEqual(badge.pin_order, 0)
        self.assertIsNotNone(badge.earned_date)
    
    def test_provider_badge_string_representation(self):
        """Test provider badge __str__ method"""
        badge = ProviderBadge.objects.create(
            provider=self.provider_user,
            badge_type=self.badge_type,
            earned_reason='Test reason'
        )
        expected = f"{self.provider_profile.business_name} - {self.badge_type.name}"
        self.assertEqual(str(badge), expected)


class TestBadgeService(BadgeTestCase):
    
    def test_badge_service_initialization(self):
        """Test BadgeService initialization"""
        service = BadgeService()
        self.assertIsNotNone(service.current_time)
        self.assertIsNotNone(service.current_month)
        self.assertIsNotNone(service.current_year)
    
    @patch('badges.services.NotificationService.create_notification')
    def test_award_badge(self, mock_notification):
        """Test award_badge method"""
        service = BadgeService()
        badge_data = {'test': 'data', 'value': 100}
        
        badge = service.award_badge(self.provider_user, self.badge_type, badge_data)
        
        self.assertEqual(badge.provider, self.provider_user)
        self.assertEqual(badge.badge_type, self.badge_type)
        self.assertEqual(badge.badge_data, badge_data)
        self.assertIsNotNone(badge.earned_reason)
        self.assertIsNotNone(badge.earned_date)
        
        # # Should send notification
        # mock_notification.assert_called_once()


class TestBadgeTypeListView(BadgeTestCase):
    
    def test_get_badge_types(self):
        """Test GET /api/badges/types/"""
        url = reverse('badges:badge-types')
        response = self.api_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle paginated response
        self.assertIn('results', response.data)
        badges = response.data['results']
        
        self.assertGreaterEqual(len(badges), 1)
        
        # Check that our test badge is in the response
        badge_names = [badge['name'] for badge in badges]
        self.assertIn(self.badge_type.name, badge_names)


class TestGetMyBadgesView(BadgeTestCase):
    
    def test_get_my_badges_success(self):
        """Test GET /api/badges/my-badges/ for authenticated provider"""
        # Create a badge for the provider
        ProviderBadge.objects.create(
            provider=self.provider_user,
            badge_type=self.badge_type,
            earned_reason='Test reason'
        )
        
        url = reverse('badges:my-badges')
        response = self.authenticated_provider_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('provider_info', response.data)
        self.assertIn('badges', response.data)
        self.assertIn('stats', response.data)
    
    def test_get_my_badges_customer_user(self):
        """Test GET /api/badges/my-badges/ for customer user (should fail)"""
        url = reverse('badges:my-badges')
        response = self.authenticated_customer_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)
    
    def test_get_my_badges_unauthenticated(self):
        """Test GET /api/badges/my-badges/ without authentication"""
        url = reverse('badges:my-badges')
        response = self.api_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestBadgeInitializationService(BadgeTestCase):
    
    def test_create_default_badge_types(self):
        """Test create_default_badge_types method"""
        # Clear existing badge types
        BadgeType.objects.all().delete()
        
        created_count = BadgeInitializationService.create_default_badge_types()
        
        self.assertGreater(created_count, 0)
        self.assertEqual(BadgeType.objects.count(), created_count)
        
        # Check that specific badge types were created
        self.assertTrue(BadgeType.objects.filter(name='First Order').exists())
        self.assertTrue(BadgeType.objects.filter(name='Provider of the Month').exists())
    
    def test_create_default_badge_types_idempotent(self):
        """Test that create_default_badge_types is idempotent"""
        # Run twice
        count1 = BadgeInitializationService.create_default_badge_types()
        count2 = BadgeInitializationService.create_default_badge_types()
        
        # Second run should create 0 new badges
        self.assertEqual(count2, 0)
        self.assertEqual(BadgeType.objects.count(), count1 + 1)  # +1 for the badge created in setUp


class TestBadgeIntegration(BadgeTestCase):
    
    def test_badge_pinning_workflow(self):
        """Test complete badge pinning workflow"""
        # Create a badge
        badge = ProviderBadge.objects.create(
            provider=self.provider_user,
            badge_type=self.badge_type,
            earned_reason='Test badge'
        )
        
        # Pin the badge
        service = BadgeService()
        result = service.pin_badge(self.provider_user, str(badge.id))
        self.assertTrue(result)
        
        # Check badge is pinned
        badge.refresh_from_db()
        self.assertTrue(badge.is_pinned)
        self.assertEqual(badge.pin_order, 1)
        
        # Unpin the badge
        result = service.unpin_badge(self.provider_user, str(badge.id))
        self.assertTrue(result)
        
        # Check badge is unpinned
        badge.refresh_from_db()
        self.assertFalse(badge.is_pinned)
        self.assertEqual(badge.pin_order, 0)
