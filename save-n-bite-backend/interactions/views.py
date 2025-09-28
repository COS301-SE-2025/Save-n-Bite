from rest_framework import status, generics,permissions
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import Cart, CartItem, Interaction, Order, Payment, InteractionItem, InteractionStatusHistory, CheckoutSession
from food_listings.models import FoodListing
from notifications.services import NotificationService
from decimal import Decimal, ROUND_HALF_UP
from .serializers import (
    CartResponseSerializer,
    AddToCartSerializer,
    RemoveCartItemSerializer,
    CheckoutSerializer,
    OrderSerializer,
    CheckoutResponseSerializer,
    UpdateInteractionStatusSerializer,
    InteractionSerializer,
    CancelDonationSerializer,
    
)
from django.db import transaction as db_transaction
import uuid
import logging

logger = logging.getLogger(__name__)

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /cart - Retrieve cart items"""
        cart, _ = Cart.objects.get_or_create(user=request.user)
    
        cart_items_data = []
        total_savings = Decimal('0.00')  # Initialize total savings
    
        for item in cart.items.all():
            # Calculate savings for this item and add to total
            item_savings = Decimal(str(item.food_listing.original_price)) - Decimal(str(item.food_listing.discounted_price))
            total_savings += item_savings * Decimal(str(item.quantity))  # Multiply by quantity
        
            # Provider data
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
                'estimatedSavings': f"{total_savings:.2f}",  
                'totalAmount': float(cart.subtotal)
            }
        }
    
        return Response(response_data)
    

class NGODonationRequestsView(generics.ListAPIView):
    serializer_class = InteractionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'ngo_profile'):
            return Interaction.objects.none()  # No access if not an NGO

        return Interaction.objects.filter(
            user=user
        ).order_by('-created_at')


    
class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """POST /cart/add - Add item to cart"""
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # Check if cart is expired
        if cart.is_expired():
            with db_transaction.atomic():
                # Clear expired cart
                cart.items.all().delete()
                # Reset expiration
                cart.expires_at = timezone.now() + timedelta(minutes=30)
                cart.save()

        food_listing = get_object_or_404(FoodListing, id=serializer.validated_data['listingId'])
        requested_quantity = serializer.validated_data['quantity']

        # Check if food listing is expired
        if food_listing.is_expired:
            return Response(
                {'error': 'This food listing has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate total quantity already in cart plus new request
        existing_cart_quantity = 0
        try:
            existing_cart_item = CartItem.objects.get(cart=cart, food_listing=food_listing)
            existing_cart_quantity = existing_cart_item.quantity
        except CartItem.DoesNotExist:
            pass

        total_requested = existing_cart_quantity + requested_quantity

        # Check if requested quantity exceeds available quantity
        if total_requested > food_listing.quantity_available:
            available = food_listing.quantity_available - existing_cart_quantity
            return Response({
                'error': {
                    'code': 'INSUFFICIENT_QUANTITY',
                    'message': f'Only {available} items available (you already have {existing_cart_quantity} in cart)',
                    'available': available,
                    'already_in_cart': existing_cart_quantity
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if adding would exceed max cart items
        if cart.total_items + requested_quantity > Cart.MAX_ITEMS:
            return Response({
                'error': {
                    'code': 'MAX_ITEMS_EXCEEDED',
                    'message': f'Cannot have more than {Cart.MAX_ITEMS} items in cart'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Proceed with adding to cart
        with db_transaction.atomic():
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                food_listing=food_listing,
                defaults={'quantity': requested_quantity}
            )

            if not created:
                cart_item.quantity += requested_quantity
                cart_item.save()

            # Reset cart expiration timer on any cart activity
            cart.expires_at = timezone.now() + timedelta(minutes=30)
            cart.save()

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
                'totalAmount': float(cart.subtotal),
                'expires_at': cart.expires_at
            }
        }, status=status.HTTP_201_CREATED)
    
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


class UpdateInteractionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, interaction_id):
        """PATCH /interactions/{id}/status/ - Update interaction status"""
        
        # Get the interaction
        try:
            interaction = Interaction.objects.get(id=interaction_id)
        except Interaction.DoesNotExist:
            return Response({
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Interaction not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions - either the customer who made the order or the business owner
        if not (interaction.user == request.user or 
                (hasattr(request.user, 'provider_profile') and 
                 interaction.business == request.user.provider_profile)):
            return Response({
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'You do not have permission to update this interaction'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Validate request data using serializer (already imported)
        serializer = UpdateInteractionStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data provided',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')
        
        # Store old status
        old_status = interaction.status
        
        # Business logic validation
        if old_status in ['completed', 'cancelled'] and new_status != old_status:
            return Response({
                'error': {
                    'code': 'STATUS_LOCKED',
                    'message': f'Cannot change status from {old_status}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the interaction
        try:
            with db_transaction.atomic():
                # Update status
                interaction.status = new_status
                
                # Set completed_at timestamp if status is completed
                if new_status == 'completed' and old_status != 'completed':
                    interaction.completed_at = timezone.now()
                
                interaction.save()
                
                # Create status history record
                InteractionStatusHistory.objects.create(
                    interaction=interaction,
                    old_status=old_status,
                    new_status=new_status,
                    changed_by=request.user,
                    notes=notes
                )
                
                # If completing the interaction, also update any related order status
                if new_status == 'completed' and hasattr(interaction, 'order'):
                    interaction.order.status = 'completed'
                    interaction.order.save()
            
            return Response({
                'interaction_id': str(interaction_id),
                'old_status': old_status,
                'new_status': new_status,
                'updated_at': interaction.updated_at.isoformat(),
                'completed_at': interaction.completed_at.isoformat() if interaction.completed_at else None,
                'notes': notes,
                'message': f'Interaction status updated from {old_status} to {new_status}'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': {
                    'code': 'UPDATE_FAILED',
                    'message': 'Failed to update interaction status',
                    'details': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

        # Check if specific items are requested for checkout
        requested_item_ids = serializer.validated_data.get('items', [])
        if requested_item_ids:
            # Filter cart items to only process requested items
            cart_items_to_process = cart.items.filter(id__in=requested_item_ids)
            if cart_items_to_process.count() != len(requested_item_ids):
                return Response(
                    {'error': 'Some requested items are not in your cart'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Process all cart items
            cart_items_to_process = cart.items.all()

        # Store total amount for all items being processed
        total_checkout_amount = sum(
            item.quantity * item.food_listing.discounted_price 
            for item in cart_items_to_process
        )

        created_orders = []
        
        with db_transaction.atomic():
            # Create individual interaction and order for each cart item
            for cart_item in cart_items_to_process:
                food_listing = cart_item.food_listing
                provider_profile = food_listing.provider.provider_profile
                item_total = cart_item.quantity * food_listing.discounted_price
                
                # Check quantity availability
                if food_listing.quantity_available < cart_item.quantity:
                    raise ValidationError(f"Not enough quantity available for {food_listing.name}")
                
                # 1. Create individual Interaction for this item
                interaction = Interaction.objects.create(
                    user=request.user,
                    business=provider_profile,
                    interaction_type='Purchase',
                    quantity=cart_item.quantity,
                    total_amount=item_total,
                    special_instructions=serializer.validated_data.get('specialInstructions', '')
                )

                # 2. Update FoodListing quantity
                food_listing.quantity_available -= cart_item.quantity
                food_listing.save()

                # 3. Create InteractionItem
                InteractionItem.objects.create(
                    interaction=interaction,
                    food_listing=food_listing,
                    name=food_listing.name,
                    quantity=cart_item.quantity,
                    price_per_item=food_listing.discounted_price,
                    total_price=item_total,
                    expiry_date=food_listing.expiry_date,
                    image_url=food_listing.images[0] if food_listing.images else ''
                )

                # 4. Create individual Payment for this item
                payment = Payment.objects.create(
                    interaction=interaction,
                    method=serializer.validated_data['paymentMethod'],
                    amount=item_total,
                    details=serializer.validated_data['paymentDetails'],
                    status=Payment.Status.PENDING
                )

                # Simulate payment processing
                payment.status = Payment.Status.COMPLETED
                payment.processed_at = timezone.now()
                payment.save()

                # 5. Create individual Order (only if payment succeeded)
                if payment.status == Payment.Status.COMPLETED:
                    order = Order.objects.create(
                        interaction=interaction,
                        pickup_window=food_listing.pickup_window,
                        pickup_code=str(uuid.uuid4())[:6].upper(),
                        status=Order.Status.CONFIRMED
                    )
                    created_orders.append(order)

            # 6. Remove processed items from cart
            cart_items_to_process.delete()

        # Prepare response with all created orders
        response_data = CheckoutResponseSerializer({
            'message': 'Checkout successful',
            'orders': created_orders,
            'summary': {
                'totalAmount': float(total_checkout_amount),
                'totalSavings': 0,
                'paymentStatus': 'completed',
                'itemsProcessed': len(created_orders)
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
        # Verify NGO status
        if request.user.user_type != 'ngo':
            return Response(
                {'error': 'Only NGOs can request donations.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        food_listing = get_object_or_404(FoodListing, id=data.get("listingId"))
        requested_quantity = data.get("quantity", 1)  # Default to 1 if not specified

        # Validate requested quantity
        if requested_quantity <= 0:
            return Response(
                {'error': 'Quantity must be at least 1.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check available quantity
        if requested_quantity > food_listing.quantity_available:
            return Response(
                {
                    'error': 'Requested quantity exceeds available amount.',
                    'available_quantity': food_listing.quantity_available,
                    'requested_quantity': requested_quantity
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        provider_profile = food_listing.provider.provider_profile

        with db_transaction.atomic():
            # Create the interaction (status will be PENDING by default)
            interaction = Interaction.objects.create(
                user=request.user,
                business=provider_profile,
                interaction_type=Interaction.InteractionType.DONATION,
                quantity=requested_quantity,
                total_amount=0.00,  # Donations are free
                special_instructions=data.get("specialInstructions", ""),
                motivation_message=data.get("motivationMessage", ""),
                verification_documents=data.get("verificationDocuments", [])
            )

            # Create interaction item
            InteractionItem.objects.create(
                interaction=interaction,
                food_listing=food_listing,
                name=food_listing.name,
                quantity=requested_quantity,
                price_per_item=0.00,
                total_price=0.00,
                expiry_date=food_listing.expiry_date,
                image_url=food_listing.images[0] if food_listing.images else ''
            )

            # Create pending order
            Order.objects.create(
                interaction=interaction,
                pickup_window=food_listing.pickup_window,
                pickup_code=str(uuid.uuid4())[:6].upper(),
                status=Order.Status.PENDING
            )

        return Response(
            {
                'message': 'Donation request submitted successfully',
                'interaction_id': str(interaction.id),
                'requested_quantity': requested_quantity,
                'available_quantity': food_listing.quantity_available
            },
            status=status.HTTP_201_CREATED
        )
    
class AcceptDonationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, interaction_id):
        interaction = get_object_or_404(
            Interaction, 
            id=interaction_id, 
            business=request.user.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION
        )

        if interaction.status != Interaction.Status.PENDING:
            return Response({'error': 'Only pending donations can be accepted.'}, status=400)

        with db_transaction.atomic():
            # Get the food listing and quantity from the interaction item
            interaction_item = interaction.items.first()  # Assuming one item per donation
            food_listing = interaction_item.food_listing
            requested_quantity = interaction_item.quantity

            # Verify quantity is still available
            if food_listing.quantity_available < requested_quantity:
                return Response(
                    {'error': f'Not enough quantity available for {food_listing.name}.'}, 
                    status=400
                )

            # Reduce the quantity
            food_listing.quantity_available -= requested_quantity
            food_listing.save()

            # Update interaction status to completed
            interaction.status = Interaction.Status.COMPLETED
            interaction.save()

        return Response(
            {'message': 'Donation accepted and marked as completed'}, 
            status=200
        )

    
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
    
class CancelDonationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, interaction_id):
        serializer = CancelDonationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '')

        interaction = get_object_or_404(
            Interaction,
            id=interaction_id,
            user=request.user,
            interaction_type=Interaction.InteractionType.DONATION
        )

        if interaction.status != Interaction.Status.PENDING:
            return Response(
                {'error': 'You can only cancel a pending donation request.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with db_transaction.atomic():
            # Restore stock
            for item in interaction.items.all():
                food_listing = item.food_listing
                food_listing.quantity_available += item.quantity
                food_listing.save()

            # Cancel interaction
            interaction.status = Interaction.Status.CANCELLED
            interaction.save()

            # Cancel linked order if it exists
            if hasattr(interaction, 'order'):
                interaction.order.status = Order.Status.CANCELLED
                interaction.order.save()

            # Record status change
            InteractionStatusHistory.objects.create(
                interaction=interaction,
                old_status=Interaction.Status.PENDING,
                new_status=Interaction.Status.CANCELLED,
                changed_by=request.user,
                notes=reason
            )

        return Response(
            {'message': 'Donation request cancelled successfully and stock restored'},
            status=status.HTTP_200_OK
        )

class BusinessHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Verify user is a provider
        if request.user.user_type != 'provider':
            return Response(
                {'error': 'Only food providers can access this history.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            provider_profile = request.user.provider_profile
        except FoodProviderProfile.DoesNotExist:
            return Response(
                {'error': 'Provider profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get all interactions for this business
        interactions = Interaction.get_business_history(provider_profile)
        
        # Format the response
        response_data = {
            'business': {
                'id': str(provider_profile.id),
                'name': provider_profile.business_name
            },
            'interactions': [interaction.get_interaction_details() for interaction in interactions],
            'stats': {
                'total_interactions': interactions.count(),
                'total_purchases': interactions.filter(interaction_type='Purchase').count(),
                'total_donations': interactions.filter(interaction_type='Donation').count(),
                'completed': interactions.filter(status='completed').count(),
                'pending': interactions.filter(status='pending').count()
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)

class InitiateCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @db_transaction.atomic
    def post(self, request):
        """POST /checkout/initiate/ - Start checkout session with timer"""
        cart = get_object_or_404(Cart, user=request.user)
        
        if cart.items.count() == 0:
            return Response(
                {'error': 'Cart is empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for existing active session
        existing_session = CheckoutSession.objects.filter(
            user=request.user,
            is_active=True,
            expires_at__gt=timezone.now()
        ).first()
        
        if existing_session:
            return Response(
                {
                    'message': 'Checkout session already active',
                    'session_id': str(existing_session.id),
                    'expires_at': existing_session.expires_at
                },
                status=status.HTTP_200_OK
            )

        # Reserve inventory by temporarily reducing available quantity
        for item in cart.items.all():
            if item.food_listing.quantity_available < item.quantity:
                return Response(
                    {
                        'error': f'Not enough quantity available for {item.food_listing.name}',
                        'item_id': str(item.food_listing.id),
                        'available': item.food_listing.quantity_available,
                        'requested': item.quantity
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            item.food_listing.quantity_available -= item.quantity
            item.food_listing.save()

        # Create checkout session
        checkout_session = CheckoutSession.objects.create(
            user=request.user,
            cart=cart,
            expires_at=timezone.now() + timedelta(minutes=30)
        )
        
        return Response(
            {
                'message': 'Checkout session started',
                'session_id': str(checkout_session.id),
                'expires_at': checkout_session.expires_at,
                'time_left_seconds': 1800  # 30 minutes in seconds
            },
            status=status.HTTP_201_CREATED
        )

class CompleteCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @db_transaction.atomic
    def post(self, request):
        """POST /checkout/complete/ - Complete checkout within the time limit"""
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        session_id = serializer.validated_data['session_id']  
        
        checkout_session = get_object_or_404(
            CheckoutSession,
            id=session_id,
            user=request.user,
            is_active=True
        )

        if checkout_session.is_expired():
            # Release reserved inventory
            for item in checkout_session.cart.items.all():
                item.food_listing.quantity_available += item.quantity
                item.food_listing.save()
            
            checkout_session.is_active = False
            checkout_session.save()
            
            return Response(
                {'error': 'Checkout session expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Proceed with normal checkout process
        cart = checkout_session.cart
        order_subtotal = cart.subtotal
        first_item = cart.items.first()
        provider_profile = first_item.food_listing.provider.provider_profile

        # 1. Create Interaction
        interaction = Interaction.objects.create(
            user=request.user,
            business=provider_profile,
            interaction_type='Purchase',
            quantity=cart.total_items,
            total_amount=order_subtotal,
            special_instructions=serializer.validated_data.get('specialInstructions', '')
        )

        # 2. Create Interaction Items (quantity already reserved)
        for cart_item in cart.items.all():
            InteractionItem.objects.create(
                Interaction=interaction,
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

        # 4. Create Order if payment succeeded
        if payment.status == Payment.Status.COMPLETED:
            order = Order.objects.create(
                interaction=interaction,
                pickup_window=first_item.food_listing.pickup_window,
                pickup_code=str(uuid.uuid4())[:6].upper(),
                status=Order.Status.CONFIRMED
            )

            # Clear cart and mark session as complete
            cart.items.all().delete()
            checkout_session.is_active = False
            checkout_session.save()

            return Response(
                {
                    'message': 'Checkout completed successfully',
                    'order_id': str(order.id),
                    'pickup_code': order.pickup_code
                },
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {'error': 'Payment processing failed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
class DonationRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Verify NGO status
        if request.user.user_type != 'ngo':
            return Response(
                {'error': 'Only NGOs can request donations.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        food_listing = get_object_or_404(FoodListing, id=data.get("listingId"))
        requested_quantity = data.get("quantity", 1)  # Default to 1 if not specified

        # Validate requested quantity
        if requested_quantity <= 0:
            return Response(
                {'error': 'Quantity must be at least 1.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check available quantity
        if requested_quantity > food_listing.quantity_available:
            return Response(
                {
                    'error': 'Requested quantity exceeds available amount.',
                    'available_quantity': food_listing.quantity_available,
                    'requested_quantity': requested_quantity
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        provider_profile = food_listing.provider.provider_profile

        with db_transaction.atomic():
            # Create the interaction (status will be PENDING by default)
            interaction = Interaction.objects.create(
                user=request.user,
                business=provider_profile,
                interaction_type=Interaction.InteractionType.DONATION,
                quantity=requested_quantity,
                total_amount=0.00,  # Donations are free
                special_instructions=data.get("specialInstructions", ""),
                motivation_message=data.get("motivationMessage", ""),
                verification_documents=data.get("verificationDocuments", [])
            )

            # Create interaction item
            InteractionItem.objects.create(
                interaction=interaction,
                food_listing=food_listing,
                name=food_listing.name,
                quantity=requested_quantity,
                price_per_item=0.00,
                total_price=0.00,
                expiry_date=food_listing.expiry_date,
                image_url=food_listing.images[0] if food_listing.images else ''
            )

            # Create pending order
            Order.objects.create(
                interaction=interaction,
                pickup_window=food_listing.pickup_window,
                pickup_code=str(uuid.uuid4())[:6].upper(),
                status=Order.Status.PENDING
            )

            # Send donation request notifications
            try:
                ngo_notification, business_notification = NotificationService.send_donation_request_notification(interaction)
                
                notification_status = {
                    'ngo_notification_sent': ngo_notification is not None,
                    'business_notification_sent': business_notification is not None
                }
                
            except Exception as e:
                # Log the error but don't fail the request
                logger.error(f"Failed to send donation request notifications: {str(e)}")
                notification_status = {
                    'ngo_notification_sent': False,
                    'business_notification_sent': False,
                    'notification_error': str(e)
                }

        return Response(
            {
                'message': 'Donation request submitted successfully',
                'interaction_id': str(interaction.id),
                'requested_quantity': requested_quantity,
                'available_quantity': food_listing.quantity_available,
                'notifications': notification_status
            },
            status=status.HTTP_201_CREATED
        )
    
class AcceptDonationView(APIView):
    """Accept a donation request - changes status from PENDING to CONFIRMED"""
    permission_classes = [IsAuthenticated]

    def post(self, request, interaction_id):
        interaction = get_object_or_404(
            Interaction, 
            id=interaction_id, 
            business=request.user.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION
        )

        if interaction.status != Interaction.Status.PENDING:
            return Response({
                'error': 'Only pending donations can be accepted.'
            }, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            # Get the food listing and quantity from the interaction item
            interaction_item = interaction.items.first()  # Assuming one item per donation
            food_listing = interaction_item.food_listing
            requested_quantity = interaction_item.quantity

            # Verify quantity is still available
            if food_listing.quantity_available < requested_quantity:
                return Response(
                    {'error': f'Not enough quantity available for {food_listing.name}.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Reserve the quantity (reduce from available)
            food_listing.quantity_available -= requested_quantity
            food_listing.save()

            # Update interaction status to CONFIRMED (not COMPLETED)
            interaction.status = Interaction.Status.CONFIRMED
            interaction.save()

            # Update related order status if exists
            if hasattr(interaction, 'order'):
                interaction.order.status = Order.Status.CONFIRMED
                interaction.order.save()

            # Send acceptance notifications
            try:
                notification = NotificationService.send_donation_response_notification(
                    interaction=interaction,
                    response_type='accepted'
                )
                
                notification_status = {
                    'notification_sent': notification is not None,
                    'notification_id': str(notification.id) if notification else None
                }
                
            except Exception as e:
                # Log the error but don't fail the acceptance
                logger.error(f"Failed to send donation acceptance notifications: {str(e)}")
                notification_status = {
                    'notification_sent': False,
                    'notification_error': str(e)
                }

        return Response(
            {
                'message': 'Donation accepted and confirmed',
                'interaction_id': str(interaction.id),
                'status': interaction.status,
                'pickup_code': interaction.order.pickup_code if hasattr(interaction, 'order') else None,
                'notifications': notification_status
            }, 
            status=status.HTTP_200_OK
        )
    
class RejectDonationView(APIView):
    """Reject a donation request"""
    permission_classes = [IsAuthenticated]

    def post(self, request, interaction_id):
        interaction = get_object_or_404(
            Interaction, 
            id=interaction_id, 
            business=request.user.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION
        )

        if interaction.status != Interaction.Status.PENDING:
            return Response({
                'error': 'Only pending donations can be rejected.'
            }, status=status.HTTP_400_BAD_REQUEST)

        rejection_reason = request.data.get('rejectionReason', '')
        
        with db_transaction.atomic():
            # Update related order status FIRST (before changing interaction status)
            if hasattr(interaction, 'order'):
                # Temporarily disable the Order.save() method's interaction status update
                # by directly updating the order status without triggering save logic
                Order.objects.filter(id=interaction.order.id).update(status=Order.Status.CANCELLED)
            
            # Now update interaction status to REJECTED
            interaction.status = Interaction.Status.REJECTED
            if hasattr(interaction, 'rejection_reason'):
                interaction.rejection_reason = rejection_reason
            interaction.save()

            # Send rejection notifications
            try:
                notification = NotificationService.send_donation_response_notification(
                    interaction=interaction,
                    response_type='rejected',
                    rejection_reason=rejection_reason
                )
                
                notification_status = {
                    'notification_sent': notification is not None,
                    'notification_id': str(notification.id) if notification else None
                }
                
            except Exception as e:
                # Log the error but don't fail the rejection
                logger.error(f"Failed to send donation rejection notifications: {str(e)}")
                notification_status = {
                    'notification_sent': False,
                    'notification_error': str(e)
                }

        return Response({
            'message': 'Donation request rejected',
            'interaction_id': str(interaction.id),
            'status': interaction.status,
            'rejection_reason': rejection_reason,
            'notifications': notification_status
        }, status=status.HTTP_200_OK)
    
class PrepareDonationView(APIView):
    """Mark donation as ready for pickup - changes status from CONFIRMED to READY_FOR_PICKUP"""
    permission_classes = [IsAuthenticated]

    def post(self, request, interaction_id):
        interaction = get_object_or_404(
            Interaction, 
            id=interaction_id, 
            business=request.user.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION
        )

        if interaction.status != Interaction.Status.CONFIRMED:
            return Response({
                'error': 'Only confirmed donations can be marked as ready for pickup.'
            }, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            # Update interaction status to READY_FOR_PICKUP
            interaction.status = Interaction.Status.READY_FOR_PICKUP
            interaction.save()

            # Update related order status if exists
            if hasattr(interaction, 'order'):
                interaction.order.status = Order.Status.READY_FOR_PICKUP
                interaction.order.save()

            # Send ready for pickup notifications
            try:
                notification = NotificationService.send_donation_ready_notification(
                    interaction=interaction
                )
                
                notification_status = {
                    'notification_sent': notification is not None,
                    'notification_id': str(notification.id) if notification else None
                }
                
            except Exception as e:
                # Log the error but don't fail the status update
                logger.error(f"Failed to send donation ready notifications: {str(e)}")
                notification_status = {
                    'notification_sent': False,
                    'notification_error': str(e)
                }

        return Response(
            {
                'message': 'Donation marked as ready for pickup',
                'interaction_id': str(interaction.id),
                'status': interaction.status,
                'pickup_code': interaction.order.pickup_code if hasattr(interaction, 'order') else None,
                'notifications': notification_status
            }, 
            status=status.HTTP_200_OK
        )

class CompleteDonationView(APIView):
    """Complete donation pickup - changes status from READY_FOR_PICKUP to COMPLETED"""
    permission_classes = [IsAuthenticated]

    def post(self, request, interaction_id):
        interaction = get_object_or_404(
            Interaction, 
            id=interaction_id, 
            business=request.user.provider_profile,
            interaction_type=Interaction.InteractionType.DONATION
        )

        if interaction.status != Interaction.Status.READY_FOR_PICKUP:
            return Response({
                'error': 'Only donations ready for pickup can be completed.'
            }, status=status.HTTP_400_BAD_REQUEST)

        pickup_verification = request.data.get('pickup_verification', {})
        
        with db_transaction.atomic():
            # Update interaction status to COMPLETED
            interaction.status = Interaction.Status.COMPLETED
            interaction.completed_at = timezone.now()
            interaction.save()

            # Update related order status if exists
            if hasattr(interaction, 'order'):
                interaction.order.status = Order.Status.COMPLETED
                interaction.order.save()

            # Create status history record
            InteractionStatusHistory.objects.create(
                interaction=interaction,
                old_status=Interaction.Status.READY_FOR_PICKUP,
                new_status=Interaction.Status.COMPLETED,
                changed_by=request.user,
                notes=pickup_verification.get('notes', 'Donation pickup completed')
            )

            # Send completion notifications
            try:
                notification = NotificationService.send_donation_completed_notification(
                    interaction=interaction
                )
                
                notification_status = {
                    'notification_sent': notification is not None,
                    'notification_id': str(notification.id) if notification else None
                }
                
            except Exception as e:
                # Log the error but don't fail the completion
                logger.error(f"Failed to send donation completion notifications: {str(e)}")
                notification_status = {
                    'notification_sent': False,
                    'notification_error': str(e)
                }

        return Response(
            {
                'message': 'Donation pickup completed successfully',
                'interaction_id': str(interaction.id),
                'status': interaction.status,
                'completed_at': interaction.completed_at.isoformat(),
                'notifications': notification_status
            }, 
            status=status.HTTP_200_OK
        )