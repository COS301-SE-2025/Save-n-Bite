# admin_system/blob_utils.py - FIXED

import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class BlobStorageHelper:
    """Helper class for blob storage URL handling - FIXED"""
    
    @staticmethod
    def get_secure_image_url(image_field, default_placeholder=None):
        """Get secure URL for image with fallback - FIXED"""
        try:
            if image_field and hasattr(image_field, 'url'):
                url = image_field.url
                
                # Fix URL if it's malformed
                if url and not url.startswith(('http://', 'https://')):
                    # Check if we're in production or development
                    is_production = getattr(settings, 'IS_AZURE_DEPLOYMENT', False) or getattr(settings, 'ENVIRONMENT', 'development') == 'production'
                    
                    if is_production:
                        account_name = getattr(settings, 'AZURE_ACCOUNT_NAME', 'savenbiteblob')
                        container_name = getattr(settings, 'AZURE_CONTAINER_NAME', 'savenbite-media')
                        base_url = f"https://{account_name}.blob.core.windows.net/{container_name}"
                    else:
                        container_name = getattr(settings, 'AZURE_CONTAINER_NAME', 'savenbite-media')
                        base_url = f"http://127.0.0.1:10000/devstoreaccount1/{container_name}"
                    
                    # Remove leading slash if present
                    if url.startswith('/'):
                        url = url[1:]
                    
                    url = f"{base_url}/{url}"
                
                return url
            
            # FIXED: Handle direct string URLs (from database)
            elif isinstance(image_field, str) and image_field:
                if image_field.startswith(('http://', 'https://')):
                    return image_field
                else:
                    # Build full URL
                    is_production = getattr(settings, 'IS_AZURE_DEPLOYMENT', False)
                    if is_production:
                        account_name = getattr(settings, 'AZURE_ACCOUNT_NAME', 'savenbiteblob')
                        container_name = getattr(settings, 'AZURE_CONTAINER_NAME', 'savenbite-media')
                        base_url = f"https://{account_name}.blob.core.windows.net/{container_name}"
                    else:
                        container_name = getattr(settings, 'AZURE_CONTAINER_NAME', 'savenbite-media')
                        base_url = f"http://127.0.0.1:10000/devstoreaccount1/{container_name}"
                    
                    # Remove leading slash if present
                    if image_field.startswith('/'):
                        image_field = image_field[1:]
                    
                    return f"{base_url}/{image_field}"
            
        except Exception as e:
            logger.warning(f"Error getting image URL: {e}")
        
        return default_placeholder or "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"