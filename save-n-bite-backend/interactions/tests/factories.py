# interactions/tests/factories.py

import factory
from factory.django import DjangoModelFactory
from factory import Faker, SubFactory, LazyAttribute
from django.contrib.auth import get_user_model
from decimal import Decimal
import uuid

from authentication.models import FoodProviderProfile, CustomerProfile, NGOProfile
from food_listings.models import FoodListing
from interactions.models import (
    Cart, CartItem, Interaction, Order, Payment, 
    InteractionItem, PickupDetails, InteractionStatusHistory
)

User = get_user_model()


class UserFactory(DjangoModelFactory):
    """Factory for creating User instances"""
    
    class Meta:
        model = User
    
    username = Faker('user_name')
    email = Faker('email')
    user_type = 'customer'
    role = 'normal'
    admin_rights = False
    
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        if not create:
            return
        
        password = extracted or 'testpass123'
        self.set_password(password)
        self.save()


class CustomerUserFactory(UserFactory):
    """Factory for creating Customer users"""
    user_type = 'customer'


class ProviderUserFactory(UserFactory):
    """Factory for creating Provider users"""
    user_type = 'provider'


class NGOUserFactory(UserFactory):
    """Factory for creating NGO users"""
    user_type = 'ngo'


class CustomerProfileFactory(DjangoModelFactory):
    """Factory for creating CustomerProfile instances"""
    
    class Meta:
        model = CustomerProfile
    
    user = SubFactory(CustomerUserFactory)
    full_name = Faker('name')


class FoodProviderProfileFactory(DjangoModelFactory):
    """Factory for creating FoodProviderProfile instances"""
    
    class Meta:
        model = FoodProviderProfile
    
    user = SubFactory(ProviderUserFactory)
    business_name = Faker('company')
    business_address = Faker('address')
    business_contact = Faker('phone_number')
    business_email = Faker('company_email')
    status = 'verified'


class NGOProfileFactory(DjangoModelFactory):
    """Factory for creating NGOProfile instances"""
    
    class Meta:
        model = NGOProfile
    
    user = SubFactory(NGOUserFactory)
    organisation_name = Faker('company')
    organisation_contact = Faker('phone_number')
    organisation_email = Faker('company_email')
    representative_name = Faker('name')
    representative_email = Faker('email')
    address_line1 = Faker('street_address')
    city = Faker('city')
    province_or_state = Faker('state')
    postal_code = Faker('postcode')
    country = 'South Africa'
    status = 'verified'


class FoodListingFactory(DjangoModelFactory):
    """Factory for creating FoodListing instances"""
    
    class Meta:
        model = FoodListing
    
    name = Faker('word')
    description = Faker('text', max_nb_chars=200)
    food_type = factory.Iterator(['ready_to_eat', 'ingredients', 'baked_goods'])
    original_price = factory.LazyFunction(lambda: Decimal(str(factory.Faker('pydecimal', left_digits=2, right_digits=2, positive=True).generate({}))))
    discounted_price = LazyAttribute(lambda obj: obj.original_price * Decimal('0.8'))
    quantity = Faker('random_int', min=1, max=20)
    quantity_available = LazyAttribute(lambda obj: obj.quantity)
    expiry_date = Faker('future_date', end_date='+30d')
    pickup_window = '17:00-19:00'
    status = 'active'
    provider = SubFactory(ProviderUserFactory)
    
    @factory.post_generation
    def setup_provider_profile(self, create, extracted, **kwargs):
        if not create:
            return
        
        if not hasattr(self.provider, 'provider_profile'):
            FoodProviderProfileFactory(user=self.provider)


class CartFactory(DjangoModelFactory):
    """Factory for creating Cart instances"""
    
    class Meta:
        model = Cart
    
    user = SubFactory(CustomerUserFactory)
    
    @factory.post_generation
    def setup_user_profile(self, create, extracted, **kwargs):
        if not create:
            return
        
        if not hasattr(self.user, 'customer_profile'):
            CustomerProfileFactory(user=self.user)


class CartItemFactory(DjangoModelFactory):
    """Factory for creating CartItem instances"""
    
    class Meta:
        model = CartItem
    
    cart = SubFactory(CartFactory)
    food_listing = SubFactory(FoodListingFactory)
    quantity = Faker('random_int', min=1, max=5)


