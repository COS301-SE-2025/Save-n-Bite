from rest_framework import serializers

class MonthlyCountSerializer(serializers.Serializer):
    month = serializers.DateField()
    count = serializers.IntegerField()

class AnalyticsResponseSerializer(serializers.Serializer):
    total_orders_fulfilled = serializers.IntegerField()
    order_change_percent = serializers.FloatField()
    donations = serializers.IntegerField()
    donation_change_percent = serializers.FloatField()
    total_followers = serializers.IntegerField()
    follower_change_percent = serializers.FloatField()
    orders_per_month = MonthlyCountSerializer(many=True)
    sales_vs_donations = serializers.DictField()
    follower_growth = MonthlyCountSerializer(many=True)
    sustainability_impact = serializers.DictField()
    top_saver_badge_percent = serializers.FloatField()
