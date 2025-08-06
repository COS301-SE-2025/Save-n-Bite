# authentication/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings
from django.contrib.auth import authenticate, login
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from decimal import Decimal
from rest_framework.response import Response
from datetime import timedelta
import logging
import string
import secrets
from django.contrib.auth import authenticate
from .serializers import (
    CustomerRegistrationSerializer,
    NGORegistrationSerializer,
    FoodProviderRegistrationSerializer,
    LoginSerializer,
    UserProfileSerializer
)
from .models import User, FoodProviderProfile, CustomerProfile, NGOProfile
from interactions.models import Interaction, Order
from reviews.models import Review
from notifications.models import BusinessFollower
logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    """Generate JWT tokens for user with proper UserID handling"""
    
    # Create refresh token manually to ensure proper user identification
    refresh = RefreshToken()
    
    # Explicitly set the user ID claim using the UserID field
    refresh[api_settings.USER_ID_CLAIM] = str(user.UserID)  # Convert UUID to string
    
    # Add any additional claims if needed
    refresh['user_type'] = user.user_type
    refresh['email'] = user.email
    
    # Generate access token from refresh token
    access_token = refresh.access_token
    
    return {
        'token': str(access_token),
        'refresh_token': str(refresh),
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def register_customer(request):
    """Register a new customer"""
    serializer = CustomerRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_serializer = UserProfileSerializer(user)
            
            return Response({
                'message': 'Customer registered successfully',
                'user': user_serializer.data,
                'token': tokens['token'],
                'refreshToken': tokens['refresh_token']
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': {
                    'code': 'REGISTRATION_ERROR',
                    'message': 'Registration failed',
                    'details': [{'field': 'general', 'message': str(e)}]
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Request validation failed',
            'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_ngo(request):
    """Register a new NGO"""
    serializer = NGORegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            return Response({
                'message': 'NGO registered successfully - pending verification',
                'organisation': {
                    'id': str(user.id),
                    'organisationName': user.ngo_profile.organisation_name,
                    'representativeEmail': user.ngo_profile.representative_email,
                    'status': user.ngo_profile.status,
                    'userType': 'ngo'
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': {
                    'code': 'REGISTRATION_ERROR',
                    'message': 'Registration failed',
                    'details': [{'field': 'general', 'message': str(e)}]
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Request validation failed',
            'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_provider(request):
    """Register a new food provider"""
    serializer = FoodProviderRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            return Response({
                'message': 'Food provider registered successfully - pending verification',
                'provider': {
                    'id': str(user.id),
                    'businessName': user.provider_profile.business_name,
                    'businessEmail': user.provider_profile.business_email,
                    'status': user.provider_profile.status,
                    'userType': 'provider'
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': {
                    'code': 'REGISTRATION_ERROR',
                    'message': 'Registration failed',
                    'details': [{'field': 'general', 'message': str(e)}]
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Request validation failed',
            'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user with email and password"""
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        user_serializer = UserProfileSerializer(user)
        
        return Response({
            'message': 'Login successful',
            'user': user_serializer.data,
            'token': tokens['token'],
            'refreshToken': tokens['refresh_token']
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': {
            'code': 'AUTHENTICATION_ERROR',
            'message': 'Login failed',
            'details': [{'field': field, 'message': errors[0]} for field, errors in serializer.errors.items()]
        }
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_signin(request):
    """Google Sign-in (placeholder for now)"""
    # This would typically verify the Google token
    # For now, we'll return a placeholder response
    token = request.data.get('token')
    
    if not token:
        return Response({
            'error': {
                'code': 'MISSING_TOKEN',
                'message': 'Google token is required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # TODO: Implement Google OAuth verification
    # For now, return a placeholder response
    return Response({
        'message': 'Google Sign-in not implemented yet',
        'error': {
            'code': 'NOT_IMPLEMENTED',
            'message': 'Google Sign-in feature is under development'
        }
    }, status=status.HTTP_501_NOT_IMPLEMENTED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user's profile with notification preferences and follow stats"""
    serializer = UserProfileSerializer(request.user)
    return Response({
        'user': serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update user profile information"""
    user = request.user
    
    try:
        # Update basic user info if provided
        if 'email' in request.data:
            # Check if email is already taken by another user
            if User.objects.filter(email=request.data['email']).exclude(id=user.id).exists():
                return Response({
                    'error': {
                        'code': 'EMAIL_EXISTS',
                        'message': 'Email already exists'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = request.data['email']
            user.username = request.data['email']  # Keep username synced with email
            user.save()

        # Update profile based on user type
        if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
            profile = user.customer_profile
            if 'full_name' in request.data:
                profile.full_name = request.data['full_name']
            
            # Handle profile image update
            if 'profile_image' in request.data and request.data['profile_image']:
                try:
                    image_data = request.data['profile_image']
                    if image_data.startswith('data:'):
                        format, imgstr = image_data.split(';base64,')
                        ext = format.split('/')[-1]
                        from django.core.files.base import ContentFile
                        import base64
                        data = ContentFile(base64.b64decode(imgstr), name=f'profile_{user.id}.{ext}')
                        profile.profile_image = data
                except Exception as e:
                    pass  # Handle image upload error gracefully
            
            profile.save()
            
        elif user.user_type == 'ngo' and hasattr(user, 'ngo_profile'):
            profile = user.ngo_profile
            update_fields = ['representative_name', 'organisation_contact', 'organisation_email']
            for field in update_fields:
                if field in request.data:
                    setattr(profile, field, request.data[field])
            profile.save()
            
        elif user.user_type == 'provider' and hasattr(user, 'provider_profile'):
            profile = user.provider_profile
            update_fields = ['business_name', 'business_contact', 'business_email', 'business_address']
            for field in update_fields:
                if field in request.data:
                    setattr(profile, field, request.data[field])
            profile.save()

        # Return updated profile
        serializer = UserProfileSerializer(user)
        return Response({
            'message': 'Profile updated successfully',
            'user': serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': {
                'code': 'UPDATE_ERROR',
                'message': 'Failed to update profile',
                'details': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_business_profile(request, business_id):
    """Get public business profile information"""
    try:
        # Fix: Use UserID instead of id
        business_user = User.objects.get(UserID=business_id, user_type='provider')
        
        if not hasattr(business_user, 'provider_profile'):
            return Response({
                'error': {
                    'code': 'PROFILE_NOT_FOUND',
                    'message': 'Business profile not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        profile = business_user.provider_profile
        
        # Get follower count and recent listings count
        try:
            from notifications.models import BusinessFollower
            from food_listings.models import FoodListing
            
            follower_count = BusinessFollower.objects.filter(business=profile).count()
            active_listings_count = FoodListing.objects.filter(
                provider=business_user, 
                status='active'
            ).count()
            
            # Check if current user is following (if authenticated)
            is_following = False
            if request.user.is_authenticated and request.user.user_type in ['customer', 'ngo']:
                is_following = BusinessFollower.objects.filter(
                    user=request.user,
                    business=profile
                ).exists()
                
        except:
            follower_count = 0
            active_listings_count = 0
            is_following = False
        
        business_data = {
            'id': str(business_user.UserID),  # Fix: Use UserID
            'business_name': profile.business_name,
            'business_email': profile.business_email,
            'business_address': profile.business_address,
            'business_contact': profile.business_contact,
            'logo': profile.logo.url if profile.logo else None,
            'status': profile.status,
            'follower_count': follower_count,
            'active_listings_count': active_listings_count,
            'is_following': is_following,
            'joined_date': business_user.date_joined.isoformat() if hasattr(business_user, 'date_joined') else None
        }
        
        return Response({
            'business': business_data
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': {
                'code': 'BUSINESS_NOT_FOUND',
                'message': 'Business not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_businesses(request):
    """Search for businesses or get all verified businesses"""
    search_query = request.GET.get('search', '').strip()
    
    try:
        from django.db.models import Q
        
        # Start with all verified businesses
        businesses_query = User.objects.filter(
            user_type='provider',
            provider_profile__status='verified'
        ).select_related('provider_profile')
        
        # Apply search filter if search query is provided
        if search_query:
            businesses_query = businesses_query.filter(
                Q(provider_profile__business_name__icontains=search_query) |
                Q(provider_profile__business_address__icontains=search_query)
            )
        
        # Limit to 200 results
        businesses = businesses_query[:200]
        
        business_list = []
        for business in businesses:
            try:
                from notifications.models import BusinessFollower
                follower_count = BusinessFollower.objects.filter(
                    business=business.provider_profile
                ).count()
            except:
                follower_count = 0
                
            business_list.append({
                'id': str(business.id),
                'business_name': business.provider_profile.business_name,
                'business_address': business.provider_profile.business_address,
                'logo': business.provider_profile.logo.url if business.provider_profile.logo else None,
                'follower_count': follower_count
            })
        
        return Response({
            'businesses': business_list,
            'count': len(business_list)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': {
                'code': 'SEARCH_ERROR',
                'message': 'Failed to search businesses',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

# ====================Admin Code===============

def get_client_ip(request):
    """Helper function to get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@api_view(['POST'])
def login_view(request):
    """Enhanced login view with admin functionality support"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': {
                'code': 'MISSING_CREDENTIALS',
                'message': 'Email and password are required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Check if user can login
        can_login, message = user.can_login()
        if not can_login:
            return Response({
                'error': {
                    'code': 'LOGIN_BLOCKED',
                    'message': message
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Authenticate user
        authenticated_user = authenticate(request, email=email, password=password)
        
        if authenticated_user:
            # Reset failed login attempts
            user.reset_failed_login_attempts()
            
            # Update last login IP
            user.last_login_ip = get_client_ip(request)
            user.save()
            
            # Login user
            login(request, authenticated_user)
            
            # Check if password must be changed
            if user.password_must_change:
                return Response({
                    'message': 'Login successful but password change required',
                    'password_change_required': True,
                    'user': {
                        'id': str(user.UserID),
                        'email': user.email,
                        'user_type': user.user_type
                    }
                }, status=status.HTTP_200_OK)
            
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': str(user.UserID),
                    'email': user.email,
                    'user_type': user.user_type,
                    'admin_rights': user.admin_rights
                }
            }, status=status.HTTP_200_OK)
        
        else:
            # Increment failed login attempts
            user.increment_failed_login()
            
            return Response({
                'error': {
                    'code': 'INVALID_CREDENTIALS',
                    'message': 'Invalid email or password'
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    except User.DoesNotExist:
        return Response({
            'error': {
                'code': 'INVALID_CREDENTIALS',
                'message': 'Invalid email or password'
            }
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change password (especially for temporary passwords)"""
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not all([current_password, new_password, confirm_password]):
        return Response({
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'Current password, new password, and confirmation are required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({
            'error': {
                'code': 'PASSWORD_MISMATCH',
                'message': 'New passwords do not match'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check current password
    if not request.user.check_password(current_password):
        return Response({
            'error': {
                'code': 'INVALID_CURRENT_PASSWORD',
                'message': 'Current password is incorrect'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate new password 
    if len(new_password) < 8:
        return Response({
            'error': {
                'code': 'WEAK_PASSWORD',
                'message': 'Password must be at least 8 characters long'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Set new password
    request.user.set_password(new_password)
    
    # Complete password change process
    request.user.complete_password_change()
    
    return Response({
        'message': 'Password changed successfully'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_password_status(request):
    """Check if user needs to change password (temporary password check)"""
    
    user = request.user
    
    # Check if user has temporary password flags
    must_change = getattr(user, 'password_must_change', False)
    has_temporary = getattr(user, 'has_temporary_password', False)
    temp_created_at = getattr(user, 'temp_password_created_at', None)
    
    password_status = {
        'must_change': must_change,
        'has_temporary': has_temporary,
        'created_at': temp_created_at.isoformat() if temp_created_at else None,
        'expired': False,
        'hours_remaining': 0
    }
    
    # Check if temporary password is expired (24 hours)
    if has_temporary and temp_created_at:
        time_since_reset = timezone.now() - temp_created_at
        hours_elapsed = time_since_reset.total_seconds() / 3600
        is_expired = hours_elapsed >= 24
        hours_remaining = max(0, 24 - hours_elapsed)
        
        password_status.update({
            'expired': is_expired,
            'hours_remaining': round(hours_remaining, 1)
        })
        
        if is_expired:
            password_status['message'] = 'Your temporary password has expired. Please contact an administrator for a new password reset.'
        elif hours_remaining < 2:
            password_status['message'] = f'Your temporary password expires in {hours_remaining:.1f} hours. Please change it soon.'
        else:
            password_status['message'] = 'You have a temporary password. Please change it to a permanent password.'
    
    return Response(password_status, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_temporary_password(request):
    """Allow users to change their temporary password to a permanent one"""
    
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not all([current_password, new_password, confirm_password]):
        return Response({
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'Current password, new password, and confirmation are required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if passwords match
    if new_password != confirm_password:
        return Response({
            'error': {
                'code': 'PASSWORD_MISMATCH',
                'message': 'New passwords do not match'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate current password
    if not request.user.check_password(current_password):
        return Response({
            'error': {
                'code': 'INVALID_CURRENT_PASSWORD',
                'message': 'Current password is incorrect'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate new password strength
    if len(new_password) < 8:
        return Response({
            'error': {
                'code': 'WEAK_PASSWORD',
                'message': 'Password must be at least 8 characters long'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Additional password validation
    if new_password.lower() in ['password', '12345678', 'password123']:
        return Response({
            'error': {
                'code': 'WEAK_PASSWORD',
                'message': 'Password is too common. Please choose a stronger password'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Set new password
        request.user.set_password(new_password)
        
        # Clear temporary password flags if they exist
        if hasattr(request.user, 'password_must_change'):
            request.user.password_must_change = False
        if hasattr(request.user, 'has_temporary_password'):
            request.user.has_temporary_password = False
        if hasattr(request.user, 'temp_password_created_at'):
            request.user.temp_password_created_at = None
            
        request.user.save()
        
        # Send confirmation notification (in-app)
        from notifications.services import NotificationService
        
        NotificationService.create_notification(
            recipient=request.user,
            notification_type='password_changed',
            title='Password Changed Successfully',
            message='Your password has been changed successfully. If you did not make this change, please contact support immediately.',
            data={
                'changed_at': timezone.now().isoformat(),
                'was_temporary': True
            }
        )
        
        # Send confirmation email as CRITICAL (bypasses preferences for security)
        NotificationService.send_critical_email_notification(
            user=request.user,
            subject='Password Changed Successfully - Save n Bite [SECURITY ALERT]',
            template_name='password_changed',
            context={
                'user_name': request.user.get_full_name() or request.user.username,
                'changed_at': timezone.now(),
                'login_url': f"http://localhost:3000/login",  # Update with your frontend URL
                'was_temporary': True,
                'support_email': 'savenbite@gmail.com'
            }
        )
        
        logger.info(f"User {request.user.email} successfully changed their temporary password")
        
        return Response({
            'message': 'Password changed successfully',
            'info': 'A confirmation email has been sent for security purposes (regardless of your email preferences).'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Password change error for user {request.user.email}: {str(e)}")
        return Response({
            'error': {
                'code': 'PASSWORD_CHANGE_ERROR',
                'message': 'Failed to change password. Please try again.'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@permission_classes([])
def login_with_password_check(request):
    """Enhanced login that checks for temporary passwords"""
    
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not all([email, password]):
        return Response({
            'error': {
                'code': 'MISSING_CREDENTIALS',
                'message': 'Email and password are required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = authenticate(request, username=email, password=password)
        
        if user:
            # Check if user is active
            if not user.is_active:
                return Response({
                    'error': {
                        'code': 'ACCOUNT_DISABLED',
                        'message': 'Account is disabled'
                    }
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check for temporary password
            must_change = getattr(user, 'password_must_change', False)
            has_temporary = getattr(user, 'has_temporary_password', False)
            temp_created_at = getattr(user, 'temp_password_created_at', None)
            
            # Check if temporary password expired
            if has_temporary and temp_created_at:
                time_since_reset = timezone.now() - temp_created_at
                hours_elapsed = time_since_reset.total_seconds() / 3600
                
                if hours_elapsed >= 24:
                    return Response({
                        'error': {
                            'code': 'TEMPORARY_PASSWORD_EXPIRED',
                            'message': 'Your temporary password has expired. Please contact an administrator for a new password reset.'
                        }
                    }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate JWT tokens using your existing function
            from authentication.views import get_tokens_for_user
            tokens = get_tokens_for_user(user)
            
            response_data = {
                'message': 'Login successful',
                'token': tokens['token'],
                'refresh_token': tokens['refresh_token'],
                'user': {
                    'id': str(user.UserID),
                    'email': user.email,
                    'user_type': user.user_type,
                    'admin_rights': getattr(user, 'admin_rights', False)
                }
            }
            
            # Add password change requirement info
            if must_change or has_temporary:
                response_data['password_change_required'] = True
                response_data['message'] = 'Login successful but password change required'
                
                if temp_created_at:
                    time_since_reset = timezone.now() - temp_created_at
                    hours_remaining = max(0, 24 - (time_since_reset.total_seconds() / 3600))
                    response_data['hours_remaining'] = round(hours_remaining, 1)
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        else:
            return Response({
                'error': {
                    'code': 'INVALID_CREDENTIALS',
                    'message': 'Invalid email or password'
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({
            'error': {
                'code': 'LOGIN_ERROR',
                'message': 'Login failed. Please try again.'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@permission_classes([AllowAny])  # No authentication required - user might be locked out
def request_password_reset(request):
    """Allow users to request a password reset for themselves"""
    
    email = request.data.get('email')
    print(f"DEBUG: Password reset requested for email: {email}")  # Debug line
    
    if not email:
        print(f"DEBUG: No email provided")  # Debug line
        return Response({
            'error': {
                'code': 'MISSING_EMAIL',
                'message': 'Email address is required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find user by email
        target_user = User.objects.get(email=email, is_active=True)
        print(f"DEBUG: Found user: {target_user.email}")  # Debug line
        
        # Generate temporary password (reuse your existing logic)
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        print(f"DEBUG: Generated temp password: {temp_password}")  # Debug line
        
        # Set expiry time (24 hours)
        expires_at = timezone.now() + timedelta(hours=24)
        print(f"DEBUG: Set expiry time: {expires_at}")  # Debug line
        
        # Update user password and set temporary flags (same as admin reset)
        target_user.set_password(temp_password)
        target_user.password_must_change = True
        target_user.has_temporary_password = True
        target_user.temp_password_created_at = timezone.now()
        target_user.save()
        print(f"DEBUG: Updated user password and flags")  # Debug line
        
        # Import your existing NotificationService
        try:
            from notifications.services import NotificationService
            print(f"DEBUG: Successfully imported NotificationService")  # Debug line
        except ImportError as import_error:
            print(f"DEBUG: Failed to import NotificationService: {import_error}")  # Debug line
            raise import_error
        
        # Create in-app notification (same as admin reset)
        try:
            notification = NotificationService.create_notification(
                recipient=target_user,
                notification_type='password_reset',
                title='Password Reset Request',
                message='You requested a password reset. Please check your email for the temporary password.',
                sender=None,  # Self-initiated, no admin sender
                data={
                    'expires_at': expires_at.isoformat(),
                    'self_requested': True
                }
            )
            print(f"DEBUG: Created in-app notification: {notification.id}")  # Debug line
        except Exception as notif_error:
            print(f"DEBUG: Failed to create notification: {notif_error}")  # Debug line
            raise notif_error
        
        # Prepare email context (same as admin reset)
        from django.conf import settings
        context = {
            'user_name': NotificationService._get_user_display_name(target_user),
            'temp_password': temp_password,
            'login_url': f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/login",
            'expires_at': expires_at,
            'admin_name': 'System',  # Since it's self-service, not admin-initiated
            'is_self_service': True,  # Add this flag
            'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@savenbite.com'),
            'company_name': 'Save n Bite'
        }
        print(f"DEBUG: Prepared email context")  # Debug line
        
        # Send email using NEW critical email method (bypasses preferences)
        try:
            email_sent = NotificationService.send_critical_email_notification(
                user=target_user,
                subject='Password Reset Request - Save n Bite [IMPORTANT]',
                template_name='password_reset',  # Reuse existing template
                context=context,
                notification=notification
            )
            print(f"DEBUG: Critical email sending result: {email_sent}")  # Debug line
        except Exception as email_error:
            print(f"DEBUG: Failed to send critical email: {email_error}")  # Debug line
            raise email_error
        
        if email_sent:
            logger.info(f"Self-service password reset email sent successfully to {target_user.email} (bypassed email preferences)")
            print(f"DEBUG: Email sent successfully")  # Debug line
            
            # Always return success message for security (don't reveal if email exists)
            return Response({
                'message': 'If an account with that email exists, you will receive password reset instructions shortly.',
                'reset_info': {
                    'expires_in_hours': 24,
                    'note': 'This email will be sent regardless of your email notification preferences for security purposes.'
                }
            }, status=status.HTTP_200_OK)
        else:
            print(f"DEBUG: Email sending returned False")  # Debug line
            raise Exception("Email sending returned False")
            
    except User.DoesNotExist:
        # For security, don't reveal that email doesn't exist
        # Return same success message as if user existed
        print(f"DEBUG: User not found for email: {email}")  # Debug line
        logger.info(f"Password reset requested for non-existent email: {email}")
        return Response({
            'message': 'If an account with that email exists, you will receive password reset instructions shortly.',
            'reset_info': {
                'expires_in_hours': 24,
                'note': 'This email will be sent regardless of your email notification preferences for security purposes.'
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"DEBUG: Exception occurred: {str(e)}")  # Debug line
        print(f"DEBUG: Exception type: {type(e)}")  # Debug line
        import traceback
        print(f"DEBUG: Full traceback: {traceback.format_exc()}")  # Debug line
        logger.error(f"Self-service password reset error for {email}: {str(e)}")
        return Response({
            'error': {
                'code': 'PASSWORD_RESET_ERROR',
                'message': 'Failed to process password reset request. Please try again.'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def check_email_exists(request):
    """
    Optional: Check if email exists (for frontend UX)
    Note: This could be a security concern as it reveals user existence
    Consider removing this in production or adding rate limiting
    """
    
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': {
                'code': 'MISSING_EMAIL',
                'message': 'Email address is required'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_exists = User.objects.filter(email=email, is_active=True).exists()
        
        return Response({
            'exists': user_exists,
            'message': 'Email found' if user_exists else 'Email not found'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Email check error: {str(e)}")
        return Response({
            'error': {
                'code': 'EMAIL_CHECK_ERROR',
                'message': 'Failed to check email'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([AllowAny])  # Allow anyone to view food providers
def get_food_providers(request):
    """
    Get all verified food providers with their complete information
    Supports optional filtering and search parameters
    """
    try:
        from django.db.models import Q, Count
        from django.core.paginator import Paginator
        
        # Start with all verified food providers
        providers_query = User.objects.filter(
            user_type='provider',
            provider_profile__status='verified',
            is_active=True
        ).select_related('provider_profile')
        
        # Optional search parameter
        search = request.GET.get('search', '').strip()
        if search:
            providers_query = providers_query.filter(
                Q(provider_profile__business_name__icontains=search) |
                Q(provider_profile__business_address__icontains=search) |
                Q(provider_profile__business_email__icontains=search)
            )
        
        # Optional status filter (though we're already filtering for verified)
        status_filter = request.GET.get('status')
        if status_filter and status_filter in ['pending_verification', 'verified', 'rejected']:
            providers_query = providers_query.filter(provider_profile__status=status_filter)
        
        # Optional location filter (city)
        city_filter = request.GET.get('city')
        if city_filter:
            providers_query = providers_query.filter(
                provider_profile__business_address__icontains=city_filter
            )
        
        # Optional filter for providers with coordinates (for map view)
        has_coordinates = request.GET.get('has_coordinates')
        if has_coordinates and has_coordinates.lower() == 'true':
            providers_query = providers_query.filter(
                provider_profile__latitude__isnull=False,
                provider_profile__longitude__isnull=False
            )
        
        # Pagination
        page_size = min(int(request.GET.get('page_size', 50)), 200)  # Max 200 items
        page_number = int(request.GET.get('page', 1))
        
        paginator = Paginator(providers_query, page_size)
        page_obj = paginator.get_page(page_number)
        
        providers_list = []
        for provider_user in page_obj:
            profile = provider_user.provider_profile
            
            # Get additional stats (follower count, active listings count)
            try:
                from notifications.models import BusinessFollower
                follower_count = BusinessFollower.objects.filter(business=profile).count()
            except:
                follower_count = 0
            
            try:
                from food_listings.models import FoodListing
                active_listings_count = FoodListing.objects.filter(
                    provider=provider_user,
                    status='active'
                ).count()
                total_listings_count = FoodListing.objects.filter(
                    provider=provider_user
                ).count()
            except:
                active_listings_count = 0
                total_listings_count = 0
            
            # Build provider data
            provider_data = {
                'id': str(provider_user.UserID),  # Using UserID as per your model
                'business_name': profile.business_name,
                'business_email': profile.business_email,
                'business_address': profile.business_address,
                'business_contact': profile.business_contact,
                'phone_number': profile.phone_number,
                'business_hours': profile.business_hours,
                'website': profile.website,
                'status': profile.status,
                'logo': profile.logo.url if profile.logo else None,
                
                # Location data
                'coordinates': profile.coordinates,  # This uses the @property from your model
                'latitude': float(profile.latitude) if profile.latitude else None,
                'longitude': float(profile.longitude) if profile.longitude else None,
                'geocoded_at': profile.geocoded_at.isoformat() if profile.geocoded_at else None,
                'geocoding_failed': profile.geocoding_failed,
                'openstreetmap_url': profile.openstreetmap_url,  # This uses the @property from your model
                
                # Stats
                'follower_count': follower_count,
                'active_listings_count': active_listings_count,
                'total_listings_count': total_listings_count,
                
                # Account info
                'joined_date': provider_user.date_joined.isoformat() if hasattr(provider_user, 'date_joined') else None,
                'last_login': provider_user.last_login.isoformat() if provider_user.last_login else None,
                
                # Check if current user is following (if authenticated)
                'is_following': False  # Will be updated below if user is authenticated
            }
            
            # Add follow status if user is authenticated
            if request.user.is_authenticated and request.user.user_type in ['customer', 'ngo']:
                try:
                    from notifications.models import BusinessFollower
                    is_following = BusinessFollower.objects.filter(
                        user=request.user,
                        business=profile
                    ).exists()
                    provider_data['is_following'] = is_following
                except:
                    pass
            
            providers_list.append(provider_data)
        
        # Prepare response with pagination info
        response_data = {
            'providers': providers_list,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'page_size': page_size
            },
            'filters_applied': {
                'search': search,
                'status': status_filter,
                'city': city_filter,
                'has_coordinates': has_coordinates
            }
        }
        
        # Add summary stats
        total_verified_providers = User.objects.filter(
            user_type='provider',
            provider_profile__status='verified',
            is_active=True
        ).count()
        
        response_data['summary'] = {
            'total_verified_providers': total_verified_providers,
            'providers_with_coordinates': User.objects.filter(
                user_type='provider',
                provider_profile__status='verified',
                is_active=True,
                provider_profile__latitude__isnull=False,
                provider_profile__longitude__isnull=False
            ).count()
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': {
                'code': 'INVALID_PARAMETERS',
                'message': 'Invalid request parameters',
                'details': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Get food providers error: {str(e)}")
        return Response({
            'error': {
                'code': 'PROVIDERS_FETCH_ERROR',
                'message': 'Failed to fetch food providers',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_food_provider_by_id(request, provider_id):
    """
    Get a specific food provider by their ID with detailed information
    """
    try:
        # Get the provider user by UserID
        provider_user = User.objects.select_related('provider_profile').get(
            UserID=provider_id,
            user_type='provider',
            is_active=True
        )
        
        profile = provider_user.provider_profile
        
        # Get additional stats
        try:
            from notifications.models import BusinessFollower
            follower_count = BusinessFollower.objects.filter(business=profile).count()
            
            # Get list of followers if requested
            include_followers = request.GET.get('include_followers', 'false').lower() == 'true'
            followers_list = []
            if include_followers:
                followers = BusinessFollower.objects.filter(business=profile).select_related('user')[:10]  # Limit to 10
                for follower in followers:
                    followers_list.append({
                        'id': str(follower.user.UserID),
                        'name': follower.user.get_full_name(),
                        'user_type': follower.user.user_type,
                        'followed_since': follower.created_at.isoformat()
                    })
        except:
            follower_count = 0
            followers_list = []
        
        try:
            from food_listings.models import FoodListing
            active_listings_count = FoodListing.objects.filter(
                provider=provider_user,
                status='active'
            ).count()
            total_listings_count = FoodListing.objects.filter(
                provider=provider_user
            ).count()
            
            # Get recent listings if requested
            include_recent_listings = request.GET.get('include_recent_listings', 'false').lower() == 'true'
            recent_listings = []
            if include_recent_listings:
                listings = FoodListing.objects.filter(
                    provider=provider_user,
                    status='active'
                ).order_by('-created_at')[:5]  # Last 5 active listings
                
                for listing in listings:
                    recent_listings.append({
                        'id': str(listing.id),
                        'name': listing.name,
                        'type': listing.type,
                        'original_price': float(listing.original_price),
                        'discounted_price': float(listing.discounted_price),
                        'quantity_available': listing.quantity_available,
                        'expiry_date': listing.expiry_date.isoformat(),
                        'created_at': listing.created_at.isoformat()
                    })
        except:
            active_listings_count = 0
            total_listings_count = 0
            recent_listings = []
        
        # Check if current user is following
        is_following = False
        if request.user.is_authenticated and request.user.user_type in ['customer', 'ngo']:
            try:
                from notifications.models import BusinessFollower
                is_following = BusinessFollower.objects.filter(
                    user=request.user,
                    business=profile
                ).exists()
            except:
                pass
        
        # Build comprehensive provider data
        provider_data = {
            'id': str(provider_user.UserID),
            'business_name': profile.business_name,
            'business_email': profile.business_email,
            'business_address': profile.business_address,
            'business_contact': profile.business_contact,
            'phone_number': profile.phone_number,
            'business_hours': profile.business_hours,
            'website': profile.website,
            'status': profile.status,
            'logo': profile.logo.url if profile.logo else None,
            
            # Location data
            'coordinates': profile.coordinates,
            'latitude': float(profile.latitude) if profile.latitude else None,
            'longitude': float(profile.longitude) if profile.longitude else None,
            'geocoded_at': profile.geocoded_at.isoformat() if profile.geocoded_at else None,
            'geocoding_failed': profile.geocoding_failed,
            'geocoding_error': profile.geocoding_error,
            'openstreetmap_url': profile.openstreetmap_url,
            
            # Account information
            'joined_date': provider_user.date_joined.isoformat() if hasattr(provider_user, 'date_joined') else None,
            'last_login': provider_user.last_login.isoformat() if provider_user.last_login else None,
            'email_verified': provider_user.is_active,
            
            # Stats and engagement
            'follower_count': follower_count,
            'active_listings_count': active_listings_count,
            'total_listings_count': total_listings_count,
            'is_following': is_following,
            
            # Optional detailed data
            'followers': followers_list if include_followers else [],
            'recent_listings': recent_listings if include_recent_listings else []
        }
        
        return Response({
            'provider': provider_data
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': {
                'code': 'PROVIDER_NOT_FOUND',
                'message': 'Food provider not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"Get food provider by ID error: {str(e)}")
        return Response({
            'error': {
                'code': 'PROVIDER_FETCH_ERROR',
                'message': 'Failed to fetch food provider details',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Optional: Lightweight endpoint for maps/location services
@api_view(['GET'])
@permission_classes([AllowAny])
def get_food_providers_locations(request):
    """
    Lightweight endpoint returning only location data for food providers
    Useful for map views and location-based services
    """
    try:
        # Only get providers with valid coordinates
        providers = User.objects.filter(
            user_type='provider',
            provider_profile__status='verified',
            is_active=True,
            provider_profile__latitude__isnull=False,
            provider_profile__longitude__isnull=False
        ).select_related('provider_profile')
        
        # Optional bounding box filter for map viewport
        north = request.GET.get('north')
        south = request.GET.get('south') 
        east = request.GET.get('east')
        west = request.GET.get('west')
        
        if all([north, south, east, west]):
            try:
                providers = providers.filter(
                    provider_profile__latitude__lte=float(north),
                    provider_profile__latitude__gte=float(south),
                    provider_profile__longitude__lte=float(east),
                    provider_profile__longitude__gte=float(west)
                )
            except ValueError:
                pass  # Ignore invalid bounding box values
        
        locations_data = []
        for provider_user in providers:
            profile = provider_user.provider_profile
            
            # Get active listings count for marker
            try:
                from food_listings.models import FoodListing
                active_listings = FoodListing.objects.filter(
                    provider=provider_user,
                    status='active'
                ).count()
            except:
                active_listings = 0
            
            locations_data.append({
                'id': str(provider_user.UserID),
                'business_name': profile.business_name,
                'business_address': profile.business_address,
                'coordinates': {
                    'lat': float(profile.latitude),
                    'lng': float(profile.longitude)
                },
                'business_hours': profile.business_hours,
                'phone_number': profile.phone_number,
                'active_listings_count': active_listings,
                'logo': profile.logo.url if profile.logo else None,
                'openstreetmap_url': profile.openstreetmap_url
            })
        
        return Response({
            'providers': locations_data,
            'total_count': len(locations_data),
            'bounding_box': {
                'north': north,
                'south': south,
                'east': east,
                'west': west
            } if all([north, south, east, west]) else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get food providers locations error: {str(e)}")
        return Response({
            'error': {
                'code': 'LOCATIONS_FETCH_ERROR',
                'message': 'Failed to fetch provider locations',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    """
    Get comprehensive profile data for the current user including:
    - User details
    - Order history and statistics
    - Businesses they follow
    - Reviews they've written
    - Impact statistics
    """
    user = request.user
    
    try:
        # Get user profile based on type
        profile_data = {}
        
        if user.user_type == 'customer':
            try:
                customer_profile = user.customer_profile
                profile_data = {
                    'full_name': customer_profile.full_name,
                    'profile_type': 'Individual Consumer',
                    'verification_status': 'verified',  # FIXED: Customers are auto-verified
                    'profile_image': customer_profile.profile_image.url if customer_profile.profile_image else None,
                }
            except CustomerProfile.DoesNotExist:
                profile_data = {
                    'full_name': user.get_full_name() or user.username,
                    'profile_type': 'Individual Consumer',
                    'verification_status': 'verified'  # FIXED: Default to verified for customers
                }
                
        elif user.user_type == 'ngo':
            try:
                ngo_profile = user.ngo_profile
                profile_data = {
                    'full_name': ngo_profile.representative_name,
                    'organisation_name': ngo_profile.organisation_name,
                    'profile_type': 'Organization',
                    'verification_status': ngo_profile.status,
                    'organisation_contact': ngo_profile.organisation_contact,
                    'organisation_email': ngo_profile.organisation_email
                }
            except NGOProfile.DoesNotExist:
                profile_data = {
                    'full_name': user.get_full_name() or user.username,
                    'profile_type': 'Organization',
                    'verification_status': 'pending'
                }
                
        elif user.user_type == 'provider':
            try:
                provider_profile = user.provider_profile
                profile_data = {
                    'full_name': provider_profile.business_name,
                    'business_name': provider_profile.business_name,
                    'profile_type': 'Food Provider',
                    'verification_status': provider_profile.status,
                    'business_email': provider_profile.business_email,
                    'business_contact': provider_profile.business_contact,
                    'business_address': provider_profile.business_address
                }
            except FoodProviderProfile.DoesNotExist:
                profile_data = {
                    'full_name': user.get_full_name() or user.username,
                    'profile_type': 'Food Provider',
                    'verification_status': 'pending'
                }
        
        # Base user information
        user_data = {
            'id': str(user.UserID),
            'email': user.email,
            'phone_number': user.phone_number,
            'profile_picture': user.profile_picture,
            'member_since': user.date_joined.strftime('%B %Y'),
            'user_type': user.user_type,
            **profile_data
        }
        
        # Get order statistics
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get all interactions for this user
        user_interactions = Interaction.objects.filter(user=user)
        user_orders = Order.objects.filter(interaction__user=user)
        
        # Order statistics
        completed_orders = user_orders.filter(status='completed').count()
        cancelled_orders = user_orders.filter(status='cancelled').count()
        missed_pickups = user_orders.filter(status='missed').count()
        
        # This month's orders for impact calculation
        this_month_orders = user_orders.filter(
            interaction__created_at__gte=current_month,
            status='completed'
        )
        
        order_statistics = {
            'completed_orders': completed_orders,
            'cancelled_orders': cancelled_orders,
            'missed_pickups': missed_pickups,
            'total_orders': completed_orders + cancelled_orders + missed_pickups
        }
        
        # Get businesses they follow (only for customers and NGOs)
        followed_businesses = []
        if user.user_type in ['customer', 'ngo']:
            try:
                following_relationships = BusinessFollower.objects.filter(user=user).select_related(
                    'business__user'
                )
                
                for follow in following_relationships:
                    business = follow.business
                    followed_businesses.append({
                        'id': str(business.user.UserID),
                        'business_name': business.business_name,
                        'business_email': business.business_email,
                        'logo': business.logo.url if business.logo else None,
                        'status': business.status,
                        'followed_since': follow.created_at.strftime('%B %Y'),
                        'business_address': business.business_address
                    })
            except Exception as e:
                logger.error(f"Error fetching followed businesses: {str(e)}")
                followed_businesses = []
        
        # Get user's reviews - FIXED: Don't slice before using in other queries
        all_user_reviews = Review.objects.filter(
            reviewer=user,
            status__in=['active', 'flagged']
        ).select_related('business')
        
        # Get latest 10 reviews for display
        recent_reviews = all_user_reviews.order_by('-created_at')[:10]
        
        reviews_data = []
        for review in recent_reviews:
            reviews_data.append({
                'id': str(review.id),
                'business_name': review.business.business_name,
                'general_rating': review.general_rating,
                'general_comment': review.general_comment,
                'food_review': review.food_review,
                'business_review': review.business_review,
                'created_at': review.created_at.strftime('%B %d, %Y'),
                'review_source': review.review_source
            })
        
        # Calculate impact statistics - FIXED: Don't use sliced querysets in aggregations
        try:
            current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Get completed orders this month - separate count and sum queries
            this_month_completed = Order.objects.filter(
                interaction__user=user,
                interaction__created_at__gte=current_month,
                status='completed'
            )
            
            meals_this_month = sum(order.interaction.quantity for order in this_month_completed)
            money_saved = sum(float(order.interaction.total_amount) for order in this_month_completed)
            
            # Get total completed orders - separate query
            all_completed = Order.objects.filter(
                interaction__user=user,
                status='completed'
            )
            
            total_meals = sum(order.interaction.quantity for order in all_completed)
            
            impact_statistics = {
                'meals_rescued_this_month': meals_this_month,
                'co2_emissions_prevented_kg': round(meals_this_month * 1.3, 1),
                'total_meals_rescued': total_meals,
                'total_co2_prevented_kg': round(total_meals * 1.3, 1),
                'money_saved_this_month': round(money_saved, 2)
            }
            
        except Exception as e:
            logger.error(f"Error calculating impact: {str(e)}")
            impact_statistics = {
                'meals_rescued_this_month': 0,
                'co2_emissions_prevented_kg': 0.0,
                'total_meals_rescued': 0,
                'total_co2_prevented_kg': 0.0,
                'money_saved_this_month': 0.0
            }
        
        # Review statistics - FIXED: Use count() instead of len() on sliced queryset
        review_stats = {
            'total_reviews': all_user_reviews.count(),
            'average_rating_given': round(float(
                all_user_reviews.filter(
                    general_rating__isnull=False
                ).aggregate(Avg('general_rating'))['general_rating__avg'] or 0
            ), 2)
        }
        
        # Response data
        response_data = {
            'user_details': user_data,
            'order_statistics': order_statistics,
            'followed_businesses': {
                'count': len(followed_businesses),
                'businesses': followed_businesses
            },
            'reviews': {
                'count': len(reviews_data),
                'recent_reviews': reviews_data,
                'statistics': review_stats
            },
            'impact_statistics': impact_statistics,
            'notification_preferences': get_user_notification_preferences(user)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching profile data for user {user.email}: {str(e)}")
        return Response({
            'error': {
                'code': 'PROFILE_FETCH_ERROR',
                'message': 'Failed to fetch profile data',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_user_notification_preferences(user):
    """Helper function to get user notification preferences"""
    try:
        from notifications.models import NotificationPreferences
        prefs, created = NotificationPreferences.objects.get_or_create(user=user)
        return {
            'email_notifications': prefs.email_notifications,
            'new_listing_notifications': prefs.new_listing_notifications,
            'promotional_notifications': prefs.promotional_notifications,
            'weekly_digest': prefs.weekly_digest
        }
    except Exception:
        return {
            'email_notifications': True,
            'new_listing_notifications': True,
            'promotional_notifications': False,
            'weekly_digest': True
        }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_history(request):
    """
    Get detailed order history for the current user
    Supports pagination and filtering
    """
    user = request.user
    
    # Get query parameters
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 20))
    order_status = request.GET.get('status', 'all')  # all, completed, cancelled, pending
    order_type = request.GET.get('type', 'all')  # all, purchase, donation
    
    try:
        # Base queryset
        orders_query = Order.objects.filter(
            interaction__user=user
        ).select_related(
            'interaction',
            'interaction__business',
            'interaction__business__user'
        ).prefetch_related(
            'interaction__items',
            'interaction__items__food_listing'
        ).order_by('-created_at')
        
        # Apply filters
        if order_status != 'all':
            orders_query = orders_query.filter(status=order_status)
        
        if order_type != 'all':
            if order_type == 'purchase':
                orders_query = orders_query.filter(interaction__interaction_type='Purchase')
            elif order_type == 'donation':
                orders_query = orders_query.filter(interaction__interaction_type='Donation')
        
        # Pagination
        total_count = orders_query.count()
        offset = (page - 1) * limit
        orders = orders_query[offset:offset + limit]
        
        # Serialize orders
        orders_data = []
        for order in orders:
            interaction = order.interaction
            business = interaction.business
            
            # Get food items
            items_data = []
            for item in interaction.items.all():
                items_data.append({
                    'food_listing_id': str(item.food_listing.id),
                    'name': item.food_listing.name,
                    'description': item.food_listing.description,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                    'expiry_date': item.food_listing.expiry_date.isoformat() if item.food_listing.expiry_date else None
                })
            
            orders_data.append({
                'order_id': str(order.id),
                'interaction_id': str(interaction.id),
                'business': {
                    'id': str(business.user.UserID),
                    'name': business.business_name,
                    'logo': business.logo.url if business.logo else None,
                    'email': business.business_email
                },
                'order_type': interaction.interaction_type,
                'status': order.status,
                'total_amount': float(interaction.total_amount),
                'quantity': interaction.quantity,
                'pickup_window': order.pickup_window,
                'pickup_code': order.pickup_code,
                'items': items_data,
                'created_at': order.created_at.isoformat(),
                'completed_at': order.completed_at.isoformat() if order.completed_at else None,
                'can_review': order.status == 'completed' and not hasattr(interaction, 'review')
            })
        
        # Pagination info
        total_pages = (total_count + limit - 1) // limit
        has_next = page < total_pages
        has_previous = page > 1
        
        return Response({
            'orders': orders_data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_count': total_count,
                'has_next': has_next,
                'has_previous': has_previous,
                'limit': limit
            },
            'filters': {
                'status': order_status,
                'type': order_type
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching order history for user {user.email}: {str(e)}")
        return Response({
            'error': {
                'code': 'ORDER_HISTORY_ERROR',
                'message': 'Failed to fetch order history',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_my_profile(request):
    """
    Update user profile information
    """
    user = request.user
    data = request.data
    
    try:
        # Update base user fields
        if 'email' in data:
            user.email = data['email']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        
        user.save()
        
        # Update profile-specific fields based on user type
        if user.user_type == 'customer':
            try:
                customer_profile = user.customer_profile
                if 'full_name' in data:
                    customer_profile.full_name = data['full_name']
                # Note: CustomerProfile doesn't have dietary_restrictions or preferred_pickup_areas
                # Only update fields that actually exist
                customer_profile.save()
            except CustomerProfile.DoesNotExist:
                # Create profile if it doesn't exist
                CustomerProfile.objects.create(
                    user=user,
                    full_name=data.get('full_name', user.get_full_name() or user.username)
                )
                
        elif user.user_type == 'ngo':
            try:
                ngo_profile = user.ngo_profile
                if 'representative_name' in data:
                    ngo_profile.representative_name = data['representative_name']
                if 'organisation_contact' in data:
                    ngo_profile.organisation_contact = data['organisation_contact']
                if 'organisation_email' in data:
                    ngo_profile.organisation_email = data['organisation_email']
                ngo_profile.save()
            except NGOProfile.DoesNotExist:
                pass  # Cannot create NGO profile without required verification docs
                
        elif user.user_type == 'provider':
            try:
                provider_profile = user.provider_profile
                if 'business_name' in data:
                    provider_profile.business_name = data['business_name']
                if 'business_email' in data:
                    provider_profile.business_email = data['business_email']
                if 'business_contact' in data:
                    provider_profile.business_contact = data['business_contact']
                if 'business_address' in data:
                    provider_profile.business_address = data['business_address']
                provider_profile.save()
            except FoodProviderProfile.DoesNotExist:
                pass  # Cannot create provider profile without required verification docs
        
        return Response({
            'message': 'Profile updated successfully',
            'user': {
                'id': str(user.UserID),
                'email': user.email,
                'phone_number': user.phone_number,
                'profile_picture': user.profile_picture
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating profile for user {user.email}: {str(e)}")
        return Response({
            'error': {
                'code': 'PROFILE_UPDATE_ERROR',
                'message': 'Failed to update profile',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)