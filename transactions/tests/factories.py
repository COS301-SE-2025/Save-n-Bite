# transactions/tests/factories.py
import uuid
from decimal import Decimal
from datetime import datetime, timedelta
import factory
from django.contrib.auth import get_user_model
from authentication.models import CustomerProfile, FoodProviderProfile, NGOProfile
from food_listings.models import FoodListing
from transactions.models import (
    Transaction, Cart, CartItem, Order, Payment,
    TransactionItem, PickupDetails, TransactionStatusHistory
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
    business_contact = factory.Faker('phone_number')
    business_email = factory.LazyAttribute(lambda obj: f"{obj.user.username}@business.com")
    status = 'verified'

class NGOProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = NGOProfile

    user = factory.SubFactory(UserFactory, user_type='ngo')
    organisation_name = factory.Faker('company')
    organisation_contact = factory.Faker('phone_number')
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

class TransactionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Transaction

    transaction_type = 'Purchase'
    quantity = 2
    status = 'pending'
    total_amount = Decimal('15.00')
    user = factory.SubFactory(UserFactory, user_type='customer')
    business = factory.SubFactory(FoodProviderProfileFactory)

class TransactionItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TransactionItem

    transaction = factory.SubFactory(TransactionFactory)
    food_listing = factory.SubFactory(FoodListingFactory)
    name = factory.LazyAttribute(lambda obj: obj.food_listing.name)
    quantity = 2
    price_per_item = factory.LazyAttribute(lambda obj: obj.food_listing.discounted_price)
    total_price = factory.LazyAttribute(lambda obj: obj.quantity * obj.price_per_item)
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

    transaction = factory.SubFactory(TransactionFactory)
    status = 'pending'
    pickup_window = '15:00-17:00'
    pickup_code = factory.LazyFunction(lambda: str(uuid.uuid4())[:6].upper())

class PaymentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Payment

    transaction = factory.SubFactory(TransactionFactory)
    method = 'card'
    amount = factory.LazyAttribute(lambda obj: obj.transaction.total_amount)
    status = 'pending'

class PickupDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PickupDetails

    order = factory.SubFactory(OrderFactory)
    scheduled_time = factory.LazyFunction(lambda: datetime.now() + timedelta(days=1))
    location = factory.Faker('street_address')
    contact_person = factory.Faker('name')
    contact_number = factory.Faker('phone_number')

class TransactionStatusHistoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TransactionStatusHistory

    transaction = factory.SubFactory(TransactionFactory)
    old_status = 'pending'
    new_status = 'confirmed'
    changed_by = factory.SubFactory(UserFactory)