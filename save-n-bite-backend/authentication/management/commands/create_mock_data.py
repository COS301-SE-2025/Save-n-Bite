from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import CustomerProfile, NGOProfile, FoodProviderProfile
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates mock data for testing'

    def handle(self, *args, **kwargs):
        # Create a test customer
        customer_user = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            password='testpass123',
            user_type='customer'
        )
        CustomerProfile.objects.create(
            user=customer_user,
            full_name='Test Customer',
        )
        self.stdout.write(self.style.SUCCESS('Created test customer'))

        # Create a test NGO
        ngo_user = User.objects.create_user(
            username='testngo',
            email='ngo@test.com',
            password='testpass123',
            user_type='ngo'
        )
        NGOProfile.objects.create(
            user=ngo_user,
            organisation_name='Test NGO',
            organisation_contact='1234567890',
            organisation_email='contact@testngo.com',
            representative_name='John Doe',
            representative_email='john@testngo.com',
            address_line1='123 NGO Street',
            city='Test City',
            province_or_state='Test State',
            postal_code='1234',
            country='Test Country',
            npo_document='path/to/document.pdf',  # You'll need to provide a real file
            status='verified'
        )
        self.stdout.write(self.style.SUCCESS('Created test NGO'))

        # Create a test food provider
        provider_user = User.objects.create_user(
            username='testprovider',
            email='provider@test.com',
            password='testpass123',
            user_type='provider'
        )
        FoodProviderProfile.objects.create(
            user=provider_user,
            business_name='Test Restaurant',
            business_address='456 Provider Street, Test City',
            business_contact='0987654321',
            business_email='contact@testrestaurant.com',
            cipc_document='path/to/document.pdf',  # You'll need to provide a real file
            status='verified'
        )
        self.stdout.write(self.style.SUCCESS('Created test food provider')) 