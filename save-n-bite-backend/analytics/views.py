from django.db.models import Count, Sum, Q, F
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from interactions.models import Interaction
from notifications.models import BusinessFollower
from authentication.models import FoodProviderProfile

class BusinessAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        business = FoodProviderProfile.objects.get(user=user)

        today = datetime.today()
        start_of_month = today.replace(day=1)
        start_of_last_month = (start_of_month - relativedelta(months=1))

        interactions = Interaction.objects.filter(business=business, status='completed')

        # --- Total Orders Fulfilled
        current_orders = interactions.filter(created_at__gte=start_of_month).count()
        last_month_orders = interactions.filter(created_at__gte=start_of_last_month, created_at__lt=start_of_month).count()
        order_change = self._percent_change(current_orders, last_month_orders)

        # --- Donations
        current_donations = interactions.filter(interaction_type='Donation', created_at__gte=start_of_month).count()
        last_month_donations = interactions.filter(interaction_type='Donation', created_at__gte=start_of_last_month, created_at__lt=start_of_month).count()
        donation_change = self._percent_change(current_donations, last_month_donations)

        # --- Followers
        current_followers = BusinessFollower.objects.filter(business=business, created_at__gte=start_of_month).count()
        last_month_followers = BusinessFollower.objects.filter(business=business, created_at__gte=start_of_last_month, created_at__lt=start_of_month).count()
        total_followers = BusinessFollower.objects.filter(business=business).count()
        follower_change = self._percent_change(current_followers, last_month_followers)

        # --- Orders per Month (last 6 months)
        six_months_ago = start_of_month - relativedelta(months=5)
        monthly_orders = (
            interactions.filter(created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        # --- Sales vs Donations Split
        sales_count = interactions.filter(interaction_type='Purchase').count()
        donation_count = interactions.filter(interaction_type='Donation').count()

        # --- New Followers Over Time (last 6 months)
        follower_growth = (
            BusinessFollower.objects.filter(business=business, created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        # --- Sustainability Impact (Meals & Water Saved)
        meals_saved = interactions.aggregate(total=Sum('quantity'))['total'] or 0

        water_saved_litres = meals_saved * 500  # Example metric: 500L per meal

        # --- Top % Badge (percentile of fulfilled orders)
        all_businesses = FoodProviderProfile.objects.all()
        business_order_counts = [
            (b.id, Interaction.objects.filter(business=b, status='completed', created_at__gte=start_of_month).count())
            for b in all_businesses
        ]
        business_order_counts.sort(key=lambda x: x[1], reverse=True)
        total_businesses = len(business_order_counts)
        rank = [i for i, (bid, _) in enumerate(business_order_counts) if bid == business.id][0] + 1
        top_percent = round((rank / total_businesses) * 100, 2)

        return Response({
            "total_orders_fulfilled": current_orders,
            "order_change_percent": order_change,
            "donations": current_donations,
            "donation_change_percent": donation_change,
            "total_followers": total_followers,
            "follower_change_percent": follower_change,
            "orders_per_month": list(monthly_orders),
            "sales_vs_donations": {
                "sales": sales_count,
                "donations": donation_count
            },
            "follower_growth": list(follower_growth),
            "sustainability_impact": {
                "meals_saved": meals_saved,
                "estimated_water_saved_litres": water_saved_litres
            },
            "top_saver_badge_percent": top_percent
        })

    def _percent_change(self, current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 2)
