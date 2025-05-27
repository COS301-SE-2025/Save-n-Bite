# authentication/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
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