from rest_framework import serializers
from food_listings.models import FoodListing
from authentication.models import FoodProviderProfile
from interactions.models import Cart, CartItem, Order, Payment, Interaction, InteractionItem, InteractionStatusHistory

# Add this to your serializers.py file (add to the end of the file)

class UpdateInteractionStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['pending', 'confirmed', 'completed', 'cancelled', 'failed'],
        required=True,
        help_text="New status for the interaction"
    )
    notes = serializers.CharField(
        max_length=500, 
        required=False, 
        allow_blank=True,
        help_text="Optional notes about the status change"
    )
    
    def validate_status(self, value):
        """Additional status validation"""
        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'failed']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        return value

class FoodProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodProviderProfile
        fields = ['id', 'business_name', 'address', 'contact', 'business_hours', 'rating', 'total_reviews']
    
    def to_representation(self, instance):
        data = super.to_representation(instance)
        data['coordinates'] = {'lat' : float(instance.latitude), 'lng': float(instance.longitude)}
        return data
    
class FoodListingsSerializer(serializers.ModelSerializer):
    provider = FoodProviderSerializer()
    savings = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()

    class Meta:
        model = FoodListing
        fields = ['id', 'name', 'description', 'quantity_available', 'original_price', 'discounted_price', 'savings', 'discount_percentage', 'type', 'expiry_date', 'pickup_window', 'images', 'allergens', 'dietary_info', 'provider']

    def get_savings(self, obj):
        return float(obj.original_price - obj.discounted_price)
    
    def get_discount_percentage(self, obj):
        return int((obj.original_price - obj.discounted_price) / obj.original_price * 100)
    
class CartItemSerializer(serializers.ModelSerializer):
    listingId = serializers.UUIDField(source='food_listing.id')
    name = serializers.CharField(source='food_listing.name')
    pricePerItem = serializers.DecimalField(source='food_listing.discounted_price', max_digits=10, decimal_places=2)
    imageUrl = serializers.URLField(source='food_listing.images')
    provider = serializers.CharField(source='food_listing.provider.provider_profile.business_name')  # Changed to provider_profile
    pickupWindow = serializers.CharField(source='food_listing.pickup_window')
    expiryDate = serializers.DateField(source='food_listing.expiry_date')
    totalPrice = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'listingId', 'name', 'quantity', 'pricePerItem', 
                 'totalPrice', 'imageUrl', 'provider', 'pickupWindow', 'expiryDate']
    
    def get_totalPrice(self, obj):
        return float(obj.quantity * obj.food_listing.discounted_price)

class CartSummarySerializer(serializers.Serializer):
    totalItems = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    estimatedSavings = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    totalAmount = serializers.DecimalField(max_digits=10, decimal_places=2)

class CartResponseSerializer(serializers.Serializer):
    cartItems = CartItemSerializer(many=True)
    summary = CartSummarySerializer()

class AddToCartSerializer(serializers.Serializer):
    listingId = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, data):
        food_listing = FoodListing.objects.filter(id=data['listingId']).first()
        if not food_listing:
            raise serializers.ValidationError("Food listing not found")
        
        if food_listing.quantity_available < 1:
            raise serializers.ValidationError("This item is currently out of stock")
            
        return data

class RemoveCartItemSerializer(serializers.Serializer):
    cartItemId = serializers.UUIDField()

class CheckoutSerializer(serializers.Serializer):
    paymentMethod = serializers.ChoiceField(choices=Payment.PaymentMethod.choices)
    paymentDetails = serializers.JSONField()
    specialInstructions = serializers.CharField(required=False, allow_blank=True)

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractionItem
        fields = ['id', 'name', 'quantity', 'price_per_item', 'total_price', 'expiry_date', 'image_url']

class OrderSerializer(serializers.ModelSerializer):
    providerId = serializers.UUIDField(source='interaction.business.id')
    providerName = serializers.CharField(source='interaction.business.business_name')
    items = serializers.SerializerMethodField()
    totalAmount = serializers.DecimalField(source='interaction.total_amount', max_digits=10, decimal_places=2)
    pickupWindow = serializers.CharField(source='pickup_window')
    pickupCode = serializers.CharField(source='pickup_code')
    createdAt = serializers.DateTimeField(source='created_at')
    
    class Meta:
        model = Order
        fields = ['id', 'providerId', 'providerName', 'items', 'totalAmount', 
                 'status', 'pickupWindow', 'pickupCode', 'createdAt']
    
    def get_items(self, obj):
        return OrderItemSerializer(
            obj.interaction.items.all(),
            many=True,
            context={'request': self.context.get('request')}
        ).data
    
class CheckoutSummarySerializer(serializers.Serializer):
    totalAmount = serializers.DecimalField(max_digits=10, decimal_places=2)
    totalSavings = serializers.DecimalField(max_digits=10, decimal_places=2)
    paymentStatus = serializers.CharField()

class CheckoutResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    orders = OrderSerializer(many=True)
    summary = CheckoutSummarySerializer()

class PaymentSerializer(serializers.ModelSerializer):
    paymentMethod = serializers.CharField(source='method')
    
    class Meta:
        model = Payment
        fields = ['id', 'paymentMethod', 'amount', 'status', 'processed_at']
        read_only_fields = ['id', 'status', 'processed_at']

class InteractionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractionItem
        fields = ['id', 'name', 'quantity', 'price_per_item', 'total_price', 'expiry_date', 'image_url']

class InteractionSerializer(serializers.ModelSerializer):
    items = InteractionItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = Interaction
        fields = ['id', 'interaction_type', 'status', 'quantity', 'total_amount',
                 'created_at', 'completed_at', 'verification_code',
                 'special_instructions', 'items', 'payment', 'order']

class DonationRequestSerializer(serializers.Serializer):
    listingId = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    specialInstructions = serializers.CharField(allow_blank=True, required=False)
    motivationMessage = serializers.CharField()
    verificationDocuments = serializers.ListField(
        child=serializers.URLField(), allow_empty=False
    )

class DonationDecisionSerializer(serializers.Serializer):
    rejectionReason = serializers.CharField(allow_blank=True, required=False)
