from django.utils import timezone
from django.http import JsonResponse
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class PasswordChangeMiddleware:
    """Middleware to force password change for users with temporary passwords"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if user needs to change password
        if (request.user.is_authenticated and 
            request.user.password_must_change and 
            not request.path.startswith('/api/auth/change-password') and
            not request.path.startswith('/api/auth/logout')):
            
            # Check if temporary password expired (24 hours)
            if (request.user.has_temporary_password and 
                request.user.temp_password_created_at):
                
                time_since_reset = timezone.now() - request.user.temp_password_created_at
                if time_since_reset.total_seconds() > 86400:  # 24 hours
                    return JsonResponse({
                        'error': {
                            'code': 'PASSWORD_EXPIRED',
                            'message': 'Temporary password has expired. Please contact admin.'
                        }
                    }, status=401)
            
            # Force password change
            return JsonResponse({
                'error': {
                    'code': 'PASSWORD_CHANGE_REQUIRED',
                    'message': 'You must change your password before continuing.'
                }
            }, status=403)
        
        response = self.get_response(request)
        return response