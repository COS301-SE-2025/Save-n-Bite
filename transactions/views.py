from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, Transaction, Order, Payment, TransactionItem
from food_listings.models import FoodListing
from .serializers import (
    CartResponseSerializer,
    AddToCartSerializer,
    RemoveCartItemSerializer,
    CheckoutSerializer,
    OrderSerializer,
    CheckoutResponseSerializer
)
from django.db import transaction as db_transaction
import uuid

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /cart - Retrieve cart items"""
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartResponseSerializer({
            'cartItems': cart.items.all(),
            'summary': {
                'totalItems': cart.total_items,
                'subtotal': cart.subtotal,
                'estimatedSavings': 0, #need to implement once we have mock data
                'totalAmount': cart.subtotal
            }
        })
        return Response(serializer.data)
    
class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """POST /cart/add - Add item to cart"""
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        food_listing = get_object_or_404(FoodListing, id=serializer.validated_data['listingId'])

        #Check if item already in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            food_listing=food_listing,
            defaults={'quantity': serializer.validated_data['quantity']}
        )

        if not created:
            cart_item.quantity += serializer.validated_data['quantity']
            cart_item.save()

        return Response({
            'message': 'Item added to cart successfully',
            'cartItem': {
                'id': cart_item.id,
                'listingId': food_listing.id,
                'quantity': cart_item.quantity,
                'addedAt': cart_item.added_at
            },
            'cartSummary':{
                'totalItems': cart.total_items,
                'totalAmount': cart.subtotal
            }
        }, status=status.HTTP_200_OK)
    
class RemoveCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """POST /cart/remove - Remove item from cart"""
        serializer = RemoveCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_object_or_404(Cart, user=request.user)
        cart_item = get_object_or_404(CartItem, id=serializer.validated_data['cartItemId'], cart=cart)
        cart_item.delete()

        return Response({
            'message': 'Item removed from cart successfully',
            'cartSummary': {
                'totalItems': cart.total_items,
                'totalAmount': cart.subtotal
            }
        }, status=status.HTTP_200_OK)

class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @db_transaction.atomic
    def post(self, request):
        """POST /cart/checkout - Process cart checkout"""
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cart = get_object_or_404(Cart, user=request.user)
        if cart.items.count() == 0:
            return Response(
                {'error': 'Cart is empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the provider profile from the first item in cart
        first_item = cart.items.first()
        provider_profile = first_item.food_listing.provider.provider_profile

        # Create transaction
        with db_transaction.atomic():
            # 1. Create Transaction
            transaction = Transaction.objects.create(
                user=request.user,
                business=provider_profile,  # Use provider_profile instead of user
                transaction_type='Purchase',
                quantity=cart.total_items,
                total_amount=cart.subtotal,
                special_instructions=serializer.validated_data.get('specialInstructions', '')
            )

            # 2. Create Transaction Items
            for cart_item in cart.items.all():
                TransactionItem.objects.create(
                    transaction=transaction,
                    food_listing=cart_item.food_listing,
                    name=cart_item.food_listing.name,
                    quantity=cart_item.quantity,
                    price_per_item=cart_item.food_listing.discounted_price,
                    total_price=cart_item.quantity * cart_item.food_listing.discounted_price,
                    expiry_date=cart_item.food_listing.expiry_date,
                    image_url=cart_item.food_listing.images
                )

            # 3. Create Payment
            payment = Payment.objects.create(
                transaction=transaction,
                method=serializer.validated_data['paymentMethod'],
                amount=cart.subtotal,
                details=serializer.validated_data['paymentDetails']
            )

            # 4. Create Order
            order = Order.objects.create(
                transaction=transaction,
                pickup_window=first_item.food_listing.pickup_window,
                pickup_code=str(uuid.uuid4())[:6].upper()
            )

            # 5. Clear cart
            cart.items.all().delete()

        # Prepare response
        response_data = CheckoutResponseSerializer({
            'message': 'Checkout successful',
            'orders': [order],
            'summary': {
                'totalAmount': cart.subtotal,
                'totalSavings': 0,  # Implement your savings calculation
                'paymentStatus': payment.status
            }
        }).data

        return Response(response_data, status=status.HTTP_201_CREATED)
    
class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /orders - List user's orders"""
        orders = Order.objects.filter(transaction__user=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        """GET /orders/{id} - Get order details"""
        order = get_object_or_404(
            Order, 
            id=order_id, 
            transaction__user=request.user
        )
        serializer = OrderSerializer(order)
        return Response(serializer.data)
# Create your views here.
