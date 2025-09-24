# authentication/jwt_auth.py - Enhanced version

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication to handle UserID field properly
    """
    
    def get_validated_token(self, raw_token):
        """
        Validates an encoded JSON web token and returns a validated token
        wrapper object. Also adds additional debugging.
        """
        try:
            return UntypedToken(raw_token)
        except TokenError as e:
            logger.error(f"Token validation failed: {str(e)}")
            raise InvalidToken({
                'detail': _('Given token not valid for any token type'),
                'messages': [
                    {
                        'token_class': UntypedToken.__name__,
                        'token_type': UntypedToken.token_type,
                        'message': str(e),
                    }
                ],
            })

    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        Uses UserID field instead of default id for user lookup.
        """
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken(_("Token contained no recognizable user identification"))

        try:
            # Convert to string if it's not already (handles UUID conversion)
            user_id_str = str(user_id)
            
            # Use UserID instead of the default 'id' field
            user = User.objects.get(UserID=user_id_str)
            
        except User.DoesNotExist:
            logger.error(f"User not found with UserID: {user_id_str}")
            raise AuthenticationFailed(_("User not found"), code="user_not_found")
        except Exception as e:
            logger.error(f"Unexpected error during user lookup: {str(e)}")
            raise AuthenticationFailed(_("Authentication failed"), code="auth_error")

        if not user.is_active:
            logger.warning(f"Inactive user attempted authentication: {user.email}")
            raise AuthenticationFailed(_("User is inactive"), code="user_inactive")

        return user
    
    def authenticate(self, request):
        """
        Enhanced authenticate method with better error handling
        """
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            return None