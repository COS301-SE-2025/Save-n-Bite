# interactions/tests/test_donation_model.py

import pytest
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from interactions.models import Interaction, InteractionItem
from food_listings.models import FoodListing
from authentication.models import FoodProviderProfile
from django.utils import timezone
from decimal import Decimal

User = get_user_model()

@pytest.mark.django_db
class TestDonationModel:
    def setup_method(self):
        self.ngo_user = User.objects.create_user(username="ngo_user", password="password")
        self.provider_user = User.objects.create_user(username="provider_user", password="password")
        self.provider_profile, created = FoodProviderProfile.objects.get_or_create(
            user=self.provider_user,
            defaults={
                'business_name': 'Fresh Foods',
                'business_address': '123 Test St',
                'business_contact': '+1234567890',
                'business_email': 'business@test.com',
                'cipc_document': 'test_doc.pdf',
                'status': 'verified'
            }
        )

        self.food_listing = FoodListing.objects.create(
            provider=self.provider_profile,
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

    # def test_create_donation_request(self):
    #     interaction = Interaction.objects.create(
    #         interaction_type=Interaction.InteractionType.DONATION,
    #         user=self.ngo_user,
    #         business=self.provider_profile,
    #         status=Interaction.Status.PENDING,
    #         total_amount=Decimal('0.00'),
    #         motivation_message="Helping our shelter",
    #         verification_documents=["doc1.pdf"]
    #     )
        
    #     # Create associated interaction item
    #     InteractionItem.objects.create(
    #         interaction=interaction,
    #         food_listing=self.food_listing,
    #         name=self.food_listing.name,
    #         quantity=1,
    #         price_per_item=self.food_listing.discounted_price,
    #         total_price=self.food_listing.discounted_price,
    #         expiry_date=self.food_listing.expiry_date,
    #         image_url=self.food_listing.images
    #     )

    #     assert interaction.status == "pending"
    #     assert interaction.rejection_reason == ""
    #     assert interaction.interaction_type == "Donation"
    #     assert interaction.items.count() == 1

    # def test_accept_donation_request(self):
    #     interaction = Interaction.objects.create(
    #         interaction_type=Interaction.InteractionType.DONATION,
    #         user=self.ngo_user,
    #         business=self.provider_profile,
    #         status=Interaction.Status.PENDING,
    #         total_amount=Decimal('0.00'),
    #         motivation_message="Helping our shelter"
    #     )

    #     interaction.status = Interaction.Status.READY_FOR_PICKUP
    #     interaction.special_instructions = "Pickup at 10AM tomorrow"
    #     interaction.save()

    #     updated = Interaction.objects.get(id=interaction.id)
    #     assert updated.status == "ready"
    #     assert updated.special_instructions == "Pickup at 10AM tomorrow"

    # def test_reject_donation_request(self):
    #     interaction = Interaction.objects.create(
    #         interaction_type=Interaction.InteractionType.DONATION,
    #         user=self.ngo_user,
    #         business=self.provider_profile,
    #         status=Interaction.Status.PENDING,
    #         total_amount=Decimal('0.00'),
    #         motivation_message="Helping our shelter"
    #     )

    #     interaction.status = Interaction.Status.REJECTED
    #     interaction.rejection_reason = "Expired listing"
    #     interaction.save()

    #     updated = Interaction.objects.get(id=interaction.id)
    #     assert updated.status == "rejected"
    #     assert updated.rejection_reason == "Expired listing"

    # def test_missing_required_fields_raises_error(self):
    #     with pytest.raises(ValidationError):
    #         bad_interaction = Interaction(
    #             interaction_type=Interaction.InteractionType.DONATION,
    #             user=self.ngo_user,
    #             business=self.provider_profile,
    #             status=Interaction.Status.PENDING,
    #             total_amount=None  # Required
    #         )
    #         bad_interaction.full_clean()  # Triggers model validation

    # def test_donation_with_items(self):
    #     interaction = Interaction.objects.create(
    #         interaction_type=Interaction.InteractionType.DONATION,
    #         user=self.ngo_user,
    #         business=self.provider_profile,
    #         status=Interaction.Status.PENDING,
    #         total_amount=Decimal('0.00'),
    #         motivation_message="Helping our shelter"
    #     )
        
    #     item = InteractionItem.objects.create(
    #         interaction=interaction,
    #         food_listing=self.food_listing,
    #         name=self.food_listing.name,
    #         quantity=2,
    #         price_per_item=self.food_listing.discounted_price,
    #         total_price=self.food_listing.discounted_price * 2,
    #         expiry_date=self.food_listing.expiry_date,
    #         image_url=self.food_listing.images
    #     )

    #     assert interaction.items.count() == 1
    #     assert float(interaction.items.first().total_price) == 0.00
    #     assert interaction.items.first().quantity == 2