# admin_panel/services.py
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.conf import settings
from django.db.models import Count, Q, Avg
from datetime import datetime, timedelta
import secrets
import string
import logging


from notifications.services import NotificationService
from notifications.models import NotificationPreferences
from authentication.models import NGOProfile, FoodProviderProfile
from .models import AdminActionLog, SystemAnnouncement, PasswordReset, DocumentAccessLog, SystemLogEntry

User = get_user_model()
logger = logging.getLogger(__name__)

class AdminService:
    """Core admin service for common admin operations"""
    
    @staticmethod
    def log_admin_action(admin_user, action_type, target_type, target_id, description, metadata=None, ip_address=None):
        """Log an admin action for audit purposes"""
        return AdminActionLog.objects.create(
            admin_user=admin_user,
            action_type=action_type,
            target_type=target_type,
            target_id=str(target_id),
            action_description=description,
            metadata=metadata or {},
            ip_address=ip_address
        )
    
    @staticmethod
    def log_document_access(admin_user, document_type, profile_type, profile_id, document_name, ip_address=None):
        """Log document access for security audit"""
        return DocumentAccessLog.objects.create(
            admin_user=admin_user,
            document_type=document_type,
            profile_type=profile_type,
            profile_id=str(profile_id),
            document_name=document_name,
            ip_address=ip_address
        )

class VerificationService:
    """Handle user verification operations"""
    
    @staticmethod
    @transaction.atomic
    def update_verification_status(admin_user, profile_type, profile_id, new_status, reason="", ip_address=None):
        """Update verification status for NGO or Business profiles"""

        if profile_type == 'ngo':
            try:
                # Try to find by profile ID first
                try:
                    profile = NGOProfile.objects.select_for_update().get(id=profile_id)
                except NGOProfile.DoesNotExist:
                    # If not found, try to find by user ID
                    profile = NGOProfile.objects.select_for_update().get(user__UserID=profile_id)

                old_status = profile.status
                profile.status = new_status
                profile.save()

                # Log the action
                AdminService.log_admin_action(
                    admin_user=admin_user,
                    action_type='user_verification',
                    target_type='ngo_profile',
                    target_id=profile.id,  # Use the actual profile ID
                    description=f"Changed NGO verification status from {old_status} to {new_status}. Reason: {reason}",
                    metadata={
                        'old_status': old_status,
                        'new_status': new_status,
                        'reason': reason,
                        'organisation_name': profile.organisation_name,
                        'user_id': str(profile.user.UserID)
                    },
                    ip_address=ip_address
                )

                return profile

            except NGOProfile.DoesNotExist:
                raise ValueError(f"NGO profile with ID {profile_id} not found")

        elif profile_type == 'provider':
            try:
                # Try to find by profile ID first
                try:
                    profile = FoodProviderProfile.objects.select_for_update().get(id=profile_id)
                except FoodProviderProfile.DoesNotExist:
                    # If not found, try to find by user ID
                    profile = FoodProviderProfile.objects.select_for_update().get(user__UserID=profile_id)

                old_status = profile.status
                profile.status = new_status
                profile.save()

                # Log the action
                AdminService.log_admin_action(
                    admin_user=admin_user,
                    action_type='user_verification',
                    target_type='provider_profile',
                    target_id=profile.id,  # Use the actual profile ID
                    description=f"Changed Provider verification status from {old_status} to {new_status}. Reason: {reason}",
                    metadata={
                        'old_status': old_status,
                        'new_status': new_status,
                        'reason': reason,
                        'business_name': profile.business_name,
                        'user_id': str(profile.user.UserID)
                    },
                    ip_address=ip_address
                )

                return profile

            except FoodProviderProfile.DoesNotExist:
                raise ValueError(f"Provider profile with ID {profile_id} not found")
        else:
            raise ValueError(f"Invalid profile type: {profile_type}")
    
    @staticmethod
    def get_pending_verifications():
        """Get all pending verification requests"""
        pending_ngos = NGOProfile.objects.filter(
            status='pending_verification'
        ).select_related('user').order_by('-user__created_at')
        
        pending_providers = FoodProviderProfile.objects.filter(
            status='pending_verification'
        ).select_related('user').order_by('-user__created_at')
        
        return {
            'ngos': pending_ngos,
            'providers': pending_providers,
            'total_count': pending_ngos.count() + pending_providers.count()
        }

