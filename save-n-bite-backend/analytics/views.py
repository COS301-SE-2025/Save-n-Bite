from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from dateutil.relativedelta import relativedelta
from django.utils import timezone

from interactions.models import Order
from notifications.models import BusinessFollower
from authentication.models import FoodProviderProfile

class BusinessAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            business = FoodProviderProfile.objects.get(user=user)
        except FoodProviderProfile.DoesNotExist:
            return Response({"error": "Business profile not found"}, status=404)

        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_of_month = start_of_month + relativedelta(months=1)
        start_of_last_month = start_of_month - relativedelta(months=1)
        six_months_ago = start_of_month - relativedelta(months=5)

        # Filtered orders
        current_month_orders = Order.objects.filter(
            interaction__business=business, 
            status='completed',
            created_at__gte=start_of_month, 
            created_at__lt=end_of_month
        )
        
        last_month_orders = Order.objects.filter(
            interaction__business=business, 
            status='completed',
            created_at__gte=start_of_last_month, 
            created_at__lt=start_of_month
        )

        current_orders_count = current_month_orders.count()
        last_orders_count = last_month_orders.count()

        current_donations = current_month_orders.filter(interaction__interaction_type='Donation').count()
        last_donations = last_month_orders.filter(interaction__interaction_type='Donation').count()

        order_change = self._percent_change(current_orders_count, last_orders_count)
        donation_change = self._percent_change(current_donations, last_donations)

        current_followers = BusinessFollower.objects.filter(
            business=business,
            created_at__gte=start_of_month,
            created_at__lt=end_of_month
        ).count()
        last_followers = BusinessFollower.objects.filter(
            business=business,
            created_at__gte=start_of_last_month,
            created_at__lt=start_of_month
        ).count()
        total_followers = BusinessFollower.objects.filter(business=business).count()
        follower_change = self._percent_change(current_followers, last_followers)

        # Monthly orders (last 6 months)
        monthly_orders_qs = Order.objects.filter(
            interaction__business=business, 
            status='completed',
            created_at__gte=six_months_ago
        ).annotate(month=TruncMonth('created_at'))\
         .values('month').annotate(count=Count('id')).order_by('month')

        monthly_orders_dict = {entry['month']: entry['count'] for entry in monthly_orders_qs}
        monthly_orders_list = []
        for i in range(6):
            month = start_of_month - relativedelta(months=5 - i)
            monthly_orders_list.append({
                'month': month,
                'count': monthly_orders_dict.get(month, 0)
            })

        # Sales vs Donations (all-time)
        all_completed_orders = Order.objects.filter(
            interaction__business=business, 
            status='completed'
        )
        sales_count = all_completed_orders.filter(interaction__interaction_type='Purchase').count()
        donation_count = all_completed_orders.filter(interaction__interaction_type='Donation').count()

        # Follower growth
        follower_growth_qs = BusinessFollower.objects.filter(
            business=business,
            created_at__gte=six_months_ago
        ).annotate(month=TruncMonth('created_at'))\
         .values('month').annotate(count=Count('id')).order_by('month')

        follower_growth_dict = {entry['month']: entry['count'] for entry in follower_growth_qs}
        follower_growth_list = []
        for i in range(6):
            month = start_of_month - relativedelta(months=5 - i)
            follower_growth_list.append({
                'month': month,
                'count': follower_growth_dict.get(month, 0)
            })

        # Sustainability impact
        meals_saved = sales_count + donation_count
        water_saved_litres = meals_saved * 500

        # Top % badge
        all_businesses = FoodProviderProfile.objects.all()
        order_counts = []
        for b in all_businesses:
            total_qty = Order.objects.filter(
                interaction__business=b,
                status='completed',
                created_at__gte=start_of_month,
                created_at__lt=end_of_month
            ).count()
            order_counts.append((b.id, total_qty))
        
        order_counts.sort(key=lambda x: x[1], reverse=True) 

        rank = next((i for i, (bid, _) in enumerate(order_counts) if bid == business.id), 0) + 1
        top_percent = round((rank / len(order_counts)) * 100, 2) if order_counts else 100.0

        return Response({
            "total_orders_fulfilled": current_orders_count,
            "order_change_percent": order_change,
            "donations": current_donations,
            "donation_change_percent": donation_change,
            "total_followers": total_followers,
            "follower_change_percent": follower_change,
            "orders_per_month": monthly_orders_list,
            "sales_vs_donations": {
                "sales": sales_count,
                "donations": donation_count
            },
            "follower_growth": follower_growth_list,
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