# Save n Bite - Interactions App Service Contract

**Project:** Save n Bite  
**App:** Interactions  
**Version:** 1.0  
**Date:** June 25, 2025  
**Team:** Secure Web & Mobile Guild  

---

## 1. Overview

The Interactions app is the core transactional component of the Save n Bite platform, managing all food purchases, donations, pickup coordination, and review processes. It serves as the central hub connecting food providers with customers and NGOs through secure, tracked interactions.

### 1.1 Purpose
- Manage food purchases and donation requests
- Coordinate pickup scheduling and logistics
- Track interaction lifecycle from creation to completion
- Enable post-interaction reviews and feedback
- Provide analytics for businesses and platform monitoring

### 1.2 Key Features
- **Transaction Management**: Purchase and donation workflows
- **Pickup Coordination**: Scheduling with location and time slot management
- **Review System**: Post-completion feedback and moderation
- **Real-time Updates**: Status tracking and notifications
- **Analytics**: Business insights and platform metrics

---

## 2. Architecture & Technology Stack

### 2.1 Backend Architecture
- **Framework**: Django 4.x with Django REST Framework
- **Database**: PostgreSQL (primary), Redis (caching & real-time)
- **Authentication**: JWT tokens with role-based permissions
- **File Storage**: AWS S3 for receipts and documents
- **Async Processing**: Celery for background tasks

### 2.2 Core Dependencies
```python
# Django & DRF
Django>=4.2.0
djangorestframework>=3.14.0
django-cors-headers>=4.0.0

# Database & Caching
psycopg2-binary>=2.9.0
redis>=4.5.0
django-redis>=5.2.0

# Authentication & Security
PyJWT>=2.6.0
django-oauth-toolkit>=1.7.0

# Task Processing
celery>=5.2.0
django-celery-beat>=2.4.0

# Utilities
python-dateutil>=2.8.0
uuid>=1.30
```

### 2.3 Database Schema
```sql
-- Core Models
- Interaction (main transaction record)
- Order (purchase/donation details)
- InteractionItem (individual food items)
- PickupDetails (scheduling information)
- Review (feedback system)
- ScheduledPickup (detailed pickup management)
- PickupLocation (business pickup points)
- PickupTimeSlot (available time slots)
```

---

## 3. API Endpoints Specification

### 3.1 Authentication Requirements
All endpoints require authentication via JWT Bearer token:
```http
Authorization: Bearer <jwt_token>
```

### 3.2 Core Interaction Endpoints

#### 3.2.1 Create Interaction
```http
POST /api/interactions/create/
Content-Type: application/json
```
```json
{
    "type": "purchase|donation",
    "business_id": "uuid",
    "items": [
        {
            "food_listing_id": "uuid",
            "quantity": 2
        }
    ],
    "pickup_preference": {
        "date": "2025-06-26",
        "time_slot": "morning|afternoon|evening"
    }
}
```

**Response (201 Created):**
```json
{
    "interaction_id": "uuid",
    "order_id": "uuid",
    "type": "purchase",
    "status": "pending",
    "total_amount": "15.50",
    "items": [
        {
            "id": "uuid",
            "name": "Pasta Special",
            "quantity": 2,
            "price_per_item": "7.75",
            "total_price": "15.50",
            "expiry_date": "2025-06-27"
        }
    ],
    "pickup_details": {
        "scheduled_time": "2025-06-26T15:30:00Z",
        "location": "Main Counter - Restaurant ABC",
        "contact_person": "John Doe",
        "contact_number": "+27123456789"
    },
    "created_at": "2025-06-25T10:30:00Z"
}
```

#### 3.2.2 Get User Interactions
```http
GET /api/interactions/my-interactions/
Query Parameters:
- status: pending|confirmed|completed|cancelled
- type: purchase|donation
- page: 1
- page_size: 20
```

**Response (200 OK):**
```json
{
    "count": 45,
    "next": "http://api.com/interactions/my-interactions/?page=2",
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "type": "purchase",
            "status": "completed",
            "business": {
                "id": "uuid",
                "name": "Restaurant ABC",
                "logo": "https://s3.amazonaws.com/logo.jpg"
            },
            "total_amount": "15.50",
            "items_count": 2,
            "pickup_time": "2025-06-25T15:30:00Z",
            "created_at": "2025-06-25T10:30:00Z",
            "can_review": true,
            "has_review": false
        }
    ]
}
```

