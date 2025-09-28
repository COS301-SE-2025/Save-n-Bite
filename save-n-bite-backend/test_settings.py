"""
Test-specific Django settings for integration and E2E tests
"""

from backend.settings import *

# Override database settings for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST': {
            'NAME': ':memory:',
        }
    }
}

# Test-specific settings
DEBUG = False
TESTING = True

# Use faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Use in-memory email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Use local memory cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Test media and static files
MEDIA_ROOT = '/tmp/test_media/'
STATIC_ROOT = '/tmp/test_static/'

# Enable migrations but use a simpler approach for SQLite compatibility
# We'll use the actual migrations but with SQLite-compatible settings

# SQLite-specific database settings
DATABASES['default']['OPTIONS'] = {
    'timeout': 20,
}

# Use JSONField instead of ArrayField for SQLite compatibility
USE_TZ = True

# Celery settings for tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Logging for tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
        },
    },
}