class InteractionFactory(DjangoModelFactory):
    """Factory for creating Interaction instances"""
    
    class Meta:
        model = Interaction
    
    interaction_type = factory.Iterator(['Purchase', 'Donation'])
    quantity = Faker('random_int', min=1, max=10)
    status = 'pending'
    total_amount = factory.LazyFunction(lambda: Decimal(str(factory.Faker('pydecimal', left_digits=2, right_digits=2, positive=True).generate({}))))
    verification_code = factory.LazyFunction(lambda: str(uuid.uuid4())[:8])
    special_instructions = Faker('text', max_nb_chars=100)
    user = SubFactory(CustomerUserFactory)
    business = SubFactory(FoodProviderProfileFactory)
    
    @factory.post_generation
    def setup_profiles(self, create, extracted, **kwargs):
        if not create:
            return
        
        # Ensure user has customer profile
        if not hasattr(self.user, 'customer_profile'):
            CustomerProfileFactory(user=self.user)


class OrderFactory(DjangoModelFactory):
    """Factory for creating Order instances"""
    
    class Meta:
        model = Order
    
    interaction = SubFactory(InteractionFactory)
    status = 'pending'
    pickup_window = '17:00-19:00'
    pickup_code = factory.LazyFunction(lambda: str(uuid.uuid4())[:6].upper())


class PaymentFactory(DjangoModelFactory):
    """Factory for creating Payment instances"""
    
    class Meta:
        model = Payment
    
    interaction = SubFactory(InteractionFactory)
    method = factory.Iterator(['card', 'cash', 'digital_wallet'])
    amount = LazyAttribute(lambda obj: obj.interaction.total_amount)
    status = 'pending'
    details = factory.Dict({
        'payment_reference': factory.Faker('uuid4'),
        'gateway': 'test_gateway'
    })


class InteractionItemFactory(DjangoModelFactory):
    """Factory for creating InteractionItem instances"""
    
    class Meta:
        model = InteractionItem
    
    interaction = SubFactory(InteractionFactory)
    food_listing = SubFactory(FoodListingFactory)
    name = LazyAttribute(lambda obj: obj.food_listing.name)
    quantity = Faker('random_int', min=1, max=5)
    price_per_item = LazyAttribute(lambda obj: obj.food_listing.discounted_price)
    total_price = LazyAttribute(lambda obj: obj.quantity * obj.price_per_item)
    expiry_date = LazyAttribute(lambda obj: obj.food_listing.expiry_date)
    image_url = Faker('image_url')


class PickupDetailsFactory(DjangoModelFactory):
    """Factory for creating PickupDetails instances"""
    
    class Meta:
        model = PickupDetails
    
    order = SubFactory(OrderFactory)
    scheduled_time = Faker('future_datetime', end_date='+7d')
    location = Faker('address')
    contact_person = Faker('name')
    contact_number = Faker('phone_number')
    is_completed = False
    notes = Faker('text', max_nb_chars=100)


class InteractionStatusHistoryFactory(DjangoModelFactory):
    """Factory for creating InteractionStatusHistory instances"""
    
    class Meta:
        model = InteractionStatusHistory
    
    Interaction = SubFactory(InteractionFactory)
    old_status = 'pending'
    new_status = 'confirmed'
    changed_by = SubFactory(UserFactory)
    notes = Faker('text', max_nb_chars=100)


# Helper factory combinations for common test scenarios

class CompleteOrderFactory(OrderFactory):
    """Factory for creating a complete order with all related objects"""
    
    @factory.post_generation
    def create_complete_order(self, create, extracted, **kwargs):
        if not create:
            return
        
        # Create payment
        PaymentFactory(interaction=self.interaction)
        
        # Create interaction items
        InteractionItemFactory.create_batch(2, interaction=self.interaction)
        
        # Create pickup details
        PickupDetailsFactory(order=self)


class CartWithItemsFactory(CartFactory):
    """Factory for creating a cart with items"""
    
    @factory.post_generation
    def create_items(self, create, extracted, **kwargs):
        if not create:
            return
        
        # Create 2-4 cart items
        num_items = extracted or 3
        CartItemFactory.create_batch(num_items, cart=self)


class CompletedInteractionFactory(InteractionFactory):
    """Factory for creating a completed interaction"""
    status = 'completed'
    
    @factory.post_generation
    def complete_interaction(self, create, extracted, **kwargs):
        if not create:
            return
        
        # Set completed timestamp
        from django.utils import timezone
        self.completed_at = timezone.now()
        self.save()
        
        # Create related objects
        PaymentFactory(interaction=self, status='completed')
        OrderFactory(interaction=self, status='completed')
        InteractionItemFactory.create_batch(2, interaction=self)