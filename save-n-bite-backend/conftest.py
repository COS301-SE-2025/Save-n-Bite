# conftest.py - Minimal version
import os

# Set Django settings FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_settings_standalone')

# Initialize Django
import django
django.setup()

# Now import pytest
import pytest

# Basic fixtures only
@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass