# Save n Bite - Scheduling App Service Contract

**Project:** Save n Bite  
**App:** Scheduling  
**Version:** 1.0  
**Date:** June 25, 2025  
**Team:** Secure Web & Mobile Guild  

---

## 1. Overview

The Scheduling app is the logistics backbone of the Save n Bite platform, managing pickup coordination, time slot allocation, location management, and route optimization. It ensures efficient food collection through intelligent scheduling algorithms and real-time availability tracking.

### 1.1 Purpose
- Manage pickup locations and time slot availability
- Coordinate food collection scheduling between businesses and customers
- Generate QR codes for pickup verification
- Optimize pickup routes and schedules
- Provide analytics for scheduling efficiency
- Handle pickup confirmations and status tracking

### 1.2 Key Features
- **Dynamic Time Slot Generation**: Automated slot creation based on food listing windows
- **Location Management**: Multiple pickup points per business with GPS coordinates
- **QR Code Verification**: Secure pickup authentication system
- **Route Optimization**: AI-powered scheduling recommendations
- **Real-time Updates**: Live availability and status tracking
- **Analytics Dashboard**: Pickup performance metrics and insights

---

## 2. Architecture & Technology Stack

### 2.1 Backend Architecture
- **Framework**: Django 4.x with Django REST Framework
- **Database**: PostgreSQL (primary), Redis (caching & real-time)
- **Authentication**: JWT tokens with role-based permissions
- **QR Code Generation**: Python qrcode library
- **Optimization Engine**: Scikit-learn for route and schedule optimization
- **Background Tasks**: Celery for async processing

### 2.2 Core Dependencies
```python
# Django & DRF
Django>=4.2.0
djangorestframework>=3.14.0
django-extensions>=3.2.0

# Database & Caching
psycopg2-binary>=2.9.0
redis>=4.5.0
django-redis>=5.2.0

# QR Code Generation
qrcode>=7.4.0
Pillow>=9.5.0

# Optimization & Analytics
scikit-learn>=1.3.0
pandas>=2.0.0
numpy>=1.24.0

# Task Processing
celery>=5.2.0
django-celery-beat>=2.4.0

# Utilities
python-dateutil>=2.8.0
geopy>=2.3.0  # For distance calculations
```

### 2.3 Database Schema
```sql
-- Core Models
- PickupLocation (business pickup points)
- FoodListingPickupSchedule (pickup windows per listing)
- PickupTimeSlot (individual booking slots)
- ScheduledPickup (confirmed pickup appointments)
- PickupAnalytics (performance tracking)
- PickupOptimization (route optimization data)
```

---

## 3. API Endpoints Specification

### 3.1 Authentication Requirements
All endpoints require authentication via JWT Bearer token:
```http
Authorization: Bearer <jwt_token>
```

### 3.2 Business Pickup Management Endpoints

#### 3.2.1 Manage Pickup Locations
```http
GET /api/scheduling/pickup-locations/
```

**Response (200 OK):**
```json
{
    "count": 3,
    "results": [
        {
            "id": "uuid",
            "name": "Main Counter",
            "address": "123 Main Street, Pretoria, 0001",
            "instructions": "Enter through main entrance, ask for pickup at counter",
            "contact_person": "John Doe",
            "contact_phone": "+27123456789",
            "latitude": "-25.7479",
            "longitude": "28.2293",
            "is_active": true,
            "created_at": "2025-06-01T08:00:00Z"
        }
    ]
}
```

#### 3.2.2 Create Pickup Location
```http
POST /api/scheduling/pickup-locations/
Content-Type: application/json

{
    "name": "Side Entrance",
    "address": "123 Main Street, Side Door, Pretoria, 0001",
    "instructions": "Use side entrance for after-hours pickup",
    "contact_person": "Jane Smith",
    "contact_phone": "+27123456790",
    "latitude": "-25.7480",
    "longitude": "28.2295"
}
```

**Response (201 Created):**
```json
{
    "id": "uuid",
    "name": "Side Entrance",
    "address": "123 Main Street, Side Door, Pretoria, 0001",
    "instructions": "Use side entrance for after-hours pickup",
    "contact_person": "Jane Smith",
    "contact_phone": "+27123456790",
    "latitude": "-25.7480",
    "longitude": "28.2295",
    "is_active": true,
    "business": {
        "id": "uuid",
        "name": "Mario's Restaurant"
    },
    "created_at": "2025-06-25T14:30:00Z"
}
```

#### 3.2.3 Get Food Listing Pickup Schedules
```http
GET /api/scheduling/pickup-schedules/
Query Parameters:
- food_listing_id: uuid (optional)
- location_id: uuid (optional)
- is_active: true|false
```

**Response (200 OK):**
```json
{
    "count": 5,
    "results": [
        {
            "id": "uuid",
            "food_listing": {
                "id": "uuid",
                "name": "Margherita Pizza",
                "status": "active",
                "expiry_date": "2025-06-26T18:00:00Z"
            },
            "location": {
                "id": "uuid",
                "name": "Main Counter",
                "address": "123 Main Street, Pretoria"
            },
            "pickup_window": "17:00-19:00",
            "total_slots": 4,
            "max_orders_per_slot": 5,
            "slot_buffer_minutes": 5,
            "slot_duration_minutes": 25,
            "is_active": true,
            "created_at": "2025-06-25T10:00:00Z"
        }
    ]
}
```

#### 3.2.4 Generate Time Slots
```http
POST /api/scheduling/generate-time-slots/
Content-Type: application/json

{
    "food_listing_id": "uuid",
    "date": "2025-06-26"
}
```

**Response (201 Created):**
```json
{
    "message": "Time slots generated successfully",
    "food_listing_id": "uuid",
    "date": "2025-06-26",
    "slots_created": 4,
    "slots": [
        {
            "id": "uuid",
            "slot_number": 1,
            "start_time": "17:00",
            "end_time": "17:25",
            "max_orders_per_slot": 5,
            "current_bookings": 0,
            "available_spots": 5,
            "is_available": true
        },
        {
            "id": "uuid",
            "slot_number": 2,
            "start_time": "17:30",
            "end_time": "17:55",
            "max_orders_per_slot": 5,
            "current_bookings": 2,
            "available_spots": 3,
            "is_available": true
        }
    ]
}
```

