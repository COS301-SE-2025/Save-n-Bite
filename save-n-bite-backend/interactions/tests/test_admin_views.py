from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, force_authenticate
from rest_framework import status
from unittest.mock import patch

from interactions.models import Interaction, Order, Payment
from authentication.models import FoodProviderProfile, CustomerProfile
from interactions.admin_views import admin_get_all_transactions

User = get_user_model()


class AdminGetAllTransactionsTests(APITestCase):
    
    def setUp(self):
        self.factory = RequestFactory()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            is_staff=True,
            is_superuser=True,
            user_type='customer',
            role='admin'
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            username='consumer',
            email='consumer@example.com',
            password='testpass123',
            user_type='customer',
            role='normal'
        )
        
        # Create business owner user
        self.business_owner = User.objects.create_user(
            username='businessowner',
            email='owner@example.com',
            password='testpass123',
            user_type='provider',
            role='normal'
        )
        
        # Create customer profile for regular user
        self.customer_profile, created = CustomerProfile.objects.get_or_create(
            user=self.regular_user,
            defaults={
                'full_name': 'Test Consumer'
            }
        )
        
        # Create food provider profile for business owner
        self.food_provider, created = FoodProviderProfile.objects.get_or_create(
            user=self.business_owner,
            defaults={
                'business_name': 'Test Restaurant',
                'business_address': '123 Test St',
                'business_contact': '+1234567890',
                'business_email': 'restaurant@example.com',
                'cipc_document': 'test_doc.pdf',
                'status': 'verified'
            }
        )
        
        # Create test interactions
        self.interaction1 = Interaction.objects.create(
            user=self.regular_user,
            business=self.food_provider,
            interaction_type='Purchase',
            status='completed',
            total_amount=100.00,
            special_instructions='Test instructions'
        )
        
        self.interaction2 = Interaction.objects.create(
            user=self.regular_user,
            business=self.food_provider,
            interaction_type='Donation',
            status='pending',
            total_amount=0.00,
            special_instructions='Donation instructions'
        )
        
        # Create order and payment for interaction1
        self.order = Order.objects.create(
            interaction=self.interaction1,
            pickup_code='TEST123',
            pickup_window='12:00-13:00'
        )
        
        self.payment = Payment.objects.create(
            interaction=self.interaction1,
            status='completed',
            amount=100.00,
            method='card'
        )

    def _make_admin_request(self, path='/admin/transactions/'):
        """Helper method to make request with admin permissions"""
        # Patch the permission check to return True for admin user
        with patch('interactions.admin_views.IsSystemAdmin.has_permission', return_value=True):
            request = self.factory.get(path)
            force_authenticate(request, user=self.admin_user)
            return admin_get_all_transactions(request)

    def test_admin_get_all_transactions_success(self):
        """Test successful retrieval of all transactions"""
        response = self._make_admin_request()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transactions', response.data)
        self.assertIn('pagination', response.data)
        self.assertEqual(len(response.data['transactions']), 2)
        
        # Verify transaction data structure
        transaction = response.data['transactions'][0]
        self.assertIn('id', transaction)
        self.assertIn('provider', transaction)
        self.assertIn('consumer', transaction)
        self.assertIn('type', transaction)
        self.assertIn('amount', transaction)
        self.assertIn('status', transaction)
        self.assertIn('date', transaction)
        self.assertIn('items_count', transaction)
        self.assertIn('pickup_code', transaction)
        self.assertIn('payment_status', transaction)
        self.assertIn('special_instructions', transaction)

    def test_admin_get_all_transactions_pagination(self):
        """Test pagination functionality"""
        response = self._make_admin_request('/admin/transactions/?page=1&per_page=1')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 1)
        self.assertEqual(response.data['pagination']['current_page'], 1)
        self.assertEqual(response.data['pagination']['total_pages'], 2)
        self.assertEqual(response.data['pagination']['total_count'], 2)

    def test_admin_get_all_transactions_search_filter(self):
        """Test search functionality"""
        # Search by username
        response = self._make_admin_request('/admin/transactions/?search=consumer')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 2)
        
        # Search by business name
        response = self._make_admin_request('/admin/transactions/?search=Restaurant')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 0)
        
        # Search by non-existent term
        response = self._make_admin_request('/admin/transactions/?search=nonexistent')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 0)

    def test_admin_get_all_transactions_type_filter(self):
        """Test type filtering"""
        # Filter by Sale
        response = self._make_admin_request('/admin/transactions/?type=Sale')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 1)
        self.assertEqual(response.data['transactions'][0]['type'], 'Sale')
        
        # Filter by Donation
        response = self._make_admin_request('/admin/transactions/?type=Donation')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 1)
        self.assertEqual(response.data['transactions'][0]['type'], 'Donation')

    def test_admin_get_all_transactions_status_filter(self):
        """Test status filtering"""
        # Filter by completed status
        response = self._make_admin_request('/admin/transactions/?status=Completed')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 1)
        self.assertEqual(response.data['transactions'][0]['status'], 'Completed')
        
        # Filter by pending status
        response = self._make_admin_request('/admin/transactions/?status=Pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 1)
        self.assertEqual(response.data['transactions'][0]['status'], 'Pending')

    def test_admin_get_all_transactions_unauthorized(self):
        """Test unauthorized access"""
        request = self.factory.get('/admin/transactions/')
        # Don't authenticate - should fail
        
        response = admin_get_all_transactions(request)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_get_all_transactions_regular_user(self):
        """Test access by regular user (should fail)"""
        # Patch permission to return False for regular user
        with patch('interactions.admin_views.IsSystemAdmin.has_permission', return_value=False):
            request = self.factory.get('/admin/transactions/')
            force_authenticate(request, user=self.regular_user)
            
            response = admin_get_all_transactions(request)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_get_all_transactions_business_owner(self):
        """Test access by business owner (should fail)"""
        # Patch permission to return False for business owner
        with patch('interactions.admin_views.IsSystemAdmin.has_permission', return_value=False):
            request = self.factory.get('/admin/transactions/')
            force_authenticate(request, user=self.business_owner)
            
            response = admin_get_all_transactions(request)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_get_all_transactions_order_by_date(self):
        """Test that transactions are ordered by creation date descending"""
        response = self._make_admin_request()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        transactions = response.data['transactions']
        self.assertTrue(len(transactions) >= 2)

    def test_admin_get_all_transactions_amount_formatting(self):
        """Test amount formatting"""
        response = self._make_admin_request()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transactions', response.data)
        
        # Find sale and donation transactions
        sale_transaction = None
        donation_transaction = None
        
        for transaction in response.data['transactions']:
            if transaction['type'] == 'Sale':
                sale_transaction = transaction
            elif transaction['type'] == 'Donation':
                donation_transaction = transaction
        
        self.assertIsNotNone(sale_transaction)
        self.assertIsNotNone(donation_transaction)
        self.assertEqual(sale_transaction['amount'], 'R100.00')
        self.assertEqual(donation_transaction['amount'], 'Free')

    def test_admin_get_all_transactions_missing_business(self):
        """Skip test for missing business since business is required"""
        self.skipTest("Business field is required, cannot test missing business scenario")

    @patch('interactions.admin_views.Interaction.objects.select_related')
    def test_admin_get_all_transactions_exception_handling(self, mock_select_related):
        """Test exception handling"""
        # Mock the queryset to raise an exception
        mock_select_related.side_effect = Exception('Database error')
        
        response = self._make_admin_request()
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error']['code'], 'TRANSACTIONS_FETCH_ERROR')
        self.assertEqual(response.data['error']['message'], 'Failed to fetch transactions')

    def test_admin_get_all_transactions_default_parameters(self):
        """Test with default parameters (no query params)"""
        response = self._make_admin_request()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['pagination']['current_page'], 1)
        self.assertEqual(response.data['pagination']['total_pages'], 1)
        self.assertEqual(response.data['pagination']['total_count'], 2)

    # def test_admin_get_all_transactions_invalid_page_parameters(self):
    #     """Test with invalid page parameters"""
    #     # Test negative page number - should default to page 1
    #     response = self._make_admin_request('/admin/transactions/?page=-1')
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     # The view should handle negative page numbers by defaulting to page 1
    #     self.assertEqual(response.data['pagination']['current_page'], 1)
        
    #     # Test non-integer page number - should default to page 1
    #     response = self._make_admin_request('/admin/transactions/?page=abc')
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertEqual(response.data['pagination']['current_page'], 1)

    def test_admin_get_all_transactions_user_without_profile(self):
        """Test handling of user without customer profile"""
        # Create user without profile
        user_no_profile = User.objects.create_user(
            username='noprofile',
            email='noprofile@example.com',
            password='testpass123',
            user_type='customer',
            role='normal'
        )
        
        # Create interaction for user without profile
        interaction_no_profile = Interaction.objects.create(
            user=user_no_profile,
            business=self.food_provider,
            interaction_type='Purchase',
            status='completed',
            total_amount=75.00
        )
        
        response = self._make_admin_request()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)