class PasswordResetService:
    """Enhanced password reset service using existing notification system"""
    
    @staticmethod
    def generate_temporary_password(length=12):
        """Generate a secure temporary password"""
        import string
        import secrets
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    @transaction.atomic
    def reset_user_password(admin_user, target_user, ip_address=None):
        """
        Reset user password and send email using existing notification system
        
        Args:
            admin_user: Admin user performing the reset
            target_user: User whose password is being reset
            ip_address: IP address for logging
            
        Returns:
            dict with reset details
        """
        from datetime import timedelta
        
        # Generate temporary password
        temp_password = PasswordResetService.generate_temporary_password()
        
        # Set expiry time (24 hours)
        expires_at = timezone.now() + timedelta(hours=24)
        
        # Update user password and set flags for temporary password
        target_user.set_password(temp_password)
        
        # Set temporary password flags if they exist on your User model
        if hasattr(target_user, 'password_must_change'):
            target_user.password_must_change = True
        if hasattr(target_user, 'has_temporary_password'):
            target_user.has_temporary_password = True
        if hasattr(target_user, 'temp_password_created_at'):
            target_user.temp_password_created_at = timezone.now()
        
        target_user.save()
        
        # Create password reset record if you have this model
        password_reset_data = {
            'target_user': target_user,
            'reset_by': admin_user,
            'expires_at': expires_at,
            'temp_password': temp_password  # Don't store this in production!
        }
        
        # Prepare email context
        from django.conf import settings
        context = {
            'user_name': NotificationService._get_user_display_name(target_user),
            'temp_password': temp_password,
            'login_url': f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/login",
            'expires_at': expires_at,
            'admin_name': admin_user.get_full_name() or admin_user.username
        }
        
        # Create in-app notification first
        notification = NotificationService.create_notification(
            recipient=target_user,
            notification_type='password_reset',
            title='Password Reset',
            message=f'Your password has been reset by an administrator. Please check your email for the temporary password.',
            sender=admin_user,
            data={
                'expires_at': expires_at.isoformat(),
                'reset_by_admin': True
            }
        )
        
        # Send email using existing notification system
        try:
            email_sent = NotificationService.send_email_notification(
                user=target_user,
                subject='Password Reset - Save n Bite',
                template_name='password_reset',
                context=context,
                notification=notification
            )
            
            if email_sent:
                # Log successful action using your existing AdminService
                try:
                    from .services import AdminService
                    AdminService.log_admin_action(
                        admin_user=admin_user,
                        action_type='password_reset',
                        target_type='user',
                        target_id=target_user.UserID,
                        description=f"Password reset for user {target_user.username}. Email sent successfully.",
                        metadata={
                            'target_email': target_user.email,
                            'expires_at': expires_at.isoformat(),
                            'email_sent': True
                        },
                        ip_address=ip_address
                    )
                except Exception as e:
                    logger.warning(f"Failed to log admin action: {str(e)}")
                
                logger.info(f"Password reset email sent successfully to {target_user.email}")
                
            else:
                raise Exception("Email sending returned False")
            
        except Exception as e:
            # Log failed email attempt
            logger.error(f"Failed to send password reset email to {target_user.email}: {str(e)}")
            
            try:
                from .services import AdminService
                AdminService.log_admin_action(
                    admin_user=admin_user,
                    action_type='password_reset',
                    target_type='user',
                    target_id=target_user.UserID,
                    description=f"Password reset for user {target_user.username}. Email failed to send: {str(e)}",
                    metadata={
                        'target_email': target_user.email,
                        'expires_at': expires_at.isoformat(),
                        'email_sent': False,
                        'error': str(e)
                    },
                    ip_address=ip_address
                )
            except Exception as log_error:
                logger.warning(f"Failed to log admin action: {str(log_error)}")
            
            # Re-raise the exception so the view can handle it
            raise Exception(f"Failed to send password reset email: {str(e)}")
        
        return {
            'user': target_user,
            'expires_at': expires_at,
            'email_sent': email_sent,
            'temp_password': temp_password  # Only for testing - remove in production
        }

class UserManagementService:
    """Handle user management operations"""
    
    @staticmethod
    @transaction.atomic
    def toggle_user_status(admin_user, target_user, ip_address=None):
        """Activate or deactivate a user account"""
        old_status = "active" if target_user.is_active else "inactive"
        target_user.is_active = not target_user.is_active
        target_user.save()
        
        new_status = "active" if target_user.is_active else "inactive"
        action = "activated" if target_user.is_active else "deactivated"
        
        # Log the action
        AdminService.log_admin_action(
            admin_user=admin_user,
            action_type='user_management',
            target_type='user',
            target_id=target_user.UserID,
            description=f"User {target_user.username} {action}",
            metadata={
                'old_status': old_status,
                'new_status': new_status,
                'action': action
            },
            ip_address=ip_address
        )
        
        return target_user

