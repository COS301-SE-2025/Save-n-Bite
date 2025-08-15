# Save n Bite - Scheduling App Service Contract

**Project:** Save n Bite  
**App:** Scheduling  
**Version:** 2.0  
**Date:** August 12, 2025  
**Team:** Secure Web & Mobile Guild  

---

## 1. Overview

The Scheduling app is the logistics backbone of the Save n Bite platform, managing pickup coordination, time slot allocation, location management, and route optimization. It ensures efficient food collection through intelligent scheduling algorithms and real-time availability tracking.

### 1.1 Purpose
- Manage pickup locations and time slot availability for food listings
- Coordinate food collection scheduling between businesses and customers
- Generate QR codes for pickup verification
- Provide analytics for scheduling efficiency
- Handle pickup confirmations and status tracking

### 1.2 Key Features
- **Food Listing-Based Scheduling**: Individual pickup schedules per food listing
- **Location Management**: Multiple pickup points per business with GPS coordinates
- **QR Code Verification**: Secure pickup authentication system
- **Real-time Updates**: Live availability and status tracking
- **Analytics Dashboard**: Pickup performance metrics and insights

---

## 2. Architecture & Technology Stack

### 2.1 Backend Architecture
- **Framework**: Django 4.x with Django REST Framework
- **Database**: PostgreSQL (primary), Redis (caching & real-time)
- **Authentication**: JWT tokens with role-based permissions
- **QR Code Generation**: Python qrcode library
- **Background Tasks**: Celery for async processing

### 2.2 Core Dependencies
```python
# Django & DRF
Django>=4.2.0
djangorestframework>=3.14.0

# Database & Caching
psycopg2-binary>=2.9.0
redis>=4.5.0

# QR Code Generation
qrcode>=7.4.0
Pillow>=9.5.0

# Optimization & Analytics
scikit-learn>=1.3.0
pandas>=2.0.0
numpy>=1.24.0

# Utilities
python-dateutil>=2.8.0
geopy>=2.3.0
```

### 2.3 Database Schema
```sql
-- Core Models
- PickupLocation (business pickup points)
- FoodListingPickupSchedule (pickup schedules per food listing)
- PickupTimeSlot (individual booking slots)
- ScheduledPickup (confirmed pickup appointments)
- PickupAnalytics (performance tracking)
- PickupOptimization (optimization settings)
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
GET | POST /api/scheduling/pickup-locations/
```

**GET Response (200 OK):**
```json
{
    "locations": [
        {
            "id": "uuid",
            "name": "Main Counter",
            "address": "123 Main Street, Pretoria",
            "instructions": "Enter through main entrance",
            "contact_person": "John Doe",
            "contact_phone": "+27123456789",
            "latitude": "-25.7479",
            "longitude": "28.2293",
            "is_active": true,
            "created_at": "2025-08-12T10:30:00Z",
            "updated_at": "2025-08-12T10:30:00Z"
        }
    ],
    "count": 1
}
```

**POST Request:**
```json
{
    "name": "Side Entrance",
    "address": "123 Main Street, Side Door, Pretoria",
    "instructions": "Use side entrance for after-hours pickup",
    "contact_person": "Jane Smith",
    "contact_phone": "+27123456790",
    "latitude": "-25.7480",
    "longitude": "28.2295"
}
```

**POST Response (201 Created):**
```json
{
    "message": "Pickup location created successfully",
    "location": {
        "id": "uuid",
        "name": "Side Entrance",
        "address": "123 Main Street, Side Door, Pretoria",
        "instructions": "Use side entrance for after-hours pickup",
        "contact_person": "Jane Smith",
        "contact_phone": "+27123456790",
        "latitude": "-25.74800000",
        "longitude": "28.22950000",
        "is_active": true,
        "created_at": "2025-08-12T15:10:05Z",
        "updated_at": "2025-08-12T15:10:05Z"
    }
}
```

