# reviews/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Review, ReviewModerationLog, ReviewHelpfulness, BusinessReviewStats
from interactions.models import Interaction
from authentication.models import FoodProviderProfile

User = get_user_model()

class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews"""
    interaction_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Review
        fields = [
            'interaction_id', 'general_rating', 'general_comment',
            'food_review', 'business_review', 'review_source'
        ]
        extra_kwargs = {
            'general_rating': {'required': False, 'allow_null': True},
            'general_comment': {'required': False, 'allow_blank': True, 'allow_null': True},
            'food_review': {'required': False, 'allow_blank': True, 'allow_null': True},
            'business_review': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
    
    def validate_interaction_id(self, value):
        """Validate that the interaction exists and belongs to the current user"""
        user = self.context['request'].user
        
        try:
            interaction = Interaction.objects.get(id=value, user=user)
        except Interaction.DoesNotExist:
            raise serializers.ValidationError("Interaction not found or doesn't belong to you")
        
        # Check if interaction is completed
        if interaction.status != 'completed':
            raise serializers.ValidationError("Can only review completed interactions")
        
        # Check if review already exists
        if hasattr(interaction, 'review'):
            raise serializers.ValidationError("Review already exists for this interaction")
        
        return value
    
    def validate(self, attrs):
        """Ensure at least one review field is provided"""
        if not any([
            attrs.get('general_rating'),
            attrs.get('general_comment', '').strip(),
            attrs.get('food_review', '').strip(),
            attrs.get('business_review', '').strip()
        ]):
            raise serializers.ValidationError(
                "At least one review field (rating, general comment, food review, or business review) must be provided."
            )
        return attrs
    
    def create(self, validated_data):
        interaction_id = validated_data.pop('interaction_id')
        interaction = Interaction.objects.get(id=interaction_id)
        
        review = Review.objects.create(
            interaction=interaction,
            reviewer=self.context['request'].user,
            **validated_data
        )
        return review


class ReviewUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating existing reviews"""
    
    class Meta:
        model = Review
        fields = [
            'general_rating', 'general_comment',
            'food_review', 'business_review'
        ]
        extra_kwargs = {
            'general_rating': {'required': False, 'allow_null': True},
            'general_comment': {'required': False, 'allow_blank': True, 'allow_null': True},
            'food_review': {'required': False, 'allow_blank': True, 'allow_null': True},
            'business_review': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
    
    def validate(self, attrs):
        """Ensure at least one review field is provided after update"""
        # Get current instance values
        instance = self.instance
        
        # Check what the values would be after update
        general_rating = attrs.get('general_rating', instance.general_rating)
        general_comment = attrs.get('general_comment', instance.general_comment or '').strip()
        food_review = attrs.get('food_review', instance.food_review or '').strip()
        business_review = attrs.get('business_review', instance.business_review or '').strip()
        
        if not any([general_rating, general_comment, food_review, business_review]):
            raise serializers.ValidationError(
                "At least one review field must have content"
            )
        
        return attrs


class ReviewerInfoSerializer(serializers.ModelSerializer):
    """Serializer for reviewer information in review displays"""
    name = serializers.SerializerMethodField()
    user_type = serializers.CharField()
    
    class Meta:
        model = User
        fields = ['id', 'name', 'user_type']
    
    def get_name(self, obj):
        if obj.user_type == 'customer' and hasattr(obj, 'customer_profile'):
            return obj.customer_profile.full_name
        elif obj.user_type == 'ngo' and hasattr(obj, 'ngo_profile'):
            return obj.ngo_profile.organisation_name
        return obj.email.split('@')[0].title()


class BusinessInfoSerializer(serializers.ModelSerializer):
    """Serializer for business information in review displays"""
    
    class Meta:
        model = FoodProviderProfile
        fields = ['id', 'business_name', 'business_email']


class ReviewDisplaySerializer(serializers.ModelSerializer):
    """Serializer for displaying reviews to users"""
    reviewer = ReviewerInfoSerializer(read_only=True)
    business = BusinessInfoSerializer(read_only=True)
    interaction_details = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'general_rating', 'general_comment', 'food_review', 'business_review',
            'review_source', 'created_at', 'updated_at', 'time_ago',
            'reviewer', 'business', 'interaction_details'
        ]
    
    def get_interaction_details(self, obj):
        return {
            'id': str(obj.interaction.id),
            'type': obj.interaction_type,
            'total_amount': float(obj.interaction_total_amount),
            'food_items': obj.food_items_snapshot
        }
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class BusinessReviewListSerializer(serializers.ModelSerializer):
    """Serializer for business owners to view reviews of their business"""
    reviewer = ReviewerInfoSerializer(read_only=True)
    interaction_details = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'general_rating', 'general_comment', 'food_review', 'business_review',
            'review_source', 'created_at', 'time_ago', 'reviewer', 'interaction_details'
        ]
    
    def get_interaction_details(self, obj):
        return {
            'id': str(obj.interaction.id),
            'type': obj.interaction_type,
            'total_amount': float(obj.interaction_total_amount),
            'completed_at': obj.interaction.completed_at.isoformat() if obj.interaction.completed_at else None,
            'food_items_count': len(obj.food_items_snapshot)
        }
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class BusinessReviewStatsSerializer(serializers.ModelSerializer):
    """Serializer for business review statistics"""
    rating_distribution = serializers.ReadOnlyField()
    rating_breakdown = serializers.SerializerMethodField()
    
    class Meta:
        model = BusinessReviewStats
        fields = [
            'total_reviews', 'average_rating', 'highest_rating', 'lowest_rating',
            'reviews_this_month', 'reviews_this_week', 'rating_distribution',
            'rating_breakdown', 'last_updated'
        ]
    
    def get_rating_breakdown(self, obj):
        return {
            '5_star': obj.rating_5_count,
            '4_star': obj.rating_4_count,
            '3_star': obj.rating_3_count,
            '2_star': obj.rating_2_count,
            '1_star': obj.rating_1_count,
        }


