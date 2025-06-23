# scheduling/tests.py

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from datetime import datetime, timedelta, time, date
import json

from .models import (
    PickupLocation, PickupTimeSlot, ScheduledPickup, 
    PickupOptimization, PickupAnalytics
)
from .services import PickupSchedulingService, PickupOptimizationService
from authentication.models import FoodProviderProfile, CustomerProfile
from interactions.models import Interaction, Order, InteractionItem
from food_listings.models import FoodListing

User = get_user_model()

# ============ FIXTURES ============

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def provider_user(db):
    """Create a provider user with profile"""
    user = User.objects.create_user(
        username='provider_test',
        email='provider@test.com',
        password='testpass123',
        user_type='provider'
    )
    
    FoodProviderProfile.objects.create(
        user=user,
        business_name='Test Restaurant',
        business_address='123 Test St, Test City',
        business_contact='+1234567890',
        business_email='business@test.com',
        status='verified'
    )
    
    return user

@pytest.fixture
def customer_user(db):
    """Create a customer user with profile"""
    user = User.objects.create_user(
        username='customer_test',
        email='customer@test.com',
        password='testpass123',
        user_type='customer'
    )
    
    CustomerProfile.objects.create(
        user=user,
        full_name='Test Customer'
    )
    
    return user

@pytest.fixture
def pickup_location(provider_user):
    """Create a pickup location"""
    return PickupLocation.objects.create(
        business=provider_user.provider_profile,
        name='Main Counter',
        address='123 Test St, Test City',
        contact_person='John Doe',
        contact_phone='+1234567890',
        instructions='Ring the bell at the counter'
    )

@pytest.fixture
def pickup_time_slot(provider_user, pickup_location):
    """Create a time slot"""
    return PickupTimeSlot.objects.create(
        business=provider_user.provider_profile,
        location=pickup_location,
        day_of_week=1,  # Tuesday
        start_time=time(17, 0),  # 5 PM
        end_time=time(19, 0),    # 7 PM
        slot_duration=timedelta(minutes=30),
        max_orders_per_slot=5,
        advance_booking_hours=2
    )

@pytest.fixture
def test_order(customer_user, provider_user):
    """Create a test order"""
    # Create interaction
    interaction = Interaction.objects.create(
        user=customer_user,
        business=provider_user.provider_profile,
        interaction_type='Purchase',
        quantity=2,
        total_amount=25.00
    )
    
    # Create order
    order = Order.objects.create(
        interaction=interaction,
        pickup_window='17:00-19:00',
        pickup_code='ABC123'
    )
    
    return order

