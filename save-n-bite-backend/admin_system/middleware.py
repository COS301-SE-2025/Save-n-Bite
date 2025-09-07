import time
from django.utils.deprecation import MiddlewareMixin
from .services import AnomalyDetectionService

class AdminAccessLoggingMiddleware(MiddlewareMixin):
    """Middleware to log access to admin endpoints"""
    
    def process_request(self, request):
        request.start_time = time.time()
    
    def process_response(self, request, response):
        # Only log admin endpoints
        if '/admin/' in request.path or '/api/admin/' in request.path:
            response_time = None
            if hasattr(request, 'start_time'):
                response_time = (time.time() - request.start_time) * 1000  # Convert to milliseconds
            
            # Log the access with response time
            AnomalyDetectionService.log_access(request, response_time)
        
        return response