#### 3.2.3 Get Interaction Details
```http
GET /api/interactions/{interaction_id}/
```

**Response (200 OK):**
```json
{
    "id": "uuid",
    "type": "purchase",
    "status": "completed",
    "business": {
        "id": "uuid",
        "name": "Restaurant ABC",
        "address": "123 Main St, Pretoria",
        "contact_email": "contact@restaurantabc.com",
        "contact_phone": "+27123456789"
    },
    "order": {
        "id": "uuid",
        "total_amount": "15.50",
        "created_at": "2025-06-25T10:30:00Z"
    },
    "items": [
        {
            "id": "uuid",
            "name": "Pasta Special",
            "quantity": 2,
            "price_per_item": "7.75",
            "total_price": "15.50",
            "expiry_date": "2025-06-27",
            "image_url": "https://s3.amazonaws.com/pasta.jpg"
        }
    ],
    "pickup_details": {
        "scheduled_time": "2025-06-25T15:30:00Z",
        "actual_time": "2025-06-25T15:35:00Z",
        "location": "Main Counter - Restaurant ABC",
        "contact_person": "John Doe",
        "contact_number": "+27123456789",
        "is_completed": true,
        "notes": "Customer arrived on time"
    },
    "status_history": [
        {
            "status": "completed",
            "changed_at": "2025-06-25T15:35:00Z",
            "notes": "Pickup successful"
        },
        {
            "status": "confirmed",
            "changed_at": "2025-06-25T12:00:00Z",
            "notes": "Ready for pickup"
        },
        {
            "status": "pending",
            "changed_at": "2025-06-25T10:30:00Z",
            "notes": "Order created"
        }
    ],
    "can_review": true,
    "has_review": false
}
```

#### 3.2.4 Update Interaction Status
```http
PATCH /api/interactions/{interaction_id}/status/
Content-Type: application/json

{
    "status": "confirmed|completed|cancelled",
    "notes": "Order ready for pickup"
}
```

**Response (200 OK):**
```json
{
    "interaction_id": "uuid",
    "old_status": "pending",
    "new_status": "confirmed",
    "updated_at": "2025-06-25T12:00:00Z",
    "notes": "Order ready for pickup"
}
```

### 3.3 Business Interaction Endpoints

#### 3.3.1 Get Business Interactions
```http
GET /api/business/interactions/
Query Parameters:
- status: pending|confirmed|completed|cancelled
- type: purchase|donation
- date_from: 2025-06-01
- date_to: 2025-06-30
- page: 1
```

**Response (200 OK):**
```json
{
    "count": 123,
    "results": [
        {
            "id": "uuid",
            "type": "purchase",
            "status": "pending",
            "customer": {
                "name": "Jane Smith",
                "email": "jane@example.com",
                "user_type": "customer"
            },
            "total_amount": "25.00",
            "items_count": 3,
            "pickup_time": "2025-06-26T14:30:00Z",
            "created_at": "2025-06-25T11:15:00Z"
        }
    ]
}
```

#### 3.3.2 Confirm Interaction Ready
```http
POST /api/business/interactions/{interaction_id}/confirm/
Content-Type: application/json

{
    "estimated_ready_time": "2025-06-26T14:00:00Z",
    "notes": "Order packaged and ready"
}
```

### 3.4 Pickup Scheduling Endpoints

#### 3.4.1 Get Available Time Slots
```http
GET /api/pickup/available-slots/
Query Parameters:
- business_id: uuid
- date: 2025-06-26
- food_listing_id: uuid (optional)
```

**Response (200 OK):**
```json
{
    "date": "2025-06-26",
    "business_id": "uuid",
    "slots": [
        {
            "id": "uuid",
            "start_time": "12:00",
            "end_time": "12:30",
            "available_spots": 3,
            "total_capacity": 5,
            "location": {
                "id": "uuid",
                "name": "Main Counter",
                "address": "123 Main St, Pretoria"
            }
        }
    ]
}
```

