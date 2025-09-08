from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
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
    """Generate dashboard statistics and analytics with accurate data"""
    
    @staticmethod
    def get_dashboard_stats():
        """Get comprehensive dashboard statistics with actual data - FIXED"""
        
        # Get date ranges
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        recent = now - timedelta(days=3)
        
        # User statistics with accurate counts - FIXED
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        recent_users = User.objects.filter(created_at__gte=week_ago).count()
        
        # Calculate previous period for growth
        prev_month_users = User.objects.filter(
            created_at__lt=month_ago,
            created_at__gte=month_ago - timedelta(days=30)
        ).count()
        user_growth = ((recent_users - prev_month_users) / max(prev_month_users, 1)) * 100 if prev_month_users > 0 else 100.0
        
        # Verification statistics with proper queries - FIXED
        pending_ngos = NGOProfile.objects.filter(status='pending_verification').count()
        pending_providers = FoodProviderProfile.objects.filter(status='pending_verification').count()
        total_pending = pending_ngos + pending_providers
        
        # Listing statistics with actual data - FIXED
        try:
            from food_listings.models import FoodListing
            total_listings = FoodListing.objects.count()
            active_listings = FoodListing.objects.filter(status='active').count()
            new_listings = FoodListing.objects.filter(created_at__gte=recent).count()
            
            # Calculate listing growth
            prev_week_listings = FoodListing.objects.filter(
                created_at__lt=recent,
                created_at__gte=recent - timedelta(days=3)
            ).count()
            listing_growth = ((new_listings - prev_week_listings) / max(prev_week_listings, 1)) * 100 if prev_week_listings > 0 else 0.0
        except Exception as e:
            logger.warning(f"Error fetching listing stats: {e}")
            total_listings = active_listings = new_listings = listing_growth = 0
        
        # Transaction statistics with proper error handling - FIXED
        try:
            from interactions.models import Interaction
            total_transactions = Interaction.objects.count()
            completed_transactions = Interaction.objects.filter(status='completed').count()
            recent_transactions = Interaction.objects.filter(created_at__gte=week_ago).count()
            
            # Calculate previous period for growth
            prev_week_transactions = Interaction.objects.filter(
                created_at__lt=week_ago,
                created_at__gte=week_ago - timedelta(days=7)
            ).count()
            transaction_growth = ((recent_transactions - prev_week_transactions) / max(prev_week_transactions, 1)) * 100 if prev_week_transactions > 0 else 0.0
        except Exception as e:
            logger.warning(f"Error fetching transaction stats: {e}")
            total_transactions = completed_transactions = recent_transactions = transaction_growth = 0
        
        # System health with actual issue counts - FIXED
        try:
            open_issues = SystemLogEntry.objects.filter(status='open').count()
            critical_issues = SystemLogEntry.objects.filter(
                status='open', 
                severity='critical'
            ).count()
        except Exception as e:
            logger.warning(f"Error fetching system health: {e}")
            open_issues = critical_issues = 0
        
        return {
            'users': {
                'total': total_users,
                'active': active_users,
                'recent_signups': recent_users,
                'growth_percentage': round(user_growth, 1)
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
                'growth_percentage': round(listing_growth, 1)
            },
            'transactions': {
                'total': total_transactions,
                'completed': completed_transactions,
                'recent': recent_transactions,
                'growth_percentage': round(transaction_growth, 1)
            },
            'system_health': {
                'open_issues': open_issues,
                'critical_issues': critical_issues
            }
        }
    
    @staticmethod
    def get_recent_activity():
        """Get recent platform activity for dashboard - FIXED"""
        from food_listings.models import FoodListing
        from interactions.models import Interaction
        
        activities = []
        
        # Recent user registrations - FIXED
        recent_users = User.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-created_at')[:5]
        
        for user in recent_users:
            display_name = user.get_full_name() or user.username
            activities.append({
                'type': 'user_registration',
                'description': f"{display_name} joined as {user.user_type}",
                'timestamp': user.created_at,
                'icon': 'user'
            })
        
        # Recent verification requests - FIXED
        try:
            recent_ngos = NGOProfile.objects.filter(
                status='pending_verification',
                user__created_at__gte=timezone.now() - timedelta(hours=24)
            ).select_related('user')[:3]
            
            recent_providers = FoodProviderProfile.objects.filter(
                status='pending_verification',
                user__created_at__gte=timezone.now() - timedelta(hours=24)
            ).select_related('user')[:3]
            
            for profile in list(recent_ngos) + list(recent_providers):
                name = getattr(profile, 'organisation_name', None) or getattr(profile, 'business_name', 'Unknown')
                activities.append({
                    'type': 'verification_request',
                    'description': f"{name} requested verification",
                    'timestamp': profile.user.created_at,
                    'icon': 'shield'
                })
        except Exception as e:
            logger.warning(f"Error fetching verification requests: {e}")
        
        # Recent listings - FIXED
        try:
            recent_listings = FoodListing.objects.filter(
                created_at__gte=timezone.now() - timedelta(hours=24)
            ).select_related('provider')[:3]
            
            for listing in recent_listings:
                provider_name = "Unknown Provider"
                if hasattr(listing.provider, 'provider_profile'):
                    provider_name = listing.provider.provider_profile.business_name
                
                activities.append({
                    'type': 'new_listing',
                    'description': f"New listing: {listing.name} by {provider_name}",
                    'timestamp': listing.created_at,
                    'icon': 'package'
                })
        except Exception as e:
            logger.warning(f"Error fetching recent listings: {e}")
        
        # Sort activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities[:10]  # Return last 10 activities

