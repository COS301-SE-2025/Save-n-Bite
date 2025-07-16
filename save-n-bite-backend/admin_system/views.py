# admin_panel/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Count, Q, Avg
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
import csv
import logging

from .permissions import IsSystemAdmin, CanModerateContent, CanManageUsers
from .services import (
    AdminService, VerificationService, PasswordResetService, 
    UserManagementService, DashboardService, SystemLogService, AdminNotificationService
)
from .serializers import (
    AdminDashboardSerializer, RecentActivitySerializer, UserListSerializer,
    VerificationRequestSerializer, VerificationUpdateSerializer, PasswordResetSerializer,
    UserToggleSerializer, AdminActionLogSerializer, SystemAnnouncementSerializer,
    CreateAnnouncementSerializer, SystemLogSerializer, ResolveSystemLogSerializer,
    SimpleAnalyticsSerializer, DataExportSerializer,
    CustomNotificationSerializer, 
    NotificationStatsSerializer,
    NotificationAnalyticsSerializer
)
from .models import AdminActionLog, SystemAnnouncement, SystemLogEntry
from authentication.models import NGOProfile, FoodProviderProfile

User = get_user_model()
logger = logging.getLogger(__name__)

def get_client_ip(request):
    """Helper function to get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

# ==================== DASHBOARD VIEWS ====================

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def admin_dashboard(request):
    """Get admin dashboard overview with stats and recent activity"""
    try:
        # Get dashboard statistics
        stats = DashboardService.get_dashboard_stats()
        
        # Get recent activity
        recent_activity = DashboardService.get_recent_activity()
        
        return Response({
            'dashboard': stats,
            'recent_activity': recent_activity,
            'admin_info': {
                'name': request.user.get_full_name() or request.user.username,
                'email': request.user.email,
                'permissions': {
                    'can_moderate': True,
                    'can_manage_users': True,
                    'is_super_admin': request.user.is_superuser
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return Response({
            'error': {
                'code': 'DASHBOARD_ERROR',
                'message': 'Failed to load dashboard data'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================== USER MANAGEMENT VIEWS ====================

@api_view(['GET'])
@permission_classes([CanManageUsers])
def get_all_users(request):
    """Get all users with filtering and pagination"""
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        user_type = request.GET.get('user_type', '')
        status_filter = request.GET.get('status', '')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        # Build query
        queryset = User.objects.select_related(
            'customer_profile', 'ngo_profile', 'provider_profile'
        ).all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(customer_profile__full_name__icontains=search) |
                Q(ngo_profile__organisation_name__icontains=search) |
                Q(provider_profile__business_name__icontains=search)
            )
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)
            
        if status_filter:
            is_active = status_filter.lower() == 'active'
            queryset = queryset.filter(is_active=is_active)
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        # Paginate
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        # Serialize
        serializer = UserListSerializer(page_obj.object_list, many=True)
        
        return Response({
            'users': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'per_page': per_page
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get users error: {str(e)}")
        return Response({
            'error': {
                'code': 'USERS_FETCH_ERROR',
                'message': 'Failed to fetch users'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([CanManageUsers])
def toggle_user_status(request):
    """Activate or deactivate a user account"""
    serializer = UserToggleSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid data provided',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        target_user = User.objects.get(UserID=serializer.validated_data['user_id'])
        
        # Toggle user status
        updated_user = UserManagementService.toggle_user_status(
            admin_user=request.user,
            target_user=target_user,
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'message': f"User {updated_user.username} {'activated' if updated_user.is_active else 'deactivated'} successfully",
            'user': {
                'id': str(updated_user.UserID),
                'username': updated_user.username,
                'is_active': updated_user.is_active
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': {
                'code': 'USER_NOT_FOUND',
                'message': 'User not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Toggle user status error: {str(e)}")
        return Response({
            'error': {
                'code': 'TOGGLE_STATUS_ERROR',
                'message': 'Failed to update user status'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([CanManageUsers])
def reset_user_password(request):
    """Reset user password using existing notification system"""
    
    serializer = PasswordResetSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid data provided',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        target_user = User.objects.get(UserID=serializer.validated_data['user_id'])
        
        # Generate temporary password
        import string
        import secrets
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        
        # Set expiry time (24 hours)
        from datetime import timedelta
        expires_at = timezone.now() + timedelta(hours=24)
        
        # Update user password
        target_user.set_password(temp_password)
        target_user.password_must_change = True
        target_user.has_temporary_password = True
        target_user.temp_password_created_at = timezone.now() 
        target_user.save()
        
        # Import your existing NotificationService
        from notifications.services import NotificationService
        
        # Create in-app notification
        notification = NotificationService.create_notification(
            recipient=target_user,
            notification_type='password_reset',
            title='Password Reset',
            message='Your password has been reset by an administrator. Please check your email for the temporary password.',
            sender=request.user,
            data={
                'expires_at': expires_at.isoformat(),
                'reset_by_admin': True
            }
        )
        
        # Prepare email context
        from django.conf import settings
        context = {
            'user_name': target_user.get_full_name() or target_user.username,
            'temp_password': temp_password,
            'login_url': f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/login",
            'expires_at': expires_at,
            'admin_name': request.user.get_full_name() or request.user.username
        }
        
        # Send email using existing notification system
        email_sent = NotificationService.send_email_notification(
            user=target_user,
            subject='Password Reset - Save n Bite',
            template_name='password_reset',
            context=context,
            notification=notification
        )
        
        if email_sent:
            # Log successful action
            AdminService.log_admin_action(
                admin_user=request.user,
                action_type='password_reset',
                target_type='user',
                target_id=target_user.UserID,
                description=f"Password reset for user {target_user.username}. Email sent successfully.",
                metadata={
                    'target_email': target_user.email,
                    'expires_at': expires_at.isoformat(),
                    'email_sent': True
                },
                ip_address=get_client_ip(request)
            )
            
            return Response({
                'message': f"Password reset for {target_user.username}. Email sent successfully to {target_user.email}",
                'reset_info': {
                    'user_email': target_user.email,
                    'expires_at': expires_at.isoformat(),
                    'email_sent': True
                }
            }, status=status.HTTP_200_OK)
        else:
            raise Exception("Email sending returned False")
            
    except User.DoesNotExist:
        return Response({
            'error': {
                'code': 'USER_NOT_FOUND',
                'message': 'User not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        return Response({
            'error': {
                'code': 'PASSWORD_RESET_ERROR',
                'message': f'Failed to reset password: {str(e)}'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================== VERIFICATION VIEWS ====================

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def get_pending_verifications(request):
    """Get all pending user verifications"""
    try:
        verifications = VerificationService.get_pending_verifications()
        
        # Format NGO data
        ngo_data = []
        for ngo in verifications['ngos']:
            ngo_data.append({
                'id': str(ngo.id),
                'type': 'ngo',
                'name': ngo.organisation_name,
                'email': ngo.organisation_email,
                'contact': ngo.organisation_contact,
                'address': f"{ngo.address_line1}, {ngo.city}",
                'representative': ngo.representative_name,
                'created_at': ngo.user.created_at.isoformat(),
                'documents': {
                    'npo_document': ngo.npo_document.url if ngo.npo_document else None,
                    'logo': ngo.organisation_logo.url if ngo.organisation_logo else None
                }
            })
        
        # Format Provider data
        provider_data = []
        for provider in verifications['providers']:
            provider_data.append({
                'id': str(provider.id),
                'type': 'provider',
                'name': provider.business_name,
                'email': provider.business_email,
                'contact': provider.business_contact,
                'address': provider.business_address,
                'created_at': provider.user.created_at.isoformat(),
                'documents': {
                    'cipc_document': provider.cipc_document.url if provider.cipc_document else None,
                    'logo': provider.logo.url if provider.logo else None
                }
            })
        
        return Response({
            'pending_verifications': {
                'ngos': ngo_data,
                'providers': provider_data,
                'total_count': verifications['total_count']
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get verifications error: {str(e)}")
        return Response({
            'error': {
                'code': 'VERIFICATIONS_FETCH_ERROR',
                'message': 'Failed to fetch verification requests'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsSystemAdmin])
def update_verification_status(request):
    """Update verification status for NGO or Provider"""
    serializer = VerificationUpdateSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid data provided',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        updated_profile = VerificationService.update_verification_status(
            admin_user=request.user,
            profile_type=serializer.validated_data['profile_type'],
            profile_id=serializer.validated_data['profile_id'],
            new_status=serializer.validated_data['new_status'],
            reason=serializer.validated_data.get('reason', ''),
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'message': 'Verification status updated successfully',
            'profile': {
                'id': str(updated_profile.id),
                'type': serializer.validated_data['profile_type'],
                'status': updated_profile.status,
                'name': (updated_profile.organisation_name if hasattr(updated_profile, 'organisation_name') 
                        else updated_profile.business_name)
            }
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': str(e)
            }
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Update verification error: {str(e)}")
        return Response({
            'error': {
                'code': 'VERIFICATION_UPDATE_ERROR',
                'message': 'Failed to update verification status'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================== AUDIT LOG VIEWS ====================

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def get_admin_action_logs(request):
    """Get admin action logs with filtering"""
    try:
        # Get query parameters
        action_type = request.GET.get('action_type')
        admin_user_id = request.GET.get('admin_user')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        search = request.GET.get('search', '')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        # Build query
        queryset = AdminActionLog.objects.select_related('admin_user').all()
        
        # Apply filters
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        if admin_user_id:
            queryset = queryset.filter(admin_user_id=admin_user_id)
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        if search:
            queryset = queryset.filter(
                Q(action_description__icontains=search) |
                Q(admin_user__username__icontains=search)
            )
        
        # Paginate
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        # Serialize
        serializer = AdminActionLogSerializer(page_obj.object_list, many=True)
        
        return Response({
            'logs': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'per_page': per_page
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get audit logs error: {str(e)}")
        return Response({
            'error': {
                'code': 'AUDIT_LOGS_ERROR',
                'message': 'Failed to fetch audit logs'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================== SYSTEM LOG VIEWS ====================

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def get_system_logs(request):
    """Get system logs with filtering"""
    try:
        # Get query parameters
        severity = request.GET.get('severity')
        status_filter = request.GET.get('status')
        category = request.GET.get('category')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        # Build query
        queryset = SystemLogEntry.objects.select_related('resolved_by').all()
        
        # Apply filters
        if severity:
            queryset = queryset.filter(severity=severity)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if category:
            queryset = queryset.filter(category=category)
        
        # Paginate
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        # Serialize
        serializer = SystemLogSerializer(page_obj.object_list, many=True)
        
        return Response({
            'logs': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            },
            'summary': {
                'total_open': SystemLogEntry.objects.filter(status='open').count(),
                'total_critical': SystemLogEntry.objects.filter(severity='critical', status='open').count()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get system logs error: {str(e)}")
        return Response({
            'error': {
                'code': 'SYSTEM_LOGS_ERROR',
                'message': 'Failed to fetch system logs'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsSystemAdmin])
def resolve_system_log(request):
    """Mark a system log as resolved"""
    serializer = ResolveSystemLogSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid data provided',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        resolved_log = SystemLogService.resolve_system_log(
            log_id=serializer.validated_data['log_id'],
            admin_user=request.user,
            resolution_notes=serializer.validated_data.get('resolution_notes', '')
        )
        
        return Response({
            'message': 'System log resolved successfully',
            'log': {
                'id': str(resolved_log.id),
                'title': resolved_log.title,
                'status': resolved_log.status,
                'resolved_at': resolved_log.resolved_at.isoformat()
            }
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': {
                'code': 'LOG_NOT_FOUND',
                'message': str(e)
            }
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Resolve system log error: {str(e)}")
        return Response({
            'error': {
                'code': 'RESOLVE_LOG_ERROR',
                'message': 'Failed to resolve system log'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================== ANALYTICS VIEWS ====================

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def get_simple_analytics(request):
    """Get simple analytics for admin dashboard"""
    try:
        from food_listings.models import FoodListing
        from interactions.models import Interaction
        
        # Calculate date ranges
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # User analytics
        total_users = User.objects.count()
        new_users_week = User.objects.filter(created_at__gte=week_ago).count()
        new_users_month = User.objects.filter(created_at__gte=month_ago).count()
        
        # Calculate user growth (simplified)
        prev_month_users = User.objects.filter(
            created_at__lt=month_ago,
            created_at__gte=month_ago - timedelta(days=30)
        ).count()
        user_growth = ((new_users_month - prev_month_users) / max(prev_month_users, 1)) * 100
        
        # Listing analytics
        try:
            total_listings = FoodListing.objects.count()
            active_listings = FoodListing.objects.filter(status='active').count()
            new_listings_week = FoodListing.objects.filter(created_at__gte=week_ago).count()
            
            prev_week_listings = FoodListing.objects.filter(
                created_at__lt=week_ago,
                created_at__gte=week_ago - timedelta(days=7)
            ).count()
            listing_growth = ((new_listings_week - prev_week_listings) / max(prev_week_listings, 1)) * 100
        except:
            total_listings = active_listings = new_listings_week = listing_growth = 0
        
        # Transaction analytics
        try:
            total_transactions = Interaction.objects.count()
            completed_transactions = Interaction.objects.filter(status='completed').count()
            success_rate = (completed_transactions / max(total_transactions, 1)) * 100
        except:
            total_transactions = completed_transactions = success_rate = 0
        
        # User distribution
        user_counts = User.objects.values('user_type').annotate(count=Count('user_type'))
        user_distribution = {}
        for item in user_counts:
            percentage = (item['count'] / max(total_users, 1)) * 100
            user_distribution[item['user_type']] = f"{percentage:.1f}%"
        
        # Top providers (simplified)
        try:
            top_providers = FoodProviderProfile.objects.filter(
                status='verified'
            ).select_related('user')[:5]
            
            top_providers_data = []
            for provider in top_providers:
                listing_count = FoodListing.objects.filter(provider=provider.user).count()
                top_providers_data.append({
                    'name': provider.business_name,
                    'listings': listing_count
                })
        except:
            top_providers_data = []
        
        analytics_data = {
            'total_users': total_users,
            'new_users_week': new_users_week,
            'new_users_month': new_users_month,
            'user_growth_percentage': round(user_growth, 1),
            
            'total_listings': total_listings,
            'active_listings': active_listings,
            'new_listings_week': new_listings_week,
            'listing_growth_percentage': round(listing_growth, 1),
            
            'total_transactions': total_transactions,
            'completed_transactions': completed_transactions,
            'transaction_success_rate': round(success_rate, 1),
            
            'user_distribution': user_distribution,
            'top_providers': top_providers_data
        }
        
        serializer = SimpleAnalyticsSerializer(data=analytics_data)
        if serializer.is_valid():
            return Response({
                'analytics': serializer.validated_data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'analytics': analytics_data  # Return raw data if serializer fails
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        return Response({
            'error': {
                'code': 'ANALYTICS_ERROR',
                'message': 'Failed to generate analytics'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================== DATA EXPORT VIEWS ====================

@api_view(['POST'])
@permission_classes([IsSystemAdmin])
def export_data(request):
    """Export data to CSV format"""
    serializer = DataExportSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid export parameters',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        export_type = serializer.validated_data['export_type']
        date_from = serializer.validated_data.get('date_from')
        date_to = serializer.validated_data.get('date_to')
        
        # Create HTTP response with CSV content type
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{export_type}_export_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        
        if export_type == 'users':
            # Export users
            writer.writerow(['ID', 'Username', 'Email', 'User Type', 'Active', 'Created At'])
            
            queryset = User.objects.all()
            if date_from:
                queryset = queryset.filter(created_at__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__lte=date_to)
            
            for user in queryset:
                writer.writerow([
                    str(user.UserID),
                    user.username,
                    user.email,
                    user.user_type,
                    'Yes' if user.is_active else 'No',
                    user.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
        
        elif export_type == 'analytics':
            # Export analytics summary
            stats = DashboardService.get_dashboard_stats()
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Total Users', stats['users']['total']])
            writer.writerow(['Active Users', stats['users']['active']])
            writer.writerow(['Total Listings', stats['listings']['total']])
            writer.writerow(['Active Listings', stats['listings']['active']])
            writer.writerow(['Total Transactions', stats['transactions']['total']])
            writer.writerow(['Completed Transactions', stats['transactions']['completed']])
        
        # Log the export action
        AdminService.log_admin_action(
            admin_user=request.user,
            action_type='data_export',
            target_type=export_type,
            target_id='N/A',
            description=f"Exported {export_type} data",
            metadata={
                'export_type': export_type,
                'date_from': str(date_from) if date_from else None,
                'date_to': str(date_to) if date_to else None
            },
            ip_address=get_client_ip(request)
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Data export error: {str(e)}")
        return Response({
            'error': {
                'code': 'EXPORT_ERROR',
                'message': 'Failed to export data'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@permission_classes([IsSystemAdmin])
def send_custom_notification(request):
    """Send custom notification to specified user groups using existing notification system"""
    
    serializer = CustomNotificationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid data provided',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Send the notification using existing system
        stats = AdminNotificationService.send_custom_notification(
            admin_user=request.user,
            subject=serializer.validated_data['subject'],
            body=serializer.validated_data['body'],
            target_audience=serializer.validated_data['target_audience'],
            ip_address=get_client_ip(request)
        )
        
        # Serialize response stats
        stats_serializer = NotificationStatsSerializer(stats)
        
        return Response({
            'message': 'Notification sent successfully using existing notification system',
            'stats': stats_serializer.data
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': {
                'code': 'INVALID_AUDIENCE',
                'message': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Custom notification error: {str(e)}")
        return Response({
            'error': {
                'code': 'NOTIFICATION_ERROR',
                'message': 'Failed to send notification'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def get_notification_analytics(request):
    """Get analytics data for admin notifications"""
    
    try:
        target_audience = request.GET.get('target_audience')
        
        analytics_data = AdminNotificationService.get_notification_statistics(
            target_audience=target_audience
        )
        
        serializer = NotificationAnalyticsSerializer(analytics_data)
        
        return Response({
            'analytics': serializer.data,
            'filters': {
                'target_audience': target_audience or 'all'
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Notification analytics error: {str(e)}")
        return Response({
            'error': {
                'code': 'ANALYTICS_ERROR',
                'message': 'Failed to retrieve notification analytics'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def get_audience_counts(request):
    """Get user counts for each audience type"""
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        audience_counts = {
            'all': User.objects.filter(is_active=True).exclude(user_type='admin').count(),
            'customers': User.objects.filter(user_type='customer', is_active=True).count(),
            'businesses': User.objects.filter(user_type='provider', is_active=True).count(),
            'organisations': User.objects.filter(user_type='ngo', is_active=True).count()
        }
        
        return Response({
            'audience_counts': audience_counts
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Audience counts error: {str(e)}")
        return Response({
            'error': {
                'code': 'AUDIENCE_COUNT_ERROR',
                'message': 'Failed to retrieve audience counts'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def get_audience_counts(request):
    """Get user counts for each audience type"""
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        audience_counts = {
            'all': User.objects.filter(is_active=True).exclude(user_type='admin').count(),
            'customers': User.objects.filter(user_type='customer', is_active=True).count(),
            'businesses': User.objects.filter(user_type='provider', is_active=True).count(),
            'organisations': User.objects.filter(user_type='ngo', is_active=True).count()
        }
        
        return Response({
            'audience_counts': audience_counts
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Audience counts error: {str(e)}")
        return Response({
            'error': {
                'code': 'AUDIENCE_COUNT_ERROR',
                'message': 'Failed to retrieve audience counts'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)