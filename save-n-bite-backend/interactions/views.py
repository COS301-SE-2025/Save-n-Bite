from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Cart, CartItem, Interaction, Order, Payment, InteractionItem
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
        
        # Build cart items with provider information manually
        cart_items_data = []
        for item in cart.items.all():
            # Get the provider information from the food listing
            provider_data = None
            if hasattr(item.food_listing, 'provider') and hasattr(item.food_listing.provider, 'provider_profile'):
                provider_profile = item.food_listing.provider.provider_profile
                provider_data = {
                    'id': str(item.food_listing.provider.id),
                    'business_name': provider_profile.business_name,
                    'business_address': provider_profile.business_address,
                }
            
            cart_items_data.append({
                'id': str(item.id),
                'name': item.food_listing.name,
                'imageUrl': item.food_listing.images[0] if item.food_listing.images else '',
                'pricePerItem': float(item.food_listing.discounted_price),
                'quantity': item.quantity,
                'totalPrice': float(item.quantity * item.food_listing.discounted_price),
                'pickupWindow': item.food_listing.pickup_window,
                'expiryDate': item.food_listing.expiry_date.isoformat() if item.food_listing.expiry_date else None,
                'provider': provider_data,
                'food_listing': {
                    'id': str(item.food_listing.id),
                    'provider': provider_data
                }
            })
        
        response_data = {
            'cartItems': cart_items_data,
            'summary': {
                'totalItems': cart.total_items,
                'subtotal': float(cart.subtotal),
                'estimatedSavings': 0,
                'totalAmount': float(cart.subtotal)
            }
        }
        
        return Response(response_data)
    
class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """POST /cart/add - Add item to cart"""
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        food_listing = get_object_or_404(FoodListing, id=serializer.validated_data['listingId'])

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
                'id': str(cart_item.id),
                'listingId': str(food_listing.id),
                'quantity': cart_item.quantity,
                'addedAt': cart_item.added_at
            },
            'cartSummary': {
                'totalItems': cart.total_items,
                'totalAmount': float(cart.subtotal)
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
                'totalAmount': float(cart.subtotal)
            }
        }, status=status.HTTP_200_OK)

