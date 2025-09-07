import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class BlobStorageHelper:
    """Helper class for blob storage URL handling"""
    
    @staticmethod
    def get_secure_image_url(image_field, default_placeholder=None):
        """Get secure URL for image with fallback"""
        try:
            if image_field and hasattr(image_field, 'url'):
                url = image_field.url
                
                # Fix URL if it's malformed
                if url and not url.startswith(('http://', 'https://')):
                    if settings.IS_AZURE_DEPLOYMENT:
                        base_url = f"https://{settings.AZURE_ACCOUNT_NAME}.blob.core.windows.net/{settings.AZURE_CONTAINER_NAME}"
                    else:
                        base_url = f"http://127.0.0.1:10000/devstoreaccount1/{settings.AZURE_CONTAINER_NAME}"
                    
                    # Remove leading slash if present
                    if url.startswith('/'):
                        url = url[1:]
                    
                    url = f"{base_url}/{url}"
                
                return url
            
        except Exception as e:
            logger.warning(f"Error getting image URL: {e}")
        
        return default_placeholder or "/static/images/placeholder.png"