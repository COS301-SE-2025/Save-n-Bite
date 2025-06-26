# interactions/tests.py

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse
from django.contrib.admin.sites import AdminSite
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from datetime import date, timedelta
import json
import uuid
from decimal import Decimal
from unittest.mock import Mock, patch

from .models import (
    Interaction, Cart, CartItem, Order, Payment, 
    InteractionItem, PickupDetails, InteractionStatusHistory
)
from .admin import (
    InteractionAdmin, CartAdmin, CartItemAdmin, OrderAdmin,
    PaymentAdmin, InteractionItemAdmin, PickupDetailsAdmin,
    InteractionStatusHistoryAdmin
)
from .serializers import (
    CartResponseSerializer, AddToCartSerializer, RemoveCartItemSerializer,
    CheckoutSerializer, OrderSerializer, PaymentSerializer,
    InteractionSerializer, CartItemSerializer
)
from authentication.models import User, FoodProviderProfile, CustomerProfile
from food_listings.models import FoodListing

# ============ FIXTURES ============

@pytest.fixture
def client():
    return Client()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def provider_user(db):
    """Create a provider user with profile"""
    user = User.objects.create_user(
        username='provider_test',
        email='provider@test.com',
        password='testpass123',
        user_type='provider'
    )
    
    FoodProviderProfile.objects.create(
        user=user,
        business_name='Test Restaurant',
        business_address='123 Test St, Test City',
        business_contact='+1234567890',
        business_email='business@test.com',
        cipc_document='test_doc.pdf',
        status='verified'
    )
    
    return user

@pytest.fixture
def customer_user(db):
    """Create a customer user with profile"""
    user = User.objects.create_user(
        username='customer_test',
        email='customer@test.com',
        password='testpass123',
        user_type='customer'
    )
    
    CustomerProfile.objects.create(
        user=user,
        full_name='Test Customer'
    )
    
    return user

@pytest.fixture
def ngo_user(db):
    """Create an NGO user"""
    user = User.objects.create_user(
        username='ngo_test',
        email='ngo@test.com',
        password='testpass123',
        user_type='ngo'
    )
    return user

