# analytics/views.py
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import UserAnalytics, Badge, UserBadge
from .services import AnalyticsService

def dashboard_view(request):
    """Main analytics dashboard view"""
    try:
        dashboard_data = AnalyticsService.get_user_dashboard_data(request.user)
        
        # Get user badges
        user_badges = UserBadge.objects.filter(user=request.user).select_related('badge')
        
        context = {
            'dashboard_data': dashboard_data,
            'user_badges': user_badges,
            'page_title': 'Analytics Dashboard'
        }
        
        return render(request, 'analytics/dashboard.html', context)
    
    except Exception as e:
        messages.error(request, f'Error loading dashboard: {str(e)}')
        return redirect('home')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_orders_per_month(request):
    """API endpoint for orders per month chart data"""
    try:
        months = int(request.GET.get('months', 12))
        data = AnalyticsService.get_orders_per_month_data(request.user, months)
        return JsonResponse({'data': data, 'success': True})
    
    except Exception as e:
        return JsonResponse({'error': str(e), 'success': False}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_sales_vs_donations(request):
    """API endpoint for sales vs donations chart data"""
    try:
        data = AnalyticsService.get_sales_vs_donations_data(request.user)
        return JsonResponse({'data': data, 'success': True})
    
    except Exception as e:
        return JsonResponse({'error': str(e), 'success': False}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_followers_over_time(request):
    """API endpoint for followers over time chart data"""
    try:
        months = int(request.GET.get('months', 6))
        data = AnalyticsService.get_followers_over_time_data(request.user, months)
        return JsonResponse({'data': data, 'success': True})
    
    except Exception as e:
        return JsonResponse({'error': str(e), 'success': False}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_leaderboard(request):
    """API endpoint for leaderboard data"""
    try:
        user_type = request.GET.get('user_type', 'all')
        period = request.GET.get('period', 'monthly')
        
        data = AnalyticsService.get_leaderboard_data(user_type, period)
        return JsonResponse({'data': data, 'success': True})
    
    except Exception as e:
        return JsonResponse({'error': str(e), 'success': False}, status=400)

def sustainability_impact_view(request):
    """Detailed sustainability impact view"""
    try:
        user_analytics, created = UserAnalytics.objects.get_or_create(
            user=request.user,
            defaults={'user_type': 'individual'}
        )
        
        # Calculate environmental impact
        meals_saved = user_analytics.meals_saved
        co2_reduced = user_analytics.co2_reduction_kg
        
        # Calculate equivalent metrics for better understanding
        equivalent_data = {
            'trees_planted': round(float(co2_reduced) * 0.06, 1),  # 1 tree absorbs ~16.5kg CO2/year
            'car_miles_offset': round(float(co2_reduced) * 2.31, 1),  # 1kg CO2 = ~2.31 miles
            'plastic_bottles_saved': meals_saved * 2,  # Estimate 2 bottles per meal
            'water_saved_liters': meals_saved * 50,  # Estimate 50L per meal
        }
        
        context = {
            'user_analytics': user_analytics,
            'equivalent_data': equivalent_data,
            'percentile_rank': user_analytics.get_percentile_rank(),
            'page_title': 'Sustainability Impact'
        }
        
        return render(request, 'analytics/sustainability_impact.html', context)
    
    except Exception as e:
        messages.error(request, f'Error loading sustainability data: {str(e)}')
        return redirect('analytics:dashboard')

def badges_view(request):
    """View all badges and achievements"""
    try:
        # Get user's earned badges
        earned_badges = UserBadge.objects.filter(user=request.user).select_related('badge')
        earned_badge_ids = [ub.badge.id for ub in earned_badges]
        
        # Get all available badges
        all_badges = Badge.objects.all()
        
        # Separate earned and unearned badges
        earned = [badge for badge in all_badges if badge.id in earned_badge_ids]
        unearned = [badge for badge in all_badges if badge.id not in earned_badge_ids]
        
        context = {
            'earned_badges': earned,
            'unearned_badges': unearned,
            'total_badges': len(earned),
            'page_title': 'Badges & Achievements'
        }
        
        return render(request, 'analytics/badges.html', context)
    
    except Exception as e:
        messages.error(request, f'Error loading badges: {str(e)}')
        return redirect('analytics:dashboard')

def leaderboard_view(request):
    """Leaderboard view for gamification"""
    try:
        user_type = request.GET.get('user_type', 'all')
        period = request.GET.get('period', 'monthly')
        
        leaderboard_data = AnalyticsService.get_leaderboard_data(user_type, period)
        
        # Find current user's position
        user_position = None
        for idx, entry in enumerate(leaderboard_data):
            if entry['username'] == request.user.username:
                user_position = idx + 1
                break
        
        context = {
            'leaderboard_data': leaderboard_data,
            'user_position': user_position,
            'current_user_type': user_type,
            'current_period': period,
            'page_title': 'Leaderboard'
        }
        
        return render(request, 'analytics/leaderboard.html', context)
    
    except Exception as e:
        messages.error(request, f'Error loading leaderboard: {str(e)}')
        return redirect('analytics:dashboard')

def detailed_analytics_view(request):
    """Detailed analytics view with all charts"""
    try:
        dashboard_data = AnalyticsService.get_user_dashboard_data(request.user)
        
        context = {
            'dashboard_data': dashboard_data,
            'page_title': 'Detailed Analytics'
        }
        
        return render(request, 'analytics/detailed_analytics.html', context)
    
    except Exception as e:
        messages.error(request, f'Error loading detailed analytics: {str(e)}')
        return redirect('analytics:dashboard')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_analytics(request):
    """Manual trigger to update analytics (for testing)"""
    try:
        transaction_data = {
            'type': 'purchase',
            'amount': 15.50,
            'meals_saved': 2,
            'co2_reduction': 1.0,
            'user_type': 'individual'
        }
        
        AnalyticsService.update_user_analytics(request.user, transaction_data)
        
        return JsonResponse({
            'success': True, 
            'message': 'Analytics updated successfully'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_dashboard_overview(request):
    """API endpoint for core dashboard overview stats"""
    try:
        data = AnalyticsService.get_user_dashboard_data(request.user)
        return JsonResponse({'data': data, 'success': True})
    except Exception as e:
        return JsonResponse({'error': str(e), 'success': False}, status=400)