class SystemLogService:
    """Enhanced system logging with anomaly detection"""
    
    @staticmethod
    def create_system_log(severity, category, title, description, error_details=None):
        """Create a new system log entry with email notifications for critical issues"""
        try:
            log_entry = SystemLogEntry.objects.create(
                severity=severity,
                category=category,
                title=title,
                description=description,
                error_details=error_details or {}
            )
            
            # Send email notification for critical/error/warning logs
            if severity in ['critical', 'error', 'warning']:
                SystemLogService._send_critical_log_email_notification(log_entry)
            
            # Check for anomalies when creating critical/error logs
            if severity in ['critical', 'error']:
                try:
                    AnomalyDetectionService.check_for_anomalies_and_alert()
                except Exception as e:
                    logger.warning(f"Error checking anomalies: {e}")
            
            return log_entry
            
        except Exception as e:
            logger.error(f"Failed to create system log: {str(e)}")
            return None
        
        @staticmethod
        def _send_critical_log_email_notification(log_entry):
            """Send email notification for critical system logs to all admin users"""
            try:
                from notifications.services import NotificationService
                from django.contrib.auth import get_user_model
                from django.conf import settings
                
                User = get_user_model()
                
                # Get all admin users
                admin_users = User.objects.filter(
                    admin_rights=True,
                    is_active=True,
                    email__isnull=False
                ).exclude(email='')
                
                if not admin_users.exists():
                    logger.warning("No admin users found to send system log notifications")
                    return
                
                # Prepare email context
                admin_panel_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/admin/system-logs"
                
                for admin_user in admin_users:
                    try:
                        # Create in-app notification
                        notification = NotificationService.create_notification(
                            recipient=admin_user,
                            notification_type='system_announcement',
                            title=f"System Alert: {log_entry.severity.upper()} - {log_entry.title}",
                            message=f"A {log_entry.severity} system issue has been detected: {log_entry.description}",
                            data={
                                'log_entry_id': str(log_entry.id),
                                'severity': log_entry.severity,
                                'category': log_entry.category,
                                'log_title': log_entry.title,
                                'admin_panel_url': admin_panel_url
                            }
                        )
                        
                        # Prepare email context
                        email_context = {
                            'admin_name': admin_user.get_full_name() or admin_user.username,
                            'severity': log_entry.severity,
                            'category': log_entry.category,
                            'title': log_entry.title,
                            'description': log_entry.description,
                            'timestamp': log_entry.timestamp,
                            'error_details': log_entry.error_details if log_entry.error_details else None,
                            'admin_panel_url': admin_panel_url,
                            'company_name': 'Save n Bite',
                            'support_email': 'savenbite@gmail.com'
                        }
                        
                        # Format error details for email if they exist
                        if log_entry.error_details:
                            try:
                                import json
                                email_context['error_details'] = json.dumps(log_entry.error_details, indent=2)
                            except:
                                email_context['error_details'] = str(log_entry.error_details)
                        
                        # Send critical email (bypasses user preferences)
                        email_sent = NotificationService.send_critical_email_notification(
                            user=admin_user,
                            subject=f"[{log_entry.severity.upper()}] Save n Bite System Alert - {log_entry.title}",
                            template_name='system_log_alert',
                            context=email_context,
                            notification=notification
                        )
                        
                        if email_sent:
                            logger.info(f"System log alert email sent to admin {admin_user.email}")
                        else:
                            logger.error(f"Failed to send system log alert email to admin {admin_user.email}")
                            
                    except Exception as e:
                        logger.error(f"Failed to send system log notification to {admin_user.email}: {e}")
                        
            except Exception as e:
                logger.error(f"Error sending critical log email notifications: {e}")

    
    @staticmethod
    def check_for_anomalies_and_alert():
        """Check for anomalies and create alerts"""
        try:
            anomalies = AnomalyDetectionService.detect_anomalies()
            
            # Create system log entries for detected anomalies
            for anomaly in anomalies:
                if anomaly['severity'] in ['Critical', 'High']:
                    SystemLogService.create_anomaly_alert(anomaly)
                    
        except Exception as e:
            logger.error(f"Error checking anomalies: {e}")
    
    @staticmethod
    def create_anomaly_alert(anomaly):
        """Create system log alert for detected anomaly"""
        SystemLogEntry.objects.create(
            severity='warning' if anomaly['severity'] == 'Medium' else 'critical',
            category='security',
            title=f"Anomaly Detected: {anomaly['type']}",
            description=anomaly['description'],
            error_details={
                'anomaly_type': anomaly['type'],
                'severity': anomaly['severity'],
                'affected_resource': anomaly.get('affected_resource', 'Unknown'),
                'detection_time': anomaly.get('timestamp', timezone.now()).isoformat()
            }
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
        
    @staticmethod  
    def create_system_log(severity, category, title, description, error_details=None):
        """Create system log entry and send notification if critical"""
        log_entry = SystemLogEntry.objects.create(
            severity=severity,
            category=category, 
            title=title,
            description=description,
            error_details=error_details or {}
        )
        
        # Send email notification for critical/error/warning logs
        if severity in ['critical', 'error', 'warning']:
            SystemLogService.send_critical_log_notification(log_entry)
        
        return log_entry
        
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
    
class SimpleAnalyticsService:
    """Enhanced analytics with proper data handling - FIXED"""
    
    @staticmethod
    def get_analytics_data():
        """Get comprehensive analytics data - CRASH FIXED"""
        try:
            from food_listings.models import FoodListing
        except ImportError:
            FoodListing = None
            
        try:
            from interactions.models import Interaction
        except ImportError:
            Interaction = None
        
        # Calculate date ranges
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # User analytics with proper distribution - FIXED
        total_users = User.objects.count()
        new_users_week = User.objects.filter(created_at__gte=week_ago).count()
        new_users_month = User.objects.filter(created_at__gte=month_ago).count()
        
        # Calculate user growth
        prev_month_users = User.objects.filter(
            created_at__lt=month_ago,
            created_at__gte=month_ago - timedelta(days=30)
        ).count()
        user_growth = ((new_users_month - prev_month_users) / max(prev_month_users, 1)) * 100
        
        # FIXED: User distribution with actual counts and percentages
        user_distribution = {}
        if total_users > 0:
            # Get actual user type counts
            user_type_counts = User.objects.values('user_type').annotate(count=Count('user_type'))
            
            for item in user_type_counts:
                user_type = item['user_type'] or 'unknown'
                count = item['count']
                percentage = (count / total_users) * 100
                user_distribution[user_type] = f"{percentage:.1f}%"
            
            # Ensure all expected user types are represented
            for user_type in ['customer', 'provider', 'ngo']:
                if user_type not in user_distribution:
                    user_distribution[user_type] = "0.0%"
        else:
            user_distribution = {
                'customer': "0.0%",
                'provider': "0.0%", 
                'ngo': "0.0%"
            }
        
        # Listing analytics
        if FoodListing:
            try:
                total_listings = FoodListing.objects.count()
                active_listings = FoodListing.objects.filter(status='active').count()
                new_listings_week = FoodListing.objects.filter(created_at__gte=week_ago).count()
                
                prev_week_listings = FoodListing.objects.filter(
                    created_at__lt=week_ago,
                    created_at__gte=week_ago - timedelta(days=7)
                ).count()
                listing_growth = ((new_listings_week - prev_week_listings) / max(prev_week_listings, 1)) * 100
            except Exception as e:
                logger.warning(f"Error in listing analytics: {e}")
                total_listings = active_listings = new_listings_week = listing_growth = 0
        else:
            total_listings = active_listings = new_listings_week = listing_growth = 0
        
        # Transaction analytics
        if Interaction:
            try:
                total_transactions = Interaction.objects.count()
                completed_transactions = Interaction.objects.filter(status='completed').count()
                success_rate = (completed_transactions / max(total_transactions, 1)) * 100
            except Exception as e:
                logger.warning(f"Error in transaction analytics: {e}")
                total_transactions = completed_transactions = success_rate = 0
        else:
            total_transactions = completed_transactions = success_rate = 0
        
        # SIMPLIFIED: Top providers without transactions (avoiding the complex query for now)
        top_providers_data = []
        try:
            # Get verified providers
            providers = FoodProviderProfile.objects.filter(
                status='verified'
            ).select_related('user')[:5]
            
            for provider in providers:
                try:
                    listing_count = 0
                    transaction_count = 0
                    completed_transaction_count = 0
                    
                    # Get listing count
                    if FoodListing:
                        listing_count = FoodListing.objects.filter(
                            provider=provider.user
                        ).count()
                    
                    # CORRECTED: Query transactions using the FoodProviderProfile instance directly
                    if Interaction:
                        try:
                            # The business field expects a FoodProviderProfile instance, not User
                            transaction_count = Interaction.objects.filter(
                                business=provider  # Use the provider (FoodProviderProfile) directly
                            ).count()
                            
                            completed_transaction_count = Interaction.objects.filter(
                                business=provider,  # Use the provider (FoodProviderProfile) directly
                                status='completed'
                            ).count()
                            
                            print(f"Provider {provider.business_name}: {transaction_count} transactions, {completed_transaction_count} completed")
                            
                        except Exception as transaction_error:
                            logger.warning(f"Transaction query failed for {provider.business_name}: {transaction_error}")
                            transaction_count = 0
                            completed_transaction_count = 0
                    
                    # Add provider data
                    top_providers_data.append({
                        'name': provider.business_name,
                        'listings': listing_count,
                        'transactions': transaction_count,
                        'completed_transactions': completed_transaction_count
                    })
                            
                except Exception as e:
                    logger.warning(f"Error getting provider stats for {provider.business_name}: {e}")
                    continue
            
            # Sort by total activity (listings + transactions) and limit to top 5
            top_providers_data.sort(key=lambda x: x['listings'] + x['transactions'], reverse=True)
            top_providers_data = top_providers_data[:5]
                    
        except Exception as e:
            logger.warning(f"Error getting top providers: {e}")
            top_providers_data = []

        # If no providers have data, add a placeholder
        if not top_providers_data:
            top_providers_data = [{
                'name': 'No Active Providers',
                'listings': 0,
                'transactions': 0,
                'completed_transactions': 0
            }]
        
        return {
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
    
class AnomalyDetectionService:
    """Enhanced anomaly detection for admin system based on Prac 2 algorithm"""

    @staticmethod
    def send_critical_anomaly_notifications(anomalies):
        """Send email notifications for critical/high severity anomalies using existing NotificationService"""
        try:
            from notifications.services import NotificationService
            from django.contrib.auth import get_user_model
            
            User = get_user_model()
            
            # Get all admin users
            admin_users = User.objects.filter(admin_rights=True, is_active=True)
            
            critical_anomalies = [a for a in anomalies if a['severity'] in ['Critical', 'High']]
            
            if not critical_anomalies:
                return
                
            for admin_user in admin_users:
                try:
                    # Create one notification per admin for all critical anomalies
                    title = f"Security Alert: {len(critical_anomalies)} Critical Anomalies Detected"
                    message = "\n".join([f"• {a['type']}: {a['description']}" for a in critical_anomalies[:3]])
                    if len(critical_anomalies) > 3:
                        message += f"\n... and {len(critical_anomalies) - 3} more"
                    
                    # Create in-app notification
                    notification = NotificationService.create_notification(
                        recipient=admin_user,
                        notification_type='security_alert',
                        title=title,
                        message=message,
                        data={
                            'anomaly_count': len(critical_anomalies),
                            'detection_time': timezone.now().isoformat()
                        }
                    )
                    
                    # Send email using your existing system
                    NotificationService.send_email_notification(
                        user=admin_user,
                        subject=f"[SECURITY ALERT] Save n Bite - {len(critical_anomalies)} Critical Anomalies",
                        template_name='security_alert',
                        context={
                            'user_name': admin_user.get_full_name() or admin_user.username,
                            'anomaly_count': len(critical_anomalies),
                            'anomalies': critical_anomalies,
                            'detection_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                        },
                        notification=notification
                    )
                    
                except Exception as e:
                    logger.error(f"Failed to send security notification to {admin_user.email}: {e}")
                    
        except Exception as e:
            logger.error(f"Error sending critical anomaly notifications: {e}")
    
    @staticmethod
    def detect_anomalies():
        """Advanced rule-based anomaly detection adapted from Prac 2"""
        from .models import AccessLog
        
        anomalies = []
        
        # Get logs for the last 24 hours
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        recent_logs = AccessLog.objects.filter(timestamp__gte=twenty_four_hours_ago)
        
        # Anomaly 1: Excessive failed admin login attempts from same IP (from Prac 2)
        suspicious_ips = recent_logs.filter(
            endpoint__contains='/admin/',
            status_code__in=[401, 403]
        ).values('ip_address').annotate(
            attempt_count=Count('id')
        ).filter(attempt_count__gte=5)
        
        for ip_data in suspicious_ips:
            anomalies.append({
                'type': 'Suspicious Admin Login Activity',
                'description': f"IP {ip_data['ip_address']} made {ip_data['attempt_count']} failed admin login attempts",
                'severity': 'Critical' if ip_data['attempt_count'] > 15 else 'High',
                'timestamp': timezone.now(),
                'affected_resource': f"Admin Panel from IP {ip_data['ip_address']}"
            })
        
        # Anomaly 2: Unauthorized access to admin endpoints (adapted from Prac 2)
        unauthorized_admin_access = recent_logs.filter(
            endpoint__contains='/admin/',
            status_code=403,
            user__isnull=False
        ).exclude(user__admin_rights=True)
        
        if unauthorized_admin_access.exists():
            user_attempts = unauthorized_admin_access.values('user__username').annotate(
                attempt_count=Count('id')
            )
            
            for user_data in user_attempts:
                anomalies.append({
                    'type': 'Unauthorized Admin Access Attempt',
                    'description': f"Non-admin user {user_data['user__username']} attempted to access admin panel {user_data['attempt_count']} times",
                    'severity': 'Critical',
                    'timestamp': timezone.now(),
                    'affected_resource': f"Admin Panel - User: {user_data['user__username']}"
                })
        
        # Anomaly 3: High volume admin activity from single user (from Prac 2)
        high_activity_admins = recent_logs.filter(
            endpoint__contains='/admin/',
            user__isnull=False,
            user__admin_rights=True
        ).values('user__username').annotate(
            request_count=Count('id')
        ).filter(request_count__gte=100)  # 100+ requests in 24 hours
        
        for user_data in high_activity_admins:
            anomalies.append({
                'type': 'High Admin Activity Volume',
                'description': f"Admin user {user_data['user__username']} made {user_data['request_count']} admin requests in 24h",
                'severity': 'Medium',
                'timestamp': timezone.now(),
                'affected_resource': f"Admin Panel - User: {user_data['user__username']}"
            })
        
        # Anomaly 4: Unusual access patterns to confidential endpoints (adapted from Prac 2)
        confidential_access = recent_logs.filter(
            Q(endpoint__contains='/verifications/') |
            Q(endpoint__contains='/users/') |
            Q(endpoint__contains='/logs/')
        ).values('user__username', 'ip_address').annotate(
            access_count=Count('id')
        ).filter(access_count__gte=20)  # 20+ access to sensitive endpoints
        
        for access_data in confidential_access:
            anomalies.append({
                'type': 'Excessive Confidential Data Access',
                'description': f"User {access_data['user__username']} from IP {access_data['ip_address']} accessed sensitive endpoints {access_data['access_count']} times",
                'severity': 'High',
                'timestamp': timezone.now(),
                'affected_resource': f"Confidential Endpoints - User: {access_data['user__username']}"
            })
        
        # Anomaly 5: Multiple failed verification attempts (new - specific to Save n Bite)
        failed_verifications = recent_logs.filter(
            endpoint__contains='/verifications/',
            status_code__in=[400, 403, 404]
        ).values('user__username').annotate(
            failed_count=Count('id')
        ).filter(failed_count__gte=5)
        
        for verification_data in failed_verifications:
            anomalies.append({
                'type': 'Multiple Failed Verification Attempts',
                'description': f"User {verification_data['user__username']} had {verification_data['failed_count']} failed verification attempts",
                'severity': 'Medium',
                'timestamp': timezone.now(),
                'affected_resource': f"Verification System - User: {verification_data['user__username']}"
            })
        
        # Anomaly 6: Rapid user account creation from same IP (adapted from Prac 2)
        rapid_registrations = recent_logs.filter(
            endpoint__contains='/auth/register/',
            status_code=201
        ).values('ip_address').annotate(
            registration_count=Count('id')
        ).filter(registration_count__gte=3)  # 3+ registrations from same IP
        
        for reg_data in rapid_registrations:
            anomalies.append({
                'type': 'Rapid Account Creation',
                'description': f"IP {reg_data['ip_address']} created {reg_data['registration_count']} accounts in 24h",
                'severity': 'Medium',
                'timestamp': timezone.now(),
                'affected_resource': f"Registration System - IP: {reg_data['ip_address']}"
            })
        
        # Anomaly 7: Access during unusual hours (adapted from Prac 2)
        from django.utils import timezone as tz
        current_hour = tz.now().hour
        if current_hour < 6 or current_hour > 22:  # Between 10 PM and 6 AM
            unusual_hour_access = recent_logs.filter(
                timestamp__hour__in=range(22, 24) + range(0, 6),
                endpoint__contains='/admin/'
            ).values('user__username').annotate(
                night_access_count=Count('id')
            ).filter(night_access_count__gte=5)
            
            for user_data in unusual_hour_access:
                anomalies.append({
                    'type': 'Unusual Hour Admin Access',
                    'description': f"User {user_data['user__username']} accessed admin panel {user_data['night_access_count']} times during unusual hours (10 PM - 6 AM)",
                    'severity': 'Low',
                    'timestamp': timezone.now(),
                    'affected_resource': f"Admin Panel - User: {user_data['user__username']}"
                })
        
        # Anomaly 8: Geographical anomaly detection (if IP geolocation available)
        # This would require additional IP geolocation service, simplified version:
        different_country_access = recent_logs.filter(
            user__isnull=False
        ).values('user__username').annotate(
            ip_count=Count('ip_address', distinct=True)
        ).filter(ip_count__gte=3)  # Same user from 3+ different IPs
        
        for user_data in different_country_access:
            anomalies.append({
                'type': 'Multiple IP Access Pattern',
                'description': f"User {user_data['user__username']} accessed system from {user_data['ip_count']} different IP addresses",
                'severity': 'Medium',
                'timestamp': timezone.now(),
                'affected_resource': f"User Account - {user_data['user__username']}"
            })

        try:
            AnomalyDetectionService.send_critical_anomaly_notifications(anomalies)
        except Exception as e:
            logger.error(f"Failed to send anomaly notifications: {e}")
        
        return anomalies
    
    @staticmethod
    def create_anomaly_alert(anomaly):
        """Create system log alert for detected anomaly (from Prac 2)"""
        from .models import SystemLogEntry
        
        SystemLogEntry.objects.create(
            severity='warning' if anomaly['severity'] == 'Medium' else 'critical',
            category='security',
            title=f"Anomaly Detected: {anomaly['type']}",
            description=anomaly['description'],
            error_details={
                'anomaly_type': anomaly['type'],
                'severity': anomaly['severity'],
                'affected_resource': anomaly.get('affected_resource', 'Unknown'),
                'detection_time': anomaly.get('timestamp', timezone.now()).isoformat(),
                'detection_algorithm': 'Enhanced Prac 2 Algorithm'
            }
        )

    @staticmethod
    def send_critical_log_notification(log_entry):
        """Send email notification for critical/error system logs - DEPRECATED"""
        # This method is now handled by the signal system
        # Call the new private method directly if needed
        SystemLogService._send_critical_log_email_notification(log_entry)

    # admin_system/services.py - Fix the context data being passed

    @staticmethod
    def _send_critical_log_email_notification(log_entry):
        """Send email notification for critical system logs to all admin users"""
        try:
            from notifications.services import NotificationService
            from django.contrib.auth import get_user_model
            from django.conf import settings
            
            User = get_user_model()
            
            # Get all admin users
            admin_users = User.objects.filter(
                admin_rights=True,
                is_active=True,
                email__isnull=False
            ).exclude(email='')
            
            if not admin_users.exists():
                logger.warning("No admin users found to send system log notifications")
                return
            
            # Prepare email context
            admin_panel_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/admin/system-logs"
            
            for admin_user in admin_users:
                try:
                    # Create in-app notification
                    notification = NotificationService.create_notification(
                        recipient=admin_user,
                        notification_type='system_announcement',
                        title=f"System Alert: {log_entry.severity.upper()} - {log_entry.title}",
                        message=f"A {log_entry.severity} system issue has been detected: {log_entry.description}",
                        data={
                            'log_entry_id': str(log_entry.id),
                            'severity': log_entry.severity,
                            'category': log_entry.category,
                            'log_title': log_entry.title,
                            'admin_panel_url': admin_panel_url
                        }
                    )
                    
                    # Format error details for display
                    error_details_formatted = None
                    if log_entry.error_details:
                        try:
                            import json
                            if isinstance(log_entry.error_details, dict):
                                error_details_formatted = json.dumps(log_entry.error_details, indent=2)
                            else:
                                error_details_formatted = str(log_entry.error_details)
                        except:
                            error_details_formatted = str(log_entry.error_details)
                    
                    # Prepare email context - FIXED with proper data
                    email_context = {
                        'admin_name': admin_user.get_full_name() or admin_user.username,
                        'severity': log_entry.severity,
                        'category': log_entry.category,
                        'title': log_entry.title,
                        'description': log_entry.description,
                        'timestamp': log_entry.timestamp,
                        'error_details': error_details_formatted,
                        'admin_panel_url': admin_panel_url,
                        'company_name': 'Save n Bite',
                        'support_email': 'savenbite@gmail.com'
                    }
                    
                    # Debug: Log the context being sent
                    logger.info(f"Sending email with context: {email_context}")
                    
                    # Send critical email (bypasses user preferences)
                    email_sent = NotificationService.send_critical_email_notification(
                        user=admin_user,
                        subject=f"[{log_entry.severity.upper()}] Save n Bite System Alert - {log_entry.title}",
                        template_name='system_log_alert',
                        context=email_context,
                        notification=notification
                    )
                    
                    if email_sent:
                        logger.info(f"System log alert email sent to admin {admin_user.email}")
                    else:
                        logger.error(f"Failed to send system log alert email to admin {admin_user.email}")
                        
                except Exception as e:
                    logger.error(f"Failed to send system log notification to {admin_user.email}: {e}")
                    
        except Exception as e:
            logger.error(f"Error sending critical log email notifications: {e}")