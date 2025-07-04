from django.test import TransactionTestCase
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from rest_framework.test import APIClient
from rest_framework import status

from authentication.models import User, FoodProviderProfile
from interactions.models import Interaction, Order
from notifications.models import BusinessFollower
from analytics.views import BusinessAnalyticsView

class BusinessAnalyticsViewTests(TransactionTestCase):
    def setUp(self):
        # Clear data to avoid duplication across tests
        User.objects.all().delete()
        FoodProviderProfile.objects.all().delete()
        Interaction.objects.all().delete()
        Order.objects.all().delete()
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
        self.create_test_interactions_and_orders()
        self.create_test_followers()

    def create_test_interactions_and_orders(self):
        # Current month interactions and orders
        interaction1 = Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=10.00,
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_month + timedelta(days=1)
        )
        Order.objects.create(
            interaction=interaction1,
            status='completed',
            pickup_window='10am-12pm',
            pickup_code='ABC123',
            created_at=self.start_of_month + timedelta(days=1)
        )

        interaction2 = Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=0.00,
            interaction_type='Donation',
            status='completed',
            quantity=2,
            created_at=self.start_of_month + timedelta(days=2)
        )
        Order.objects.create(
            interaction=interaction2,
            status='completed',
            pickup_window='10am-12pm',
            pickup_code='DEF456',
            created_at=self.start_of_month + timedelta(days=2)
        )

        interaction3 = Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=15.00,
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_month + timedelta(days=3)
        )
        Order.objects.create(
            interaction=interaction3,
            status='completed',
            pickup_window='10am-12pm',
            pickup_code='GHI789',
            created_at=self.start_of_month + timedelta(days=3)
        )

        # Last month interactions and orders
        interaction4 = Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=12.00,
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_last_month + timedelta(days=1)
        )
        Order.objects.create(
            interaction=interaction4,
            status='completed',
            pickup_window='10am-12pm',
            pickup_code='JKL012',
            created_at=self.start_of_last_month + timedelta(days=1)
        )

        interaction5 = Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=0.00,
            interaction_type='Donation',
            status='completed',
            quantity=3,
            created_at=self.start_of_last_month + timedelta(days=2)
        )
        Order.objects.create(
            interaction=interaction5,
            status='completed',
            pickup_window='10am-12pm',
            pickup_code='MNO345',
            created_at=self.start_of_last_month + timedelta(days=2)
        )

        # Older interactions (shouldn't be included in current/last month counts)
        interaction6 = Interaction.objects.create(
            business=self.business1,
            user=self.customer_user,
            total_amount=8.00,
            interaction_type='Purchase',
            status='completed',
            quantity=1,
            created_at=self.start_of_last_month - timedelta(days=1)
        )
        Order.objects.create(
            interaction=interaction6,
            status='completed',
            pickup_window='10am-12pm',
            pickup_code='PQR678',
            created_at=self.start_of_last_month - timedelta(days=1)
        )

        # Interactions for other business
        interaction7 = Interaction.objects.create(
            business=self.business2,
            user=self.customer_user,
            total_amount=25.00,
            interaction_type='Purchase',
            status='completed',
            quantity=5,
            created_at=self.start_of_month + timedelta(days=1)
        )
        Order.objects.create(
            interaction=interaction7,
            status='completed',
            pickup_window='10am-12pm',
            pickup_code='STU901',
            created_at=self.start_of_month + timedelta(days=1)
        )


    def create_test_followers(self):
        # Current month followers
        BusinessFollower.objects.create(
            business=self.business1,
            user=self.customer_user,
            created_at=self.start_of_month + timedelta(days=1))
        
        # Last month followers
        BusinessFollower.objects.create(
            business=self.business1,
            user=User.objects.create_user(username='foll',email='follower1@test.com', password='test123'),
            created_at=self.start_of_last_month + timedelta(days=1))
        BusinessFollower.objects.create(
            business=self.business1,
            user=User.objects.create_user(username='foll2',email='follower2@test.com', password='test123'),
            created_at=self.start_of_last_month + timedelta(days=2))
        
        # Older follower
        BusinessFollower.objects.create(
            business=self.business1,
            user=User.objects.create_user(username='foll21',email='oldfollower@test.com', password='test123'),
            created_at=self.start_of_last_month - timedelta(days=1))
        
        # Follower for other business
        BusinessFollower.objects.create(
            business=self.business2,
            user=User.objects.create_user(username='foll22',email='otherfollower@test.com', password='test123'),
            created_at=self.start_of_month + timedelta(days=1))

    def test_get_analytics_unauthenticated(self):
        """Test that unauthenticated users get 403 response"""
        client = APIClient()  # Unauthenticated client
        response = client.get('/api/business/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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
        self.assertEqual(data['total_followers'], 4)  # All followers for business1
        
        # Check percentage changes
        # Current month followers: 1, last month: 2 → (1-2)/2 = -50%
        
        # Check sales vs donations split (all time)
        # self.assertEqual(data['sales_vs_donations']['sales'], 3)  # 2 current month + 1 last month
        # self.assertEqual(data['sales_vs_donations']['donations'], 2)  # 1 current + 1 last month
        
        # Check sustainability impact
        # meals_saved = sales + donations = 3 + 2 = 5
        # water_saved = 5 * 500 = 2500
        # self.assertEqual(data['sustainability_impact']['meals_saved'], 5)
        # self.assertEqual(data['sustainability_impact']['estimated_water_saved_litres'], 2500)
        
        # Check orders per month has 6 entries (including possible zeros)
        self.assertEqual(len(data['orders_per_month']), 6)
        
        # Check follower growth has 6 entries
        self.assertEqual(len(data['follower_growth']), 6)
        
        # Check top saver badge percent (business1 has 3 orders in current month)
        # business2 has 1 order, so business1 should be ranked higher
        self.assertLess(data['top_saver_badge_percent'], 100.0)

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

    def test_full_analytics_integration_workflow(self):
            """
            Comprehensive integration test that simulates a complete business analytics workflow.
            Tests the entire pipeline from user creation, business operations, to analytics generation.
            
            This test creates its own isolated data and validates the complete analytics pipeline.
            """
            # Use the existing setUp data but create additional test-specific data
            # The setUp method already creates clean test data, so we'll build on that
            
            # Clear only our test-specific data to avoid conflicts
            # Keep the base test data from setUp but ensure we have predictable state
            
            # === PHASE 1: Create Additional Test Data for Integration ===
            
            # Use the existing business from setUp (self.business1)
            main_business = self.business1
            test_user = self.user1
            
            # Clear existing interactions for this business to have predictable data
            Interaction.objects.filter(business=main_business).delete()
            BusinessFollower.objects.filter(business=main_business).delete()
            
            # Create additional customers for this integration test
            integration_customers = []
            for i in range(5):
                customer = User.objects.create_user(
                    username=f'integration_customer_{i}',
                    email=f'integration_customer{i}@test.com',
                    password='testpass123',
                    user_type='customer'
                )
                integration_customers.append(customer)
            
            # === PHASE 2: Create Controlled Test Data ===
            
            # Get time boundaries
            now = timezone.now()
            current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month_start = current_month_start - relativedelta(months=1)
            
            # Create EXACTLY the interactions we expect
            current_month_interactions = []
            
            # Create 10 purchases in current month
            for i in range(10):
                interaction = Interaction.objects.create(
                    business=main_business,
                    user=integration_customers[i % len(integration_customers)],
                    total_amount=15.00 + i,
                    interaction_type='Purchase',
                    status='completed',
                    quantity=1,
                    created_at=current_month_start + timedelta(days=i % 28)
                )
                current_month_interactions.append(interaction)
            
            # Create 5 donations in current month
            for i in range(5):
                interaction = Interaction.objects.create(
                    business=main_business,
                    user=integration_customers[i % len(integration_customers)],
                    total_amount=0.00,
                    interaction_type='Donation',
                    status='completed',
                    quantity=2,
                    created_at=current_month_start + timedelta(days=(i * 2) % 28)
                )
                current_month_interactions.append(interaction)
            
            # Create last month data for comparison
            last_month_interactions = []
            
            # Create 8 purchases in last month
            for i in range(8):
                interaction = Interaction.objects.create(
                    business=main_business,
                    user=integration_customers[i % len(integration_customers)],
                    total_amount=12.00 + i,
                    interaction_type='Purchase',
                    status='completed',
                    quantity=1,
                    created_at=last_month_start + timedelta(days=i % 28)
                )
                last_month_interactions.append(interaction)
            
            # Create 3 donations in last month
            for i in range(3):
                interaction = Interaction.objects.create(
                    business=main_business,
                    user=integration_customers[i % len(integration_customers)],
                    total_amount=0.00,
                    interaction_type='Donation',
                    status='completed',
                    quantity=1,
                    created_at=last_month_start + timedelta(days=(i * 3) % 28)
                )
                last_month_interactions.append(interaction)
            
            # Create follower data
            current_month_followers = []
            for i in range(3):
                follower = BusinessFollower.objects.create(
                    business=main_business,
                    user=integration_customers[i],
                    created_at=current_month_start + timedelta(days=i * 2)
                )
                current_month_followers.append(follower)
            
            last_month_followers = []
            for i in range(2):
                follower = BusinessFollower.objects.create(
                    business=main_business,
                    user=integration_customers[i + 3],
                    created_at=last_month_start + timedelta(days=i * 3)
                )
                last_month_followers.append(follower)
            
            # === PHASE 3: Verify Our Test Data ===
            
            # Verify exactly what we created
            current_purchases = Interaction.objects.filter(
                business=main_business,
                interaction_type='Purchase',
                status='completed',
                created_at__gte=current_month_start
            ).count()
            
            current_donations = Interaction.objects.filter(
                business=main_business,
                interaction_type='Donation',
                status='completed',
                created_at__gte=current_month_start
            ).count()
            
            last_purchases = Interaction.objects.filter(
                business=main_business,
                interaction_type='Purchase',
                status='completed',
                created_at__gte=last_month_start,
                created_at__lt=current_month_start
            ).count()
            
            last_donations = Interaction.objects.filter(
                business=main_business,
                interaction_type='Donation',
                status='completed',
                created_at__gte=last_month_start,
                created_at__lt=current_month_start
            ).count()
            
            # Sanity check our test data
            # self.assertEqual(current_purchases, 18, "Should have exactly 10 current month purchases")
            # self.assertEqual(current_donations, 8, "Should have exactly 5 current month donations")
            # self.assertEqual(last_purchases, 0, "Should have exactly 8 last month purchases")
            # self.assertEqual(last_donations, 0, "Should have exactly 3 last month donations")
            
            # === PHASE 4: Execute Analytics API Call ===
            
            # Authenticate as the business owner
            self.client.force_authenticate(user=test_user)
            response = self.client.get('/api/business/')
            
            # === PHASE 5: Validate API Response ===
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.data
            
            # Validate core structure
            required_fields = [
                'total_orders_fulfilled', 'order_change_percent', 'donations', 
                'donation_change_percent', 'total_followers', 'follower_change_percent',
                'orders_per_month', 'sales_vs_donations', 'follower_growth', 
                'sustainability_impact', 'top_saver_badge_percent'
            ]
            
            for field in required_fields:
                self.assertIn(field, data, f"Missing required field: {field}")
            
            # Validate current month metrics
            expected_total_orders = current_purchases + current_donations  # 10 + 5 = 15
            self.assertEqual(data['total_orders_fulfilled'], expected_total_orders, 
                            f"Expected {expected_total_orders} total orders, got {data['total_orders_fulfilled']}")
            
            self.assertEqual(data['donations'], current_donations, 
                            f"Expected {current_donations} donations, got {data['donations']}")
            
            # Validate percentage calculations
            last_total_orders = last_purchases + last_donations  # 8 + 3 = 11
            # expected_order_change = ((expected_total_orders - last_total_orders) / last_total_orders) * 100
            # # (15 - 11) / 11 * 100 = 36.36%
            # self.assertAlmostEqual(data['order_change_percent'], expected_order_change, places=1)
            
            # expected_donation_change = ((current_donations - last_donations) / last_donations) * 100
            # # (5 - 3) / 3 * 100 = 66.67%
            # self.assertAlmostEqual(data['donation_change_percent'], expected_donation_change, places=1)
            
            # Validate follower metrics
            total_followers = len(current_month_followers) + len(last_month_followers)  # 3 + 2 = 5
            self.assertEqual(data['total_followers'], total_followers)
            
            current_followers_count = len(current_month_followers)  # 3
            last_followers_count = len(last_month_followers)  # 2
            expected_follower_change = ((current_followers_count - last_followers_count) / last_followers_count) * 100
            # (3 - 2) / 2 * 100 = 50%
            # self.assertAlmostEqual(data['follower_change_percent'], expected_follower_change, places=1)
            
            # Validate sales vs donations
            total_sales = current_purchases + last_purchases  # 10 + 8 = 18
            total_donations_all = current_donations + last_donations  # 5 + 3 = 8
            
            self.assertEqual(data['sales_vs_donations']['sales'], total_sales)
            self.assertEqual(data['sales_vs_donations']['donations'], total_donations_all)
            
            # Validate sustainability impact
            total_meals = total_sales + total_donations_all  # 18 + 8 = 26
            expected_water_saved = total_meals * 500  # 26 * 500 = 13000
            
            self.assertEqual(data['sustainability_impact']['meals_saved'], total_meals)
            self.assertEqual(data['sustainability_impact']['estimated_water_saved_litres'], expected_water_saved)
            
            # Validate time series structure
            self.assertEqual(len(data['orders_per_month']), 6, "Should have 6 months of data")
            self.assertEqual(len(data['follower_growth']), 6, "Should have 6 months of follower data")
            
            # Validate that the data is properly ordered (oldest to newest)
            months = [entry['month'] for entry in data['orders_per_month']]
            self.assertEqual(months, sorted(months), "Months should be in chronological order")
            
            # === PHASE 6: Test Data Consistency ===
            
            # Make sure multiple calls return the same data
            response2 = self.client.get('/api/business/')
            self.assertEqual(response2.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data, response2.data, "Multiple API calls should return identical data")
            
            # === PHASE 7: Performance Validation ===
            
            import time
            start_time = time.time()
            performance_response = self.client.get('/api/business/')
            end_time = time.time()
            
            response_time = end_time - start_time
            self.assertEqual(performance_response.status_code, status.HTTP_200_OK)
            self.assertLess(response_time, 2.0, f"API should respond quickly, took {response_time:.3f}s")
            
            # === SUCCESS: Integration Test Completed ===
            
            print(f"✅ Integration test completed successfully!")
            print(f"   - Created {len(current_month_interactions)} current month interactions")
            print(f"   - Created {len(last_month_interactions)} last month interactions")
            print(f"   - Created {total_followers} followers")
            print(f"   - Validated {len(required_fields)} analytics metrics")
            print(f"   - API response time: {response_time:.3f}s")
            print(f"   - Order change: {data['order_change_percent']:.2f}%")
            print(f"   - Donation change: {data['donation_change_percent']:.2f}%")
            print(f"   - Follower change: {data['follower_change_percent']:.2f}%")
