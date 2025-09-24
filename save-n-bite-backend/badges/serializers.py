# badges/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import BadgeType, ProviderBadge, BadgeLeaderboard, ProviderBadgeStats

User = get_user_model()


class BadgeTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for badge types (public information)
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    rarity_display = serializers.CharField(source='get_rarity_display', read_only=True)
    
    class Meta:
        model = BadgeType
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'rarity', 'rarity_display', 'svg_filename', 'criteria_description',
            'display_order'
        ]


class ProviderBadgeSerializer(serializers.ModelSerializer):
    """
    Serializer for provider badges with badge type details
    """
    badge_type = BadgeTypeSerializer(read_only=True)
    earned_date_formatted = serializers.SerializerMethodField()
    month_year_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ProviderBadge
        fields = [
            'id', 'badge_type', 'earned_date', 'earned_date_formatted',
            'earned_reason', 'badge_data', 'is_pinned', 'pin_order',
            'month', 'year', 'month_year_display'
        ]
        read_only_fields = ['earned_date', 'earned_reason', 'badge_data']
    
    def get_earned_date_formatted(self, obj):
        """Format the earned date in a readable format"""
        return obj.earned_date.strftime("%B %d, %Y")
    
    def get_month_year_display(self, obj):
        """Display month/year for monthly badges"""
        if obj.month and obj.year:
            from calendar import month_name
            return f"{month_name[obj.month]} {obj.year}"
        return None


class ProviderBadgeStatsSerializer(serializers.ModelSerializer):
    """
    Serializer for provider badge statistics
    """
    rarity_score = serializers.SerializerMethodField()
    first_badge_formatted = serializers.SerializerMethodField()
    latest_badge_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ProviderBadgeStats
        fields = [
            'total_badges', 'performance_badges', 'milestone_badges',
            'recognition_badges', 'monthly_badges', 'special_badges',
            'common_badges', 'uncommon_badges', 'rare_badges',
            'epic_badges', 'legendary_badges', 'pinned_badges_count',
            'first_badge_earned', 'first_badge_formatted',
            'latest_badge_earned', 'latest_badge_formatted',
            'rarity_score'
        ]
    
    def get_rarity_score(self, obj):
        """Calculate rarity score"""
        return obj.get_rarity_score()
    
    def get_first_badge_formatted(self, obj):
        """Format first badge date"""
        if obj.first_badge_earned:
            return obj.first_badge_earned.strftime("%B %d, %Y")
        return None
    
    def get_latest_badge_formatted(self, obj):
        """Format latest badge date"""
        if obj.latest_badge_earned:
            return obj.latest_badge_earned.strftime("%B %d, %Y")
        return None


class BadgePinSerializer(serializers.Serializer):
    """
    Serializer for pinning/unpinning badges
    """
    badge_id = serializers.UUIDField()
    pin_action = serializers.ChoiceField(choices=['pin', 'unpin'])
    
    def validate_badge_id(self, value):
        """Validate that the badge exists and belongs to the requesting user"""
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("User authentication required")
        
        try:
            badge = ProviderBadge.objects.get(id=value, provider=request.user)
            return value
        except ProviderBadge.DoesNotExist:
            raise serializers.ValidationError("Badge not found or doesn't belong to you")


class ProviderBadgeProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying badges on provider profiles (public view)
    """
    badge_type = BadgeTypeSerializer(read_only=True)
    earned_date_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ProviderBadge
        fields = [
            'id', 'badge_type', 'earned_date_formatted', 'badge_data'
        ]
    
    def get_earned_date_formatted(self, obj):
        return obj.earned_date.strftime("%B %Y")  # More concise for public display


class BadgeLeaderboardSerializer(serializers.ModelSerializer):
    """
    Serializer for badge leaderboards
    """
    first_place_name = serializers.SerializerMethodField()
    second_place_name = serializers.SerializerMethodField()
    third_place_name = serializers.SerializerMethodField()
    month_year_display = serializers.SerializerMethodField()
    leaderboard_type_display = serializers.CharField(source='get_leaderboard_type_display', read_only=True)
    
    class Meta:
        model = BadgeLeaderboard
        fields = [
            'id', 'leaderboard_type', 'leaderboard_type_display',
            'month', 'year', 'month_year_display',
            'first_place_name', 'first_place_value',
            'second_place_name', 'second_place_value',
            'third_place_name', 'third_place_value',
            'calculated_at', 'is_finalized'
        ]
    
    def get_first_place_name(self, obj):
        if obj.first_place and hasattr(obj.first_place, 'provider_profile'):
            return obj.first_place.provider_profile.business_name
        return None
    
    def get_second_place_name(self, obj):
        if obj.second_place and hasattr(obj.second_place, 'provider_profile'):
            return obj.second_place.provider_profile.business_name
        return None
    
    def get_third_place_name(self, obj):
        if obj.third_place and hasattr(obj.third_place, 'provider_profile'):
            return obj.third_place.provider_profile.business_name
        return None
    
    def get_month_year_display(self, obj):
        from calendar import month_name
        return f"{month_name[obj.month]} {obj.year}"


class ProviderBadgeSummarySerializer(serializers.Serializer):
    """
    Serializer for provider badge summary (for dashboard/profile overview)
    """
    provider_name = serializers.CharField()
    provider_id = serializers.UUIDField()
    total_badges = serializers.IntegerField()
    pinned_badges = ProviderBadgeProfileSerializer(many=True)
    recent_badges = ProviderBadgeSerializer(many=True)
    stats = ProviderBadgeStatsSerializer()
    categories = serializers.DictField()


class BadgeLeaderboardRankingSerializer(serializers.Serializer):
    """
    Serializer for public badge leaderboard rankings
    """
    rank = serializers.IntegerField()
    provider_name = serializers.CharField()
    provider_id = serializers.UUIDField()
    total_badges = serializers.IntegerField()
    rarity_score = serializers.IntegerField()
    latest_badge_date = serializers.DateTimeField()
    badge_breakdown = serializers.DictField()


class BadgeEarnedNotificationSerializer(serializers.Serializer):
    """
    Serializer for badge earned notifications
    """
    badge_id = serializers.UUIDField()
    badge_name = serializers.CharField()
    badge_description = serializers.CharField()
    badge_category = serializers.CharField()
    badge_rarity = serializers.CharField()
    earned_date = serializers.DateTimeField()
    svg_filename = serializers.CharField()