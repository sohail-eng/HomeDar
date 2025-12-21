"""
Custom JWT token classes for HomeDar User model.
"""
from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens_for_user(user):
    """
    Generate refresh and access tokens for a user.
    Returns a dict with 'refresh' and 'access' tokens.
    """
    refresh = RefreshToken()
    refresh['user_id'] = str(user.id)
    refresh['username'] = user.username
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

