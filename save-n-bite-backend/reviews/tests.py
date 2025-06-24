# reviews/test_reviews.py

import uuid
import pytest
from decimal import Decimal
from unittest.mock import MagicMock

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from reviews.models import Review, ReviewModerationLog, BusinessReviewStats
from reviews.serializers import ReviewCreateSerializer, BusinessReviewStatsSerializer
from interactions.models import Interaction
from authentication.models import FoodProviderProfile, CustomerProfile

User = get_user_model()


# ============ FIXTURES ============

@pytest.fixture
def customer_user(db):
    """Create a customer user"""
    return User.objects.create_user(
        username='customer@test.com',
        email='customer@test.com',
        password='testpass123',
        user_type='customer'
    )


@pytest.fixture
def provider_user(db):
    """Create a provider user"""
    return User.objects.create_user(
        username='provider@test.com',
        email='provider@test.com',
        password='testpass123',
        user_type='provider'
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    return User.objects.create_user(
        username='admin@test.com',
        email='admin@test.com',
        password='testpass123',
        user_type='admin',
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def customer_profile(customer_user):
    """Create a customer profile"""
    return CustomerProfile.objects.create(
        user=customer_user,
        full_name='John Doe'
    )


@pytest.fixture
def provider_profile(provider_user):
    """Create a provider profile"""
    return FoodProviderProfile.objects.create(
        user=provider_user,
        business_name='Test Restaurant',
        business_address='123 Test St',
        business_contact='+1234567890',
        business_email='business@test.com',
        cipc_document='test_doc.pdf'
    )


@pytest.fixture
def completed_interaction(customer_user, provider_profile):
    """Create a completed interaction"""
    return Interaction.objects.create(
        user=customer_user,
        business=provider_profile,
        interaction_type='Purchase',
        total_amount=Decimal('15.00'),
        status='completed'
    )


@pytest.fixture
def pending_interaction(customer_user, provider_profile):
    """Create a pending interaction"""
    return Interaction.objects.create(
        user=customer_user,
        business=provider_profile,
        interaction_type='Purchase',
        total_amount=Decimal('20.00'),
        status='pending'
    )


@pytest.fixture
def api_client():
    """Create an API client"""
    return APIClient()


@pytest.fixture
def authenticated_customer_client(api_client, customer_user):
    """Create an authenticated customer API client"""
    refresh = RefreshToken.for_user(customer_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def authenticated_provider_client(api_client, provider_user):
    """Create an authenticated provider API client"""
    refresh = RefreshToken.for_user(provider_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def authenticated_admin_client(api_client, admin_user):
    """Create an authenticated admin API client"""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


# ============ REVIEW MODEL TESTS ============

@pytest.mark.django_db
class TestReviewModel:
    """Test Review model functionality"""

    def test_review_creation_with_rating(self, customer_user, provider_profile, completed_interaction):
        """Test creating a review with just a rating"""
        review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=4
        )
        
        assert review.reviewer == customer_user
        assert review.business == provider_profile
        assert review.general_rating == 4
        assert review.status == 'active'
        assert review.is_visible is True
        assert review.has_content is True

    def test_review_creation_with_comment(self, customer_user, completed_interaction):
        """Test creating a review with just a comment"""
        review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_comment='Great food!'
        )
        
        assert review.general_comment == 'Great food!'
        assert review.has_content is True

    def test_review_validation_empty_content(self, customer_user, completed_interaction):
        """Test that validation fails when all content fields are empty"""
        review = Review(
            interaction=completed_interaction,
            reviewer=customer_user
        )
        
        with pytest.raises(ValidationError):
            review.clean()

    def test_review_string_representation(self, customer_user, provider_profile, completed_interaction):
        """Test review string representation"""
        review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=5
        )
        
        expected = f"Review by {customer_user.email} for {provider_profile.business_name} - 5★"
        assert str(review) == expected

    def test_review_without_rating_string(self, customer_user, provider_profile, completed_interaction):
        """Test review string representation without rating"""
        review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_comment='Good food'
        )
        
        expected = f"Review by {customer_user.email} for {provider_profile.business_name} - No rating"
        assert str(review) == expected

    def test_review_caches_interaction_data(self, customer_user, provider_profile, completed_interaction):
        """Test that review saves interaction data"""
        review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=3
        )
        
        assert review.interaction_type == 'Purchase'
        assert review.interaction_total_amount == Decimal('15.00')
        assert review.business == provider_profile

    def test_review_visibility_by_status(self, customer_user, provider_profile, completed_interaction):
        """Test review visibility based on status"""
        # Active review should be visible
        active_review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=4,
            status='active'
        )
        assert active_review.is_visible is True
        
        # Create another interaction for deleted review test
        interaction2 = Interaction.objects.create(
            user=customer_user,
            business=provider_profile,
            interaction_type='Purchase',
            total_amount=Decimal('20.00'),
            status='completed'
        )
        
        # Deleted review should not be visible
        deleted_review = Review.objects.create(
            interaction=interaction2,
            reviewer=customer_user,
            general_rating=1,
            status='deleted'
        )
        assert deleted_review.is_visible is False

    def test_one_review_per_interaction(self, customer_user, completed_interaction):
        """Test that only one review per interaction is allowed"""
        Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=4
        )
        
        with pytest.raises(IntegrityError):
            Review.objects.create(
                interaction=completed_interaction,
                reviewer=customer_user,
                general_rating=5
            )

    def test_review_has_content_property(self, customer_user, completed_interaction):
        """Test review has_content property"""
        # Review with content
        review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=4
        )
        assert review.has_content is True
        
        # Empty review (test property only)
        empty_review = Review(
            interaction=completed_interaction,
            reviewer=customer_user
        )
        assert empty_review.has_content is False