#### 3.2.5 Business Schedule Overview
```http
GET /api/scheduling/schedule-overview/
Query Parameters:
- date: 2025-06-26 (optional, defaults to today)
```

**Response (200 OK):**
```json
{
    "date": "2025-06-26",
    "total_pickups": 15,
    "completed_pickups": 8,
    "pending_pickups": 6,
    "missed_pickups": 1,
    "pickups_by_hour": {
        "17": [
            {
                "pickup_id": "uuid",
                "confirmation_code": "ABC123",
                "customer_name": "Jane Smith",
                "food_listing": "Margherita Pizza",
                "time": "17:15",
                "status": "confirmed"
            }
        ],
        "18": [
            {
                "pickup_id": "uuid",
                "confirmation_code": "XYZ789",
                "customer_name": "John Doe",
                "food_listing": "Caesar Salad",
                "time": "18:30",
                "status": "scheduled"
            }
        ]
    },
    "food_listings_with_pickups": [
        {
            "food_listing__id": "uuid",
            "food_listing__name": "Margherita Pizza",
            "pickup_count": 8
        }
    ]
}
```

#### 3.2.6 Verify Pickup Code
```http
POST /api/scheduling/verify-code/
Content-Type: application/json

{
    "confirmation_code": "ABC123"
}
```

**Response (200 OK):**
```json
{
    "pickup": {
        "id": "uuid",
        "confirmation_code": "ABC123",
        "customer": {
            "name": "Jane Smith",
            "phone": "+27123456789",
            "email": "jane@example.com"
        },
        "food_listing": {
            "name": "Margherita Pizza",
            "quantity": 2
        },
        "scheduled_time": "2025-06-26T17:15:00Z",
        "location": "Main Counter",
        "status": "confirmed",
        "customer_notes": "Please keep pizza warm",
        "qr_code_data": {
            "pickup_id": "uuid",
            "order_id": "uuid",
            "business_id": "uuid"
        }
    },
    "verification_successful": true
}
```

#### 3.2.7 Complete Pickup
```http
POST /api/scheduling/complete-pickup/{pickup_id}/
Content-Type: application/json

{
    "actual_pickup_time": "2025-06-26T17:18:00Z",
    "business_notes": "Customer arrived on time, items collected successfully",
    "verification_method": "qr_code"
}
```

**Response (200 OK):**
```json
{
    "message": "Pickup completed successfully",
    "pickup_id": "uuid",
    "status": "completed",
    "actual_pickup_time": "2025-06-26T17:18:00Z",
    "scheduled_time": "2025-06-26T17:15:00Z",
    "on_time": true,
    "completion_summary": {
        "items_collected": 2,
        "total_value": "25.50",
        "customer_satisfaction": "pending_review"
    }
}
```

### 3.3 Customer Pickup Scheduling Endpoints

#### 3.3.1 Get Available Slots
```http
GET /api/scheduling/available-slots/
Query Parameters:
- food_listing_id: uuid
- date: 2025-06-26 (optional, defaults to today)
- location_id: uuid (optional)
```

**Response (200 OK):**
```json
{
    "food_listing": {
        "id": "uuid",
        "name": "Margherita Pizza",
        "business": {
            "name": "Mario's Restaurant",
            "address": "123 Main Street, Pretoria"
        }
    },
    "date": "2025-06-26",
    "available_slots": [
        {
            "id": "uuid",
            "start_time": "17:00",
            "end_time": "17:25",
            "available_spots": 3,
            "total_capacity": 5,
            "location": {
                "id": "uuid",
                "name": "Main Counter",
                "address": "123 Main Street, Pretoria",
                "instructions": "Enter through main entrance",
                "contact_person": "John Doe",
                "contact_phone": "+27123456789",
                "latitude": "-25.7479",
                "longitude": "28.2293"
            },
            "estimated_wait_time": "5 minutes",
            "popularity_score": 0.8
        }
    ],
    "total_available_slots": 3,
    "next_available_date": "2025-06-27"
}
```

#### 3.3.2 Schedule Pickup
```http
POST /api/scheduling/schedule/
Content-Type: application/json

{
    "order_id": "uuid",
    "food_listing_id": "uuid",
    "time_slot_id": "uuid",
    "date": "2025-06-26",
    "customer_notes": "Please keep food warm, will arrive 5 minutes early"
}
```

**Response (201 Created):**
```json
{
    "pickup": {
        "id": "uuid",
        "confirmation_code": "ABC123",
        "scheduled_date": "2025-06-26",
        "scheduled_time": "17:00-17:25",
        "location": {
            "name": "Main Counter",
            "address": "123 Main Street, Pretoria",
            "contact_person": "John Doe",
            "contact_phone": "+27123456789",
            "instructions": "Enter through main entrance"
        },
        "food_listing": {
            "name": "Margherita Pizza",
            "quantity": 2,
            "business": "Mario's Restaurant"
        },
        "status": "scheduled",
        "customer_notes": "Please keep food warm, will arrive 5 minutes early"
    },
    "qr_code": {
        "data": {
            "pickup_id": "uuid",
            "confirmation_code": "ABC123",
            "business_id": "uuid",
            "scheduled_time": "2025-06-26 17:00",
            "location": "Main Counter"
        },
        "image_url": "https://s3.amazonaws.com/qr-codes/pickup-ABC123.png"
    },
    "reminders": {
        "email_sent": true,
        "sms_scheduled": "2025-06-26T16:00:00Z",
        "push_notification_scheduled": "2025-06-26T16:30:00Z"
    }
}
```

#### 3.3.3 Get Customer Pickups
```http
GET /api/scheduling/my-pickups/
Query Parameters:
- status: scheduled|confirmed|completed|cancelled|missed
- date_from: 2025-06-01
- date_to: 2025-06-30
- page: 1
```