class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @db_transaction.atomic
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cart = get_object_or_404(Cart, user=request.user)
        if cart.items.count() == 0:
            return Response(
                {'error': 'Cart is empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Store subtotal before clearing cart
        order_subtotal = cart.subtotal
        first_item = cart.items.first()
        provider_profile = first_item.food_listing.provider.provider_profile

        with db_transaction.atomic():
            # 1. Create Interaction
            interaction = Interaction.objects.create(
                user=request.user,
                business=provider_profile,
                interaction_type='Purchase',
                quantity=cart.total_items,
                total_amount=order_subtotal,
                special_instructions=serializer.validated_data.get('specialInstructions', '')
            )

            # 2. Create Interaction Items
            for cart_item in cart.items.all():
                InteractionItem.objects.create(
                    interaction=interaction,
                    food_listing=cart_item.food_listing,
                    name=cart_item.food_listing.name,
                    quantity=cart_item.quantity,
                    price_per_item=cart_item.food_listing.discounted_price,
                    total_price=cart_item.quantity * cart_item.food_listing.discounted_price,
                    expiry_date=cart_item.food_listing.expiry_date,
                    image_url=cart_item.food_listing.images[0] if cart_item.food_listing.images else ''
                )

            # 3. Create Payment
            payment = Payment.objects.create(
                interaction=interaction,
                method=serializer.validated_data['paymentMethod'],
                amount=order_subtotal,
                details=serializer.validated_data['paymentDetails'],
                status=Payment.Status.PENDING
            )

            # Simulate payment processing
            if serializer.validated_data['paymentMethod'] != 'cash':
                payment.status = Payment.Status.COMPLETED
                payment.processed_at = timezone.now()
                payment.save()
            else:
                payment.status = Payment.Status.COMPLETED
                payment.processed_at = timezone.now()
                payment.save()

            # 4. Create Order (only if payment succeeded)
            if payment.status == Payment.Status.COMPLETED:
                order = Order.objects.create(
                    interaction=interaction,
                    pickup_window=first_item.food_listing.pickup_window,
                    pickup_code=str(uuid.uuid4())[:6].upper(),
                    status=Order.Status.CONFIRMED
                )

                # 5. Clear cart
                cart.items.all().delete()

        # Prepare response
        response_data = CheckoutResponseSerializer({
            'message': 'Checkout successful',
            'orders': [order] if payment.status == Payment.Status.COMPLETED else [],
            'summary': {
                'totalAmount': float(order_subtotal),
                'totalSavings': 0,
                'paymentStatus': payment.status
            }
        }).data

        return Response(response_data, status=status.HTTP_201_CREATED)
    
class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /orders - List user's orders"""
        orders = Order.objects.filter(interaction__user=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        """GET /orders/{id} - Get order details"""
        order = get_object_or_404(
            Order, 
            id=order_id, 
            interaction__user=request.user
        )
        serializer = OrderSerializer(order)
        return Response(serializer.data)

# Review functions remain unchanged below this point
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_interaction_review_status(request, interaction_id):
    """Check if an interaction can be reviewed or already has a review"""
    try:
        interaction = Interaction.objects.get(id=interaction_id, user=request.user)
    except Interaction.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Interaction not found or does not belong to you'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    can_review = (
        interaction.status == 'completed' and 
        request.user.user_type in ['customer', 'ngo']
    )
    
    has_review = hasattr(interaction, 'review')
    review_id = str(interaction.review.id) if has_review else None
    
    return Response({
        'interaction_id': str(interaction_id),
        'can_review': can_review,
        'has_review': has_review,
        'review_id': review_id,
        'interaction_status': interaction.status,
        'completed_at': interaction.completed_at.isoformat() if interaction.completed_at else None
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interaction_review(request, interaction_id):
    """Get the review for a specific interaction (business owner only)"""
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only food providers can view interaction reviews'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    if not hasattr(request.user, 'provider_profile'):
        return Response({
            'error': {
                'code': 'PROFILE_NOT_FOUND',
                'message': 'Provider profile not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        interaction = Interaction.objects.get(
            id=interaction_id,
            business=request.user.provider_profile
        )
    except Interaction.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Interaction not found for your business'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    if not hasattr(interaction, 'review'):
        return Response({
            'has_review': False,
            'interaction_id': str(interaction_id),
            'interaction_status': interaction.status,
            'total_amount': float(interaction.total_amount),
            'completed_at': interaction.completed_at.isoformat() if interaction.completed_at else None
        }, status=status.HTTP_200_OK)
    
    review = interaction.review
    
    if review.status != 'active':
        return Response({
            'has_review': False,
            'interaction_id': str(interaction_id),
            'message': 'Review exists but is not active'
        }, status=status.HTTP_200_OK)
    
    reviewer_name = review.reviewer.email
    if review.reviewer.user_type == 'customer' and hasattr(review.reviewer, 'customer_profile'):
        reviewer_name = review.reviewer.customer_profile.full_name
    elif review.reviewer.user_type == 'ngo' and hasattr(review.reviewer, 'ngo_profile'):
        reviewer_name = review.reviewer.ngo_profile.organisation_name
    
    return Response({
        'has_review': True,
        'interaction_id': str(interaction_id),
        'review': {
            'id': str(review.id),
            'general_rating': review.general_rating,
            'general_comment': review.general_comment,
            'food_review': review.food_review,
            'business_review': review.business_review,
            'review_source': review.review_source,
            'created_at': review.created_at.isoformat(),
            'reviewer': {
                'name': reviewer_name,
                'user_type': review.reviewer.user_type
            },
            'interaction_details': {
                'type': review.interaction_type,
                'total_amount': float(review.interaction_total_amount),
                'food_items': review.food_items_snapshot
            }
        }
    }, status=status.HTTP_200_OK)


# ========================Review Functions=====================:

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_interaction_review_status(request, interaction_id):
    """Check if an interaction can be reviewed or already has a review"""
    
    # Check if interaction exists and belongs to current user
    try:
        interaction = Interaction.objects.get(id=interaction_id, user=request.user)
    except Interaction.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Interaction not found or does not belong to you'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user can review (only customers and NGOs)
    can_review = (
        interaction.status == 'completed' and 
        request.user.user_type in ['customer', 'ngo']
    )
    
    # Check if review already exists
    has_review = hasattr(interaction, 'review')
    review_id = str(interaction.review.id) if has_review else None
    
    return Response({
        'interaction_id': str(interaction_id),
        'can_review': can_review,
        'has_review': has_review,
        'review_id': review_id,
        'interaction_status': interaction.status,
        'completed_at': interaction.completed_at.isoformat() if interaction.completed_at else None
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interaction_review(request, interaction_id):
    """Get the review for a specific interaction (business owner only)"""
    
    # Only food providers can access this endpoint
    if request.user.user_type != 'provider':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only food providers can view interaction reviews'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check if provider profile exists
    if not hasattr(request.user, 'provider_profile'):
        return Response({
            'error': {
                'code': 'PROFILE_NOT_FOUND',
                'message': 'Provider profile not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get interaction for this business
    try:
        interaction = Interaction.objects.get(
            id=interaction_id,
            business=request.user.provider_profile
        )
    except Interaction.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Interaction not found for your business'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if review exists
    if not hasattr(interaction, 'review'):
        return Response({
            'has_review': False,
            'interaction_id': str(interaction_id),
            'interaction_status': interaction.status,
            'total_amount': float(interaction.total_amount),
            'completed_at': interaction.completed_at.isoformat() if interaction.completed_at else None
        }, status=status.HTTP_200_OK)
    
    # Return review data
    review = interaction.review
    
    # Only show active reviews to business
    if review.status != 'active':
        return Response({
            'has_review': False,
            'interaction_id': str(interaction_id),
            'message': 'Review exists but is not active'
        }, status=status.HTTP_200_OK)
    
    # Get reviewer name
    reviewer_name = review.reviewer.email
    if review.reviewer.user_type == 'customer' and hasattr(review.reviewer, 'customer_profile'):
        reviewer_name = review.reviewer.customer_profile.full_name
    elif review.reviewer.user_type == 'ngo' and hasattr(review.reviewer, 'ngo_profile'):
        reviewer_name = review.reviewer.ngo_profile.organisation_name
    
    return Response({
        'has_review': True,
        'interaction_id': str(interaction_id),
        'review': {
            'id': str(review.id),
            'general_rating': review.general_rating,
            'general_comment': review.general_comment,
            'food_review': review.food_review,
            'business_review': review.business_review,
            'review_source': review.review_source,
            'created_at': review.created_at.isoformat(),
            'reviewer': {
                'name': reviewer_name,
                'user_type': review.reviewer.user_type
            },
            'interaction_details': {
                'type': review.interaction_type,
                'total_amount': float(review.interaction_total_amount),
                'food_items': review.food_items_snapshot
            }
        }
    }, status=status.HTTP_200_OK)

class DonationRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != 'ngo':
            return Response({'error': 'Only NGOs can request donations.'}, status=403)

        data = request.data
        food_listing = get_object_or_404(FoodListing, id=data.get("listingId"))
        provider_profile = food_listing.provider.provider_profile

        interaction = Interaction.objects.create(
            user=request.user,
            business=provider_profile,
            interaction_type=Interaction.InteractionType.DONATION,
            quantity=data.get("quantity", 1),
            total_amount=0.00,  # No charge
            special_instructions=data.get("specialInstructions", ""),
            motivation_message=data.get("motivationMessage", ""),
            verification_documents=data.get("verificationDocuments", [])
        )

        # Create InteractionItem (similar to purchase)
        InteractionItem.objects.create(
            interaction=interaction,
            food_listing=food_listing,
            name=food_listing.name,
            quantity=data.get("quantity", 1),
            price_per_item=0.00,
            total_price=0.00,
            expiry_date=food_listing.expiry_date,
            image_url=food_listing.images
        )

        Order.objects.create(
            interaction=interaction,
            pickup_window=food_listing.pickup_window,
            pickup_code=str(uuid.uuid4())[:6].upper()
        )

        return Response({'message': 'Donation request submitted'}, status=201)
    
class AcceptDonationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, interaction_id):
        interaction = get_object_or_404(
            Interaction, id=interaction_id, business=request.user.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION
        )

        if interaction.status != Interaction.Status.PENDING:
            return Response({'error': 'Only pending donations can be accepted.'}, status=400)

        interaction.status = Interaction.Status.READY_FOR_PICKUP
        interaction.save()

        # Optionally: trigger notification to NGO

        return Response({'message': 'Donation accepted and marked as ready for pickup'}, status=200)
    
class RejectDonationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, interaction_id):
        interaction = get_object_or_404(
            Interaction, id=interaction_id, business=request.user.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION
        )

        if interaction.status != Interaction.Status.PENDING:
            return Response({'error': 'Only pending donations can be rejected.'}, status=400)

        reason = request.data.get('rejectionReason', '')
        interaction.status = Interaction.Status.REJECTED
        interaction.rejection_reason = reason
        interaction.save()

        # Optionally: trigger notification to NGO

        return Response({'message': 'Donation request rejected'}, status=200)

