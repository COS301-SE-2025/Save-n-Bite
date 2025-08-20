# admin_panel/utils.py
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import SystemLogEntry
from .services import AdminService

logger = logging.getLogger(__name__)

class SystemLogger:
    """Utility class for creating system logs"""
    
    @staticmethod
    def log_error(category, title, description, error_details=None):
        """Log an error to the system"""
        try:
            return SystemLogEntry.objects.create(
                severity='error',
                category=category,
                title=title,
                description=description,
                error_details=error_details or {}
            )
        except Exception as e:
            logger.error(f"Failed to create system log: {str(e)}")
    
    @staticmethod
    def log_warning(category, title, description, error_details=None):
        """Log a warning to the system"""
        try:
            return SystemLogEntry.objects.create(
                severity='warning',
                category=category,
                title=title,
                description=description,
                error_details=error_details or {}
            )
        except Exception as e:
            logger.error(f"Failed to create system log: {str(e)}")
    
    @staticmethod
    def log_critical(category, title, description, error_details=None):
        """Log a critical issue to the system"""
        try:
            log_entry = SystemLogEntry.objects.create(
                severity='critical',
                category=category,
                title=title,
                description=description,
                error_details=error_details or {}
            )
            
            # Send immediate notification for critical issues
            try:
                send_mail(
                    subject=f'[CRITICAL] Save n Bite System Alert: {title}',
                    message=f'''
Critical system issue detected:

Category: {category}
Title: {title}
Description: {description}
Time: {timezone.now()}

Please check the admin panel immediately.
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.ADMIN_EMAIL] if hasattr(settings, 'ADMIN_EMAIL') else [],
                    fail_silently=True,
                )
            except:
                pass  # Don't fail if email doesn't work
            
            return log_entry
        except Exception as e:
            logger.error(f"Failed to create critical system log: {str(e)}")

def get_file_size_human_readable(size_bytes):
    """Convert bytes to human readable format"""
    if size_bytes == 0:
        return "0B"
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.1f}{size_names[i]}"

def validate_document_file(file):
    """Validate uploaded document files"""
    # Check file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        return False, "File size too large. Maximum 10MB allowed."
    
    # Check file type
    allowed_types = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    file_extension = file.name.lower().split('.')[-1]
    if f'.{file_extension}' not in allowed_types:
        return False, f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
    
    return True, "Valid file"

def generate_secure_filename(original_filename, user_id, document_type):
    """Generate a secure filename for document storage"""
    import uuid
    import os
    
    file_extension = os.path.splitext(original_filename)[1]
    secure_name = f"{document_type}_{user_id}_{uuid.uuid4().hex[:8]}{file_extension}"
    return secure_name

class DocumentSecurityManager:
    """Manage document access security"""
    
    @staticmethod
    def log_document_access(admin_user, document_type, profile_type, profile_id, document_name, ip_address=None):
        """Log when an admin accesses a document"""
        return AdminService.log_document_access(
            admin_user=admin_user,
            document_type=document_type,
            profile_type=profile_type,
            profile_id=profile_id,
            document_name=document_name,
            ip_address=ip_address
        )
    
    @staticmethod
    def generate_secure_document_url(document_field, admin_user, profile_type, profile_id, ip_address=None):
        """Generate a secure URL for document access and log the access"""
        if not document_field:
            return None
        
        # Log the access
        DocumentSecurityManager.log_document_access(
            admin_user=admin_user,
            document_type=document_field.name,
            profile_type=profile_type,
            profile_id=profile_id,
            document_name=document_field.name,
            ip_address=ip_address
        )
        
        # Return the URL (in production, this could be a signed URL)
        return document_field.url

class AdminStatsCalculator:
    """Helper class for calculating admin dashboard statistics"""
    
    @staticmethod
    def calculate_percentage_change(current, previous):
        """Calculate percentage change between two values"""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100
    
    @staticmethod
    def calculate_growth_rate(current_period_count, previous_period_count):
        """Calculate growth rate between two periods"""
        if previous_period_count == 0:
            return 100.0 if current_period_count > 0 else 0.0
        
        growth_rate = ((current_period_count - previous_period_count) / previous_period_count) * 100
        return round(growth_rate, 1)
    
    @staticmethod
    def format_large_number(number):
        """Format large numbers for display (1000 -> 1K, 1000000 -> 1M)"""
        if number >= 1000000:
            return f"{number/1000000:.1f}M"
        elif number >= 1000:
            return f"{number/1000:.1f}K"
        else:
            return str(number)

def admin_required(view_func):
    """Decorator to ensure only admins can access certain functions"""
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not getattr(request.user, 'admin_rights', False):
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'error': {'code': 'FORBIDDEN', 'message': 'Admin rights required'}
            }, status=status.HTTP_403_FORBIDDEN)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper

def get_client_ip(request):
    """
    Get the client's IP address from the request.
    Handles cases where the app is behind a proxy/load balancer.
    """
    # Check for IP in various headers (common proxy headers)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        # Fall back to REMOTE_ADDR
        ip = request.META.get('REMOTE_ADDR')
    
    return ip