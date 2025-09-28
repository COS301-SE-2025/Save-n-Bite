
from .settings import *
import os
import sys

# =============================
# Dynamic test database naming
# =============================
# Allow selecting a dedicated test database per app/suite via env vars.
# Priority:
# 1) TEST_DB_NAME (full explicit name)
# 2) TEST_APP -> builds name as f"test_{TEST_APP}_db"
# 3) Fallback to previous default: 'test_save_n_bite_integration_db'

EXPLICIT_TEST_DB_NAME = os.getenv('TEST_DB_NAME')
TEST_APP = os.getenv('TEST_APP')  # e.g., 'authentication', 'admin_system'

if EXPLICIT_TEST_DB_NAME:
    SELECTED_TEST_DB_NAME = EXPLICIT_TEST_DB_NAME
elif TEST_APP:
    SELECTED_TEST_DB_NAME = f"test_{TEST_APP}_db"
else:
    SELECTED_TEST_DB_NAME = 'test_save_n_bite_integration_db'

# Override database settings for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': SELECTED_TEST_DB_NAME,  # Isolated per suite when TEST_APP/TEST_DB_NAME is set
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD', '').strip('"').strip("'"),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
        'TEST': {
            'NAME': SELECTED_TEST_DB_NAME,
        },
    }
}

# Disable migrations for faster test execution
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

# Only disable migrations if running tests
if 'test' in sys.argv:
    MIGRATION_MODULES = DisableMigrations()

# Test-specific settings for better performance
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',  # Faster for tests
]

# Ensure password validation is enabled for NFR security tests
# Import from main settings to maintain security requirements during testing
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Disable logging during tests to reduce noise
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
}

# Disable email sending during tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Use in-memory cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Test-specific Azure Blob Storage settings (use local storage for tests)
AZURE_ACCOUNT_NAME = 'devstoreaccount1'
AZURE_ACCOUNT_KEY = 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw=='
AZURE_CONTAINER = 'test-container'
AZURE_CONNECTION_STRING = 'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;'

# Reduce timeout for tests
TEST_TIMEOUT = 300  # 5 minutes

# Test database settings
TEST_DATABASE_PREFIX = 'test_integration_'
