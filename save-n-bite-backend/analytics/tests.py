from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from authentication.models import User, FoodProviderProfile
from interactions.models import Interaction
from notifications.models import BusinessFollower

class BusinessAnalyticsTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(email='biz@example.com', password='password123')
        self.other_user = User.objects.create_user(email='other@example.com', password='password123')

        self.business = FoodProviderProfile.objects.create(user=self.user, business_name="Biz 1")
        self.other_business = FoodProviderProfile.objects.create(user=self.other_user, business_name="Biz 2")

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        now = timezone.now()
        start_of_month = now.replace(day=1)
        last_month = start_of_month - timedelta(days=1)

        # This month (biz 1)
        Interaction.objects.create(
            interaction_type='Purchase',
            quantity=5,
            total_amount=50,
            status='completed',
            created_at=now,
            user=self.user,
            business=self.business
        )
        Interaction.objects.create(
            interaction_type='Donation',
            quantity=2,
            total_amount=0,
            status='completed',
            created_at=now,
            user=self.user,
            business=self.business
        )

        # Last month (biz 1)
        Interaction.objects.create(
            interaction_type='Purchase',
            quantity=3,
            total_amount=30,
            status='completed',
            created_at=last_month,
            user=self.user,
            business=self.business
        )

        # Interactions for another business (should not affect results)
        Interaction.objects.create(
            interaction_type='Donation',
            quantity=100,
            total_amount=0,
            status='completed',
            created_at=now,
            user=self.other_user,
            business=self.other_business
        )

        # Follower for business
        BusinessFollower.objects.create(
            user=self.user,
            business=self.business,
            created_at=now
        )

    def test_response_status(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_total_orders_fulfilled(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertEqual(response.data['total_orders_fulfilled'], 2)

    def test_order_change_percent(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertEqual(response.data['order_change_percent'], -33.33)

    def test_donations_count(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertEqual(response.data['donations'], 1)

    def test_donation_change_percent(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertEqual(response.data['donation_change_percent'], -100.0)

    def test_follower_metrics(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertEqual(response.data['total_followers'], 1)
        self.assertEqual(response.data['follower_change_percent'], 100.0)

    def test_orders_per_month(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertTrue(isinstance(response.data['orders_per_month'], list))
        self.assertGreaterEqual(len(response.data['orders_per_month']), 1)

    def test_sales_vs_donations_split(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertEqual(response.data['sales_vs_donations']['sales'], 2)
        self.assertEqual(response.data['sales_vs_donations']['donations'], 1)

    def test_follower_growth_structure(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertTrue(isinstance(response.data['follower_growth'], list))
        self.assertGreaterEqual(len(response.data['follower_growth']), 1)

    def test_sustainability_impact(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertEqual(response.data['sustainability_impact']['meals_saved'], 7)
        self.assertEqual(response.data['sustainability_impact']['estimated_water_saved_litres'], 3500)

    def test_top_saver_badge(self):
        response = self.client.get(reverse('business-analytics'))
        self.assertIn('top_saver_badge_percent', response.data)
        self.assertTrue(isinstance(response.data['top_saver_badge_percent'], float))