**Response (200 OK):**
```json
{
    "count": 12,
    "next": "http://api.com/scheduling/my-pickups/?page=2",
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "confirmation_code": "ABC123",
            "food_listing": {
                "id": "uuid",
                "name": "Margherita Pizza",
                "image": "https://s3.amazonaws.com/food-images/pizza.jpg"
            },
            "business": {
                "name": "Mario's Restaurant",
                "logo": "https://s3.amazonaws.com/logos/mario.jpg"
            },
            "scheduled_date": "2025-06-26",
            "scheduled_time": "17:00-17:25",
            "location": {
                "name": "Main Counter",
                "address": "123 Main Street, Pretoria"
            },
            "status": "scheduled",
            "is_upcoming": true,
            "is_today": false,
            "can_cancel": true,
            "time_until_pickup": "2 hours 15 minutes",
            "created_at": "2025-06-25T14:30:00Z"
        }
    ]
}
```

#### 3.3.4 Get Pickup Details
```http
GET /api/scheduling/pickups/{pickup_id}/
```

**Response (200 OK):**
```json
{
    "id": "uuid",
    "confirmation_code": "ABC123",
    "food_listing": {
        "id": "uuid",
        "name": "Margherita Pizza",
        "description": "Fresh margherita pizza with basil",
        "image": "https://s3.amazonaws.com/food-images/pizza.jpg",
        "quantity": 2,
        "price_per_item": "12.50",
        "total_value": "25.00"
    },
    "business": {
        "id": "uuid",
        "name": "Mario's Restaurant",
        "address": "123 Main Street, Pretoria",
        "phone": "+27123456789",
        "logo": "https://s3.amazonaws.com/logos/mario.jpg"
    },
    "location": {
        "name": "Main Counter",
        "address": "123 Main Street, Pretoria",
        "instructions": "Enter through main entrance, ask for pickup at counter",
        "contact_person": "John Doe",
        "contact_phone": "+27123456789",
        "latitude": "-25.7479",
        "longitude": "28.2293"
    },
    "scheduled_date": "2025-06-26",
    "scheduled_start_time": "17:00",
    "scheduled_end_time": "17:25",
    "actual_pickup_time": null,
    "status": "scheduled",
    "customer_notes": "Please keep food warm",
    "business_notes": "",
    "qr_code": {
        "data": {
            "pickup_id": "uuid",
            "confirmation_code": "ABC123",
            "business_id": "uuid"
        },
        "image_url": "https://s3.amazonaws.com/qr-codes/pickup-ABC123.png"
    },
    "reminder_sent": false,
    "can_cancel": true,
    "cancellation_deadline": "2025-06-26T16:00:00Z",
    "directions": {
        "google_maps_url": "https://maps.google.com/?q=-25.7479,28.2293",
        "estimated_travel_time": "15 minutes",
        "distance": "5.2 km"
    },
    "created_at": "2025-06-25T14:30:00Z"
}
```

#### 3.3.5 Cancel Pickup
```http
DELETE /api/scheduling/pickups/{pickup_id}/cancel/
Content-Type: application/json

{
    "reason": "Change of plans",
    "notify_business": true
}
```

**Response (200 OK):**
```json
{
    "message": "Pickup cancelled successfully",
    "pickup_id": "uuid",
    "status": "cancelled",
    "cancellation_time": "2025-06-25T15:30:00Z",
    "refund_eligible": true,
    "slot_released": true,
    "business_notified": true
}
```

### 3.4 Analytics & Optimization Endpoints

#### 3.4.1 Business Analytics
```http
GET /api/scheduling/analytics/
Query Parameters:
- start_date: 2025-06-01
- end_date: 2025-06-30
- location_id: uuid (optional)
- food_listing_id: uuid (optional)
```

**Response (200 OK):**
```json
{
    "period": {
        "start_date": "2025-06-01",
        "end_date": "2025-06-30"
    },
    "summary": {
        "total_pickups_scheduled": 125,
        "successful_pickups": 108,
        "missed_pickups": 12,
        "cancelled_pickups": 5,
        "success_rate": 86.4,
        "average_pickup_time": "2.3 minutes",
        "peak_pickup_hours": ["17:00-18:00", "12:00-13:00"]
    },
    "by_location": [
        {
            "location": {
                "id": "uuid",
                "name": "Main Counter"
            },
            "pickup_count": 95,
            "success_rate": 89.5,
            "average_wait_time": "1.8 minutes"
        }
    ],
    "by_food_listing": [
        {
            "food_listing": {
                "id": "uuid",
                "name": "Margherita Pizza"
            },
            "pickup_count": 45,
            "success_rate": 91.1,
            "customer_satisfaction": 4.6
        }
    ],
    "time_distribution": {
        "16:00": 8,
        "17:00": 25,
        "18:00": 32,
        "19:00": 18
    },
    "optimization_score": 78.5,
    "recommendations": [
        "Consider adding more time slots during 18:00-19:00 peak period",
        "Side entrance location shows lower success rate - investigate issues"
    ]
}
```

#### 3.4.2 Optimization Recommendations
```http
GET /api/scheduling/optimization/
Query Parameters:
- date: 2025-06-26 (optional, defaults to tomorrow)
- optimization_type: schedule|route|capacity
```

**Response (200 OK):**
```json
{
    "date": "2025-06-26",
    "optimization_type": "schedule",
    "current_efficiency": 76.3,
    "optimized_efficiency": 89.1,
    "recommendations": [
        {
            "type": "time_slot_adjustment",
            "priority": "high",
            "description": "Add 2 additional slots during 18:00-19:00 peak period",
            "impact": {
                "additional_capacity": 10,
                "reduced_wait_time": "3.2 minutes",
                "increased_satisfaction": "12%"
            },
            "implementation": {
                "effort": "low",
                "cost": "none",
                "timeline": "immediate"
            }
        },
        {
            "type": "location_optimization",
            "priority": "medium",
            "description": "Redirect overflow traffic from Main Counter to Side Entrance",
            "impact": {
                "balanced_load": true,
                "reduced_congestion": "25%",
                "improved_efficiency": "8%"
            },
            "implementation": {
                "effort": "medium",
                "cost": "signage_update",
                "timeline": "1-2 days"
            }
        }
    ],
    "predicted_outcomes": {
        "pickup_success_rate": "91.5%",
        "customer_satisfaction": "4.7/5",
        "operational_efficiency": "89.1%",
        "revenue_impact": "+15.2%"
    },
    "seasonal_insights": {
        "trend": "increasing",
        "peak_season": "winter_months",
        "adjustment_needed": "prepare_for_25%_increase"
    }
}
```

### 3.5 Utility Endpoints

