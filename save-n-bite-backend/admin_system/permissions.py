# admin_panel/permissions.py
from rest_framework.permissions import BasePermission

class IsSystemAdmin(BasePermission):
    """
    Permission class to check if user has admin rights.
    Based on existing User model with admin_rights field.
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                getattr(request.user, 'admin_rights', False) is True or
                getattr(request.user, 'is_superuser', False) is True
            )
        )
    
    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated and (
                getattr(request.user, 'admin_rights', False) is True or
                getattr(request.user, 'is_superuser', False) is True
            )
        )

class CanModerateContent(BasePermission):
    """
    Permission for content moderation actions.
    Currently same as IsSystemAdmin but can be extended for different roles.
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'admin_rights') and
            request.user.admin_rights == True
        )

class CanManageUsers(BasePermission):
    """
    Permission for user management actions.
    Can be extended to have different levels of user management access.
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'admin_rights') and
            request.user.admin_rights == True
        )

class CanViewAuditLogs(BasePermission):
    """
    Permission to view audit logs.
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'admin_rights') and
            request.user.admin_rights == True
        )

class CanManageSystemSettings(BasePermission):
    """
    Permission for system settings management.
    Highest level permission - restrict to superusers.
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'admin_rights') and
            request.user.admin_rights == True and
            (request.user.is_superuser or hasattr(request.user, 'role') and request.user.role == 'admin')
        )