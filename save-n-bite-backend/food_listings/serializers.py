# food_listings/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FoodListing
import base64
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)
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
        try:
            if hasattr(obj, 'provider_profile') and obj.provider_profile.logo:
                return obj.provider_profile.logo.url
        except Exception as e:
            logger.error(f"Error getting provider logo: {str(e)}")
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
        
        # UPDATED: Handle image upload to blob storage
        if image_data:
            try:
                # Use the new blob storage method
                image_url = listing.add_image_from_base64(image_data)
                logger.info(f"Successfully uploaded image for food listing {listing.name}: {image_url}")
                
            except Exception as e:
                logger.error(f"Failed to upload image for food listing {listing.name}: {str(e)}")
                # Don't fail listing creation for image upload errors
        
        return listing


class FoodListingSerializer(serializers.ModelSerializer):
    """Serializer for displaying food listings"""
    provider = ProviderInfoSerializer(read_only=True)
    savings = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    imageUrl = serializers.SerializerMethodField()
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodListing
        fields = [
            'id', 'name', 'description', 'food_type', 'original_price',
            'discounted_price', 'savings', 'discount_percentage', 'quantity',
            'quantity_available', 'expiry_date', 'pickup_window', 'imageUrl',
            'allergens', 'dietary_info', 'status', 'is_available',
            'provider', 'created_at', 'updated_at', 'image_count'
        ]
    
    def get_imageUrl(self, obj):
        """Get the primary image URL from blob storage"""
        try:
            return obj.get_primary_image()
        except Exception as e:
            logger.error(f"Error getting primary image for listing {obj.id}: {str(e)}")
            return None
        
    def get_image_count(self, obj):
        """Get the number of images"""
        try:
            return obj.get_image_count()
        except Exception:
            return 0


class FoodListingDetailSerializer(FoodListingSerializer):
    """Detailed serializer for individual listing view with all images"""
    provider = ProviderInfoSerializer(read_only=True)
    all_images = serializers.SerializerMethodField()
    
    class Meta(FoodListingSerializer.Meta):
        fields = FoodListingSerializer.Meta.fields + ['all_images']
    
    def get_all_images(self, obj):
        """Get all image URLs from blob storage"""
        try:
            if isinstance(obj.images, list):
                return obj.images
            return []
        except Exception as e:
            logger.error(f"Error getting all images for listing {obj.id}: {str(e)}")
            return []


class FoodListingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating food listings with blob storage support"""
    imageUrl = serializers.CharField(required=False, allow_blank=True, write_only=True)
    replace_images = serializers.BooleanField(default=False, write_only=True)
    
    class Meta:
        model = FoodListing
        fields = [
            'name', 'description', 'food_type', 'original_price',
            'discounted_price', 'quantity', 'expiry_date', 'pickup_window',
            'imageUrl', 'allergens', 'dietary_info', 'status', 'replace_images'
        ]
    
    def update(self, instance, validated_data):
        # Handle image update
        image_data = validated_data.pop('imageUrl', None)
        replace_images = validated_data.pop('replace_images', False)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # UPDATED: Handle image replacement or addition in blob storage
        if image_data:
            try:
                if replace_images:
                    # Remove all existing images first
                    if isinstance(instance.images, list):
                        for image_url in instance.images[:]:  # Create a copy to iterate
                            instance.remove_image(image_url)
                
                # Add new image
                image_url = instance.add_image_from_base64(image_data)
                logger.info(f"Successfully {'replaced' if replace_images else 'added'} image for food listing {instance.name}: {image_url}")
                
            except Exception as e:
                logger.error(f"Failed to update image for food listing {instance.name}: {str(e)}")
                # Don't fail update for image upload errors
        
        instance.save()
        return instance
    
class FoodListingDeleteSerializer(serializers.Serializer):
    """Optional serializer for delete confirmation"""
    confirm_deletion = serializers.BooleanField(default=True)
    deletion_reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
