"""
Custom authentication utilities for HomeDar User model.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth.models import AnonymousUser
from ..models import User


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that works with our User model.
    """
    
    def get_user(self, validated_token):
        """
        Get user from validated token.
        """
        try:
            user_id = validated_token.get('user_id')
            if not user_id:
                return AnonymousUser()
            
            user = User.objects.get(id=user_id)
            return user
        except User.DoesNotExist:
            return AnonymousUser()
        except Exception:
            return AnonymousUser()