#### 3.5.1 Send Pickup Reminders
```http
POST /api/scheduling/send-reminders/
Content-Type: application/json

{
    "reminder_type": "1_hour|30_minutes|all",
    "date": "2025-06-26"
}
```

**Response (200 OK):**
```json
{
    "message": "Pickup reminders sent successfully",
    "reminders_sent": 23,
    "reminder_type": "1_hour",
    "date": "2025-06-26",
    "breakdown": {
        "email": 23,
        "sms": 18,
        "push_notification": 23,
        "failed": 0
    }
}
```

#### 3.5.2 Public Pickup Locations
```http
GET /api/scheduling/public/locations/{business_id}/
```

**Response (200 OK):**
```json
{
    "business": {
        "id": "uuid",
        "name": "Mario's Restaurant",
        "address": "123 Main Street, Pretoria"
    },
    "locations": [
        {
            "id": "uuid",
            "name": "Main Counter",
            "address": "123 Main Street, Pretoria",
            "latitude": "-25.7479",
            "longitude": "28.2293",
            "operating_hours": "Mon-Sun: 17:00-20:00",
            "facilities": ["parking", "wheelchair_accessible"],
            "instructions": "Enter through main entrance"
        }
    ]
}
```

---

## 4. Business Rules & Validation

### 4.1 Scheduling Rules
- Pickup slots can only be created for active food listings
- Time slots cannot overlap within the same location
- Minimum 30 minutes advance booking required
- Maximum 7 days advance booking allowed
- Cancellation allowed up to 1 hour before scheduled time

### 4.2 Capacity Management
- Each time slot has a maximum capacity limit
- Overbooking prevention through real-time validation
- Automatic slot generation based on food listing expiry
- Buffer time between slots to prevent congestion

### 4.3 Location Constraints
- Each business must have at least one active pickup location
- GPS coordinates required for route optimization
- Operating hours must align with business hours
- Contact information mandatory for each location

### 4.4 QR Code Security
- Unique confirmation codes generated for each pickup
- QR codes expire after pickup completion
- Business verification required for code validation
- Audit trail maintained for all verification attempts

---

## 5. Error Handling

### 5.1 Standard Error Format
```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": {
            "field": ["Specific validation error"]
        }
    }
}
```

### 5.2 Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request data validation failed |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | SLOT_UNAVAILABLE | Time slot no longer available |
| 422 | BOOKING_CONFLICT | Schedule conflict detected |
| 429 | RATE_LIMITED | Too many booking attempts |
| 500 | SCHEDULING_ERROR | Internal scheduling error |

### 5.3 Specific Error Examples

#### Booking Conflicts
```json
{
    "error": {
        "code": "SLOT_UNAVAILABLE",
        "message": "Selected time slot is no longer available",
        "details": {
            "slot_id": "uuid",
            "current_capacity": 5,
            "max_capacity": 5,
            "alternative_slots": [
                {
                    "slot_id": "uuid",
                    "time": "17:30-17:55",
                    "available_spots": 2
                }
            ]
        }
    }
}
```

#### Location Validation Errors
```json
{
    "error": {
        "code": "INVALID_LOCATION",
        "message": "Pickup location does not belong to your business",
        "details": {
            "location_id": "uuid",
            "business_id": "uuid"
        }
    }
}
```

---

## 6. Performance Requirements

### 6.1 Response Time Targets
- Slot availability check: < 200ms
- Pickup scheduling: < 1 second
- QR code generation: < 500ms
- Analytics queries: < 2 seconds
- Route optimization: < 5 seconds

### 6.2 Concurrency Requirements
- Handle 500+ concurrent slot checks
- Support 100+ simultaneous bookings
- Process 50+ QR code verifications per minute
- Manage 1000+ active pickup schedules

### 6.3 Scalability Targets
- Support 10,000+ scheduled pickups per day
- Handle 100+ businesses with multiple locations
- Process 50,000+ slot availability requests daily
- Store 1 year of historical scheduling data

---

## 7. Integration Points

### 7.1 Internal Service Dependencies
- **Interactions Service**: Order and payment status
- **Food Listings Service**: Available items and expiry dates
- **Notifications Service**: Pickup reminders and status updates
- **Authentication Service**: User profiles and permissions
- **Analytics Service**: Performance tracking and insights

### 7.2 External Service Dependencies
- **Google Maps API**: Distance calculations and directions
- **AWS S3**: QR code image storage
- **SMS Gateway**: Text message reminders
- **Email Service**: Pickup confirmation emails

### 7.3 Event-Driven Architecture
```python
# Django Signals Integration
from django.dispatch import receiver
from food_listings.signals import listing_created, listing_expired
from interactions.signals import order_confirmed

@receiver(listing_created)
def create_pickup_schedule(sender, listing, **kwargs):
    """Auto-create pickup schedule for new food listings"""
    if listing.pickup_window:
        PickupSchedulingService.create_pickup_schedule(
            food_listing=listing,
            schedule_data={
                'location_id': listing.provider.default_pickup_location.id,
                'pickup_window': listing.pickup_window,
                'total_slots': 4,
                'max_orders_per_slot': 5
            }
        )

@receiver(order_confirmed)
def enable_pickup_scheduling(sender, order, **kwargs):
    """Enable pickup scheduling once order is confirmed"""
    # Create notification to customer about scheduling
    NotificationService.create_notification(
        recipient=order.user,
        notification_type='schedule_pickup',
        title='Schedule Your Pickup',
        message=f'Your order is confirmed! Please schedule a pickup time for {order.food_listing.name}.',
        data={'order_id': str(order.id)}
    )
```

---

## 8. QR Code System

### 8.1 QR Code Generation
```python
import qrcode
import json
from io import BytesIO
from PIL import Image

def generate_pickup_qr_code(scheduled_pickup):
    """Generate QR code for pickup verification"""
    
    # QR code data
    qr_data = {
        'pickup_id': str(scheduled_pickup.id),
        'confirmation_code': scheduled_pickup.confirmation_code,
        'business_id': str(scheduled_pickup.location.business.id),
        'scheduled_time': scheduled_pickup.scheduled_date.isoformat(),
        'location': scheduled_pickup.location.name,
        'customer_id': str(scheduled_pickup.order.user.id),
        'generated_at': timezone.now().isoformat(),
        'version': '1.0'
    }
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(qr_data))
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Add logo overlay (optional)
    if settings.QR_CODE_LOGO_PATH:
        logo = Image.open(settings.QR_CODE_LOGO_PATH)
        logo_size = min(img.size) // 5
        logo = logo.resize((logo_size, logo_size))
        
        # Calculate position to center logo
        pos = ((img.size[0] - logo_size) // 2, (img.size[1] - logo_size) // 2)
        img.paste(logo, pos)
    
    return img, qr_data
```

