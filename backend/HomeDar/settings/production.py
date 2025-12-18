"""
Production settings for HomeDar project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Set allowed hosts from environment variable
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost'])

# Database configuration for production
# Use DATABASE_URL if provided (recommended for production)
if env('DATABASE_URL'):
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
            'OPTIONS': {
                'connect_timeout': 10,
            },
        }
    }
else:
    raise ValueError("Database configuration is required in production. Set DATABASE_URL or DB_NAME, DB_USER, DB_PASSWORD.")

# Security settings for production
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=False)
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=False)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS settings for production - be specific about allowed origins
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])

# Static files serving in production
# Make sure to run: python manage.py collectstatic
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Media storage: local vs Google Cloud Storage (GCS)
# By default we keep using local MEDIA_ROOT (/media/).
# When USE_GCS_MEDIA=true, uploaded files go to the configured GCS bucket.
USE_GCS_MEDIA = env.bool('USE_GCS_MEDIA', default=False)

if USE_GCS_MEDIA:
    # Use Google Cloud Storage for media files
    DEFAULT_FILE_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'

    GS_BUCKET_NAME = env('GS_BUCKET_NAME')

    # Optional: path to service account JSON file
    GS_CREDENTIALS_FILE = env('GS_CREDENTIALS_FILE', default=None)
    if GS_CREDENTIALS_FILE:
        from google.oauth2 import service_account

        GS_CREDENTIALS = service_account.Credentials.from_service_account_file(
            GS_CREDENTIALS_FILE
        )

    # Media URLs will be served from GCS
    MEDIA_URL = f'https://storage.googleapis.com/{GS_BUCKET_NAME}/'

    # Optional: control default ACL for uploaded files
    GS_DEFAULT_ACL = 'publicRead'

# Email configuration for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@homedar.com')