# ============ REVIEW MODERATION TESTS ============

@pytest.mark.django_db
class TestReviewModeration:
    """Test Review moderation functionality"""

    def test_moderation_log_creation(self, customer_user, provider_profile, completed_interaction, admin_user):
        """Test creating moderation logs"""
        review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=2,
            status='active'
        )
        
        log = ReviewModerationLog.objects.create(
            review=review,
            moderator=admin_user,
            action='flag',
            reason='Inappropriate content',
            previous_status='active',
            new_status='flagged'
        )
        
        assert log.review == review
        assert log.moderator == admin_user
        assert log.action == 'flag'

    def test_moderation_log_string_representation(self, customer_user, completed_interaction, admin_user):
        """Test moderation log string representation"""
        review = Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=1
        )
        
        log = ReviewModerationLog.objects.create(
            review=review,
            moderator=admin_user,
            action='flag',
            reason='Test',
            previous_status='active',
            new_status='flagged'
        )
        
        expected = f"flag by {admin_user.email} on review {review.id}"
        assert str(log) == expected


# ============ BUSINESS REVIEW STATS TESTS ============

@pytest.mark.django_db
class TestBusinessReviewStats:
    """Test BusinessReviewStats model"""

    def test_business_stats_creation(self, provider_profile):
        """Test creating business review stats"""
        stats = BusinessReviewStats.objects.create(
            business=provider_profile
        )
        
        assert stats.business == provider_profile
        assert stats.total_reviews == 0
        assert stats.average_rating == Decimal('0.00')

    def test_business_stats_unique_constraint(self, provider_profile):
        """Test that only one stats object per business is allowed"""
        BusinessReviewStats.objects.create(business=provider_profile)
        
        with pytest.raises(IntegrityError):
            BusinessReviewStats.objects.create(business=provider_profile)

    def test_business_stats_string_representation(self, provider_profile):
        """Test business stats string representation"""
        stats = BusinessReviewStats.objects.create(
            business=provider_profile
        )
        
        expected = f"Review stats for {provider_profile.business_name}"
        assert str(stats) == expected


# ============ REVIEW API TESTS ============

