from rest_framework.test import APIClient
from rest_framework import status
from django.test import TestCase
from authentication.models import FoodProviderProfile
from food_listings.models import FoodListing
from interactions.models import Interaction, InteractionItem, Order
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse

User = get_user_model()

class AcceptRejectDonationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.business_user = User.objects.create_user(username="provider",email="provider@example.com", password="pass", user_type="provider")
        self.provider_profile = FoodProviderProfile.objects.create(user=self.business_user, business_name="Test Shop")

        self.ngo_user = User.objects.create_user(username='ngo', email="ngo@example.com", password="pass", user_type="ngo")
        self.food_listing = FoodListing.objects.create(
            provider=self.business_user,
            name="Carrots",
            description='Yummy carrots',
            food_type='ingredients',
            quantity=15,
            quantity_available=5,
            original_price=20.00,
            discounted_price=0.00,
            expiry_date=timezone.now().date(),
            pickup_window="10-12",
            images='url.jpeg',
            allergens = 'nothing',
            dietary_info= 'vegan',
            status='active'
        )

        self.interaction = Interaction.objects.create(
            user=self.ngo_user,
            business=self.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION,
            quantity=2,
            total_amount=0.00
        )

        InteractionItem.objects.create(
            interaction=self.interaction,
            food_listing=self.food_listing,
            name=self.food_listing.name,
            quantity=2,
            price_per_item=0.00,
            total_price=0.00,
            expiry_date=self.food_listing.expiry_date
        )

        Order.objects.create(
            interaction=self.interaction,
            pickup_window=self.food_listing.pickup_window,
            pickup_code="ABC123"
        )

        self.client.force_authenticate(user=self.business_user)

    def test_accept_donation_success(self):
        url = reverse("donation-accept", args=[str(self.interaction.id)])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.interaction.refresh_from_db()
        self.assertEqual(self.interaction.status, Interaction.Status.READY_FOR_PICKUP)

    # def test_accept_donation_insufficient_quantity(self):
    #     self.interaction.items.first().quantity = 10
    #     self.interaction.items.first().save()

    #     self.food_listing.quantity_available = 5
    #     self.food_listing.save()

    #     url = reverse("donation-accept", args=[str(self.interaction.id)])
    #     response = self.client.post(url)
    #     self.assertEqual(response.status_code, 400)

    def test_reject_donation_success(self):
        url = reverse("donation-reject", args=[str(self.interaction.id)])
        payload = {"rejectionReason": "Out of stock"}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, 200)
        self.interaction.refresh_from_db()
        self.assertEqual(self.interaction.status, Interaction.Status.REJECTED)
        self.assertEqual(self.interaction.rejection_reason, "Out of stock")

    def test_reject_donation_invalid_status(self):
        self.interaction.status = Interaction.Status.REJECTED
        self.interaction.rejection_reason = "Already rejected"
        self.interaction.save()
        url = reverse("donation-reject", args=[str(self.interaction.id)])
        payload = {"rejectionReason": "Too late"}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, 400)