#### 3.2.2 Get/Update/Delete Specific Pickup Location
```http
GET | PUT | DELETE /api/scheduling/pickup-locations/<uuid:location_id>/
```

#### 3.2.3 Get Food Listing Pickup Schedules
```http
GET | POST /api/scheduling/pickup-schedules/
```

**GET Response (200 OK):**
```json
{
    "pickup_schedules": [
        {
            "id": "uuid",
            "food_listing": "uuid",
            "food_listing_name": "Delicious Pizza",
            "location": "uuid",
            "location_name": "Main Counter",
            "business_name": "Mario's Restaurant",
            "pickup_window": "17:00-19:00",
            "total_slots": 4,
            "max_orders_per_slot": 5,
            "slot_buffer_minutes": 5,
            "is_active": true,
            "start_time": "17:00:00",
            "end_time": "19:00:00",
            "window_duration_minutes": 120,
            "slot_duration_minutes": 26,
            "generated_slots": [
                {
                    "slot_number": 1,
                    "start_time": "17:00:00",
                    "end_time": "17:26:00",
                    "max_orders": 5
                }
            ],
            "created_at": "2025-08-12T10:00:00Z",
            "updated_at": "2025-08-12T10:00:00Z"
        }
    ],
    "count": 1
}
```

#### 3.2.4 Generate Time Slots
```http
POST /api/scheduling/generate-time-slots/
```

**Request:**
```json
{
    "food_listing_id": "uuid",
    "date": "2025-08-13"
}
```

**Response (201 Created):**
```json
{
    "message": "Generated 4 time slots",
    "time_slots": [
        {
            "id": "uuid",
            "pickup_schedule": "uuid",
            "slot_number": 1,
            "start_time": "17:00:00",
            "end_time": "17:26:00",
            "max_orders_per_slot": 5,
            "date": "2025-08-13",
            "current_bookings": 0,
            "is_active": true,
            "food_listing_name": "Delicious Pizza",
            "location_name": "Main Counter",
            "is_available": true,
            "available_spots": 5,
            "created_at": "2025-08-12T15:13:04Z"
        }
    ],
    "count": 4
}
```

#### 3.2.5 Business Schedule Overview
```http
GET /api/scheduling/schedule-overview/
Query Parameters:
- date: 2025-08-13 (optional, defaults to today)
```

**Response (200 OK):**
```json
{
    "schedule_overview": {
        "date": "2025-08-13",
        "total_pickups": 15,
        "completed_pickups": 8,
        "pending_pickups": 6,
        "missed_pickups": 1,
        "pickups_by_hour": {
            "17": [
                {
                    "id": "uuid",
                    "confirmation_code": "ABC123",
                    "food_listing_name": "Margherita Pizza",
                    "customer_name": "Jane Smith",
                    "status": "confirmed",
                    "time": "17:15"
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
}
```

#### 3.2.6 Verify Pickup Code
```http
POST /api/scheduling/verify-code/
```

**Request:**
```json
{
    "confirmation_code": "ABC123"
}
```

**Response (200 OK):**
```json
{
    "message": "Pickup verified successfully",
    "pickup": {
        "id": "uuid",
        "confirmation_code": "ABC123",
        "customer": {
            "id": "uuid",
            "full_name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "+27123456789"
        },
        "food_listing": {
            "id": "uuid",
            "name": "Margherita Pizza",
            "description": "Fresh margherita pizza",
            "quantity": 2,
            "pickup_window": "17:00-19:00"
        },
        "location": {
            "id": "uuid",
            "name": "Main Counter",
            "address": "123 Main Street, Pretoria",
            "instructions": "Enter through main entrance",
            "contact_person": "John Doe",
            "contact_phone": "+27123456789"
        },
        "scheduled_date": "2025-08-13",
        "scheduled_start_time": "17:15:00",
        "scheduled_end_time": "17:40:00",
        "status": "confirmed",
        "customer_notes": "Please keep pizza warm",
        "business_notes": "",
        "is_upcoming": true,
        "is_today": false,
        "created_at": "2025-08-12T14:30:00Z",
        "updated_at": "2025-08-12T14:30:00Z"
    }
}
```