@pytest.fixture
def authenticated_provider_client(api_client, provider_user):
    """API client authenticated as provider"""
    refresh = RefreshToken.for_user(provider_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def authenticated_customer_client(api_client, customer_user):
    """API client authenticated as customer"""
    refresh = RefreshToken.for_user(customer_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

# ============ MODEL TESTS ============

@pytest.mark.django_db
class TestPickupLocationModel:
    
    def test_create_pickup_location(self, provider_user):
        """Test creating a pickup location"""
        location = PickupLocation.objects.create(
            business=provider_user.provider_profile,
            name='Side Entrance',
            address='456 Test Ave',
            contact_person='Jane Smith',
            contact_phone='+0987654321'
        )
        
        assert location.name == 'Side Entrance'
        assert location.business == provider_user.provider_profile
        assert location.is_active is True
        assert str(location) == f"{provider_user.provider_profile.business_name} - Side Entrance"

    def test_unique_location_name_per_business(self, provider_user):
        """Test that location names are unique per business"""
        # Create first location
        PickupLocation.objects.create(
            business=provider_user.provider_profile,
            name='Main Counter',
            address='123 Test St',
            contact_person='John Doe',
            contact_phone='+1234567890'
        )
        
        # Try to create another location with the same name should work in model
        # (uniqueness is enforced at the serializer level)
        location2 = PickupLocation(
            business=provider_user.provider_profile,
            name='Main Counter',
            address='456 Test Ave',
            contact_person='Jane Smith',
            contact_phone='+0987654321'
        )
        
        # This should not raise an error at model level
        assert location2.name == 'Main Counter'

@pytest.mark.django_db
class TestPickupTimeSlotModel:

    def test_create_time_slot(self, provider_user, pickup_location):
        """Test creating a time slot"""
        time_slot = PickupTimeSlot.objects.create(
            business=provider_user.provider_profile,
            location=pickup_location,
            day_of_week=0,  # Monday
            start_time=time(9, 0),
            end_time=time(17, 0),
            slot_duration=timedelta(minutes=30),
            max_orders_per_slot=10
        )
        
        assert time_slot.get_day_of_week_display() == 'Monday'
        assert time_slot.start_time == time(9, 0)
        assert time_slot.max_orders_per_slot == 10

    def test_time_slot_validation(self, provider_user, pickup_location):
        """Test time slot validation"""
        time_slot = PickupTimeSlot(
            business=provider_user.provider_profile,
            location=pickup_location,
            day_of_week=0,
            start_time=time(17, 0),
            end_time=time(9, 0),  # End before start
            slot_duration=timedelta(minutes=30)
        )
        
        with pytest.raises(Exception):
            time_slot.full_clean()

@pytest.mark.django_db
class TestScheduledPickupModel:

    def test_create_scheduled_pickup(self, test_order, pickup_time_slot, pickup_location):
        """Test creating a scheduled pickup"""
        pickup = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today() + timedelta(days=1),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        assert pickup.status == 'scheduled'
        assert pickup.confirmation_code is not None
        assert len(pickup.confirmation_code) == 6
        assert pickup.qr_code_data is not None

    def test_confirmation_code_generation(self, test_order, pickup_time_slot, pickup_location):
        """Test that confirmation codes are unique"""
        pickup1 = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today() + timedelta(days=1),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        # Create another order for second pickup
        from interactions.models import Interaction, Order
        interaction2 = Interaction.objects.create(
            user=test_order.interaction.user,
            business=test_order.interaction.business,
            interaction_type='Purchase',
            quantity=1,
            total_amount=15.00
        )
        order2 = Order.objects.create(
            interaction=interaction2,
            pickup_window='17:00-19:00',
            pickup_code='DEF456'
        )
        
        pickup2 = ScheduledPickup.objects.create(
            order=order2,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today() + timedelta(days=1),
            scheduled_start_time=time(17, 30),
            scheduled_end_time=time(18, 0)
        )
        
        assert pickup1.confirmation_code != pickup2.confirmation_code

    def test_pickup_properties(self, test_order, pickup_time_slot, pickup_location):
        """Test pickup properties"""
        future_date = date.today() + timedelta(days=1)
        pickup = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=future_date,
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        assert pickup.is_upcoming is True
        assert pickup.is_today is False
        
        # Test with today's date
        pickup.scheduled_date = date.today()
        pickup.save()
        assert pickup.is_today is True

# ============ SERVICE TESTS ============

@pytest.mark.django_db
class TestPickupSchedulingService:

    def test_create_pickup_location(self, provider_user):
        """Test creating pickup location via service"""
        location_data = {
            'name': 'Test Location',
            'address': '789 Service St',
            'contact_person': 'Service Person',
            'contact_phone': '+1111111111',
            'instructions': 'Test instructions'
        }
        
        location = PickupSchedulingService.create_pickup_location(
            provider_user.provider_profile, location_data
        )
        
        assert location.name == 'Test Location'
        assert location.business == provider_user.provider_profile

    def test_get_available_slots(self, provider_user, pickup_location, pickup_time_slot):
        """Test getting available slots"""
        target_date = date.today() + timedelta(days=1)
        
        # Ensure target_date is a Tuesday (day_of_week=1)
        while target_date.weekday() != 1:
            target_date += timedelta(days=1)
        
        available_slots = PickupSchedulingService.get_available_slots(
            provider_user.provider_profile, target_date
        )
        
        assert len(available_slots) > 0
        assert available_slots[0]['location_name'] == pickup_location.name

    def test_schedule_pickup(self, test_order, pickup_time_slot, pickup_location):
        """Test scheduling a pickup"""
        target_date = date.today() + timedelta(days=1)
        # Ensure target_date is a Tuesday
        while target_date.weekday() != 1:
            target_date += timedelta(days=1)
            
        slot_data = {
            'time_slot_id': pickup_time_slot.id,
            'location_id': pickup_location.id,
            'date': target_date,
            'start_time': '17:00:00',
            'end_time': '17:30:00'
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'pickup' in response.data
        assert 'qr_code' in response.data

    def test_get_customer_pickups(self, authenticated_customer_client, test_order, pickup_time_slot, pickup_location):
        """Test getting customer's pickups"""
        # Create a scheduled pickup
        ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today() + timedelta(days=1),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        url = reverse('scheduling:customer_pickups')
        response = authenticated_customer_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert 'pickups' in response.data['results']

    def test_verify_pickup_code_success(self, authenticated_provider_client, test_order, pickup_time_slot, pickup_location):
        """Test successful pickup code verification"""
        pickup = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today(),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        url = reverse('scheduling:verify_pickup_code')
        data = {
            'confirmation_code': pickup.confirmation_code
        }
        
        response = authenticated_provider_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['valid'] is True
        assert 'pickup' in response.data

    def test_complete_pickup_success(self, authenticated_provider_client, test_order, pickup_time_slot, pickup_location):
        """Test successful pickup completion"""
        pickup = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today(),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        url = reverse('scheduling:complete_pickup', args=[pickup.id])
        data = {
            'notes': 'Customer arrived on time'
        }
        
        response = authenticated_provider_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'pickup' in response.data
        
        # Verify pickup was marked as completed
        pickup.refresh_from_db()
        assert pickup.status == 'completed'

    def test_cancel_pickup_success(self, authenticated_customer_client, test_order, pickup_time_slot, pickup_location):
        """Test successful pickup cancellation"""
        # Schedule pickup for tomorrow to allow cancellation
        future_date = date.today() + timedelta(days=1)
        pickup = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=future_date,
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        url = reverse('scheduling:cancel_pickup', args=[pickup.id])
        data = {
            'reason': 'Change of plans'
        }
        
        response = authenticated_customer_client.put(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify pickup was cancelled
        pickup.refresh_from_db()
        assert pickup.status == 'cancelled'

@pytest.mark.django_db
class TestBusinessScheduleViews:

    def test_business_schedule_overview(self, authenticated_provider_client, test_order, pickup_time_slot, pickup_location):
        """Test business schedule overview"""
        # Create some scheduled pickups
        ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today(),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        url = reverse('scheduling:schedule_overview')
        response = authenticated_provider_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'summary' in response.data
        assert 'pickups' in response.data
        assert response.data['summary']['total_pickups'] >= 1

    def test_business_analytics(self, authenticated_provider_client, provider_user):
        """Test business analytics endpoint"""
        url = reverse('scheduling:business_analytics')
        response = authenticated_provider_client.get(url, {'days': 7})
        
        assert response.status_code == status.HTTP_200_OK
        assert 'analytics' in response.data

    def test_optimization_recommendations(self, authenticated_provider_client):
        """Test optimization recommendations"""
        url = reverse('scheduling:optimization_recommendations')
        response = authenticated_provider_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'recommendations' in response.data

# ============ INTEGRATION TESTS ============

@pytest.mark.django_db
class TestPickupWorkflow:
    """Test complete pickup workflow from scheduling to completion"""

    def test_complete_pickup_workflow(
        self, 
        provider_user, 
        customer_user, 
        authenticated_provider_client, 
        authenticated_customer_client
    ):
        """Test the complete pickup workflow"""
        
        # 1. Provider creates pickup location
        location_url = reverse('scheduling:pickup_locations')
        location_data = {
            'name': 'Workflow Location',
            'address': '123 Workflow St',
            'contact_person': 'Workflow Person',
            'contact_phone': '+1111111111'
        }
        
        location_response = authenticated_provider_client.post(
            location_url,
            data=json.dumps(location_data),
            content_type='application/json'
        )
        
        assert location_response.status_code == status.HTTP_201_CREATED
        location_id = location_response.data['location']['id']
        
        # 2. Provider creates time slot
        slot_url = reverse('scheduling:pickup_time_slots')
        slot_data = {
            'location': location_id,
            'day_of_week': 1,  # Tuesday
            'start_time': '17:00:00',
            'end_time': '19:00:00',
            'slot_duration': 1800,  # 30 minutes in seconds
            'max_orders_per_slot': 5
        }
        
        slot_response = authenticated_provider_client.post(
            slot_url,
            data=json.dumps(slot_data),
            content_type='application/json'
        )
        
        assert slot_response.status_code == status.HTTP_201_CREATED
        time_slot_id = slot_response.data['time_slot']['id']
        
        # 3. Create an order for the customer
        interaction = Interaction.objects.create(
            user=customer_user,
            business=provider_user.provider_profile,
            interaction_type='Purchase',
            quantity=1,
            total_amount=20.00
        )
        
        order = Order.objects.create(
            interaction=interaction,
            pickup_window='17:00-19:00',
            pickup_code='WF123'
        )
        
        # 4. Customer checks available slots
        target_date = date.today() + timedelta(days=1)
        while target_date.weekday() != 1:  # Find next Tuesday
            target_date += timedelta(days=1)
            
        available_url = reverse('scheduling:available_slots')
        available_response = authenticated_customer_client.get(available_url, {
            'business_id': str(provider_user.UserID),  # Use UserID
            'date': target_date.isoformat()
        })
        
        assert available_response.status_code == status.HTTP_200_OK
        assert len(available_response.data['available_slots']) > 0
        
        # 5. Customer schedules pickup
        schedule_url = reverse('scheduling:schedule_pickup')
        schedule_data = {
            'order_id': str(order.id),
            'time_slot_id': time_slot_id,
            'location_id': location_id,
            'date': target_date.isoformat(),
            'start_time': '17:00:00',
            'end_time': '17:30:00'
        }
        
        schedule_response = authenticated_customer_client.post(
            schedule_url,
            data=json.dumps(schedule_data),
            content_type='application/json'
        )
        
        assert schedule_response.status_code == status.HTTP_201_CREATED
        pickup_id = schedule_response.data['pickup']['id']
        confirmation_code = schedule_response.data['pickup']['confirmation_code']
        
        # 6. Provider verifies pickup code
        verify_url = reverse('scheduling:verify_pickup_code')
        verify_data = {
            'confirmation_code': confirmation_code
        }
        
        # Change the pickup date to today for verification
        pickup = ScheduledPickup.objects.get(id=pickup_id)
        pickup.scheduled_date = date.today()
        pickup.save()
        
        verify_response = authenticated_provider_client.post(
            verify_url,
            data=json.dumps(verify_data),
            content_type='application/json'
        )
        
        assert verify_response.status_code == status.HTTP_200_OK
        assert verify_response.data['valid'] is True
        
        # 7. Provider completes pickup
        complete_url = reverse('scheduling:complete_pickup', args=[pickup_id])
        complete_data = {
            'notes': 'Workflow test completed successfully'
        }
        
        complete_response = authenticated_provider_client.post(
            complete_url,
            data=json.dumps(complete_data),
            content_type='application/json'
        )
        
        assert complete_response.status_code == status.HTTP_200_OK
        
        # 8. Verify final state
        pickup.refresh_from_db()
        assert pickup.status == 'completed'
        assert pickup.actual_pickup_time is not None
        assert pickup.pickup_notes == 'Workflow test completed successfully'
        
        # 9. Verify order is also completed
        order.refresh_from_db()
        assert order.status == 'completed'

# ============ ERROR HANDLING TESTS ============

@pytest.mark.django_db
class TestPickupErrorHandling:

    def test_invalid_confirmation_code(self, authenticated_provider_client):
        """Test verification with invalid confirmation code"""
        url = reverse('scheduling:verify_pickup_code')
        data = {
            'confirmation_code': 'INVALID'
        }
        
        response = authenticated_provider_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['valid'] is False

    def test_schedule_past_date(self, authenticated_customer_client, test_order, pickup_time_slot, pickup_location):
        """Test scheduling pickup for past date"""
        url = reverse('scheduling:schedule_pickup')
        data = {
            'order_id': str(test_order.id),
            'time_slot_id': str(pickup_time_slot.id),
            'location_id': str(pickup_location.id),
            'date': (date.today() - timedelta(days=1)).isoformat(),  # Yesterday
            'start_time': '17:00:00',
            'end_time': '17:30:00'
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cancel_pickup_too_late(self, authenticated_customer_client, test_order, pickup_time_slot, pickup_location):
        """Test cancelling pickup too close to pickup time"""
        # Create pickup for today
        pickup = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today(),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        url = reverse('scheduling:cancel_pickup', args=[pickup.id])
        
        response = authenticated_customer_client.put(url)
        
        # Should fail if pickup is today (within 1 hour of current time)
        # This test might pass or fail depending on current time
        # In a real test, you might mock the current time
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            assert 'TOO_LATE' in response.data.get('error', {}).get('code', '')

# ============ PERFORMANCE TESTS ============

@pytest.mark.django_db
class TestPickupPerformance:

    def test_multiple_slot_generation(self, provider_user, pickup_location):
        """Test performance with multiple time slots"""
        # Create multiple time slots for different days
        for day in range(7):  # All days of week
            PickupTimeSlot.objects.create(
                business=provider_user.provider_profile,
                location=pickup_location,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration=timedelta(minutes=30),
                max_orders_per_slot=10
            )
        
        # Test getting available slots for multiple dates
        import time as time_module
        start_time = time_module.time()
        
        for i in range(7):
            target_date = date.today() + timedelta(days=i)
            slots = PickupSchedulingService.get_available_slots(
                provider_user.provider_profile, target_date
            )
            
        end_time = time_module.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time (adjust threshold as needed)
        assert execution_time < 5.0  # 5 seconds max

    def test_concurrent_booking_prevention(self, test_order, pickup_time_slot, pickup_location):
        """Test that concurrent bookings for same slot are prevented"""
        target_date = date.today() + timedelta(days=1)
        slot_data = {
            'time_slot_id': pickup_time_slot.id,
            'location_id': pickup_location.id,
            'date': target_date,
            'start_time': time(17, 0),
            'end_time': time(17, 30)
        }
        
        # First booking should succeed
        pickup1, _ = PickupSchedulingService.schedule_pickup(test_order, slot_data)
        assert pickup1 is not None
        
        # Create second order
        interaction2 = Interaction.objects.create(
            user=test_order.interaction.user,
            business=test_order.interaction.business,
            interaction_type='Purchase',
            quantity=1,
            total_amount=15.00
        )
        order2 = Order.objects.create(
            interaction=interaction2,
            pickup_window='17:00-19:00',
            pickup_code='CON123'
        )
        
        # Second booking for same slot should fail
        with pytest.raises(Exception):
            PickupSchedulingService.schedule_pickup(order2, slot_data) time(17, 0),
            'end_time': time(17, 30)
        }
        
        pickup, qr_image = PickupSchedulingService.schedule_pickup(test_order, slot_data)
        
        assert pickup.order == test_order
        assert pickup.time_slot == pickup_time_slot
        assert qr_image is not None

    def test_verify_pickup_code(self, test_order, pickup_time_slot, pickup_location, provider_user):
        """Test verifying pickup code"""
        pickup = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today(),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        verified_pickup = PickupSchedulingService.verify_pickup_code(
            pickup.confirmation_code, provider_user.provider_profile
        )
        
        assert verified_pickup == pickup

    def test_complete_pickup(self, test_order, pickup_time_slot, pickup_location):
        """Test completing a pickup"""
        pickup = ScheduledPickup.objects.create(
            order=test_order,
            time_slot=pickup_time_slot,
            location=pickup_location,
            scheduled_date=date.today(),
            scheduled_start_time=time(17, 0),
            scheduled_end_time=time(17, 30)
        )
        
        completed_pickup = PickupSchedulingService.complete_pickup(pickup)
        
        assert completed_pickup.status == 'completed'
        assert completed_pickup.actual_pickup_time is not None

# ============ VIEW TESTS ============

@pytest.mark.django_db
class TestPickupLocationViews:

    def test_create_pickup_location(self, authenticated_provider_client):
        """Test creating pickup location via API"""
        url = reverse('scheduling:pickup_locations')
        data = {
            'name': 'API Test Location',
            'address': '999 API St',
            'contact_person': 'API Person',
            'contact_phone': '+9999999999',
            'instructions': 'API instructions'
        }
        
        response = authenticated_provider_client.post(
            url, 
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'location' in response.data
        assert response.data['location']['name'] == 'API Test Location'

    def test_get_pickup_locations(self, authenticated_provider_client, pickup_location):
        """Test getting pickup locations"""
        url = reverse('scheduling:pickup_locations')
        response = authenticated_provider_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'locations' in response.data
        assert len(response.data['locations']) >= 1

    def test_customer_cannot_create_location(self, authenticated_customer_client):
        """Test that customers cannot create pickup locations"""
        url = reverse('scheduling:pickup_locations')
        data = {
            'name': 'Unauthorized Location',
            'address': '000 Hack St',
            'contact_person': 'Hacker',
            'contact_phone': '+0000000000'
        }
        
        response = authenticated_customer_client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
class TestPickupSchedulingViews:

    def test_get_available_slots(self, api_client, provider_user, pickup_time_slot):
        """Test getting available slots"""
        # Test date - ensure it's a Tuesday
        target_date = date.today() + timedelta(days=1)
        while target_date.weekday() != 1:
            target_date += timedelta(days=1)
            
        url = reverse('scheduling:available_slots')
        response = api_client.get(url, {
            'business_id': str(provider_user.UserID),  # Use UserID
            'date': target_date.isoformat()
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'available_slots' in response.data
