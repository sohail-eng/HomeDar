"""
Development settings for HomeDar project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Database configuration
# Default to SQLite, but can use PostgreSQL if credentials are provided
if env('DATABASE_URL'):
    # Use DATABASE_URL if provided (e.g., for Heroku, Railway, etc.)
    DATABASES = {
        'default': env.db()
    }
elif env('DB_NAME'):
    # Use individual database credentials if provided
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('DB_NAME'),
            'USER': env('DB_USER'),
            'PASSWORD': env('DB_PASSWORD'),
            'HOST': env('DB_HOST', default='localhost'),
            'PORT': env('DB_PORT', default='5432'),
        }
    }
else:
    # Default to SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# CORS settings for development - allow all origins (be more restrictive in production)
CORS_ALLOW_ALL_ORIGINS = True

# Email backend for development (console backend prints emails to console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