#### 3.4.2 Schedule Pickup
```http
POST /api/pickup/schedule/
Content-Type: application/json

{
    "interaction_id": "uuid",
    "time_slot_id": "uuid",
    "customer_notes": "Will arrive 5 minutes early"
}
```

**Response (201 Created):**
```json
{
    "pickup_id": "uuid",
    "confirmation_code": "ABC123",
    "scheduled_date": "2025-06-26",
    "scheduled_time": "12:00-12:30",
    "location": {
        "name": "Main Counter",
        "address": "123 Main St, Pretoria",
        "instructions": "Enter through main entrance",
        "contact_person": "John Doe",
        "contact_phone": "+27123456789"
    },
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?data=ABC123"
}
```

### 3.5 Review System Endpoints

#### 3.5.1 Check Review Status
```http
GET /api/reviews/interaction/{interaction_id}/status/
```

**Response (200 OK):**
```json
{
    "interaction_id": "uuid",
    "can_review": true,
    "has_review": false,
    "review_id": null,
    "interaction_status": "completed",
    "completed_at": "2025-06-25T15:35:00Z"
}
```

#### 3.5.2 Create Review
```http
POST /api/reviews/create/
Content-Type: application/json

{
    "interaction_id": "uuid",
    "general_rating": 5,
    "general_comment": "Great experience!",
    "food_review": "Food was fresh and delicious",
    "business_review": "Staff was very helpful",
    "review_source": "popup"
}
```

**Response (201 Created):**
```json
{
    "review_id": "uuid",
    "interaction_id": "uuid",
    "general_rating": 5,
    "status": "active",
    "created_at": "2025-06-25T16:00:00Z",
    "message": "Review submitted successfully"
}
```

#### 3.5.3 Get Business Reviews
```http
GET /api/business/reviews/
Query Parameters:
- status: active|flagged|censored
- rating: 1-5
- page: 1
```

**Response (200 OK):**
```json
{
    "count": 89,
    "average_rating": 4.2,
    "rating_distribution": {
        "5": 45,
        "4": 23,
        "3": 12,
        "2": 6,
        "1": 3
    },
    "results": [
        {
            "id": "uuid",
            "general_rating": 5,
            "general_comment": "Great experience!",
            "reviewer": {
                "name": "Jane Smith",
                "user_type": "customer"
            },
            "interaction": {
                "type": "purchase",
                "total_amount": "15.50",
                "completed_at": "2025-06-25T15:35:00Z"
            },
            "created_at": "2025-06-25T16:00:00Z"
        }
    ]
}
```

---

## 4. Error Handling

### 4.1 Standard Error Format
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

### 4.2 Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request data validation failed |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | PERMISSION_DENIED | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate review) |
| 422 | BUSINESS_RULE_VIOLATION | Business logic violation |
| 500 | INTERNAL_ERROR | Server error |

### 4.3 Specific Error Examples

#### Interaction Creation Errors
```json
{
    "error": {
        "code": "INSUFFICIENT_STOCK",
        "message": "Not enough items available",
        "details": {
            "food_listing_id": "uuid",
            "requested": 5,
            "available": 2
        }
    }
}
```

#### Review Creation Errors
```json
{
    "error": {
        "code": "REVIEW_ALREADY_EXISTS",
        "message": "A review for this interaction already exists",
        "details": {
            "interaction_id": "uuid",
            "existing_review_id": "uuid"
        }
    }
}
```

---

## 5. Business Rules & Validation

### 5.1 Interaction Creation Rules
- Users must be verified to create interactions
- Food listings must be active and available
- Requested quantity cannot exceed available stock
- Purchase interactions require payment processing
- Donation requests require NGO verification

### 5.2 Status Transition Rules
```
pending → confirmed → completed
pending → cancelled
confirmed → cancelled
```

### 5.3 Review System Rules
- Only customers and NGOs can create reviews
- Reviews only allowed for completed interactions
- One review per interaction (OneToOne constraint)
- Minimum content requirement: rating OR comment
- Rating must be 1-5 stars

### 5.4 Pickup Scheduling Rules
- Pickups can only be scheduled for confirmed interactions
- Time slots have maximum capacity limits
- No scheduling outside business operating hours
- 24-hour advance booking requirement