class DashboardService:
    """Generate dashboard statistics and analytics"""
    
    @staticmethod
    def get_dashboard_stats():
        """Get comprehensive dashboard statistics"""
        from food_listings.models import FoodListing
        from interactions.models import Interaction
        
        # Get date ranges
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        recent = now - timedelta(days=3)
        
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        recent_users = User.objects.filter(created_at__gte=week_ago).count()
        
        # Verification statistics
        pending_ngos = NGOProfile.objects.filter(status='pending_verification').count()
        pending_providers = FoodProviderProfile.objects.filter(status='pending_verification').count()
        total_pending = pending_ngos + pending_providers
        
        # Listing statistics
        total_listings = FoodListing.objects.count()
        active_listings = FoodListing.objects.filter(status='active').count()
        new_listings = FoodListing.objects.filter(created_at__gte=recent).count()
        
        # Transaction statistics (if available)
        try:
            total_transactions = Interaction.objects.count()
            completed_transactions = Interaction.objects.filter(status='completed').count()
            recent_transactions = Interaction.objects.filter(created_at__gte=week_ago).count()
        except:
            total_transactions = completed_transactions = recent_transactions = 0
        
        # The following is mocked and requires calculations 
        # Calculate percentage changes (mock data for now)
        user_growth = 12.5  # calculate this based on previous period
        listing_growth = 23.1
        transaction_growth = -4.5
        
        return {
            'users': {
                'total': total_users,
                'active': active_users,
                'recent_signups': recent_users,
                'growth_percentage': user_growth
            },
            'verifications': {
                'pending_total': total_pending,
                'pending_ngos': pending_ngos,
                'pending_providers': pending_providers
            },
            'listings': {
                'total': total_listings,
                'active': active_listings,
                'new_this_week': new_listings,
                'growth_percentage': listing_growth
            },
            'transactions': {
                'total': total_transactions,
                'completed': completed_transactions,
                'recent': recent_transactions,
                'growth_percentage': transaction_growth
            },
            'system_health': {
                'open_issues': SystemLogEntry.objects.filter(status='open').count(),
                'critical_issues': SystemLogEntry.objects.filter(
                    status='open', 
                    severity='critical'
                ).count()
            }
        }
    
    @staticmethod
    def get_recent_activity():
        """Get recent platform activity for dashboard"""
        from food_listings.models import FoodListing
        from interactions.models import Interaction
        
        activities = []
        
        # Recent user registrations
        recent_users = User.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-created_at')[:5]
        
        for user in recent_users:
            activities.append({
                'type': 'user_registration',
                'description': f"{user.get_full_name() or user.username} joined as {user.user_type}",
                'timestamp': user.created_at,
                'icon': 'user'
            })
        
        # Recent verification requests
        recent_verifications = list(NGOProfile.objects.filter(
            status='pending_verification',
            user__created_at__gte=timezone.now() - timedelta(hours=24)
        ).select_related('user')) + list(FoodProviderProfile.objects.filter(
            status='pending_verification',
            user__created_at__gte=timezone.now() - timedelta(hours=24)
        ).select_related('user'))
        
        for profile in recent_verifications:
            name = getattr(profile, 'organisation_name', None) or getattr(profile, 'business_name', '')
            activities.append({
                'type': 'verification_request',
                'description': f"{name} requested verification",
                'timestamp': profile.user.created_at,
                'icon': 'shield'
            })
        
        # Sort activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities[:10]  # Return last 10 activities

class SystemLogService:
    """Handle system logging and monitoring"""
    
    @staticmethod
    def create_system_log(severity, category, title, description, error_details=None):
        """Create a new system log entry"""
        return SystemLogEntry.objects.create(
            severity=severity,
            category=category,
            title=title,
            description=description,
            error_details=error_details or {}
        )
    
    @staticmethod
    def resolve_system_log(log_id, admin_user, resolution_notes=""):
        """Mark a system log as resolved"""
        try:
            log_entry = SystemLogEntry.objects.get(id=log_id)
            log_entry.status = 'resolved'
            log_entry.resolved_by = admin_user
            log_entry.resolved_at = timezone.now()
            log_entry.resolution_notes = resolution_notes
            log_entry.save()
            
            # Log the admin action
            AdminService.log_admin_action(
                admin_user=admin_user,
                action_type='system_management',
                target_type='system_log',
                target_id=log_id,
                description=f"Resolved system log: {log_entry.title}",
                metadata={
                    'resolution_notes': resolution_notes,
                    'severity': log_entry.severity
                }
            )
            
            return log_entry
        except SystemLogEntry.DoesNotExist:
            raise ValueError(f"System log with ID {log_id} not found")
        