class ReviewModerationSerializer(serializers.ModelSerializer):
    """Serializer for admin review moderation"""
    reviewer = ReviewerInfoSerializer(read_only=True)
    business = BusinessInfoSerializer(read_only=True)
    moderated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'general_rating', 'general_comment', 'food_review', 'business_review',
            'status', 'moderation_notes', 'moderated_by_name', 'moderated_at',
            'created_at', 'updated_at', 'reviewer', 'business'
        ]
    
    def get_moderated_by_name(self, obj):
        if obj.moderated_by:
            return obj.moderated_by.email
        return None


class ReviewModerationActionSerializer(serializers.Serializer):
    """Serializer for moderation actions"""
    action = serializers.ChoiceField(choices=['flag', 'censor', 'delete', 'restore'])
    reason = serializers.CharField(max_length=500)
    moderation_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)


# Removed ReviewHelpfulnessSerializer since helpfulness voting is not needed


class InteractionReviewStatusSerializer(serializers.Serializer):
    """Serializer to check if an interaction can be reviewed"""
    interaction_id = serializers.UUIDField()
    can_review = serializers.BooleanField(read_only=True)
    has_review = serializers.BooleanField(read_only=True)
    review_id = serializers.UUIDField(read_only=True, allow_null=True)
    interaction_status = serializers.CharField(read_only=True)
    completed_at = serializers.DateTimeField(read_only=True, allow_null=True)


class ReviewSummarySerializer(serializers.Serializer):
    """Serializer for review summaries and analytics"""
    total_reviews_written = serializers.IntegerField()
    average_rating_given = serializers.DecimalField(max_digits=3, decimal_places=2)
    reviews_this_month = serializers.IntegerField()
    most_reviewed_business = serializers.CharField()
    recent_reviews = ReviewDisplaySerializer(many=True)