### 8.2 QR Code Verification Process
```python
def verify_pickup_qr_code(qr_data, business):
    """Verify QR code for pickup completion"""
    
    try:
        # Extract and validate required fields
        pickup_id = qr_data.get('pickup_id')
        confirmation_code = qr_data.get('confirmation_code')
        business_id = qr_data.get('business_id')
        
        # Verify business matches
        if str(business.id) != business_id:
            return False, "QR code is not for this business"
        
        # Find scheduled pickup
        pickup = ScheduledPickup.objects.get(
            id=pickup_id,
            confirmation_code=confirmation_code,
            location__business=business,
            status__in=['scheduled', 'confirmed']
        )
        
        # Check if pickup is for today
        if pickup.scheduled_date != timezone.now().date():
            return False, "Pickup is not scheduled for today"
        
        # Check if within pickup window (allow 30 min early/late)
        current_time = timezone.now().time()
        start_buffer = (datetime.combine(date.today(), pickup.scheduled_start_time) 
                       - timedelta(minutes=30)).time()
        end_buffer = (datetime.combine(date.today(), pickup.scheduled_end_time) 
                     + timedelta(minutes=30)).time()
        
        if not (start_buffer <= current_time <= end_buffer):
            return False, f"Outside pickup window. Scheduled: {pickup.scheduled_start_time}-{pickup.scheduled_end_time}"
        
        return True, pickup
        
    except ScheduledPickup.DoesNotExist:
        return False, "Invalid pickup or confirmation code"
    except Exception as e:
        return False, f"Verification error: {str(e)}"
```

---

## 9. Route Optimization Engine

### 9.1 Optimization Algorithms
```python
import numpy as np
from sklearn.cluster import KMeans
from geopy.distance import geodesic

class PickupOptimizationService:
    """Advanced route and schedule optimization"""
    
    @classmethod
    def optimize_pickup_routes(cls, business, date, pickups):
        """Optimize pickup routes for multiple locations"""
        
        if len(pickups) <= 1:
            return pickups
        
        # Extract coordinates
        coordinates = []
        pickup_data = []
        
        for pickup in pickups:
            if pickup.location.latitude and pickup.location.longitude:
                coordinates.append([
                    float(pickup.location.latitude),
                    float(pickup.location.longitude)
                ])
                pickup_data.append({
                    'pickup': pickup,
                    'coordinates': [float(pickup.location.latitude), float(pickup.location.longitude)],
                    'time': pickup.scheduled_start_time,
                    'duration': 5  # Estimated pickup duration in minutes
                })
        
        if len(coordinates) < 2:
            return pickups
        
        # Cluster nearby pickups
        n_clusters = min(3, len(coordinates))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(coordinates)
        
        # Optimize within each cluster
        optimized_routes = []
        for cluster_id in range(n_clusters):
            cluster_pickups = [pickup_data[i] for i, c in enumerate(clusters) if c == cluster_id]
            if cluster_pickups:
                optimized_cluster = cls._optimize_cluster_route(cluster_pickups)
                optimized_routes.extend(optimized_cluster)
        
        return optimized_routes
    
    @classmethod
    def _optimize_cluster_route(cls, cluster_pickups):
        """Optimize route within a cluster using nearest neighbor"""
        
        if len(cluster_pickups) <= 1:
            return cluster_pickups
        
        # Start with earliest pickup
        cluster_pickups.sort(key=lambda x: x['time'])
        optimized = [cluster_pickups[0]]
        remaining = cluster_pickups[1:]
        
        current_location = cluster_pickups[0]['coordinates']
        
        while remaining:
            # Find nearest remaining pickup
            distances = []
            for pickup in remaining:
                distance = geodesic(current_location, pickup['coordinates']).kilometers
                distances.append(distance)
            
            nearest_idx = np.argmin(distances)
            nearest_pickup = remaining.pop(nearest_idx)
            optimized.append(nearest_pickup)
            current_location = nearest_pickup['coordinates']
        
        return optimized
    
    @classmethod
    def suggest_time_slot_adjustments(cls, business, historical_data):
        """Suggest time slot adjustments based on demand patterns"""
        
        suggestions = []
        
        # Analyze demand by hour
        hourly_demand = {}
        for data in historical_data:
            hour = data.scheduled_start_time.hour
            hourly_demand[hour] = hourly_demand.get(hour, 0) + 1
        
        if not hourly_demand:
            return suggestions
        
        # Find peak hours
        max_demand = max(hourly_demand.values())
        avg_demand = sum(hourly_demand.values()) / len(hourly_demand)
        
        for hour, demand in hourly_demand.items():
            if demand > avg_demand * 1.5:  # High demand
                suggestions.append({
                    'type': 'increase_capacity',
                    'hour': hour,
                    'current_demand': demand,
                    'suggested_additional_slots': max(1, int((demand - avg_demand) / 5)),
                    'priority': 'high' if demand > avg_demand * 2 else 'medium'
                })
            elif demand < avg_demand * 0.3:  # Low demand
                suggestions.append({
                    'type': 'reduce_capacity',
                    'hour': hour,
                    'current_demand': demand,
                    'suggested_reduction': 1,
                    'priority': 'low'
                })
        
        return suggestions
    
    @classmethod
    def calculate_efficiency_score(cls, business, date):
        """Calculate overall pickup efficiency score"""
        
        pickups = ScheduledPickup.objects.filter(
            location__business=business,
            scheduled_date=date
        )
        
        if not pickups.exists():
            return 0
        
        # Metrics for efficiency calculation
        total_pickups = pickups.count()
        completed_pickups = pickups.filter(status='completed').count()
        on_time_pickups = pickups.filter(
            status='completed',
            actual_pickup_time__lte=F('scheduled_end_time')
        ).count()
        
        # Calculate scores
        completion_rate = (completed_pickups / total_pickups) * 100 if total_pickups > 0 else 0
        punctuality_rate = (on_time_pickups / completed_pickups) * 100 if completed_pickups > 0 else 0
        
        # Capacity utilization
        total_slots = PickupTimeSlot.objects.filter(
            pickup_schedule__location__business=business,
            date=date
        ).count()
        utilization_rate = (total_pickups / total_slots) * 100 if total_slots > 0 else 0
        
        # Weighted efficiency score
        efficiency_score = (
            completion_rate * 0.4 +
            punctuality_rate * 0.3 +
            min(utilization_rate, 100) * 0.3
        )
        
        return round(efficiency_score, 1)
```