#### 3.2.7 Complete Pickup
```http
POST /api/scheduling/complete-pickup/<uuid:pickup_id>/
```

**Response (200 OK):**
```json
{
    "message": "Pickup completed successfully",
    "pickup": {
        "id": "uuid",
        "status": "completed",
        "actual_pickup_time": "2025-08-13T17:18:00Z",
        "confirmation_code": "ABC123",
        "food_listing_name": "Margherita Pizza",
        "customer_email": "jane@example.com"
    }
}
```

### 3.3 Customer Pickup Scheduling Endpoints

#### 3.3.1 Get Available Slots
```http
GET /api/scheduling/available-slots/
Query Parameters:
- food_listing_id: uuid (required)
- date: 2025-08-13 (optional, defaults to today)
```

**Response (200 OK):**
```json
{
    "available_slots": [
        {
            "id": "uuid",
            "slot_number": 1,
            "start_time": "17:00:00",
            "end_time": "17:26:00",
            "date": "2025-08-13",
            "available_spots": 5,
            "food_listing": {
                "id": "uuid",
                "name": "Delicious Pizza",
                "description": "Fresh pizza with toppings",
                "pickup_window": "17:00-19:00"
            },
            "location": {
                "id": "uuid",
                "name": "Main Counter",
                "address": "123 Main Street, City Center",
                "instructions": "Enter through main entrance",
                "contact_person": "John Doe",
                "contact_phone": "+27123456789"
            }
        }
    ],
    "count": 4,
    "date": "2025-08-13",
    "food_listing": {
        "id": "uuid",
        "name": "Delicious Pizza",
        "pickup_window": "17:00-19:00"
    }
}
```

#### 3.3.2 Schedule Pickup
```http
POST /api/scheduling/schedule/
```

**Request:**
```json
{
    "order_id": "uuid",
    "food_listing_id": "uuid",
    "time_slot_id": "uuid",
    "date": "2025-08-13",
    "customer_notes": "Please keep food warm"
}
```