@pytest.mark.django_db
class TestReviewAPI:
    """Test Review API endpoints"""

    def test_create_review_success(self, authenticated_customer_client, completed_interaction):
        """Test successful review creation"""
        data = {
            'interaction_id': str(completed_interaction.id),
            'general_rating': 4,
            'general_comment': 'Good food!'
        }
        
        response = authenticated_customer_client.post('/api/reviews/create/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()['message'] == 'Review created successfully'
        
        # Verify review was created
        assert Review.objects.filter(interaction=completed_interaction).exists()

    def test_create_review_invalid_user_type(self, authenticated_provider_client, completed_interaction):
        """Test that providers cannot create reviews"""
        data = {
            'interaction_id': str(completed_interaction.id),
            'general_rating': 4
        }
        
        response = authenticated_provider_client.post('/api/reviews/create/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_review_non_completed_interaction(self, authenticated_customer_client, pending_interaction):
        """Test that reviews cannot be created for non-completed interactions"""
        data = {
            'interaction_id': str(pending_interaction.id),
            'general_rating': 4
        }
        
        response = authenticated_customer_client.post('/api/reviews/create/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_review_nonexistent_interaction(self, authenticated_customer_client):
        """Test review creation with nonexistent interaction"""
        data = {
            'interaction_id': str(uuid.uuid4()),
            'general_rating': 4
        }
        
        response = authenticated_customer_client.post('/api/reviews/create/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_duplicate_review(self, authenticated_customer_client, customer_user, completed_interaction):
        """Test that duplicate reviews cannot be created"""
        # Create first review
        Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=4
        )
        
        data = {
            'interaction_id': str(completed_interaction.id),
            'general_rating': 5
        }
        
        response = authenticated_customer_client.post('/api/reviews/create/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_review_empty_content(self, authenticated_customer_client, completed_interaction):
        """Test that reviews with no content fail validation"""
        data = {
            'interaction_id': str(completed_interaction.id),
            'general_comment': '',
            'food_review': '',
            'business_review': ''
        }
        
        response = authenticated_customer_client.post('/api/reviews/create/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_business_reviews_access(self, authenticated_provider_client, customer_user, completed_interaction):
        """Test business review access"""
        # Create a review
        Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=4,
            general_comment='Good food',
            status='active'
        )
        
        response = authenticated_provider_client.get('/api/business/reviews/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data['results']['reviews']) == 1

    def test_business_reviews_unauthorized(self, authenticated_customer_client):
        """Test that non-providers cannot access business reviews"""
        response = authenticated_customer_client.get('/api/business/reviews/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_business_review_stats(self, authenticated_provider_client, customer_user, provider_profile):
        """Test business review statistics"""
        # Create multiple reviews
        for rating in [5, 4, 3]:
            interaction = Interaction.objects.create(
                user=customer_user,
                business=provider_profile,
                interaction_type='Purchase',
                total_amount=Decimal('10.00'),
                status='completed'
            )
            Review.objects.create(
                interaction=interaction,
                reviewer=customer_user,
                general_rating=rating,
                status='active'
            )
        
        response = authenticated_provider_client.get('/api/business/reviews/stats/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'stats' in data

    def test_admin_review_access(self, authenticated_admin_client, customer_user, completed_interaction):
        """Test admin review access"""
        Review.objects.create(
            interaction=completed_interaction,
            reviewer=customer_user,
            general_rating=2,
            status='active'
        )
        
        response = authenticated_admin_client.get('/api/admin/reviews/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data['results']['reviews']) == 1

    def test_admin_review_access_unauthorized(self, authenticated_customer_client):
        """Test that non-admins cannot access admin endpoints"""
        response = authenticated_customer_client.get('/api/admin/reviews/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_access(self, api_client):
        """Test that unauthenticated users cannot access endpoints"""
        response = api_client.post('/api/reviews/create/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        response = api_client.get('/api/business/reviews/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_review_with_invalid_rating(self, authenticated_customer_client, completed_interaction):
        """Test review creation with invalid rating"""
        # Test rating too high
        data = {
            'interaction_id': str(completed_interaction.id),
            'general_rating': 6
        }
        
        response = authenticated_customer_client.post('/api/reviews/create/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============ REVIEW SERIALIZER TESTS ============

@pytest.mark.django_db
class TestReviewSerializers:
    """Test Review serializers"""

    def test_review_create_serializer_valid(self, customer_user, completed_interaction):
        """Test ReviewCreateSerializer with valid data"""
        request = MagicMock()
        request.user = customer_user
        
        data = {
            'interaction_id': str(completed_interaction.id),
            'general_rating': 4,
            'general_comment': 'Good food'
        }
        
        serializer = ReviewCreateSerializer(
            data=data,
            context={'request': request}
        )
        assert serializer.is_valid()

    def test_review_create_serializer_invalid_empty(self, customer_user, completed_interaction):
        """Test ReviewCreateSerializer with empty content"""
        request = MagicMock()
        request.user = customer_user
        
        data = {
            'interaction_id': str(completed_interaction.id),
            'general_comment': '',
            'food_review': '',
            'business_review': ''
        }
        
        serializer = ReviewCreateSerializer(
            data=data,
            context={'request': request}
        )
        assert not serializer.is_valid()

    def test_business_review_stats_serializer(self, provider_profile):
        """Test BusinessReviewStatsSerializer"""
        stats = BusinessReviewStats.objects.create(
            business=provider_profile,
            total_reviews=5,
            average_rating=Decimal('4.20'),
            rating_1_count=0,
            rating_2_count=1,
            rating_3_count=1,
            rating_4_count=2,
            rating_5_count=1
        )
        
        serializer = BusinessReviewStatsSerializer(stats)
        data = serializer.data
        
        assert data['total_reviews'] == 5
        assert float(data['average_rating']) == 4.20