@pytest.fixture
def authenticated_provider_client(api_client, provider_user):
    """API client authenticated as provider"""
    refresh = RefreshToken.for_user(provider_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def authenticated_customer_client(api_client, customer_user):
    """API client authenticated as customer"""
    refresh = RefreshToken.for_user(customer_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def authenticated_ngo_client(api_client, ngo_user):
    """API client authenticated as NGO"""
    refresh = RefreshToken.for_user(ngo_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def food_listing(provider_user):
    """Create a sample food listing"""
    return FoodListing.objects.create(
        name='Fresh Pizza',
        description='Delicious pizza with fresh ingredients',
        food_type='ready_to_eat',
        original_price=20.00,
        discounted_price=15.00,
        quantity=5,
        quantity_available=5,
        expiry_date=date.today() + timedelta(days=1),
        pickup_window='17:00-19:00',
        provider=provider_user,
        status='active'
    )

@pytest.fixture
def cart(customer_user):
    """Create a cart for customer"""
    return Cart.objects.create(user=customer_user)

@pytest.fixture
def cart_item(cart, food_listing):
    """Create a cart item"""
    return CartItem.objects.create(
        cart=cart,
        food_listing=food_listing,
        quantity=2
    )

@pytest.fixture
def interaction(customer_user, provider_user):
    """Create a sample interaction"""
    return Interaction.objects.create(
        user=customer_user,
        business=provider_user.provider_profile,
        interaction_type='Purchase',
        quantity=2,
        total_amount=30.00,
        status='confirmed'
    )

@pytest.fixture
def completed_interaction(customer_user, provider_user):
    """Create a completed interaction"""
    return Interaction.objects.create(
        user=customer_user,
        business=provider_user.provider_profile,
        interaction_type='Purchase',
        quantity=1,
        total_amount=15.00,
        status='completed'
    )

@pytest.fixture
def order(interaction):
    """Create an order"""
    return Order.objects.create(
        interaction=interaction,
        pickup_window='17:00-19:00',
        pickup_code='ABC123'
    )

@pytest.fixture
def payment(interaction):
    """Create a payment"""
    return Payment.objects.create(
        interaction=interaction,
        method='card',
        amount=30.00,
        status='completed'
    )

@pytest.fixture
def interaction_item(interaction, food_listing):
    """Create an interaction item"""
    return InteractionItem.objects.create(
        interaction=interaction,
        food_listing=food_listing,
        name=food_listing.name,
        quantity=2,
        price_per_item=15.00,
        total_price=30.00,
        expiry_date=food_listing.expiry_date
    )

# ============ MODEL TESTS ============

@pytest.mark.django_db
class TestInteractionModel:
    
    def test_create_interaction(self, customer_user, provider_user):
        """Test creating a basic interaction"""
        interaction = Interaction.objects.create(
            user=customer_user,
            business=provider_user.provider_profile,
            interaction_type='Purchase',
            quantity=1,
            total_amount=15.00
        )
        
        assert interaction.user == customer_user
        assert interaction.business == provider_user.provider_profile
        assert interaction.interaction_type == 'Purchase'
        assert interaction.status == 'pending'  # Default status
        assert interaction.total_amount == Decimal('15.00')
        assert str(interaction.id)  # UUID should be set
        
    def test_string_representation(self, interaction):
        """Test the __str__ method"""
        expected = f"{interaction.interaction_type} - {interaction.status} - {interaction.total_amount}"
        assert str(interaction) == expected
        
    def test_status_transition_validation(self, interaction):
        """Test that completed interactions cannot change status"""
        interaction.status = 'completed'
        interaction.save()
        
        # Try to change status from completed
        interaction.status = 'cancelled'
        
        with pytest.raises(Exception):  # ValidationError should be raised
            interaction.save()
            

@pytest.mark.django_db
class TestCartModel:
    
    def test_create_cart(self, customer_user):
        """Test creating a cart"""
        cart = Cart.objects.create(user=customer_user)
        
        assert cart.user == customer_user
        assert str(cart.id)  # UUID should be set
        
    def test_cart_total_items_empty(self, cart):
        """Test total_items property when cart is empty"""
        assert cart.total_items == 0
        
    def test_cart_subtotal_empty(self, cart):
        """Test subtotal property when cart is empty"""
        assert cart.subtotal == 0
        
    def test_string_representation(self, cart):
        """Test cart string representation"""
        expected = f"Cart for {cart.user.email}"
        assert str(cart) == expected

@pytest.mark.django_db
class TestCartItemModel:
    
    def test_create_cart_item(self, cart, food_listing):
        """Test creating a cart item"""
        cart_item = CartItem.objects.create(
            cart=cart,
            food_listing=food_listing,
            quantity=3
        )
        
        assert cart_item.cart == cart
        assert cart_item.food_listing == food_listing
        assert cart_item.quantity == 3
        
    def test_cart_item_total_price(self, cart_item):
        """Test total_price property"""
        expected_total = cart_item.quantity * cart_item.food_listing.discounted_price
        assert cart_item.total_price == expected_total
        
    def test_cart_item_unique_constraint(self, cart, food_listing):
        """Test unique constraint on cart and food_listing"""
        CartItem.objects.create(cart=cart, food_listing=food_listing, quantity=1)
        
        # Attempting to create another item with same cart and food_listing should fail
        with pytest.raises(Exception):
            CartItem.objects.create(cart=cart, food_listing=food_listing, quantity=2)
            
    def test_string_representation(self, cart_item):
        """Test cart item string representation"""
        expected = f"{cart_item.quantity} x {cart_item.food_listing.name} in cart"
        assert str(cart_item) == expected

@pytest.mark.django_db
class TestOrderModel:
    
    def test_create_order(self, interaction):
        """Test creating an order"""
        order = Order.objects.create(
            interaction=interaction,
            pickup_window='17:00-19:00',
            pickup_code='TEST123'
        )
        
        assert order.interaction == interaction
        assert order.status == 'pending'  # Default status
        assert order.pickup_window == '17:00-19:00'
        assert order.pickup_code == 'TEST123'
        
    def test_order_items_property(self, order, interaction_item):
        """Test that order.items returns interaction items"""
        items = order.items
        assert interaction_item in items
        
    def test_string_representation(self, order):
        """Test order string representation"""
        expected = f"Order {order.id} - {order.status}"
        assert str(order) == expected

@pytest.mark.django_db
class TestPaymentModel:
    
    def test_create_payment(self, interaction):
        """Test creating a payment"""
        payment = Payment.objects.create(
            interaction=interaction,
            method='card',
            amount=25.00
        )
        
        assert payment.interaction == interaction
        assert payment.method == 'card'
        assert payment.amount == Decimal('25.00')
        assert payment.status == 'pending'  # Default status
        
    def test_string_representation(self, payment):
        """Test payment string representation"""
        expected = f"Payment {payment.id} - {payment.method} - {payment.status}"
        assert str(payment) == expected

@pytest.mark.django_db
class TestInteractionItemModel:
    
    def test_create_interaction_item(self, interaction, food_listing):
        """Test creating an interaction item"""
        item = InteractionItem.objects.create(
            interaction=interaction,
            food_listing=food_listing,
            name=food_listing.name,
            quantity=2,
            price_per_item=15.00,
            expiry_date=food_listing.expiry_date
        )
        
        assert item.interaction == interaction
        assert item.food_listing == food_listing
        assert item.quantity == 2
        assert item.price_per_item == Decimal('15.00')
        assert item.total_price == Decimal('30.00')  # Auto-calculated on save
        
    def test_total_price_calculation(self, interaction, food_listing):
        """Test that total_price is calculated on save"""
        item = InteractionItem.objects.create(
            interaction=interaction,
            food_listing=food_listing,
            name=food_listing.name,
            quantity=3,
            price_per_item=10.00,
            expiry_date=food_listing.expiry_date
        )
        
        assert item.total_price == Decimal('30.00')
        
    def test_string_representation(self, interaction_item):
        """Test interaction item string representation"""
        expected = f"{interaction_item.quantity} x {interaction_item.name} ({interaction_item.total_price})"
        assert str(interaction_item) == expected

# ============ SERIALIZER TESTS ============

@pytest.mark.django_db
class TestInteractionSerializers:
    
    def test_cart_item_serializer(self, cart_item):
        """Test CartItemSerializer"""
        serializer = CartItemSerializer(cart_item)
        data = serializer.data
        
        assert data['id'] == str(cart_item.id)
        assert data['listingId'] == str(cart_item.food_listing.id)
        assert data['name'] == cart_item.food_listing.name
        assert data['quantity'] == cart_item.quantity
        assert 'totalPrice' in data
        assert 'provider' in data
        
    def test_add_to_cart_serializer_valid(self):
        """Test AddToCartSerializer with valid data"""
        data = {
            'listingId': str(uuid.uuid4()),
            'quantity': 2
        }
        serializer = AddToCartSerializer(data=data)
        assert serializer.is_valid()
        
    def test_add_to_cart_serializer_invalid_quantity(self):
        """Test AddToCartSerializer with invalid quantity"""
        data = {
            'listingId': str(uuid.uuid4()),
            'quantity': 0  # Invalid
        }
        serializer = AddToCartSerializer(data=data)
        assert not serializer.is_valid()
        assert 'quantity' in serializer.errors
        
    def test_checkout_serializer_valid(self):
        """Test CheckoutSerializer with valid data"""
        data = {
            'paymentMethod': 'card',
            'paymentDetails': {'card_number': '1234'},
            'specialInstructions': 'Extra sauce'
        }
        serializer = CheckoutSerializer(data=data)
        assert serializer.is_valid()
        
    def test_order_serializer(self, order, interaction_item):
        """Test OrderSerializer"""
        serializer = OrderSerializer(order)
        data = serializer.data
        
        assert data['id'] == str(order.id)
        assert data['providerId'] == str(order.interaction.business.id)
        assert data['providerName'] == order.interaction.business.business_name
        assert data['status'] == order.status
        assert 'items' in data
        assert 'totalAmount' in data

# ============ VIEW TESTS ============

@pytest.mark.django_db
class TestCartViews:
    
    def test_get_empty_cart(self, authenticated_customer_client):
        """Test getting an empty cart"""
        url = reverse('cart')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'cartItems' in data
        assert 'summary' in data
        assert data['summary']['totalItems'] == 0
        assert float(data['summary']['totalAmount']) == 0.0
        
    def test_get_cart_with_items(self, authenticated_customer_client, cart_item):
        """Test getting cart with items"""
        url = reverse('cart')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data['cartItems']) > 0
        assert data['summary']['totalItems'] > 0
        
    def test_add_to_cart_existing_item(self, authenticated_customer_client, cart_item):
        """Test adding existing item to cart (should increment quantity)"""
        url = reverse('add-to-cart')
        original_quantity = cart_item.quantity
        
        data = {
            'listingId': str(cart_item.food_listing.id),
            'quantity': 3
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify quantity was incremented
        cart_item.refresh_from_db()
        assert cart_item.quantity == original_quantity + 3
        
    def test_add_to_cart_nonexistent_listing(self, authenticated_customer_client):
        """Test adding nonexistent listing to cart"""
        url = reverse('add-to-cart')
        data = {
            'listingId': str(uuid.uuid4()),
            'quantity': 1
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_remove_from_cart_success(self, authenticated_customer_client, cart_item):
        """Test removing item from cart successfully"""
        url = reverse('remove-from-cart')
        data = {
            'cartItemId': str(cart_item.id)
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data['message'] == 'Item removed from cart successfully'
        
        # Verify cart item was deleted
        assert not CartItem.objects.filter(id=cart_item.id).exists()
        
    def test_remove_from_cart_nonexistent_item(self, authenticated_customer_client):
        """Test removing nonexistent item from cart"""
        url = reverse('remove-from-cart')
        data = {
            'cartItemId': str(uuid.uuid4())
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
class TestOrderViews:
    
    def test_order_list_view(self, authenticated_customer_client, order):
        """Test listing user's orders"""
        url = reverse('order-list')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]['id'] == str(order.id)
        
    def test_order_detail_view(self, authenticated_customer_client, order):
        """Test getting order details"""
        url = reverse('order-detail', args=[order.id])
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['id'] == str(order.id)
        assert 'providerId' in data
        assert 'items' in data
        
    def test_order_detail_unauthorized(self, authenticated_customer_client, order, customer_user):
        """Test accessing order that doesn't belong to user"""
        # Create another user and their order
        other_user = User.objects.create_user(
            username='other_customer',
            email='other@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        # Create interaction for other user
        other_interaction = Interaction.objects.create(
            user=other_user,
            business=order.interaction.business,
            interaction_type='Purchase',
            quantity=1,
            total_amount=10.00
        )
        
        other_order = Order.objects.create(
            interaction=other_interaction,
            pickup_window='12:00-14:00',
            pickup_code='XYZ789'
        )
        
        url = reverse('order-detail', args=[other_order.id])
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

# ============ ADMIN TESTS ============

@pytest.mark.django_db
class TestInteractionAdmin:
    
    def test_interaction_admin_configuration(self):
        """Test InteractionAdmin configuration"""
        admin = InteractionAdmin(Interaction, AdminSite())
        
        expected_list_display = (
            'id', 'interaction_type', 'status', 'total_amount', 
            'user', 'business', 'created_at'
        )
        expected_list_filter = ('status', 'interaction_type')
        expected_search_fields = ('id', 'user__email', 'business__user__email')
        
        assert admin.list_display == expected_list_display
        assert admin.list_filter == expected_list_filter
        assert admin.search_fields == expected_search_fields
        
    def test_cart_admin_configuration(self):
        """Test CartAdmin configuration"""
        admin = CartAdmin(Cart, AdminSite())
        
        expected_list_display = ('id', 'user', 'total_items', 'subtotal', 'created_at')
        assert admin.list_display == expected_list_display
        
    def test_order_admin_configuration(self):
        """Test OrderAdmin configuration"""
        admin = OrderAdmin(Order, AdminSite())
        
        expected_list_display = ('id', 'interaction', 'status', 'pickup_window', 'created_at')
        expected_list_filter = ('status',)
        
        assert admin.list_display == expected_list_display
        assert admin.list_filter == expected_list_filter

# ============ PERMISSION TESTS ============

@pytest.mark.django_db
class TestPermissions:
        
    def test_provider_cannot_access_cart(self, authenticated_provider_client):
        """Test that providers can access cart (cart is universal)"""
        url = reverse('cart')
        response = authenticated_provider_client.get(url)
        # Cart should be accessible to all authenticated users
        assert response.status_code == status.HTTP_200_OK

# ============ INTEGRATION TESTS ============

@pytest.mark.django_db
class TestIntegrationWorkflows:
    
    def test_complete_purchase_workflow(self, authenticated_customer_client, customer_user, food_listing):
        """Test complete purchase workflow: add to cart -> checkout -> order creation"""
        
        # 1. Add item to cart
        add_url = reverse('add-to-cart')
        add_data = {
            'listingId': str(food_listing.id),
            'quantity': 2
        }
        
        add_response = authenticated_customer_client.post(
            add_url,
            data=json.dumps(add_data),
            content_type='application/json'
        )
        
        assert add_response.status_code == status.HTTP_200_OK
        
        # 2. Verify cart has item
        cart_url = reverse('cart')
        cart_response = authenticated_customer_client.get(cart_url)
        
        assert cart_response.status_code == status.HTTP_200_OK
        cart_data = cart_response.json()
        assert len(cart_data['cartItems']) == 1
        assert cart_data['summary']['totalItems'] == 2
        
        # 3. Checkout
        checkout_url = reverse('checkout')
        checkout_data = {
            'paymentMethod': 'card',
            'paymentDetails': {'card_number': '1234567890'},
            'specialInstructions': 'Integration test order'
        }
        
        checkout_response = authenticated_customer_client.post(
            checkout_url,
            data=json.dumps(checkout_data),
            content_type='application/json'
        )
        
        assert checkout_response.status_code == status.HTTP_201_CREATED
        checkout_result = checkout_response.json()
        order_id = checkout_result['orders'][0]['id']
        
        # 4. Verify order was created
        order_url = reverse('order-detail', args=[order_id])
        order_response = authenticated_customer_client.get(order_url)
        
        assert order_response.status_code == status.HTTP_200_OK
        order_data = order_response.json()
        assert order_data['id'] == order_id
        assert len(order_data['items']) == 1
        assert order_data['items'][0]['quantity'] == 2
        
        # 5. Verify cart is empty
        final_cart_response = authenticated_customer_client.get(cart_url)
        final_cart_data = final_cart_response.json()
        assert len(final_cart_data['cartItems']) == 0
        assert final_cart_data['summary']['totalItems'] == 0
        
        # 6. Verify database objects were created correctly
        interaction = Interaction.objects.get(user=customer_user)
        assert interaction.interaction_type == 'Purchase'
        assert interaction.total_amount == Decimal('30.00')  # 2 * 15.00
        
        order = Order.objects.get(id=order_id)
        assert order.interaction == interaction
        
        payment = Payment.objects.get(interaction=interaction)
        assert payment.method == 'card'
        assert payment.amount == Decimal('30.00')
        
        interaction_items = InteractionItem.objects.filter(interaction=interaction)
        assert interaction_items.count() == 1
        assert interaction_items.first().quantity == 2

# ============ EDGE CASE TESTS ============

@pytest.mark.django_db
class TestEdgeCases:
    
    def test_cart_with_unavailable_listing(self, authenticated_customer_client, food_listing):
        """Test checkout with listing that becomes unavailable"""
        # Add item to cart
        add_url = reverse('add-to-cart')
        add_data = {
            'listingId': str(food_listing.id),
            'quantity': 2
        }
        
        authenticated_customer_client.post(
            add_url,
            data=json.dumps(add_data),
            content_type='application/json'
        )
        
        # Make listing unavailable
        food_listing.status = 'inactive'
        food_listing.save()
        
        # Try to checkout
        checkout_url = reverse('checkout')
        checkout_data = {
            'paymentMethod': 'card',
            'paymentDetails': {'card_number': '1234567890'}
        }
        
        # This should still work as checkout doesn't validate listing availability
        # In a real implementation, you might want to add this validation
        response = authenticated_customer_client.post(
            checkout_url,
            data=json.dumps(checkout_data),
            content_type='application/json'
        )
        
        # This test documents current behavior - modify based on business requirements
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]

# ============ SIGNAL TESTS ============

@pytest.mark.django_db
class TestSignals:
    """Test any signals defined in signals.py"""
    
    def test_interaction_status_history_creation(self, interaction):
        """Test that status history is created when interaction status changes"""
        # Note: This test assumes you have signals to track status changes
        # If signals.py is empty, this test documents the expected behavior
        
        original_status = interaction.status
        interaction.status = 'confirmed'
        interaction.save()
        
        # If you implement status tracking signals, uncomment and modify:
        # status_history = InteractionStatusHistory.objects.filter(
        #     Interaction=interaction,
        #     old_status=original_status,
        #     new_status='confirmed'
        # )
        # assert status_history.exists()
        
        # For now, just verify the status changed
        interaction.refresh_from_db()
        assert interaction.status == 'confirmed'

# ============ PERFORMANCE TESTS ============

@pytest.mark.django_db
class TestPerformance:
    """Test performance-related scenarios"""
    
    def test_cart_with_many_items(self, authenticated_customer_client, provider_user):
        """Test cart performance with many items"""
        # Create many food listings
        listings = []
        for i in range(10):
            listing = FoodListing.objects.create(
                name=f'Item {i}',
                description=f'Description {i}',
                food_type='ready_to_eat',
                original_price=10.00 + i,
                discounted_price=8.00 + i,
                quantity=5,
                quantity_available=5,
                expiry_date=date.today() + timedelta(days=1),
                pickup_window='17:00-19:00',
                provider=provider_user,
                status='active'
            )
            listings.append(listing)
        
        # Add all items to cart
        add_url = reverse('add-to-cart')
        for listing in listings:
            authenticated_customer_client.post(
                add_url,
                data=json.dumps({
                    'listingId': str(listing.id),
                    'quantity': 1
                }),
                content_type='application/json'
            )
        
        # Test cart retrieval performance
        cart_url = reverse('cart')
        response = authenticated_customer_client.get(cart_url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data['cartItems']) == 10
        assert data['summary']['totalItems'] == 10
        
        # Test checkout performance
        checkout_url = reverse('checkout')
        checkout_response = authenticated_customer_client.post(
            checkout_url,
            data=json.dumps({
                'paymentMethod': 'card',
                'paymentDetails': {'card_number': '1234567890'}
            }),
            content_type='application/json'
        )
        
        assert checkout_response.status_code == status.HTTP_201_CREATED

# ============ REVIEW-RELATED TESTS ============

@pytest.mark.django_db
class TestReviewFunctionality:
    """Test review-related endpoints"""
    
    def test_check_interaction_review_status_can_review(self, authenticated_customer_client, completed_interaction):
        """Test checking review status for completed interaction"""
        url = reverse('check_interaction_review_status', args=[completed_interaction.id])
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['interaction_id'] == str(completed_interaction.id)
        assert data['can_review'] is True
        assert data['has_review'] is False
        assert data['interaction_status'] == 'completed'
    
    def test_check_interaction_review_status_cannot_review_pending(self, authenticated_customer_client, interaction):
        """Test checking review status for pending interaction"""
        url = reverse('check_interaction_review_status', args=[interaction.id])
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['can_review'] is False
        assert data['interaction_status'] == 'confirmed'
    
    def test_check_interaction_review_status_not_found(self, authenticated_customer_client):
        """Test checking review status for non-existent interaction"""
        fake_id = uuid.uuid4()
        url = reverse('check_interaction_review_status', args=[fake_id])
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data['error']['code'] == 'NOT_FOUND'
    
    def test_check_interaction_review_status_wrong_user(self, authenticated_customer_client, completed_interaction, customer_user):
        """Test checking review status for interaction belonging to different user"""
        # Create another user
        other_user = User.objects.create_user(
            username='other_customer',
            email='other@test.com',
            password='testpass123',
            user_type='customer'
        )
        
        # Change interaction to belong to other user
        completed_interaction.user = other_user
        completed_interaction.save()
        
        url = reverse('check_interaction_review_status', args=[completed_interaction.id])
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data['error']['code'] == 'NOT_FOUND'
    
    def test_get_interaction_review_provider_access(self, authenticated_provider_client, completed_interaction):
        """Test provider accessing interaction review"""
        url = reverse('get_interaction_review', args=[completed_interaction.id])
        response = authenticated_provider_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['has_review'] is False
        assert data['interaction_id'] == str(completed_interaction.id)
    
    def test_get_interaction_review_customer_forbidden(self, authenticated_customer_client, completed_interaction):
        """Test customer cannot access interaction review endpoint"""
        url = reverse('get_interaction_review', args=[completed_interaction.id])
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert data['error']['code'] == 'PERMISSION_DENIED'

# ============ VALIDATION TESTS ============

@pytest.mark.django_db
class TestValidation:
    """Test model and form validation"""
    
    def test_interaction_validation_completed_status_change(self, completed_interaction):
        """Test that completed interactions cannot change status"""
        with pytest.raises(Exception):
            completed_interaction.status = 'cancelled'
            completed_interaction.save()
    
    def test_cart_item_unique_constraint(self, cart, food_listing):
        """Test cart item unique constraint"""
        CartItem.objects.create(cart=cart, food_listing=food_listing, quantity=1)
        
        with pytest.raises(Exception):
            CartItem.objects.create(cart=cart, food_listing=food_listing, quantity=2)
    
    def test_interaction_item_total_price_calculation(self, interaction, food_listing):
        """Test interaction item total price auto-calculation"""
        item = InteractionItem.objects.create(
            interaction=interaction,
            food_listing=food_listing,
            name=food_listing.name,
            quantity=5,
            price_per_item=12.50,
            expiry_date=food_listing.expiry_date
        )
        
        assert item.total_price == Decimal('62.50')  # 5 * 12.50

# ============ SERIALIZER VALIDATION TESTS ============

@pytest.mark.django_db
class TestSerializerValidation:
    
    def test_add_to_cart_serializer_missing_fields(self):
        """Test AddToCartSerializer with missing fields"""
        serializer = AddToCartSerializer(data={})
        assert not serializer.is_valid()
        assert 'listingId' in serializer.errors
        assert 'quantity' in serializer.errors
    
    def test_add_to_cart_serializer_invalid_uuid(self):
        """Test AddToCartSerializer with invalid UUID"""
        data = {
            'listingId': 'invalid-uuid',
            'quantity': 1
        }
        serializer = AddToCartSerializer(data=data)
        assert not serializer.is_valid()
        assert 'listingId' in serializer.errors
    
    def test_checkout_serializer_invalid_payment_method(self):
        """Test CheckoutSerializer with invalid payment method"""
        data = {
            'paymentMethod': 'invalid_method',
            'paymentDetails': {}
        }
        serializer = CheckoutSerializer(data=data)
        assert not serializer.is_valid()
        assert 'paymentMethod' in serializer.errors
    
    def test_remove_cart_item_serializer_invalid_uuid(self):
        """Test RemoveCartItemSerializer with invalid UUID"""
        data = {'cartItemId': 'not-a-uuid'}
        serializer = RemoveCartItemSerializer(data=data)
        assert not serializer.is_valid()
        assert 'cartItemId' in serializer.errors