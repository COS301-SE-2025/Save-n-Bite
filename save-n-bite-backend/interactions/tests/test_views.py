from django.urls import reverse
import uuid
from rest_framework.test import APITestCase
from rest_framework import status
from model_bakery import baker
from django.utils import timezone
from interactions.models import Cart, CartItem, Interaction, Order, FoodListing, CheckoutSession, InteractionItem
from authentication.models import User, NGOProfile, FoodProviderProfile

class CartViewsTests(APITestCase):
    def setUp(self):
        self.user = baker.make(User)
        self.business_user = baker.make(User, user_type='provider')
        self.ngo_user = baker.make(User, user_type='ngo')
        
        # Create business profile with required fields
        self.business_profile, created = FoodProviderProfile.objects.get_or_create(
            user=self.business_user,
            defaults={
                'business_name': "Test Business",
                'business_address': "123 Test St",
                'business_contact': '+1234567890',
                'business_email': 'business@test.com',
                'cipc_document': 'test_doc.pdf',
                'status': 'verified'
            }
        )
        
        # Create food listing with all required fields
        self.food_listing = baker.make(
            FoodListing,
            provider=self.business_user,
            quantity=10,
            quantity_available=10,
            original_price=10.00,
            discounted_price=8.00,
            food_type='ready_to_eat',
            status='active',
            expiry_date=timezone.now().date() + timezone.timedelta(days=1),
            pickup_window="17:00-19:00",
            name="Test Food",
            description="Test Description",
            allergens=[],
            dietary_info=[],
            images=[]
        )
        
        # Create cart
        self.cart = baker.make(Cart, user=self.user)
        
        # Create cart item with correct field name
        self.cart_item = baker.make(
            CartItem, 
            cart=self.cart, 
            food_listing=self.food_listing,
            quantity=1
        )
        
        # Create interaction first
        self.interaction = baker.make(
            Interaction,
            interaction_type="Purchase",
            status="pending",
            total_amount=10.00,
            user=self.user,
            business=self.business_profile
        )
        
        # Create interaction item
        self.interaction_item = baker.make(
            InteractionItem,
            interaction=self.interaction,
            food_listing=self.food_listing,
            name=self.food_listing.name,
            quantity=1,
            price_per_item=self.food_listing.discounted_price,
            total_price=self.food_listing.discounted_price,
            expiry_date=self.food_listing.expiry_date,
            image_url=""
        )
        
        # Create order with interaction
        self.order = baker.make(
            Order,
            interaction=self.interaction,
            status="pending",
            pickup_window="17:00-19:00",
            pickup_code="TEST123"
        )

        self.checkout_session = baker.make(
        CheckoutSession,
        user=self.user,
        cart=self.cart,
        expires_at=timezone.now() + timezone.timedelta(hours=1),
        is_active=True
    )
    
        global session_id
        session_id = str(self.checkout_session.session_id)

    # --- CART VIEWS ---
    def test_cart_view(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("cart")  # Matches your URL pattern
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("cartItems", response.data)

    def test_add_to_cart(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("add-to-cart")  # Matches your URL pattern
        data = {
            "listingId": str(self.food_listing.id),  
            "quantity": 2,
            "pickup_window": "17:00-19:00"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)  
        self.assertEqual(response.data["message"], "Item added to cart successfully")

    def test_remove_cart_item(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("remove-from-cart")  
        data = {"cartItemId": str(self.cart_item.id)}  # Matches your serializer field
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Item removed from cart successfully")

    # --- CHECKOUT VIEWS ---
    def test_checkout_success(self):
        self.client.force_authenticate(user=self.user)

        url = reverse("checkout") 
        data = {
        "session_id": str(self.checkout_session.session_id),
        "paymentMethod": "card",
        "paymentDetails": {
            "cardNumber": "4111111111111111",
            "expiryDate": "12/25",
            "cvv": "123",
            "cardholderName": "John Doe"
        },
        "specialInstructions": "Please call when ready for pickup"
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)  

    # def test_initiate_checkout(self):
    #     self.client.force_authenticate(user=self.user)
    #     url = reverse("initiate-checkout")  
    #     response = self.client.post(url)
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cart_view_empty(self):
        self.client.force_authenticate(user=self.user)
        self.cart.items.all().delete()  # Empty the cart
        response = self.client.get(reverse("cart"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["cartItems"]), 0)

    def test_add_to_cart_expired_listing(self):
        # Make food listing expired
        self.food_listing.expiry_date = timezone.now().date() - timezone.timedelta(days=1)
        self.food_listing.save()
        
        self.client.force_authenticate(user=self.user)
        response = self.client.post(reverse("add-to-cart"), {
            "listingId": str(self.food_listing.id),
            "quantity": 1
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "This food listing has expired")

        def test_update_interaction_invalid_transition(self):
            # First transition to confirmed (valid transition from pending)
            self.interaction.status = "confirmed"
            self.interaction.save()
            
            # Then transition to completed (valid transition from confirmed)
            self.interaction.status = "completed"
            self.interaction.save()
            
            # Now try to change from completed (should fail)
            self.client.force_authenticate(user=self.business_user)
            response = self.client.patch(
                reverse("update_interaction_status", kwargs={"interaction_id": str(self.interaction.id)}),
                {"status": "pending"},
                format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("STATUS_LOCKED", response.data["error"]["code"])

    def test_donation_request_non_ngo(self):
        self.client.force_authenticate(user=self.user)  # Regular user
        response = self.client.post(reverse("donation-request"), {
            "listingId": str(self.food_listing.id),
            "quantity": 1
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_checkout_empty_cart(self):
        self.cart.items.all().delete()
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("checkout"), 
            {
                "paymentMethod": "card",
                "paymentDetails": {
                    "cardNumber": "4111111111111111",
                    "expiryDate": "12/25",
                    "cvv": "123",
                    "cardholderName": "John Doe"
                }
            },
            format='json'  # Add this parameter
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "Cart is empty")

    # def test_initiate_checkout_insufficient_quantity(self):
    #     # Clear existing cart items first
    #     self.cart.items.all().delete()
        
    #     # Set food listing to have very limited quantity
    #     self.food_listing.quantity_available = 1
    #     self.food_listing.save()
        
    #     # Add more items to cart than available
    #     CartItem.objects.create(
    #         cart=self.cart,
    #         food_listing=self.food_listing,
    #         quantity=5  # More than the 1 available
    #     )
        
    #     self.client.force_authenticate(user=self.user)
    #     response = self.client.post(reverse("initiate-checkout"))
        
    #     # Debug information
    #     if response.status_code != status.HTTP_400_BAD_REQUEST:
    #         print(f"DEBUG: Expected 400, got {response.status_code}")
    #         print(f"DEBUG: Response data: {response.data}")
    #         print(f"DEBUG: Food listing quantity: {self.food_listing.quantity_available}")
    #         print(f"DEBUG: Cart items: {[{'quantity': item.quantity, 'listing_id': item.food_listing.id} for item in self.cart.items.all()]}")
        
    #     self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    #     self.assertIn("Not enough quantity available", response.data["error"])

    # def test_complete_checkout(self):
    #     self.client.force_authenticate(user=self.user)
    #     url = reverse("complete-checkout")  
    #     data = {
    #         "session_id": str(self.checkout_session.session_id),
    #         "paymentMethod": "card",
    #         "paymentDetails": {
    #             "cardNumber": "4111111111111111",
    #             "expiryDate": "12/25",
    #             "cvv": "123",
    #             "cardholderName": "John Doe"
    #         },
    #         "specialInstructions": "Please call when ready for pickup"
    #     }

    #     response = self.client.post(url, data, format='json')

    #     print("\nDEBUG test_complete_checkout:")
    #     print(f"Looking up session_id: {self.checkout_session.session_id}")
    #     print("Status Code:", response.status_code)
    #     print("Response Data:", response.data)
        
    #     self.assertEqual(response.status_code, status.HTTP_201_CREATED)  

    # --- ORDER VIEWS ---
    def test_order_list_view(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("order-list")  # Matches your URL pattern
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_order_detail_view(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("order-detail", kwargs={"order_id": str(self.order.id)})  # Matches your URL pattern
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data["id"]), str(self.order.id))

    # --- INTERACTION STATUS ---
    def test_update_interaction_status(self):
        self.client.force_authenticate(user=self.business_user)
        url = reverse("update_interaction_status", kwargs={"interaction_id": str(self.interaction.id)})  # Matches your URL pattern
        data = {
            "status": "confirmed",
            "notes": "Test note",
            "verification_code": "123456"  
        }
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["new_status"], "confirmed")

    # --- BUSINESS HISTORY ---
    def test_business_history_view(self):
        self.client.force_authenticate(user=self.business_user)
        url = reverse("business-history")  # Matches your URL pattern
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)
        self.assertIn('interactions', response.data)
        self.assertIsInstance(response.data['interactions'], list)


class InteractionModelTests(APITestCase):
    def setUp(self):
        self.user = baker.make(User)
        self.business_user = baker.make(User, user_type='business')
        self.business_profile, created = FoodProviderProfile.objects.get_or_create(
            user=self.business_user,
            defaults={
                'business_name': "Test Business",
                'business_address': "123 Test St",
                'business_contact': '+1234567890',
                'business_email': 'business@test.com',
                'cipc_document': 'test_doc.pdf',
                'status': 'verified'
            }
        )
        self.food_listing = baker.make(
            FoodListing,
            provider=self.business_user,
            quantity=10,
            quantity_available=10,
            original_price=10.00,
            discounted_price=8.00,
            food_type='ready_to_eat',
            status='active',
            expiry_date=timezone.now().date() + timezone.timedelta(days=1),
            pickup_window="17:00-19:00",
            name="Test Food",
            description="Test Description",
            allergens=[],
            dietary_info=[],
            images=[]
        )
        
        # Create interaction
        self.interaction = baker.make(
            Interaction,
            interaction_type="Purchase",
            status="pending",
            total_amount=10.00,
            user=self.user,
            business=self.business_profile
        )
        
        # Create interaction item
        self.interaction_item = baker.make(
            InteractionItem,
            interaction=self.interaction,
            food_listing=self.food_listing,
            name=self.food_listing.name,
            quantity=1,
            price_per_item=self.food_listing.discounted_price,
            total_price=self.food_listing.discounted_price,
            expiry_date=self.food_listing.expiry_date,
            image_url=""
        )

    # --- HELPER FUNCTIONS ---
    def test_interaction_str_method(self):
        self.assertEqual(str(self.interaction), f"Purchase - pending - 10")

    def test_interaction_item_str_method(self):
        self.assertEqual(str(self.interaction_item), f"1 x Test Food (8.0)")