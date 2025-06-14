# food_listings/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FoodListing
import base64
from django.core.files.base import ContentFile

User = get_user_model()

class ProviderInfoSerializer(serializers.ModelSerializer):
    """Serializer for provider information in listings"""
    business_name = serializers.CharField(source='provider_profile.business_name', read_only=True)
    business_address = serializers.CharField(source='provider_profile.business_address', read_only=True)
    logo = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'business_name', 'business_address', 'logo']
    
    def get_logo(self, obj):
        if hasattr(obj, 'provider_profile') and obj.provider_profile.logo:
            return obj.provider_profile.logo.url
        return None


class FoodListingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating food listings"""
    imageUrl = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = FoodListing
        fields = [
            'name', 'description', 'food_type', 'original_price', 
            'discounted_price', 'quantity', 'expiry_date', 
            'pickup_window', 'imageUrl', 'allergens', 'dietary_info'
        ]
    
    def create(self, validated_data):
        # Get the authenticated user (provider)
        provider = self.context['request'].user
        
        # Handle image upload
        image_data = validated_data.pop('imageUrl', None)
        
        # Create the listing
        listing = FoodListing.objects.create(
            provider=provider,
            **validated_data
        )
        
        # Handle image if provided
        if image_data:
            try:
                # Assuming base64 encoded image
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1]
                # For now, we'll just store the URL in the images JSON field
                # In production, you'd upload to cloud storage
                listing.images = [image_data]  # Store as URL or base64
                listing.save()
            except Exception as e:
                pass  # Handle image upload error gracefully
        
        return listing


class FoodListingSerializer(serializers.ModelSerializer):
    """Serializer for displaying food listings"""
    provider = ProviderInfoSerializer(read_only=True)
    savings = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    imageUrl = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodListing
        fields = [
            'id', 'name', 'description', 'food_type', 'original_price',
            'discounted_price', 'savings', 'discount_percentage', 'quantity',
            'quantity_available', 'expiry_date', 'pickup_window', 'imageUrl',
            'allergens', 'dietary_info', 'status', 'is_available',
            'provider', 'created_at', 'updated_at'
        ]
    
    def get_imageUrl(self, obj):
        if obj.images and len(obj.images) > 0:
            return obj.images[0]  # Return first image
        return None


class FoodListingDetailSerializer(FoodListingSerializer):
    """Detailed serializer for individual listing view"""
    provider = ProviderInfoSerializer(read_only=True)
    images = serializers.JSONField(read_only=True)
    
    class Meta(FoodListingSerializer.Meta):
        fields = FoodListingSerializer.Meta.fields + ['images']


class FoodListingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating food listings"""
    imageUrl = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = FoodListing
        fields = [
            'name', 'description', 'food_type', 'original_price',
            'discounted_price', 'quantity', 'expiry_date', 'pickup_window',
            'imageUrl', 'allergens', 'dietary_info', 'status'
        ]
    
    def update(self, instance, validated_data):
        # Handle image update
        image_data = validated_data.pop('imageUrl', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle image if provided
        if image_data:
            try:
                instance.images = [image_data]
            except Exception as e:
                pass
        
        instance.save()
        return instance