# authentication/admin_views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.hashers import check_password
import logging

from .models import User
from admin_system.permissions import IsSystemAdmin
from admin_system.services import AdminService
from admin_system.utils import get_client_ip

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def get_admin_profile(request):
    """Get admin user profile information"""
    try:
        admin_user = request.user
        return Response({
            'profile': {
                'id': str(admin_user.UserID),
                'username': admin_user.username,
                'email': admin_user.email,
                'full_name': admin_user.get_full_name() or admin_user.username,
                'phone_number': admin_user.phone_number,
                'is_superuser': admin_user.is_superuser,
                'admin_rights': admin_user.admin_rights,
                'last_login': admin_user.last_login.isoformat() if admin_user.last_login else None,
                'date_joined': admin_user.date_joined.isoformat(),
                'role': admin_user.role
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get admin profile error: {str(e)}")
        return Response({
            'error': {'code': 'PROFILE_ERROR', 'message': 'Failed to get profile'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsSystemAdmin])
def update_admin_profile(request):
    """Update admin profile information"""
    try:
        admin_user = request.user
        data = request.data
        
        # Track what was changed
        changes = {}
        
        # Update allowed fields
        if 'username' in data and data['username'] != admin_user.username:
            changes['username'] = {'old': admin_user.username, 'new': data['username']}
            admin_user.username = data['username']
            
        if 'email' in data and data['email'] != admin_user.email:
            changes['email'] = {'old': admin_user.email, 'new': data['email']}
            admin_user.email = data['email']
            
        if 'phone_number' in data and data['phone_number'] != admin_user.phone_number:
            changes['phone_number'] = {'old': admin_user.phone_number, 'new': data['phone_number']}
            admin_user.phone_number = data['phone_number']
        
        admin_user.save()
        
        # Log the changes
        if changes:
            AdminService.log_admin_action(
                admin_user=admin_user,
                action_type='profile_update',
                target_type='admin_profile',
                target_id=str(admin_user.UserID),
                description=f"Updated admin profile: {', '.join(changes.keys())}",
                metadata={
                    'changes': changes
                },
                ip_address=get_client_ip(request)
            )
        
        return Response({
            'message': 'Profile updated successfully',
            'profile': {
                'id': str(admin_user.UserID),
                'username': admin_user.username,
                'email': admin_user.email,
                'phone_number': admin_user.phone_number
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Update admin profile error: {str(e)}")
        return Response({
            'error': {'code': 'UPDATE_ERROR', 'message': 'Failed to update profile'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

