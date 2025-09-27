# blob_storage.py - UPDATED with public access fix

import os
from azure.storage.blob import BlobServiceClient, PublicAccess
from django.conf import settings
from django.core.files.storage import Storage, FileSystemStorage
from django.core.files.base import ContentFile
from django.utils.deconstruct import deconstructible
from urllib.parse import urljoin
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

@deconstructible
class AzureBlobStorage(Storage):
    """
    Custom storage backend for Azure Blob Storage
    Works with both Azurite (local) and Azure Cloud
    """
    
    def __init__(self, container_name=None):
        self.container_name = container_name or settings.AZURE_CONTAINER_NAME
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.account_url = getattr(settings, 'AZURE_ACCOUNT_URL', None)
        self.custom_domain = getattr(settings, 'AZURE_CUSTOM_DOMAIN', None)
        
        # Initialize blob service client
        try:
            if self.connection_string:
                self.blob_service_client = BlobServiceClient.from_connection_string(
                    self.connection_string
                )
            elif self.account_url:
                self.blob_service_client = BlobServiceClient(
                    account_url=self.account_url,
                    credential=settings.AZURE_ACCOUNT_KEY
                )
            else:
                raise ValueError("Either AZURE_STORAGE_CONNECTION_STRING or AZURE_ACCOUNT_URL must be provided")
                
            # Ensure container exists with PUBLIC READ ACCESS
            self._ensure_container_exists()
            
        except Exception as e:
            logger.error(f"Failed to initialize Azure Blob Storage: {str(e)}")
            raise
    
    def _ensure_container_exists(self):
        """Create container if it doesn't exist WITH PUBLIC READ ACCESS"""
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            
            # ⭐ FIXED: Create container with public read access for blobs
            container_client.create_container(public_access=PublicAccess.Blob)
            logger.info(f"Created container with public access: {self.container_name}")
            
        except Exception as e:
            if "ContainerAlreadyExists" in str(e):
                # Container exists, but we need to ensure it has public access
                try:
                    container_client = self.blob_service_client.get_container_client(self.container_name)
                    # ⭐ FIXED: Correct method call with required parameter
                    container_client.set_container_access_policy(
                        signed_identifiers={},  # Empty dict for signed identifiers
                        public_access=PublicAccess.Blob
                    )
                    logger.info(f"Updated existing container to public access: {self.container_name}")
                except Exception as access_error:
                    # If we can't set access policy, just log and continue
                    # The container might already have the right permissions
                    logger.warning(f"Could not update container access (this might be okay): {str(access_error)}")
            else:
                logger.warning(f"Container creation issue: {str(e)}")
    
    def _get_blob_client(self, name):
        """Get blob client for given blob name"""
        return self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=name
        )
    
    def _clean_name(self, name):
        """Clean file name for blob storage"""
        # Replace backslashes with forward slashes for consistency
        name = name.replace('\\', '/')
        
        # Remove leading slashes
        name = name.lstrip('/')
        
        return name
    
    def _save(self, name, content):
        """Save file to Azure Blob Storage"""
        name = self._clean_name(name)
        
        # Generate unique filename to avoid conflicts
        if hasattr(content, 'name') and content.name:
            # Extract file extension
            file_ext = os.path.splitext(content.name)[1]
            # Create unique name
            unique_name = f"{uuid.uuid4()}{file_ext}"
            
            # Preserve directory structure if present
            dir_path = os.path.dirname(name)
            if dir_path:
                name = f"{dir_path}/{unique_name}"
            else:
                name = unique_name
        
        try:
            blob_client = self._get_blob_client(name)
            
            # Reset content position if it's a file-like object
            if hasattr(content, 'seek'):
                content.seek(0)
            
            # Upload blob with public read access
            if hasattr(content, 'read'):
                blob_client.upload_blob(content.read(), overwrite=True)
            else:
                blob_client.upload_blob(content, overwrite=True)
            
            logger.info(f"Successfully uploaded blob with public access: {name}")
            return name
            
        except Exception as e:
            logger.error(f"Failed to upload blob {name}: {str(e)}")
            raise
    
    # ... (keep all other existing methods unchanged)
    def _open(self, name, mode='rb'):
        """Open file from Azure Blob Storage"""
        name = self._clean_name(name)
        
        try:
            blob_client = self._get_blob_client(name)
            blob_data = blob_client.download_blob()
            return ContentFile(blob_data.readall())
        except Exception as e:
            logger.error(f"Failed to open blob {name}: {str(e)}")
            raise
    
    def delete(self, name):
        """Delete file from Azure Blob Storage"""
        name = self._clean_name(name)
        
        try:
            blob_client = self._get_blob_client(name)
            blob_client.delete_blob()
            logger.info(f"Successfully deleted blob: {name}")
        except Exception as e:
            logger.error(f"Failed to delete blob {name}: {str(e)}")
            # Don't raise exception for delete operations
    
    def exists(self, name):
        """Check if file exists in Azure Blob Storage"""
        name = self._clean_name(name)
        
        try:
            blob_client = self._get_blob_client(name)
            return blob_client.exists()
        except Exception as e:
            logger.error(f"Failed to check blob existence {name}: {str(e)}")
            return False
    
    def listdir(self, path):
        """List directory contents"""
        path = self._clean_name(path)
        if path and not path.endswith('/'):
            path += '/'
        
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            blobs = container_client.list_blobs(name_starts_with=path)
            
            dirs = set()
            files = []
            
            for blob in blobs:
                name = blob.name
                if name.startswith(path):
                    relative_path = name[len(path):]
                    if '/' in relative_path:
                        # It's in a subdirectory
                        dirs.add(relative_path.split('/')[0])
                    else:
                        # It's a file in this directory
                        files.append(relative_path)
            
            return list(dirs), files
            
        except Exception as e:
            logger.error(f"Failed to list directory {path}: {str(e)}")
            return [], []
    
    def size(self, name):
        """Get file size"""
        name = self._clean_name(name)
        
        try:
            blob_client = self._get_blob_client(name)
            properties = blob_client.get_blob_properties()
            return properties.size
        except Exception as e:
            logger.error(f"Failed to get blob size {name}: {str(e)}")
            return 0
    
    def url(self, name):
        """Get public URL for the blob"""
        if not name:
            return None
            
        name = self._clean_name(name)
        
        try:
            blob_client = self._get_blob_client(name)
            
            if self.custom_domain:
                return f"https://{self.custom_domain}/{self.container_name}/{name}"
            else:
                return blob_client.url
                
        except Exception as e:
            logger.error(f"Failed to get blob URL {name}: {str(e)}")
            return None
    
    def get_modified_time(self, name):
        """Get last modified time"""
        name = self._clean_name(name)
        
        try:
            blob_client = self._get_blob_client(name)
            properties = blob_client.get_blob_properties()
            return properties.last_modified
        except Exception as e:
            logger.error(f"Failed to get blob modified time {name}: {str(e)}")
            return datetime.now()