### 9.2 Demand Forecasting
```python
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib

class DemandForecastingService:
    """Predict pickup demand using machine learning"""
    
    @classmethod
    def train_demand_model(cls, business):
        """Train demand forecasting model"""
        
        # Get historical data
        historical_pickups = ScheduledPickup.objects.filter(
            location__business=business,
            created_at__gte=timezone.now() - timedelta(days=90)
        ).values(
            'scheduled_date',
            'scheduled_start_time',
            'food_listing__category',
            'location_id'
        )
        
        if len(historical_pickups) < 50:
            return None  # Need more data
        
        # Create DataFrame
        df = pd.DataFrame(historical_pickups)
        df['day_of_week'] = pd.to_datetime(df['scheduled_date']).dt.dayofweek
        df['hour'] = pd.to_datetime(df['scheduled_start_time'], format='%H:%M:%S').dt.hour
        df['month'] = pd.to_datetime(df['scheduled_date']).dt.month
        
        # Aggregate by time periods
        demand_data = df.groupby(['day_of_week', 'hour', 'month', 'food_listing__category']).size().reset_index(name='demand')
        
        # Prepare features
        le_category = LabelEncoder()
        demand_data['category_encoded'] = le_category.fit_transform(demand_data['food_listing__category'])
        
        features = ['day_of_week', 'hour', 'month', 'category_encoded']
        X = demand_data[features]
        y = demand_data['demand']
        
        # Train model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Save model and encoder
        model_data = {
            'model': model,
            'label_encoder': le_category,
            'features': features,
            'business_id': business.id,
            'trained_at': timezone.now()
        }
        
        return model_data
    
    @classmethod
    def predict_demand(cls, business, date, food_category):
        """Predict demand for specific date and category"""
        
        # Load trained model (in production, this would be cached)
        model_data = cls._load_model(business.id)
        if not model_data:
            return None
        
        model = model_data['model']
        label_encoder = model_data['label_encoder']
        
        # Prepare features
        day_of_week = date.weekday()
        month = date.month
        
        predictions = {}
        
        # Predict for each hour
        for hour in range(16, 21):  # Typical pickup hours
            try:
                category_encoded = label_encoder.transform([food_category])[0]
                features = [[day_of_week, hour, month, category_encoded]]
                predicted_demand = model.predict(features)[0]
                predictions[hour] = max(0, int(round(predicted_demand)))
            except ValueError:
                # Unknown category
                predictions[hour] = 0
        
        return predictions
    
    @classmethod
    def _load_model(cls, business_id):
        """Load trained model from storage"""
        # In production, this would load from Redis or database
        # For now, return None to indicate no model available
        return None
```

---

## 10. Analytics & Reporting

### 10.1 Performance Metrics
```python
class PickupAnalyticsService:
    """Comprehensive analytics for pickup operations"""
    
    @classmethod
    def generate_daily_report(cls, business, date):
        """Generate comprehensive daily pickup report"""
        
        pickups = ScheduledPickup.objects.filter(
            location__business=business,
            scheduled_date=date
        )
        
        # Basic metrics
        total_scheduled = pickups.count()
        completed = pickups.filter(status='completed').count()
        cancelled = pickups.filter(status='cancelled').count()
        missed = pickups.filter(status='missed').count()
        
        # Performance metrics
        on_time_pickups = pickups.filter(
            status='completed',
            actual_pickup_time__lte=F('scheduled_end_time')
        ).count()
        
        # Calculate average wait times
        wait_times = []
        for pickup in pickups.filter(status='completed', actual_pickup_time__isnull=False):
            scheduled_time = datetime.combine(pickup.scheduled_date, pickup.scheduled_start_time)
            actual_time = pickup.actual_pickup_time.replace(tzinfo=None)
            wait_time = (actual_time - scheduled_time).total_seconds() / 60
            wait_times.append(wait_time)
        
        avg_wait_time = sum(wait_times) / len(wait_times) if wait_times else 0
        
        # Customer satisfaction (from reviews)
        satisfaction_scores = []
        for pickup in pickups.filter(status='completed'):
            if hasattr(pickup.order.interaction, 'review'):
                satisfaction_scores.append(pickup.order.interaction.review.general_rating)
        
        avg_satisfaction = sum(satisfaction_scores) / len(satisfaction_scores) if satisfaction_scores else 0
        
        # Revenue impact
        total_value = pickups.filter(status='completed').aggregate(
            total=Sum('order__total_amount')
        )['total'] or 0
        
        report = {
            'date': date,
            'business': {
                'id': business.id,
                'name': business.business_name
            },
            'summary': {
                'total_scheduled': total_scheduled,
                'completed': completed,
                'cancelled': cancelled,
                'missed': missed,
                'completion_rate': (completed / total_scheduled * 100) if total_scheduled > 0 else 0,
                'on_time_rate': (on_time_pickups / completed * 100) if completed > 0 else 0
            },
            'performance': {
                'average_wait_time_minutes': round(avg_wait_time, 1),
                'customer_satisfaction': round(avg_satisfaction, 1),
                'efficiency_score': PickupOptimizationService.calculate_efficiency_score(business, date)
            },
            'financial': {
                'total_value': float(total_value),
                'average_order_value': float(total_value / completed) if completed > 0 else 0
            },
            'recommendations': cls._generate_recommendations(business, pickups)
        }
        
        return report
    
    @classmethod
    def _generate_recommendations(cls, business, pickups):
        """Generate actionable recommendations"""
        
        recommendations = []
        
        # Analyze completion rate
        total = pickups.count()
        completed = pickups.filter(status='completed').count()
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        if completion_rate < 80:
            recommendations.append({
                'type': 'completion_rate',
                'priority': 'high',
                'message': f'Completion rate ({completion_rate:.1f}%) is below target (80%). Consider improving communication with customers.',
                'actions': [
                    'Send more pickup reminders',
                    'Clarify pickup instructions',
                    'Follow up on missed pickups'
                ]
            })
        
        # Analyze time distribution
        hourly_distribution = {}
        for pickup in pickups:
            hour = pickup.scheduled_start_time.hour
            hourly_distribution[hour] = hourly_distribution.get(hour, 0) + 1
        
        if hourly_distribution:
            peak_hour = max(hourly_distribution, key=hourly_distribution.get)
            peak_demand = hourly_distribution[peak_hour]
            
            if peak_demand > total * 0.4:  # More than 40% in one hour
                recommendations.append({
                    'type': 'capacity_optimization',
                    'priority': 'medium',
                    'message': f'High demand concentration at {peak_hour}:00 ({peak_demand} pickups). Consider spreading load.',
                    'actions': [
                        f'Add more time slots around {peak_hour}:00',
                        'Incentivize off-peak pickups',
                        'Consider additional pickup locations'
                    ]
                })
        
        return recommendations
    
    @classmethod
    def export_analytics_data(cls, business, start_date, end_date, format='csv'):
        """Export analytics data for external analysis"""
        
        pickups = ScheduledPickup.objects.filter(
            location__business=business,
            scheduled_date__range=[start_date, end_date]
        ).select_related(
            'order__interaction',
            'food_listing',
            'location'
        )
        
        data = []
        for pickup in pickups:
            data.append({
                'date': pickup.scheduled_date,
                'time': pickup.scheduled_start_time,
                'confirmation_code': pickup.confirmation_code,
                'food_listing': pickup.food_listing.name,
                'location': pickup.location.name,
                'status': pickup.status,
                'customer_type': pickup.order.interaction.user.user_type,
                'order_value': float(pickup.order.total_amount),
                'actual_pickup_time': pickup.actual_pickup_time,
                'customer_notes': pickup.customer_notes,
                'business_notes': pickup.business_notes
            })
        
        if format == 'csv':
            df = pd.DataFrame(data)
            return df.to_csv(index=False)
        elif format == 'json':
            return json.dumps(data, default=str, indent=2)
        else:
            return data
```

