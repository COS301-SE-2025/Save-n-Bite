import time
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)

class AdminAccessLoggingMiddleware(MiddlewareMixin):
    """Middleware to log access to admin endpoints"""
    
    def process_request(self, request):
        request.start_time = time.time()
    
    def process_response(self, request, response):
        # Only log admin endpoints
        if '/admin/' in request.path or '/api/admin/' in request.path:
            try:
                from .models import AccessLog
                
                response_time = None
                if hasattr(request, 'start_time'):
                    response_time = (time.time() - request.start_time) * 1000
                
                # Get client IP
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip = x_forwarded_for.split(',')[0]
                else:
                    ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
                
                # Log the access
                AccessLog.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    ip_address=ip,
                    endpoint=request.path,
                    method=request.method,
                    status_code=response.status_code,
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    response_time=response_time
                )
            except Exception as e:
                logger.warning(f"Failed to log admin access: {e}")
        
        return response