"""
Custom rate limiting throttles for authentication endpoints.
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.exceptions import Throttled


class LoginRateThrottle(AnonRateThrottle):
    """
    Rate limit for login endpoint: 5 attempts per 15 minutes per IP.
    
    DRF's parse_rate only supports single-character units (s, m, h, d).
    For 15 minutes, we override parse_rate to return the correct duration.
    """
    rate = '5/m'  # Use standard format that DRF can parse
    
    def get_cache_key(self, request, view):
        """Get cache key for rate limiting."""
        return super().get_cache_key(request, view)
    
    def parse_rate(self, rate):
        """
        Override to return 5 requests per 15 minutes (900 seconds) instead of 1 minute.
        """
        if rate == '5/m':
            # Return (num_requests, duration_in_seconds)
            # 5 requests per 15 minutes = 5 requests per 900 seconds
            return (5, 900)
        # Fall back to parent's parse_rate for other rates
        return super().parse_rate(rate)
    
    def allow_request(self, request, view):
        """Check if request should be allowed."""
        try:
            rate = self.get_rate()
            if rate is None:
                return True
            return super().allow_request(request, view)
        except Exception:
            # On error, allow the request to prevent blocking users
            return True
    
    def throttle_failure(self):
        """Provide user-friendly error message."""
        wait = self.wait()
        
        if wait is None or wait <= 0:
            wait = 0
        
        if wait > 0:
            wait_minutes = int(wait / 60) if wait >= 60 else int(wait)
            wait_text = f"{wait_minutes} minute{'s' if wait_minutes != 1 else ''}" if wait >= 60 else f"{int(wait)} second{'s' if wait != 1 else ''}"
        else:
            wait_text = "immediately"
        
        raise Throttled(
            detail=f"Too many login attempts. Please try again {wait_text}." if wait > 0 else "Login temporarily unavailable. Please try again in a moment.",
            wait=wait
        )


class SignupRateThrottle(AnonRateThrottle):
    """
    Rate limit for signup endpoint: 3 attempts per hour per IP.
    """
    rate = '3/h'
    
    def get_cache_key(self, request, view):
        """Get cache key for rate limiting."""
        return super().get_cache_key(request, view)
    
    def allow_request(self, request, view):
        """Check if request should be allowed."""
        try:
            rate = self.get_rate()
            if rate is None:
                return True
            
            allowed = super().allow_request(request, view)
            
            if not allowed:
                wait = self.wait()
                if wait is None or wait <= 0:
                    return True
            
            return allowed
        except Exception:
            # On error, allow the request to prevent blocking users
            return True
    
    def throttle_failure(self):
        """Provide user-friendly error message."""
        wait = self.wait()
        
        if wait is None or wait <= 0:
            wait = 0
        
        if wait > 0:
            wait_minutes = int(wait / 60) if wait >= 60 else int(wait)
            wait_text = f"{wait_minutes} minute{'s' if wait_minutes != 1 else ''}" if wait >= 60 else f"{int(wait)} second{'s' if wait != 1 else ''}"
        else:
            wait_text = "immediately"
        
        raise Throttled(
            detail=f"Too many signup attempts. Please try again {wait_text}." if wait > 0 else "Signup temporarily unavailable. Please try again in a moment.",
            wait=wait
        )


class ForgotPasswordRateThrottle(AnonRateThrottle):
    """
    Rate limit for forgot password endpoints: 3 attempts per hour per username_or_email/IP.
    """
    rate = '3/h'
    
    def get_cache_key(self, request, view):
        """Include username_or_email in cache key for per-user rate limiting."""
        ident = self.get_ident(request)
        
        if request.method == 'POST':
            username_or_email = request.data.get('username_or_email', '').strip()
            if not username_or_email:
                username_or_email = request.data.get('email', '').strip().lower()
            
            if username_or_email:
                ident = f"{ident}_{username_or_email}"
        
        cache_key = self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
        
        return cache_key
    
    def allow_request(self, request, view):
        """Check if request should be allowed."""
        try:
            rate = self.get_rate()
            if rate is None:
                return True
            return super().allow_request(request, view)
        except Exception:
            # On error, allow the request to prevent blocking users
            return True
    
    def throttle_failure(self):
        """Provide user-friendly error message."""
        wait = self.wait()
        
        if wait is None or wait <= 0:
            wait = 0
        
        if wait > 0:
            wait_minutes = int(wait / 60) if wait >= 60 else int(wait)
            wait_text = f"{wait_minutes} minute{'s' if wait_minutes != 1 else ''}" if wait >= 60 else f"{int(wait)} second{'s' if wait != 1 else ''}"
        else:
            wait_text = "immediately"
        
        raise Throttled(
            detail=f"Too many password reset attempts. Please try again in {wait_text}.",
            wait=wait
        )
