# interactions/tests/test_donation_views.py

import uuid
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from authentication.models import FoodProviderProfile
from food_listings.models import FoodListing
from interactions.models import (
    Interaction, InteractionItem, Order
)
from django.contrib.auth import get_user_model

User = get_user_model()

class DonationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.ngo = User.objects.create_user(username="ngo", email="ngo@example.com", password="pass", user_type="ngo")
        self.business_user = User.objects.create_user(username="business", email="business@example.com", password="pass", user_type="provider")
        self.provider_profile = FoodProviderProfile.objects.create(user=self.business_user, business_name="Provider 1")

        # Listing
        self.food_listing = FoodListing.objects.create(
            provider=self.business_user,  # Changed from business_user to provider_profile
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
            allergens='nothing',
            dietary_info='vegan',
            status='active'
        )

        self.client.force_authenticate(user=self.ngo)

    def test_donation_request_success(self):
        url = reverse("donation-request")
        payload = {
            "listingId": str(self.food_listing.id),
            "quantity": 2,
            "specialInstructions": "Keep fresh",
            "motivationMessage": "We need this for soup kitchen",
            "verificationDocuments": ["http://example.com/doc1"]
        }

        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        interaction_id = response.data["interaction_id"]
        self.assertTrue(Interaction.objects.filter(id=interaction_id).exists())
        self.assertEqual(Order.objects.count(), 1)

    def test_donation_request_invalid_quantity(self):
        url = reverse("donation-request")
        payload = {
            "listingId": str(self.food_listing.id),
            "quantity": 0
        }
        response = self.client.post(url, payload, format="json")  # Added format="json"
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_donation_request_exceeding_quantity(self):
        url = reverse("donation-request")
        payload = {
            "listingId": str(self.food_listing.id),
            "quantity": 20
        }
        response = self.client.post(url, payload, format="json")  # Added format="json"
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_donation_request_non_ngo_forbidden(self):
        self.client.force_authenticate(user=self.business_user)
        url = reverse("donation-request")
        payload = {
            "listingId": str(self.food_listing.id),
            "quantity": 1
        }
        response = self.client.post(url, payload, format="json")  # Added format="json"
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)