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
from django.utils import timezone
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
from .models import User
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