---

## 11. Security & Compliance

### 11.1 Data Protection
```python
class SchedulingSecurityService:
    """Security measures for scheduling data"""
    
    @classmethod
    def encrypt_sensitive_data(cls, data):
        """Encrypt sensitive scheduling information"""
        from cryptography.fernet import Fernet
        
        key = settings.SCHEDULING_ENCRYPTION_KEY
        f = Fernet(key)
        
        encrypted_data = f.encrypt(json.dumps(data).encode())
        return encrypted_data
    
    @classmethod
    def audit_pickup_access(cls, user, pickup, action):
        """Log access to pickup information"""
        
        PickupAccessLog.objects.create(
            user=user,
            pickup=pickup,
            action=action,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            timestamp=timezone.now()
        )
    
    @classmethod
    def validate_pickup_permissions(cls, user, pickup):
        """Validate user permissions for pickup access"""
        
        # Customer can only access their own pickups
        if user.user_type == 'customer':
            return pickup.order.interaction.user == user
        
        # NGO can only access their own pickups
        if user.user_type == 'ngo':
            return pickup.order.interaction.user == user
        
        # Provider can access pickups at their locations
        if user.user_type == 'provider':
            return pickup.location.business.user == user
        
        # Admin can access all pickups
        if user.user_type == 'admin':
            return True
        
        return False
```

### 11.2 GDPR Compliance
```python
class SchedulingGDPRService:
    """GDPR compliance for scheduling data"""
    
    @classmethod
    def anonymize_pickup_data(cls, pickup):
        """Anonymize pickup data for GDPR compliance"""
        
        pickup.customer_notes = "[ANONYMIZED]"
        pickup.business_notes = "[ANONYMIZED]"
        pickup.qr_code_data = {}
        pickup.save()
        
        # Log anonymization
        PickupDataLog.objects.create(
            pickup=pickup,
            action='anonymized',
            reason='gdpr_request',
            timestamp=timezone.now()
        )
    
    @classmethod
    def export_user_scheduling_data(cls, user):
        """Export all scheduling data for a user"""
        
        pickups = ScheduledPickup.objects.filter(
            order__interaction__user=user
        )
        
        data = {
            'user_id': str(user.id),
            'export_date': timezone.now().isoformat(),
            'pickups': []
        }
        
        for pickup in pickups:
            data['pickups'].append({
                'confirmation_code': pickup.confirmation_code,
                'scheduled_date': pickup.scheduled_date.isoformat(),
                'status': pickup.status,
                'location': pickup.location.name,
                'customer_notes': pickup.customer_notes,
                'created_at': pickup.created_at.isoformat()
            })
        
        return data
    
    @classmethod
    def delete_user_scheduling_data(cls, user):
        """Delete all scheduling data for a user"""
        
        pickups = ScheduledPickup.objects.filter(
            order__interaction__user=user
        )
        
        # Soft delete or anonymize instead of hard delete
        for pickup in pickups:
            cls.anonymize_pickup_data(pickup)
```

---

## 12. Testing Strategy

