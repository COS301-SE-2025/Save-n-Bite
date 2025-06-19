# authentication/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import (
    CustomerRegistrationSerializer,
    NGORegistrationSerializer,
    FoodProviderRegistrationSerializer,
    LoginSerializer,
    UserProfileSerializer
)
from .models import User

def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'token': str(refresh.access_token),
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
    """Search for businesses"""
    search_query = request.GET.get('search', '').strip()
    
    if not search_query:
        return Response({
            'businesses': [],
            'count': 0
        }, status=status.HTTP_200_OK)
    
    try:
        from django.db.models import Q
        
        # Search in business profiles
        businesses = User.objects.filter(
            user_type='provider',
            provider_profile__status='verified'
        ).filter(
            Q(provider_profile__business_name__icontains=search_query) |
            Q(provider_profile__business_address__icontains=search_query)
        ).select_related('provider_profile')[:20]  # Limit to 20 results
        
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