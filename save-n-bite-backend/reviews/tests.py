# reviews/tests.py

import pytest
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from datetime import date, timedelta
import uuid

from .models import Review, BusinessReviewStats, ReviewModerationLog
from interactions.models import Interaction
from authentication.models import User, FoodProviderProfile, CustomerProfile, NGOProfile

User = get_user_model()

class ReviewSystemTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.customer_user = User.objects.create_user(
            username='customer@test.com',
            email='customer@test.com',
            password='testpass123',
            user_type='customer'
        )
        CustomerProfile.objects.create(
            user=self.customer_user,
            full_name='Test Customer'
        )
        
        self.provider_user = User.objects.create_user(
            username='provider@test.com',
            email='provider@test.com',
            password='testpass123',
            user_type='provider'
        )
        self.provider_profile = FoodProviderProfile.objects.create(
            user=self.provider_user,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='business@test.com',
            status='verified'
        )
        
        self.admin_user = User.objects.create_user(
            username='admin@test.com',
            email='admin@test.com',
            password='testpass123',
            user_type='customer',
            admin_rights=True
        )
        
        # Create test interaction
        self.interaction = Interaction.objects.create(
            user=self.customer_user,
            business=self.provider_profile,
            interaction_type='Purchase',
            quantity=2,
            total_amount=25.00,
            status='completed'
        )
    
    def authenticate_user(self, user):
        """Helper method to authenticate a user"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_create_review_success(self):
        """Test successful review creation"""
        self.authenticate_user(self.customer_user)
        
        data = {
            'interaction_id': str(self.interaction.id),
            'general_rating': 4,
            'general_comment': 'Great food and service!',
            'food_review': 'The pizza was delicious',
            'business_review': 'Friendly staff and clean restaurant',
            'review_source': 'popup'
        }
        
        response = self.client.post('/api/reviews/create/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Review.objects.filter(interaction=self.interaction).exists())
        
        review = Review.objects.get(interaction=self.interaction)
        self.assertEqual(review.general_rating, 4)
        self.assertEqual(review.reviewer, self.customer_user)
        self.assertEqual(review.business, self.provider_profile)
    
    def test_create_review_validation_error(self):
        """Test review creation with validation errors"""
        self.authenticate_user(self.customer_user)
        
        # Try to create review with no content
        data = {
            'interaction_id': str(self.interaction.id),
            'review_source': 'popup'
        }
        
        response = self.client.post('/api/reviews/create/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_review_permission_denied(self):
        """Test review creation permission for providers"""
        self.authenticate_user(self.provider_user)
        
        data = {
            'interaction_id': str(self.interaction.id),
            'general_rating': 4,
            'general_comment': 'Test review'
        }
        
        response = self.client.post('/api/reviews/create/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_business_reviews(self):
        """Test business owner viewing their reviews"""
        # Create a review first
        review = Review.objects.create(
            interaction=self.interaction,
            reviewer=self.customer_user,
            general_rating=5,
            general_comment='Excellent service!',
            status='active'
        )
        
        self.authenticate_user(self.provider_user)
        response = self.client.get('/api/business/reviews/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']['reviews']), 1)
        self.assertEqual(data['results']['reviews'][0]['id'], str(review.id))
    
    def test_business_review_stats(self):
        """Test business review statistics"""
        # Create multiple reviews
        for rating in [5, 4, 4, 3, 5]:
            Review.objects.create(
                interaction=self.interaction,
                reviewer=self.customer_user,
                general_rating=rating,
                status='active'
            )
        
        self.authenticate_user(self.provider_user)
        response = self.client.get('/api/business/reviews/stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        stats = data['stats']
        
        self.assertEqual(stats['total_reviews'], 5)
        self.assertAlmostEqual(float(stats['average_rating']), 4.2, places=1)
    
    def test_admin_moderation(self):
        """Test admin review moderation"""
        # Create a review
        review = Review.objects.create(
            interaction=self.interaction,
            reviewer=self.customer_user,
            general_rating=2,
            general_comment='This review needs moderation',
            status='active'
        )
        
        self.authenticate_user(self.admin_user)
        
        # Flag the review
        moderation_data = {
            'action': 'flag',
            'reason': 'Inappropriate content',
            'moderation_notes': 'Flagged for review by admin'
        }
        
        response = self.client.post(
            f'/api/admin/reviews/{review.id}/moderate/',
            moderation_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check review status was updated
        review.refresh_from_db()
        self.assertEqual(review.status, 'flagged')
        self.assertEqual(review.moderated_by, self.admin_user)
        
        # Check moderation log was created
        self.assertTrue(
            ReviewModerationLog.objects.filter(
                review=review,
                action='flag',
                moderator=self.admin_user
            ).exists()
        )
    
    def test_update_review(self):
        """Test updating an existing review"""
        review = Review.objects.create(
            interaction=self.interaction,
            reviewer=self.customer_user,
            general_rating=3,
            general_comment='Original comment',
            status='active'
        )
        
        self.authenticate_user(self.customer_user)
        
        update_data = {
            'general_rating': 4,
            'general_comment': 'Updated comment',
            'food_review': 'Added food review'
        }
        
        response = self.client.put(
            f'/api/reviews/{review.id}/update/',
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        review.refresh_from_db()
        self.assertEqual(review.general_rating, 4)
        self.assertEqual(review.general_comment, 'Updated comment')
        self.assertEqual(review.food_review, 'Added food review')
    
    def test_review_stats_calculation(self):
        """Test business review statistics calculation"""
        stats = BusinessReviewStats.objects.create(business=self.provider_profile)
        
        # Create reviews with different ratings
        ratings = [5, 5, 4, 4, 3, 2, 1]
        for rating in ratings:
            Review.objects.create(
                interaction=self.interaction,
                reviewer=self.customer_user,
                general_rating=rating,
                status='active'
            )
        
        # Recalculate stats
        stats.recalculate_stats()
        
        self.assertEqual(stats.total_reviews, 7)
        self.assertEqual(stats.rating_5_count, 2)
        self.assertEqual(stats.rating_4_count, 2)
        self.assertEqual(stats.rating_3_count, 1)
        self.assertEqual(stats.rating_2_count, 1)
        self.assertEqual(stats.rating_1_count, 1)
        self.assertEqual(stats.highest_rating, 5)
        self.assertEqual(stats.lowest_rating, 1)
        
        expected_avg = sum(ratings) / len(ratings)
        self.assertAlmostEqual(float(stats.average_rating), expected_avg, places=2)


class ReviewModelTestCase(TestCase):
    def setUp(self):
        self.customer_user = User.objects.create_user(
            username='customer@test.com',
            email='customer@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.provider_user = User.objects.create_user(
            username='provider@test.com',
            email='provider@test.com',
            password='testpass123',
            user_type='provider'
        )
        
        self.provider_profile = FoodProviderProfile.objects.create(
            user=self.provider_user,
            business_name='Test Restaurant',
            business_address='123 Test St',
            business_contact='+1234567890',
            business_email='business@test.com',
            status='verified'
        )
        
        self.interaction = Interaction.objects.create(
            user=self.customer_user,
            business=self.provider_profile,
            interaction_type='Purchase',
            quantity=1,
            total_amount=15.00,
            status='completed'
        )
    
    def test_review_creation(self):
        """Test review model creation and properties"""
        review = Review.objects.create(
            interaction=self.interaction,
            reviewer=self.customer_user,
            general_rating=4,
            general_comment='Good food',
            food_review='Tasty pizza',
            business_review='Clean restaurant'
        )
        
        self.assertEqual(review.reviewer, self.customer_user)
        self.assertEqual(review.business, self.provider_profile)
        self.assertEqual(review.status, 'active')
        self.assertTrue(review.is_visible)
        self.assertTrue(review.has_content)
        
        # Test string representation
        expected_str = f"Review by {self.customer_user.email} for {self.provider_profile.business_name} - 4★"
        self.assertEqual(str(review), expected_str)
    
    def test_review_validation(self):
        """Test review validation for empty content"""
        from django.core.exceptions import ValidationError
        
        review = Review(
            interaction=self.interaction,
            reviewer=self.customer_user
        )
        
        with self.assertRaises(ValidationError):
            review.clean()
    
    def test_review_caching(self):
        """Test that interaction data is cached in review"""
        review = Review.objects.create(
            interaction=self.interaction,
            reviewer=self.customer_user,
            general_rating=3,
            general_comment='Test review'
        )
        
        self.assertEqual(review.interaction_type, 'Purchase')
        self.assertEqual(review.interaction_total_amount, 15.00)
        self.assertEqual(review.business, self.provider_profile)


if __name__ == '__main__':
    import django
    django.setup()
    
    # Run specific test
    from django.test.utils import get_runner
    from django.conf import settings
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(["reviews.tests"])