class AdminNotificationService:
    """Service for admin-initiated custom notifications using existing notification system"""
    
    @staticmethod
    @transaction.atomic
    def send_custom_notification(admin_user, subject, body, target_audience, ip_address=None):
        """
        Send custom notification to specified user groups using existing NotificationService
        
        Args:
            admin_user: The admin user sending the notification
            subject: Email subject line
            body: Email/notification body content
            target_audience: 'all', 'customers', 'businesses', 'organisations'
            ip_address: Admin's IP address for logging
        
        Returns:
            dict: Statistics about the notification sending
        """
        
        # Get target users based on audience selection
        target_users = AdminNotificationService._get_target_users(target_audience)
        
        stats = {
            'total_users': len(target_users),
            'notifications_sent': 0,
            'emails_sent': 0,
            'emails_failed': 0,
            'target_audience': target_audience
        }
        
        # Log the admin action using your existing AdminService
        try:
            from .services import AdminService  # Import your existing AdminService
            AdminService.log_admin_action(
                admin_user=admin_user,
                action_type='custom_notification',
                target_type='notification',
                target_id=None,
                description=f"Sent custom notification to {target_audience}: {subject}",
                metadata={
                    'subject': subject,
                    'target_audience': target_audience,
                    'total_recipients': stats['total_users']
                },
                ip_address=ip_address
            )
        except Exception as e:
            logger.warning(f"Failed to log admin action: {str(e)}")
        
        # Send notifications to each target user using existing NotificationService
        for user in target_users:
            try:
                # Create in-app notification using existing service
                notification = NotificationService.create_notification(
                    recipient=user,
                    notification_type='admin_announcement',
                    title=subject,
                    message=body,
                    sender=admin_user,
                    data={
                        'is_admin_message': True,
                        'target_audience': target_audience,
                        'sent_at': timezone.now().isoformat()
                    }
                )
                stats['notifications_sent'] += 1
                
                # Send email using existing email notification system
                try:
                    email_sent = NotificationService.send_email_notification(
                        user=user,
                        subject=f"Save n Bite - {subject}",
                        template_name='admin_custom_notification',
                        context={
                            'user_name': NotificationService._get_user_display_name(user),
                            'subject': subject,
                            'body': body,
                            'admin_name': admin_user.get_full_name() or admin_user.username,
                            'user_type': user.user_type
                        },
                        notification=notification
                    )
                    
                    if email_sent:
                        stats['emails_sent'] += 1
                    else:
                        stats['emails_failed'] += 1
                        logger.warning(f"Email sending returned False for user {user.email}")
                        
                except Exception as e:
                    logger.error(f"Failed to send email to {user.email}: {str(e)}")
                    stats['emails_failed'] += 1
                    
            except Exception as e:
                logger.error(f"Failed to create notification for {user.email}: {str(e)}")
                stats['emails_failed'] += 1
        
        logger.info(f"Custom notification sent by {admin_user.email}. Stats: {stats}")
        return stats
    
    @staticmethod
    def _get_target_users(target_audience):
        """Get list of users based on target audience"""
        
        if target_audience == 'all':
            return User.objects.filter(is_active=True).exclude(user_type='admin')
        
        elif target_audience == 'customers':
            return User.objects.filter(
                user_type='customer',
                is_active=True
            )
        
        elif target_audience == 'businesses':
            return User.objects.filter(
                user_type='provider',
                is_active=True
            )
        
        elif target_audience == 'organisations':
            return User.objects.filter(
                user_type='ngo',
                is_active=True
            )
        
        else:
            raise ValueError(f"Invalid target audience: {target_audience}")
    
    @staticmethod
    def get_notification_statistics(target_audience=None):
        """Get statistics about notification delivery for a specific audience"""
        
        from notifications.models import Notification, EmailNotificationLog
        
        # Base queryset for admin notifications
        notifications_query = Notification.objects.filter(
            notification_type='admin_announcement'
        )
        
        emails_query = EmailNotificationLog.objects.filter(
            template_name='admin_custom_notification'
        )
        
        # Filter by audience if specified
        if target_audience and target_audience != 'all':
            if target_audience == 'customers':
                notifications_query = notifications_query.filter(recipient__user_type='customer')
                emails_query = emails_query.filter(recipient_user__user_type='customer')
            elif target_audience == 'businesses':
                notifications_query = notifications_query.filter(recipient__user_type='provider')
                emails_query = emails_query.filter(recipient_user__user_type='provider')
            elif target_audience == 'organisations':
                notifications_query = notifications_query.filter(recipient__user_type='ngo')
                emails_query = emails_query.filter(recipient_user__user_type='ngo')
        
        return {
            'total_notifications': notifications_query.count(),
            'read_notifications': notifications_query.filter(is_read=True).count(),
            'total_emails': emails_query.count(),
            'successful_emails': emails_query.filter(status='sent').count(),
            'failed_emails': emails_query.filter(status='failed').count(),
            'recent_notifications': notifications_query.order_by('-created_at')[:10]
        }