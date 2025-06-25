from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, CustomerProfile, NGOProfile, FoodProviderProfile

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_customer_url = reverse('register_customer')
        self.register_ngo_url = reverse('register_ngo')
        self.register_provider_url = reverse('register_provider')
        self.login_url = reverse('login_user')
        
    def test_register_customer(self):
        data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'username': 'testuser',
            'full_name': 'Test User'
        }
        response = self.client.post(self.register_customer_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
        
    def test_login(self):
        # First create a user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        # Try to login
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('refreshToken', response.data)
        self.assertIn('user', response.data)
        self.assertIn('message', response.data)
        
        # Verify user data in response
        user_data = response.data['user']
        self.assertEqual(user_data['email'], 'test@example.com')
        self.assertEqual(user_data['user_type'], 'customer')
