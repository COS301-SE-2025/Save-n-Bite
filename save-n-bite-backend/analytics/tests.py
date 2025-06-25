from django.test import TransactionTestCase
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from rest_framework.test import APIClient
from rest_framework import status

from authentication.models import User, FoodProviderProfile
from interactions.models import Interaction
from notifications.models import BusinessFollower
from analytics.views import BusinessAnalyticsView  # Add this import

class BusinessAnalyticsViewTests(TransactionTestCase):
    def setUp(self):
    # Clear data to avoid duplication across tests
        User.objects.all().delete()
        FoodProviderProfile.objects.all().delete()
        Interaction.objects.all().delete()
        BusinessFollower.objects.all().delete()

        self.client = APIClient()

        # Create test users
        self.user1 = User.objects.create_user(
            username='bus',
            email='business1@test.com', 
            password='testpass123',
            user_type='food_provider'
        )
        self.user2 = User.objects.create_user(
            username='busi',
            email='business2@test.com', 
            password='testpass123',
            user_type='food_provider'
        )
        self.customer_user = User.objects.create_user(
            username='cus',
            email='customer@test.com',
            password='testpass123',
            user_type='customer'
        )

    # Create business profiles
        self.business1 = FoodProviderProfile.objects.create(
            user=self.user1,
            business_name="Test Business 1"
        )
        self.business2 = FoodProviderProfile.objects.create(
            user=self.user2,
            business_name="Test Business 2"
        )

        # Authenticate the client
        self.client.force_authenticate(user=self.user1)

        # Get current time and month boundaries
        self.now = timezone.now()
        self.start_of_month = self.now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        self.start_of_last_month = self.start_of_month - relativedelta(months=1)

        # Create test data
        self.create_test_interactions()
        self.create_test_followers()


    def create_test_interactions(self):
        # Current month interactions
        Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,  # Add user field
            total_amount=10.00,  # Add total_amount field
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_month + timedelta(days=1)
        )
        Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=0.00,
            interaction_type='Donation',
            status='completed',
            quantity=2,
            created_at=self.start_of_month + timedelta(days=2)
        )
        Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=15.00,
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_month + timedelta(days=3)
        )
        
        # Last month interactions
        Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=12.00,
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_last_month + timedelta(days=1)
        )
        Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=0.00,
            interaction_type='Donation',
            status='completed',
            quantity=3,
            created_at=self.start_of_last_month + timedelta(days=2)
        )
        
        # Older interactions (shouldn't be included in current/last month counts)
        Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=8.00,
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_last_month - timedelta(days=1)
        )
        
        # Interactions for other business
        Interaction.objects.create(
            business=self.business2,
            user=self.customer_user,
            total_amount=25.00,
            interaction_type='Purchase',
            status='completed',
            quantity=5,
            created_at=self.start_of_month + timedelta(days=1)
        )

    def create_test_followers(self):
        # Current month followers
        BusinessFollower.objects.create(
            business=self.business1,
            user=self.customer_user,
            created_at=self.start_of_month + timedelta(days=1)
        )
        
        # Last month followers
        BusinessFollower.objects.create(
            business=self.business1,
            user=User.objects.create_user(username='foll',email='follower1@test.com', password='test123'),
            created_at=self.start_of_last_month + timedelta(days=1)
        )
        BusinessFollower.objects.create(
            business=self.business1,
            user=User.objects.create_user(username='foll2',email='follower2@test.com', password='test123'),
            created_at=self.start_of_last_month + timedelta(days=2)
        )
        
        # Older follower
        BusinessFollower.objects.create(
            business=self.business1,
            user=User.objects.create_user(username='foll21',email='oldfollower@test.com', password='test123'),
            created_at=self.start_of_last_month - timedelta(days=1)
        )
        
        # Follower for other business
        BusinessFollower.objects.create(
            business=self.business2,
            user=User.objects.create_user(username='foll22',email='otherfollower@test.com', password='test123'),
            created_at=self.start_of_month + timedelta(days=1)
        )

    def test_get_analytics_unauthenticated(self):
        """Test that unauthenticated users get 403 response"""
        client = APIClient()  # Unauthenticated client
        response = client.get('/api/business/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_analytics_without_business_profile(self):
        """Test user without business profile gets 404"""
        user = User.objects.create_user(username='nobus',email='nobusiness@test.com', password='test123')
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/business/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Business profile not found')

    def test_get_analytics_success(self):
        """Test successful analytics retrieval"""
        response = self.client.get('/api/business/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        # Check basic counts
        self.assertEqual(data['total_orders_fulfilled'], 3)  # 2 purchases + 1 donation in current month
        self.assertEqual(data['donations'], 1)  # 1 donation in current month
        self.assertEqual(data['total_followers'], 4)  # All followers for business1
        
        # Check percentage changes
        # Current month orders: 3, last month: 2 → (3-2)/2 = 50%
        self.assertAlmostEqual(data['order_change_percent'], 50.0)
        # Current month donations: 1, last month: 1 → (1-1)/1 = 0%
        self.assertAlmostEqual(data['donation_change_percent'], 0.0)
        # Current month followers: 1, last month: 2 → (1-2)/2 = -50%
        self.assertAlmostEqual(data['follower_change_percent'], -50.0)
        
        # Check sales vs donations split (all time)
        self.assertEqual(data['sales_vs_donations']['sales'], 4)  # 3 current month + 1 last month + 1 older
        self.assertEqual(data['sales_vs_donations']['donations'], 2)  # 1 current + 1 last month
        
        # Check sustainability impact
        # Donations: current month (2) + last month (3) + older (0) = 5 total
        # meals_saved = 5 * 2 = 10
        # water_saved = 10 * 500 = 5000
        self.assertEqual(data['sustainability_impact']['meals_saved'], 10)
        self.assertEqual(data['sustainability_impact']['estimated_water_saved_litres'], 5000)
        
        # Check orders per month has 6 entries (including possible zeros)
        self.assertEqual(len(data['orders_per_month']), 6)
        
        # Check follower growth has 6 entries
        self.assertEqual(len(data['follower_growth']), 6)
        
        # Check top saver badge percent (business1 has 3 orders in current month)
        # business2 has 1 order, so business1 should be ranked higher
        self.assertLess(data['top_saver_badge_percent'], 50.0)  # Should be in top 50%

    def test_percent_change_calculation(self):
        """Test the _percent_change helper method"""
        view = BusinessAnalyticsView()
        
        # Test increase
        self.assertAlmostEqual(view._percent_change(150, 100), 50.0)
        
        # Test decrease
        self.assertAlmostEqual(view._percent_change(50, 100), -50.0)
        
        # Test zero previous (should return 100% if current > 0)
        self.assertAlmostEqual(view._percent_change(10, 0), 100.0)
        
        # Test both zero
        self.assertAlmostEqual(view._percent_change(0, 0), 0.0)

    def test_monthly_orders_data_structure(self):
        """Test the monthly orders data includes all months even with zero counts"""
        response = self.client.get('/api/business/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        monthly_orders = response.data['orders_per_month']
        
        # Should have exactly 6 months of data
        self.assertEqual(len(monthly_orders), 6)
        
        # Check months are in order
        months = [entry['month'] for entry in monthly_orders]
        self.assertEqual(months, sorted(months))
        
        # Check each month has 'month' and 'count' keys
        for entry in monthly_orders:
            self.assertIn('month', entry)
            self.assertIn('count', entry)

    def test_follower_growth_data_structure(self):
        """Test the follower growth data includes all months even with zero counts"""
        response = self.client.get('/api/business/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        follower_growth = response.data['follower_growth']
        
        # Should have exactly 6 months of data
        self.assertEqual(len(follower_growth), 6)
        
        # Check months are in order
        months = [entry['month'] for entry in follower_growth]
        self.assertEqual(months, sorted(months))
        
        # Check each month has 'month' and 'count' keys
        for entry in follower_growth:
            self.assertIn('month', entry)
            self.assertIn('count', entry)

    def test_top_saver_badge_with_multiple_businesses(self):
        """Test top saver badge calculation with multiple businesses"""
        # Create more businesses with different order counts
        user3 = User.objects.create_user(username='bb',email='business3@test.com', password='test123')
        business3 = FoodProviderProfile.objects.create(user=user3, business_name="Business 3")
        
        # Create orders for business3 (more than business1)
        for _ in range(5):
            Interaction.objects.create(
            business=business3,
            user=self.customer_user,              
            total_amount=10.00,                   
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_month + timedelta(days=1)
    )

        
        # Get analytics for business1
        response = self.client.get('/api/business/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # business1 has 3 orders, business2 has 1, business3 has 5
        # Total businesses: 3
        # Rank: business3 (1), business1 (2), business2 (3)
        # Percentile: (2/3)*100 = 66.67
        self.assertAlmostEqual(response.data['top_saver_badge_percent'], 66.67, places=2)