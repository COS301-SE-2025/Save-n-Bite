#!/usr/bin/env python
"""
Debug script to test password validation
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.test_settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from authentication.serializers import CustomerRegistrationSerializer

def test_password_validation():
    print("Testing password validation...")
    
    # Test 1: Direct Django validation
    print("\n1. Testing Django's validate_password directly:")
    weak_passwords = ['123', 'password', 'abc', '111111']
    
    for password in weak_passwords:
        try:
            validate_password(password)
            print(f"  ❌ Password '{password}' was ACCEPTED (should be rejected)")
        except ValidationError as e:
            print(f"  ✅ Password '{password}' was REJECTED: {e}")
    
    # Test 2: Serializer validation
    print("\n2. Testing CustomerRegistrationSerializer:")
    
    for password in weak_passwords:
        data = {
            'full_name': 'Test User',
            'email': f'test_{password}@test.com',
            'password': password,
            'role': 'normal'
        }
        
        serializer = CustomerRegistrationSerializer(data=data)
        if serializer.is_valid():
            print(f"  ❌ Serializer ACCEPTED password '{password}' (should be rejected)")
        else:
            print(f"  ✅ Serializer REJECTED password '{password}': {serializer.errors}")
    
    # Test 3: API endpoint
    print("\n3. Testing API endpoint:")
    from rest_framework.test import APIClient
    
    client = APIClient()
    
    for password in weak_passwords:
        data = {
            'full_name': 'Test User',
            'email': f'test_{password}@test.com',
            'password': password,
            'role': 'normal'
        }
        
        response = client.post('/auth/register/customer/', data)
        if response.status_code == 201:
            print(f"  ❌ API ACCEPTED password '{password}' (should be rejected)")
            print(f"      Response: {response.data}")
        else:
            print(f"  ✅ API REJECTED password '{password}': {response.status_code}")
            print(f"      Response: {response.data}")

if __name__ == '__main__':
    test_password_validation()