# Utility functions for different file types
def get_customer_profile_storage():
    """Storage for customer profile images"""
    if not getattr(settings, 'USE_AZURE_STORAGE', True):
        return FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    return AzureBlobStorage('customer-profiles')

def get_ngo_document_storage():
    """Storage for NGO documents"""
    if not getattr(settings, 'USE_AZURE_STORAGE', True):
        return FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    return AzureBlobStorage('ngo-documents')

def get_ngo_logo_storage():
    """Storage for NGO logos"""
    if not getattr(settings, 'USE_AZURE_STORAGE', True):
        return FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    return AzureBlobStorage('ngo-logos')

def get_provider_document_storage():
    """Storage for provider CIPC documents"""
    if not getattr(settings, 'USE_AZURE_STORAGE', True):
        return FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    return AzureBlobStorage('provider-documents')

def get_provider_logo_storage():
    """Storage for provider logos"""
    if not getattr(settings, 'USE_AZURE_STORAGE', True):
        return FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    return AzureBlobStorage('provider-logos')

def get_provider_banner_storage():
    """Storage for provider banners"""
    if not getattr(settings, 'USE_AZURE_STORAGE', True):
        return FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    return AzureBlobStorage('provider-banners')

def get_food_listing_storage():
    """Storage for food listing images"""
    if not getattr(settings, 'USE_AZURE_STORAGE', True):
        return FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    return AzureBlobStorage('food-listings')


# Helper function to generate upload paths
def generate_upload_path(instance, filename, folder):
    """
    Generate upload path with timestamp and user ID
    """
    ext = filename.split('.')[-1]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    if hasattr(instance, 'user'):
        user_id = str(instance.user.UserID)
    elif hasattr(instance, 'provider'):
        user_id = str(instance.provider.UserID)
    else:
        user_id = str(uuid.uuid4())
    
    filename = f"{user_id}_{timestamp}.{ext}"
    return f"{folder}/{filename}"

# Upload path functions for each model
def customer_profile_image_path(instance, filename):
    return generate_upload_path(instance, filename, 'customer_profiles')

def ngo_document_path(instance, filename):
    return generate_upload_path(instance, filename, 'ngo_documents')

def ngo_logo_path(instance, filename):
    return generate_upload_path(instance, filename, 'ngo_logos')

def provider_cipc_path(instance, filename):
    return generate_upload_path(instance, filename, 'provider_documents')

def provider_logo_path(instance, filename):
    return generate_upload_path(instance, filename, 'provider_logos')

def provider_banner_path(instance, filename):
    return generate_upload_path(instance, filename, 'provider_banners')

def food_listing_image_path(instance, filename):
    return generate_upload_path(instance, filename, 'food_listings')