**Response (201 Created):**
```json
{
    "message": "Pickup scheduled successfully",
    "pickup": {
        "id": "uuid",
        "confirmation_code": "ABC123",
        "scheduled_date": "2025-08-13",
        "scheduled_start_time": "17:00:00",
        "scheduled_end_time": "17:26:00",
        "status": "scheduled",
        "food_listing_name": "Delicious Pizza",
        "location_name": "Main Counter",
        "customer_notes": "Please keep food warm"
    },
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

#### 3.3.3 Get Customer Pickups
```http
GET /api/scheduling/my-pickups/
Query Parameters:
- status: scheduled|confirmed|completed|cancelled|missed (optional)
- upcoming: true|false (optional)
- page: 1 (optional)
- page_size: 20 (optional)
```

**Response (200 OK):**
```json
{
    "count": 12,
    "next": "http://api.com/scheduling/my-pickups/?page=2",
    "previous": null,
    "results": {
        "pickups": [
            {
                "id": "uuid",
                "interaction_id": "uuid",
                "scheduled_date": "2025-08-13",
                "scheduled_start_time": "17:00:00",
                "scheduled_end_time": "17:26:00",
                "status": "scheduled",
                "confirmation_code": "ABC123",
                "food_listing": {
                    "id": "uuid",
                    "name": "Delicious Pizza",
                    "pickup_window": "17:00-19:00",
                    "expiry_date": "2025-08-14"
                },
                "business": {
                    "id": "uuid",
                    "business_name": "Mario's Restaurant",
                    "business_address": "123 Main Street, Pretoria",
                    "business_contact": "+27123456789"
                },
                "location": {
                    "id": "uuid",
                    "name": "Main Counter",
                    "address": "123 Main Street, Pretoria",
                    "instructions": "Enter through main entrance",
                    "contact_person": "John Doe",
                    "contact_phone": "+27123456789"
                },
                "customer_notes": "Please keep food warm",
                "is_upcoming": true,
                "is_today": false
            }
        ]
    }
}
```

#### 3.3.4 Get Pickup Details
```http
GET /api/scheduling/pickups/<uuid:pickup_id>/
```

**Response (200 OK):**
```json
{
    "pickup": {
        "id": "uuid",
        "order": "uuid",
        "food_listing": {
            "id": "uuid",
            "name": "Delicious Pizza",
            "description": "Fresh pizza with toppings",
            "pickup_window": "17:00-19:00",
            "quantity": 2
        },
        "location": {
            "id": "uuid",
            "name": "Main Counter",
            "address": "123 Main Street, Pretoria",
            "instructions": "Enter through main entrance",
            "contact_person": "John Doe",
            "contact_phone": "+27123456789"
        },
        "scheduled_date": "2025-08-13",
        "scheduled_start_time": "17:00:00",
        "scheduled_end_time": "17:26:00",
        "actual_pickup_time": null,
        "status": "scheduled",
        "confirmation_code": "ABC123",
        "customer": {
            "id": "uuid",
            "full_name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "+27123456789"
        },
        "customer_notes": "Please keep food warm",
        "business_notes": "",
        "is_upcoming": true,
        "is_today": false,
        "created_at": "2025-08-12T14:30:00Z",
        "updated_at": "2025-08-12T14:30:00Z"
    }
}
```

#### 3.3.5 Cancel Pickup
```http
DELETE /api/scheduling/pickups/<uuid:pickup_id>/cancel/
```

**Response (200 OK):**
```json
{
    "message": "Pickup cancelled successfully",
    "pickup_id": "uuid",
    "status": "cancelled"
}
```

### 3.4 Analytics & Optimization Endpoints

#### 3.4.1 Business Analytics
```http
GET /api/scheduling/analytics/
Query Parameters:
- start_date: 2025-08-01 (optional, defaults to 7 days ago)
- end_date: 2025-08-12 (optional, defaults to today)
```

**Response (200 OK):**
```json
{
    "analytics": [
        {
            "id": "uuid",
            "date": "2025-08-12",
            "total_scheduled": 10,
            "total_completed": 8,
            "total_missed": 1,
            "total_cancelled": 1,
            "on_time_percentage": 87.5,
            "average_pickup_duration": null,
            "customer_satisfaction_rating": null,
            "slot_utilization_rate": 80.0,
            "peak_hour_efficiency": 0.0,
            "efficiency_score": 85.0,
            "completion_rate": 80.0,
            "no_show_rate": 10.0
        }
    ],
    "period": {
        "start_date": "2025-08-05",
        "end_date": "2025-08-12"
    },
    "count": 1
}
```

#### 3.4.2 Optimization Recommendations
```http
GET /api/scheduling/optimization/
Query Parameters:
- date: 2025-08-13 (optional, defaults to today)
```

**Response (200 OK):**
```json
{
    "recommendations": {
        "total_pickups": 5,
        "peak_hours": [
            {
                "hour": 18,
                "pickup_count": 8,
                "suggested_max": 3
            }
        ],
        "suggestions": [
            "Consider spreading out pickups at 18:00 - currently 8 scheduled"
        ],
        "efficiency_score": 75.5
    },
    "date": "2025-08-13"
}
```

### 3.5 Utility Endpoints

#### 3.5.1 Send Pickup Reminders
```http
POST /api/scheduling/send-reminders/
```

**Response (200 OK):**
```json
{
    "message": "Pickup reminders sent successfully"
}
```

#### 3.5.2 Public Pickup Locations
```http
GET /api/scheduling/public/locations/<uuid:business_id>/
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
            "instructions": "Enter through main entrance",
            "contact_person": "John Doe",
            "contact_phone": "+27123456789"
        }
    ],
    "count": 1
}
```

---

## 4. Permission Matrix

| Endpoint Category | Provider | Customer | NGO | Admin | Public |
|------------------|----------|----------|-----|-------|--------|
| Pickup Locations Management | ✅ | ❌ | ❌ | ✅ | ❌ |
| Food Listing Pickup Schedules | ✅ | ❌ | ❌ | ✅ | ❌ |
| Schedule Overview | ✅ | ❌ | ❌ | ✅ | ❌ |
| Verify/Complete Pickup | ✅ | ❌ | ❌ | ✅ | ❌ |
| Available Slots | ✅ | ✅ | ✅ | ✅ | ❌ |
| Schedule Pickup | ❌ | ✅ | ✅ | ✅ | ❌ |
| Customer Pickups | ❌ | ✅ | ✅ | ✅ | ❌ |
| Analytics | ✅ | ❌ | ❌ | ✅ | ❌ |
| Send Reminders | ✅ | ❌ | ❌ | ✅ | ❌ |
| Public Locations | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Error Handling

### 5.1 Standard Error Format
```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": "Additional error details or validation errors"
    }
}
```

### 5.2 Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request data validation failed |
| 400 | MISSING_PARAMETER | Required parameter is missing |
| 400 | INVALID_DATE | Date format is invalid |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 500 | SERVER_ERROR | Internal server error |

---

## 6. Data Formats & Protocols

### 6.1 Communication Protocol
- **Protocol**: REST over HTTPS
- **Content Type**: application/json
- **Authentication**: JWT Bearer Token
- **Date Format**: ISO 8601 (YYYY-MM-DD for dates, YYYY-MM-DDTHH:MM:SSZ for timestamps)
- **Time Format**: HH:MM:SS (24-hour format)

### 6.2 Request/Response Standards
- All requests must include `Content-Type: application/json` header
- All timestamps are in UTC
- UUIDs are used for all resource identifiers
- Pagination follows standard REST patterns with `page` and `page_size` parameters

### 6.3 QR Code Format
- **Type**: PNG image encoded as base64 data URL
- **Content**: JSON string containing pickup verification data
- **Error Correction**: Low level for optimal size
- **Version**: QR Code version 1 (21x21 modules)

---

## 7. Integration Dependencies

### 7.1 Internal Service Dependencies
- **Food Listings Service**: For food listing data and availability
- **Interactions Service**: For order management and customer interactions
- **Authentication Service**: For user profiles and permissions
- **Notifications Service**: For pickup reminders and status updates

### 7.2 External Dependencies
- **Leaflet Maps API**: For location coordinates and distance calculations
- **Email Service**: For pickup confirmation emails

---

## 8. Performance & Scalability

### 8.1 Response Time Targets
- Slot availability check: < 200ms
- Pickup scheduling: < 1 second
- QR code generation: < 500ms
- Analytics queries: < 2 seconds

### 8.2 Concurrency Support
- Handle 500+ concurrent slot availability checks
- Support 100+ simultaneous bookings
- Process 50+ QR code verifications per minute

### 8.3 Data Retention
- Analytics data: 1 year
- Completed pickup records: 2 years
- QR code data: Until pickup completion + 30 days

---

## 9. Security Considerations

### 9.1 Authentication & Authorization
- JWT tokens with appropriate expiration times
- Role-based access control enforced at endpoint level
- Business isolation - providers can only access their own data

### 9.2 Data Protection
- QR codes expire after pickup completion
- Sensitive customer data is access-controlled
- All API communications over HTTPS

### 9.3 Rate Limiting
- API rate limiting to prevent abuse
- Pickup booking limits to prevent slot hoarding
- QR code verification attempt limits

---

## 10. Testing & Validation

### 10.1 Contract Testing
- API contract tests for all endpoints
- Schema validation for request/response formats
- Error response format consistency

### 10.2 Integration Testing
- End-to-end pickup workflow testing
- Cross-service communication validation
- Real-time data synchronization testing

### 10.3 Performance Testing
- Load testing for concurrent operations
- Stress testing for peak usage scenarios
- Database query optimization validation