---

## 6. Performance Requirements

### 6.1 Response Time Targets
- Interaction creation: < 2 seconds
- List endpoints: < 500ms
- Detail endpoints: < 300ms
- Status updates: < 1 second

### 6.2 Concurrency Requirements
- Support 1000+ concurrent users
- Handle 100+ interactions per minute
- Real-time status updates via WebSocket

### 6.3 Caching Strategy
- Business profiles cached for 1 hour
- Food listings cached for 30 minutes
- Review statistics cached for 24 hours
- Redis for session management

---

## 7. Security Requirements

### 7.1 Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Token expiration: 24 hours
- Refresh token mechanism

### 7.2 Data Protection
- HTTPS only for all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection via Django's built-in security

### 7.3 Privacy Compliance
- Minimal data collection principle
- User consent for data processing
- Data retention policies
- GDPR compliance measures

---

## 8. Integration Points

### 8.1 Internal Service Dependencies
- **Authentication Service**: User profiles and permissions
- **Food Listings Service**: Product availability and pricing
- **Notifications Service**: Real-time alerts and emails
- **Payment Service**: Transaction processing
- **Analytics Service**: Business intelligence

### 8.2 External Service Dependencies
- **AWS S3**: File storage for receipts and images
- **Email Service**: Transactional emails
- **SMS Service**: Pickup reminders
- **QR Code Generator**: Pickup confirmation codes

### 8.3 WebSocket Events
```javascript
// Real-time status updates
{
    "event": "interaction_status_changed",
    "data": {
        "interaction_id": "uuid",
        "old_status": "pending",
        "new_status": "confirmed",
        "timestamp": "2025-06-25T12:00:00Z"
    }
}

// New review notification
{
    "event": "review_received",
    "data": {
        "business_id": "uuid",
        "review_id": "uuid",
        "rating": 5,
        "timestamp": "2025-06-25T16:00:00Z"
    }
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Model validation and business logic
- Serializer data transformation
- Permission classes
- Utility functions

### 9.2 Integration Tests
- API endpoint functionality
- Database transactions
- Service integration
- Error handling

### 9.3 Load Testing
- Concurrent user scenarios
- Peak traffic simulation
- Database performance under load
- Cache effectiveness

### 9.4 Test Coverage Requirements
- Minimum 90% code coverage
- 100% coverage for critical paths
- Automated testing in CI/CD pipeline

---

## 10. Deployment & Operations

### 10.1 Environment Configuration
```python
# Production Settings
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': 'rds-production.amazonaws.com',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'AUTOCOMMIT': True,
        }
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://elasticache.amazonaws.com:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### 10.2 Monitoring & Logging
- Application performance monitoring (APM)
- Database query monitoring
- Error tracking and alerting
- Business metrics dashboards

### 10.3 Scaling Considerations
- Horizontal scaling with load balancers
- Database read replicas
- Redis clustering for cache
- CDN for static assets

---

## 11. Future Enhancements

### 11.1 Planned Features
- **AI-Powered Matching**: Smart recommendations for food selection
- **Blockchain Integration**: SaveCoin rewards and transparent transactions
- **Advanced Analytics**: Predictive modeling for demand forecasting
- **Mobile App**: Native iOS and Android applications
- **Delivery Service**: Third-party delivery integration

### 11.2 API Versioning Strategy
- Version in URL path: `/api/v1/interactions/`
- Backward compatibility for 2 major versions
- Deprecation notices 6 months in advance
- Migration guides for version upgrades

---

## 12. Support & Maintenance

### 12.1 Documentation
- API documentation via Swagger/OpenAPI
- Development setup guides
- Troubleshooting documentation
- Business process documentation

---

## 13. Appendix

### 13.1 Glossary
- **Interaction**: Any transaction between user and business (purchase/donation)
- **Pickup**: Scheduled collection of food items
- **Review**: Post-interaction feedback and rating
- **Time Slot**: Available pickup time window
- **Business**: Food provider (restaurant, grocery store, etc.)

---

**Document Version**: 1.0  
**Last Updated**: June 25, 2025  
**Next Review**: July 25, 2025