### 12.1 Unit Tests
```python
class SchedulingTestCase(TestCase):
    """Unit tests for scheduling functionality"""
    
    def setUp(self):
        self.business = create_test_business()
        self.location = create_test_location(self.business)
        self.food_listing = create_test_food_listing(self.business)
        self.customer = create_test_customer()
        
    def test_time_slot_generation(self):
        """Test automatic time slot generation"""
        pickup_schedule = FoodListingPickupSchedule.objects.create(
            food_listing=self.food_listing,
            location=self.location,
            pickup_window="17:00-19:00",
            total_slots=4,
            max_orders_per_slot=5
        )
        
        target_date = timezone.now().date() + timedelta(days=1)
        slots = PickupSchedulingService.generate_time_slots_for_date(
            self.food_listing, target_date
        )
        
        self.assertEqual(len(slots), 4)
        self.assertEqual(slots[0].start_time, time(17, 0))
        self.assertTrue(all(slot.is_available for slot in slots))
    
    def test_pickup_scheduling(self):
        """Test pickup scheduling process"""
        order = create_test_order(self.customer, self.food_listing)
        time_slot = create_test_time_slot(self.food_listing)
        
        schedule_data = {
            'order_id': order.id,
            'food_listing_id': self.food_listing.id,
            'time_slot_id': time_slot.id,
            'date': timezone.now().date() + timedelta(days=1),
            'customer_notes': 'Test notes'
        }
        
        pickup, qr_image = PickupSchedulingService.schedule_pickup(
            order, schedule_data
        )
        
        self.assertEqual(pickup.status, 'scheduled')
        self.assertEqual(pickup.food_listing, self.food_listing)
        self.assertIsNotNone(pickup.confirmation_code)
        self.assertIsNotNone(qr_image)
    
    def test_qr_code_verification(self):
        """Test QR code verification process"""
        pickup = create_test_scheduled_pickup()
        qr_data = pickup.qr_code_data
        
        is_valid, result = verify_pickup_qr_code(qr_data, self.business)
        
        self.assertTrue(is_valid)
        self.assertEqual(result, pickup)
    
    def test_capacity_management(self):
        """Test time slot capacity limits"""
        time_slot = create_test_time_slot(self.food_listing, max_orders=2)
        
        # Schedule first pickup
        order1 = create_test_order(self.customer, self.food_listing)
        pickup1 = schedule_test_pickup(order1, time_slot)
        
        # Schedule second pickup
        order2 = create_test_order(self.customer, self.food_listing)
        pickup2 = schedule_test_pickup(order2, time_slot)
        
        # Third pickup should fail
        order3 = create_test_order(self.customer, self.food_listing)
        with self.assertRaises(ValidationError):
            schedule_test_pickup(order3, time_slot)
```

### 12.2 Integration Tests
```python
class SchedulingIntegrationTestCase(TestCase):
    """Integration tests for scheduling workflows"""
    
    def test_complete_pickup_workflow(self):
        """Test complete pickup workflow from scheduling to completion"""
        
        # 1. Create food listing with pickup schedule
        food_listing = create_test_food_listing_with_schedule()
        
        # 2. Customer schedules pickup
        customer = create_test_customer()
        order = create_test_order(customer, food_listing)
        
        response = self.client.post('/api/scheduling/schedule/', {
            'order_id': order.id,
            'food_listing_id': food_listing.id,
            'time_slot_id': get_available_slot().id,
            'date': (timezone.now().date() + timedelta(days=1)).isoformat()
        })
        
        self.assertEqual(response.status_code, 201)
        pickup = ScheduledPickup.objects.get(order=order)
        
        # 3. Business verifies QR code
        business_user = create_test_business_user()
        self.client.force_authenticate(user=business_user)
        
        verify_response = self.client.post('/api/scheduling/verify-code/', {
            'confirmation_code': pickup.confirmation_code
        })
        
        self.assertEqual(verify_response.status_code, 200)
        
        # 4. Business completes pickup
        complete_response = self.client.post(
            f'/api/scheduling/complete-pickup/{pickup.id}/',
            {
                'actual_pickup_time': timezone.now().isoformat(),
                'business_notes': 'Pickup completed successfully'
            }
        )
        
        self.assertEqual(complete_response.status_code, 200)
        
        pickup.refresh_from_db()
        self.assertEqual(pickup.status, 'completed')
        self.assertIsNotNone(pickup.actual_pickup_time)
```

---

## 13. Deployment & Operations

### 13.1 Environment Configuration
```python
# Production Settings
SCHEDULING_CONFIG = {
    'QR_CODE_STORAGE': 's3://savenbiteguild-qr-codes/',
    'MAX_ADVANCE_BOOKING_DAYS': 7,
    'MIN_ADVANCE_BOOKING_MINUTES': 30,
    'OPTIMIZATION_ENGINE_ENABLED': True,
    'DEMAND_FORECASTING_ENABLED': True,
    'ANALYTICS_RETENTION_DAYS': 365,
}

# Celery Tasks for Scheduling
CELERY_BEAT_SCHEDULE.update({
    'generate-daily-time-slots': {
        'task': 'scheduling.tasks.generate_daily_time_slots',
        'schedule': crontab(hour=0, minute=30),  # Generate slots for next day
    },
    'send-pickup-reminders': {
        'task': 'scheduling.tasks.send_pickup_reminders',
        'schedule': crontab(minute='*/30'),  # Check every 30 minutes
    },
    'cleanup-expired-slots': {
        'task': 'scheduling.tasks.cleanup_expired_slots',
        'schedule': crontab(hour=2, minute=0),  # Daily cleanup
    },
    'update-analytics': {
        'task': 'scheduling.tasks.update_daily_analytics',
        'schedule': crontab(hour=23, minute=0),  # End of day analytics
    },
})
```

### 13.2 Monitoring & Alerting
```python
# Monitoring Configuration
SCHEDULING_MONITORING = {
    'metrics': [
        'scheduling_slot_utilization_rate',
        'scheduling_pickup_success_rate',
        'scheduling_qr_verification_failures',
        'scheduling_optimization_performance'
    ],
    'alerts': [
        {
            'metric': 'scheduling_pickup_success_rate',
            'threshold': 0.80,
            'operator': 'less_than',
            'notification': 'email_and_slack'
        },
        {
            'metric': 'scheduling_qr_verification_failures',
            'threshold': 0.05,
            'operator': 'greater_than',
            'notification': 'immediate_alert'
        }
    ]
}

# Performance Monitoring
class SchedulingMetrics:
    @staticmethod
    def track_slot_utilization():
        """Track time slot utilization rates"""
        today = timezone.now().date()
        total_slots = PickupTimeSlot.objects.filter(date=today).count()
        booked_slots = PickupTimeSlot.objects.filter(
            date=today, 
            current_bookings__gt=0
        ).count()
        
        utilization = (booked_slots / total_slots) if total_slots > 0 else 0
        
        # Send metric to monitoring system
        send_metric('scheduling.slot_utilization', utilization)
        
        return utilization
```

---    