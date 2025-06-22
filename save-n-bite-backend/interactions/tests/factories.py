# interactions/tests/factories.py
import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4
import factory
from factory import fuzzy
from django.contrib.auth import get_user_model
from authentication.models import CustomerProfile, FoodProviderProfile, NGOProfile
from food_listings.models import FoodListing
from interactions.models import (
    Interaction, Cart, CartItem, Order, Payment,
    InteractionItem, PickupDetails, InteractionStatusHistory
)

User = get_user_model()

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    username = factory.Sequence(lambda n: f'user{n}')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    user_type = 'customer'
    role = 'normal'

class CustomerProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomerProfile

    user = factory.SubFactory(UserFactory)
    full_name = factory.Faker('name')

class FoodProviderProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FoodProviderProfile

    user = factory.SubFactory(UserFactory, user_type='provider')
    business_name = factory.Faker('company')
    business_address = factory.Faker('street_address')
    business_contact = "0123456789"
    business_email = factory.LazyAttribute(lambda obj: f"{obj.user.username}@business.com")
    status = 'verified'

class NGOProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = NGOProfile

    user = factory.SubFactory(UserFactory, user_type='ngo')
    organisation_name = factory.Faker('company')
    organisation_contact = "0123456789"
    organisation_email = factory.LazyAttribute(lambda obj: f"{obj.user.username}@ngo.org")
    representative_name = factory.Faker('name')
    representative_email = factory.LazyAttribute(lambda obj: f"rep_{obj.user.username}@ngo.org")
    address_line1 = factory.Faker('street_address')
    city = factory.Faker('city')
    province_or_state = factory.Faker('state')
    postal_code = factory.Faker('postcode')
    country = factory.Faker('country')
    status = 'verified'

class FoodListingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FoodListing

    name = factory.Faker('word')
    description = factory.Faker('text', max_nb_chars=200)
    food_type = 'ready_to_eat'
    original_price = Decimal('10.00')
    discounted_price = Decimal('7.50')
    quantity = 10
    quantity_available = 10
    expiry_date = factory.LazyFunction(lambda: datetime.now().date() + timedelta(days=3))
    pickup_window = '17:00-19:00'
    provider = factory.SubFactory(UserFactory, user_type='provider')
    status = 'active'

class InteractionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Interaction

    interaction_type = 'Purchase'
    quantity = 2
    status = 'pending'
    total_amount = 15.0
    verification_code = fuzzy.FuzzyText(length=6)
    user = factory.SubFactory(UserFactory, user_type='customer')
    business = factory.SubFactory(FoodProviderProfileFactory)

    

class InteractionItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InteractionItem

    interaction = factory.SubFactory(InteractionFactory)
    food_listing = factory.SubFactory(FoodListingFactory)
    name = factory.LazyAttribute(lambda obj: obj.food_listing.name)
    quantity = 2
    price_per_item = 7.5
    total_price = quantity * price_per_item
    expiry_date = factory.LazyAttribute(lambda obj: obj.food_listing.expiry_date)

class CartFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Cart

    user = factory.SubFactory(UserFactory, user_type='customer')

class CartItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CartItem

    cart = factory.SubFactory(CartFactory)
    food_listing = factory.SubFactory(FoodListingFactory)
    quantity = 1

class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    id = factory.LazyFunction(uuid4)
    interaction = factory.SubFactory(InteractionFactory)
    status = "pending"
    pickup_window = fuzzy.FuzzyText(length=11, chars='0123456789:- ')  # e.g. "12:00 - 13:00"
    pickup_code = fuzzy.FuzzyText(length=10, chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')

class PaymentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Payment

    interaction = factory.SubFactory(InteractionFactory)
    method = 'card'
    amount = factory.LazyAttribute(lambda obj: obj.interaction.total_amount)
    status = 'pending'

class InteractionStatusHistoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InteractionStatusHistory

    interaction = factory.SubFactory(InteractionFactory)
    old_status = 'pending'
    new_status = 'confirmed'
    changed_by = factory.SubFactory(UserFactory)