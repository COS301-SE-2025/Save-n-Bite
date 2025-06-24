from rest_framework import serializers
from .models import UserAnalytics, MonthlyAnalytics, TransactionAnalytics, Badge, UserBadge
from django.contrib.auth import get_user_model

User = get_user_model()

class MonthlyAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyAnalytics
        fields = ['year', 'month', 'orders_count', 'total_sales', 'donations_given',
                  'new_followers', 'meals_saved_monthly', 'co2_reduced_monthly']

class SalesDonationsSerializer(serializers.Serializer):
    sales = serializers.DictField()
    donations = serializers.DictField()

class UserAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnalytics
        fields = ['total_orders', 'total_donations_given', 'total_followers', 
                  'average_rating', 'total_reviews', 'meals_saved', 
                  'co2_reduction_kg', 'total_badges']

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'criteria_type', 'criteria_value']

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer()
    
    class Meta:
        model = UserBadge
        fields = ['badge', 'awarded_at']

class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    username = serializers.CharField()
    meals_saved = serializers.IntegerField()
    co2_reduced = serializers.FloatField()
    badges = serializers.IntegerField()

class ChangeSerializer(serializers.Serializer):
    percentage = serializers.FloatField()
    direction = serializers.ChoiceField(choices=['increase', 'decrease', 'stable'])

class DashboardOverviewSerializer(serializers.Serializer):
    total_orders = serializers.DictField(child=serializers.FloatField())
    donations = serializers.DictField(child=serializers.FloatField())
    followers = serializers.DictField(child=serializers.FloatField())
    average_rating = serializers.DictField()
    sustainability_impact = serializers.DictField()
    percentile_rank = serializers.FloatField()
