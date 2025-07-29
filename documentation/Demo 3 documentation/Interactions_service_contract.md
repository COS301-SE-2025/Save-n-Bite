# Save n Bite - Interactions App Service Contract

**Project:** Save n Bite  
**App:** Interactions  
**Version:** 2.0  
**Date:** July 15, 2025  
**Team:** Secure Web & Mobile Guild  

---

## 1. Overview

The Interactions app is the core transactional component of the Save n Bite platform, managing all food purchases and donations. It serves as the central hub connecting food providers with customers and Organisations through secure, tracked interactions.

### 1.1 Purpose
- Manage food purchases and donation requests
- Track interaction lifecycle from creation to completion

### 1.2 Key Features
- **Transaction Management**: Purchase and donation workflows
- **Real-time Updates**: Status tracking

---

## 2. Architecture & Technology Stack

### 2.1 Backend Architecture
- **Framework**: Django 5.2.3 with Django REST Framework
- **Database**: PostgreSQL (primary), Redis (caching & real-time)
- **Authentication**: JWT tokens with role-based permissions
- **File Storage**: AWS S3 for receipts and documents
- **Async Processing**: Celery for background tasks

### 2.2 Core Dependencies
```python
# Django & DRF
Django>=5.2.3
djangorestframework>=3.16.0
django-cors-headers>=4.7.0

# Database & Caching
psycopg2-binary>=2.9.10
redis>=6.2.0
django-redis>=6.0.0

# Authentication & Security
PyJWT>=2.9.0

# Task Processing
celery>=5.5.3

# Utilities
python-dateutil>=2.9.0
```

### 2.3 Database Schema
```sql
-- Core Models
- Interaction (main transaction record)
- Cart (main cart record)
- Cart Item (individual food tems in cart)
- Order (purchase/donation details)
- Payment (order payment system)
- InteractionItem (individual food items)
- InteractionStatusHistory (transaction history management)
```

---

## 3. API Endpoints Specification

# Transactions Service Contract

## Overview
API for managing customer shopping cart operations, checkout process, and order management. All endpoints require customer authentication.

**Base URL:** `https://127.0.0.1:8000/cart/`

---

## Cart Management

### 3.1 Get Cart Contents
**GET** 

Fetches all food listings in a customer's cart.

**Headers:**
```
Authorization: Bearer YOUR_CUSTOMER_TOKEN_HERE
```

**Response (200 - Success):**
```json
{
  "cartItems": [
    {
      "id": "6707ca74-e67b-4761-b323-1da852e1f444",
      "listingId": "06426c4f-4adc-4fea-9000-585457559ca1",
      "quantity": 2,
      "addedAt": "2025-05-26T17:54:34.343402Z",
      "listing": {
        "id": "06426c4f-4adc-4fea-9000-585457559ca1",
        "name": "Fresh Sandwiches",
        "description": "Assorted sandwiches from lunch service",
        "discounted_price": 2.99,
        "original_price": 8.99,
        "expiry_date": "2025-01-15",
        "pickup_window": "17:00-19:00",
        "provider": {
          "id": "provider-uuid",
          "business_name": "Arthur's Restaurant"
        },
        "image_url": "/media/listings/sandwich.jpg"
      },
      "subtotal": 5.98
    }
  ],
  "cartSummary": {
    "totalItems": 2,
    "totalAmount": 5.98,
    "totalSavings": 12.00,
    "itemCount": 1
  }
}
```

---

### 3.2 Add Item to Cart
**POST** `/add/`

Adds a food listing to a customer's cart.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_CUSTOMER_TOKEN_HERE
```

**Request Body:**
```json
{
  "listingId": "YOUR_LISTING_UUID_HERE",
  "quantity": 2
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| listingId | UUID | Yes | The unique identifier of the food listing |
| quantity | integer | Yes | Number of items to add (min: 1, max: available quantity) |

**Response (201 - Created):**
```json
{
  "message": "Item added to cart successfully",
  "cartItem": {
    "id": "6707ca74-e67b-4761-b323-1da852e1f444",
    "listingId": "06426c4f-4adc-4fea-9000-585457559ca1",
    "quantity": 2,
    "addedAt": "2025-05-26T17:54:34.343402Z"
  },
  "cartSummary": {
    "totalItems": 2,
    "totalAmount": 5.98
  }
}
```

---

### 3.3 Remove Item from Cart
**POST** `/remove/`

Removes an item from a customer's cart.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_CUSTOMER_TOKEN_HERE
```

**Request Body:**
```json
{
  "cartItemId": "CART_ITEM_UUID_HERE"
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cartItemId | UUID | Yes | The unique identifier of the cart item to remove |

**Response (200 - Success):**
```json
{
  "message": "Item removed from cart successfully",
  "cartSummary": {
    "totalItems": 0,
    "totalAmount": 0
  }
}
```

---

## Checkout & Payment

### 3.4 Checkout Cart
**POST** `/checkout/`

Processes customer checkout and creates orders grouped by provider.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_CUSTOMER_TOKEN_HERE
```

**Request Body:**
```json
{
  "paymentMethod": "card",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryDate": "12/25",
    "cvv": "123",
    "cardholderName": "John Doe"
  },
  "specialInstructions": "Please call when ready for pickup"
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| paymentMethod | string | Yes | Payment method ("card", "wallet", "cash_on_pickup") |
| paymentDetails | object | Conditional | Required for card/wallet payments |
| specialInstructions | string | No | Special pickup or preparation instructions |

**Payment Details (for card method):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cardNumber | string | Yes | Credit/debit card number |
| expiryDate | string | Yes | Card expiry date (MM/YY format) |
| cvv | string | Yes | Card security code |
| cardholderName | string | Yes | Name on the card |

**Response (201 - Created):**
```json
{
  "message": "Checkout successful",
  "orders": [
    {
      "id": "08cf03b8-202e-4dea-8fab-3bdd911d57e3",
      "providerId": "5",
      "providerName": "Tanjiro's Restaurant",
      "items": [
        {
          "id": "5f49f7ae-6b64-4292-9002-c2b4cde7cb06",
          "name": "Artisan Bread Loaves",
          "quantity": 2,
          "price_per_item": "7.50",
          "total_price": "15.00",
          "expiry_date": "2025-01-16",
          "image_url": "/media/listings/bread.jpg"
        }
      ],
      "totalAmount": "15.00",
      "status": "pending",
      "pickupWindow": "16:00-18:00",
      "pickupCode": "C452B2",
      "createdAt": "2025-05-26T17:59:33.644936Z",
      "providerContact": "+1234567890",
      "providerAddress": {
        "street": "123 Food Street",
        "city": "Downtown",
        "province": "Gauteng",
        "postal_code": "2000"
      }
    }
  ],
  "summary": {
    "totalAmount": "15.00",
    "totalSavings": "15.00",
    "paymentStatus": "completed",
    "transactionId": "txn_abc123456789"
  }
}
```

---

## Order Management

### 3.5 Get Specific Order
**GET** `/orders/{ORDER_ID}/`

Retrieves detailed information about a specific customer order.

**Headers:**
```
Authorization: Bearer YOUR_CUSTOMER_TOKEN_HERE
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| ORDER_ID | UUID | The unique identifier of the order |

**Response (200 - Success):**
```json
{
  "order": {
    "id": "08cf03b8-202e-4dea-8fab-3bdd911d57e3",
    "providerId": "5",
    "providerName": "Tanjiro's Restaurant",
    "providerContact": "+1234567890",
    "providerAddress": {
      "street": "123 Food Street",
      "city": "Downtown",
      "province": "Gauteng",
      "postal_code": "2000"
    },
    "items": [
      {
        "id": "5f49f7ae-6b64-4292-9002-c2b4cde7cb06",
        "name": "Artisan Bread Loaves",
        "description": "Freshly baked artisan bread",
        "quantity": 2,
        "price_per_item": "7.50",
        "total_price": "15.00",
        "original_price": "12.00",
        "expiry_date": "2025-01-16",
        "image_url": "/media/listings/bread.jpg",
        "allergens": ["gluten"],
        "dietary_info": ["organic"]
      }
    ],
    "totalAmount": "15.00",
    "totalSavings": "9.00",
    "status": "pending",
    "pickupWindow": "16:00-18:00",
    "pickupCode": "C452B2",
    "specialInstructions": "Please call when ready for pickup",
    "paymentMethod": "card",
    "paymentStatus": "completed",
    "transactionId": "txn_abc123456789",
    "createdAt": "2025-05-26T17:59:33.644936Z",
    "updatedAt": "2025-05-26T17:59:33.644936Z",
    "estimatedReadyTime": "2025-05-26T18:30:00Z"
  }
}
```

---

### 3.6 Get All Customer Orders
**GET** `/orders/`

Retrieves all orders for the authenticated customer with pagination and filtering options.

**Headers:**
```
Authorization: Bearer YOUR_CUSTOMER_TOKEN_HERE
```

**Query Parameters:** *(Optional)*
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number for pagination (default: 1) |
| limit | integer | Number of orders per page (default: 20) |
| status | string | Filter by order status |
| date_from | string | Filter orders from this date (YYYY-MM-DD) |
| date_to | string | Filter orders until this date (YYYY-MM-DD) |
| provider_id | UUID | Filter by specific provider |

**Example Request:**
```
GET /orders/?page=1&limit=10&status=completed&date_from=2025-01-01
```

**Response (200 - Success):**
```json
{
  "orders": [
    {
      "id": "08cf03b8-202e-4dea-8fab-3bdd911d57e3",
      "providerId": "5",
      "providerName": "Tanjiro's Restaurant",
      "totalAmount": "15.00",
      "totalSavings": "9.00",
      "status": "completed",
      "pickupWindow": "16:00-18:00",
      "pickupCode": "C452B2",
      "itemCount": 1,
      "createdAt": "2025-05-26T17:59:33.644936Z",
      "completedAt": "2025-05-26T18:45:00Z"
    },
    {
      "id": "another-order-uuid",
      "providerId": "3",
      "providerName": "Arthur's Restaurant",
      "totalAmount": "8.50",
      "totalSavings": "4.25",
      "status": "ready_for_pickup",
      "pickupWindow": "17:00-19:00",
      "pickupCode": "A123B4",
      "itemCount": 2,
      "createdAt": "2025-05-25T15:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalOrders": 2,
    "hasNext": false,
    "hasPrev": false
  },
  "summary": {
    "totalLifetimeOrders": 15,
    "totalLifetimeSpent": "234.50",
    "totalLifetimeSavings": "156.75"
  }
}
```

---

## Donation Management

### 3.7 Request a donation
**POST** `/donation/request/`

Allows NGOs to request food donations from providers.

**Headers:**
```
Authorization: Bearer YOUR_NGO_TOKEN_HERE
```

**Resquest body:**
```json
{
  "listingId": "fd8a9d88-75c7-4b82-8c6d-137b5e098fa9",
  "quantity": 2,
  "specialInstructions": "Please provide packaging",
  "motivationMessage": "Feeding 50 children at our shelter",
  "verificationDocuments": [
    "https://example.org/docs/certificate.pdf"
  ]
}
```

**Request Paramters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| listingId | UUID | Yes | Food listing identifier |
| quantity | integer | Yes | Requested items (min: 1) |
| specialInstructions | string | No | Pickup instructions |
| motivationMessage | string | No | NGO's purpose for donation |
| verificationDocuments | array | No | URLs to NGO verification docs |

**Response (201 - Created):**
```json

{
  "message": "Donation request submitted successfully",
  "interaction_id": "bfaa0d1c-ecf6-49df-8179-35c4f178cca9",
  "requested_quantity": 2,
  "available_quantity": 60
}

```

---

### 3.8 Accept a donation
**POST** `/donation/{interaction_id}/accept/`

Allows providers to accept pending donation requests.

**Headers:**
```
Authorization: Bearer YOUR_NGO_TOKEN_HERE
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| interaction_id | UUID | The unique identifier of the interaction |

**Response (200 - Success):**
```json

{
  "message": "Donation accepted and marked as ready for pickup"
}

```

---

### 3.9 Reject a donation
**POST** `/donation/{interaction_id}/reject/`

Allows providers to reject pending donation requests.

**Headers:**
```
Authorization: Bearer YOUR_NGO_TOKEN_HERE
```

**Resquest body:**
```json

{
  "rejectionReason": "Currently overwhelmed with requests"
}

```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| interaction_id | UUID | The unique identifier of the interaction |

**Response (200 - Success):**
```json

{
  "message": "Donation request rejected"
}

```
## Data Types & Enums

### Payment Methods
- `card` - Credit/debit card payment
- `wallet` - Digital wallet (PayPal, Apple Pay, etc.)
- `cash_on_pickup` - Pay with cash during pickup

### Order Status
- `pending` - Order placed, awaiting provider confirmation
- `confirmed` - Provider confirmed the order
- `preparing` - Food is being prepared
- `ready_for_pickup` - Order ready for customer pickup
- `completed` - Order successfully picked up
- `cancelled` - Order cancelled by customer or provider
- `expired` - Order not picked up within the time window

### Payment Status
- `pending` - Payment processing
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

### Donation Eum Values:
# InteractionType
- `donation` - Donation
# Status Additions
- `rejected` - Rejected

### Donation Status Transitions
- PENDING → READY_FOR_PICKUP (acceptance)
- PENDING → REJECTED (rejection)
- READY_FOR_PICKUP → COMPLETED (pickup verification)



---

## Error Responses

| Status Code | Description | Example Response |
|-------------|-------------|------------------|
| 400 | Bad Request | `{"error": "Invalid quantity value"}` |
| 401 | Unauthorized | `{"error": "Customer authentication required"}` |
| 404 | Not Found | `{"error": "Cart item not found"}` |
| 409 | Conflict | `{"error": "Item no longer available"}` |
| 422 | Validation Error | `{"error": "Insufficient quantity available", "availableQuantity": 3}` |
| 402 | Payment Required | `{"error": "Payment failed", "details": "Insufficient funds"}` |

---

## Business Rules

### Cart Operations
- **Maximum cart items**: 50 items total
- **Item availability**: Items are reserved for 30 minutes after adding to cart
- **Quantity limits**: Cannot exceed available quantity for each listing
- **Expiry validation**: Cannot add expired items to cart

### Checkout Process
- **Order grouping**: Items are grouped by provider into separate orders
- **Payment processing**: All orders must be paid together in a single transaction
- **Pickup codes**: Each order gets a unique 6-character alphanumeric pickup code
- **Order expiry**: Orders expire if not picked up within the specified window

### Pricing
- **Savings calculation**: Based on difference between original and discounted prices
- **Currency**: All amounts in local currency with 2 decimal places
- **Taxes**: Prices are inclusive of applicable taxes

### Donations

#### Eligibility Rules:
- **User types**: Only users with user_type='ngo' can request donations
- **Donation management**: Providers can only manage donations for their own listings

#### Validation Rules:
- **Rejection**: Must provide rejection reason when rejecting
- **Donation Requests**: Quantity cannot exceed available stock
---

## Authentication

All endpoints require customer JWT authentication:

```
Authorization: Bearer <your-customer-jwt-token>
```

---

## Rate Limiting

- **Cart operations**: 60 requests per minute
- **Checkout**: 5 requests per minute
- **Order viewing**: 100 requests per minute
- **Donation requests**: 10 requests per hour per NGO
- **Donation management**: 30 requests per minute per provider
---

## Notes

- All timestamps are in ISO 8601 format with UTC timezone
- Pickup codes are case-insensitive
- Cart contents are preserved for 7 days of inactivity
- Orders are automatically marked as expired 1 hour after pickup window ends
- Refunds are processed automatically for expired orders
- Special instructions have a 500-character limit

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

### 9.3 Test Coverage Requirements
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
        'HOST': 'postgres-db.postgres.database.azure.com', #stub
        'PORT': '5432',
        'NAME': 'save_n_bite_db',
        'USER': 'db_user@your-postgres-db', #stub
        'PASSWORD': 'secure_password', #stub
        'OPTIONS': {
            'sslmode': 'require',  # Enforce SSL for Azure PostgreSQL
            'MAX_CONNS': 20,
            'AUTOCOMMIT': True,
        }
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://your-redis-name.redis.cache.windows.net:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PASSWORD': 'redis_access_key',
            'SSL': True
        }
    }
}

```

---

**Document Version**: 2.0  
**Last Updated**: July 15, 2025  
**Next Review**: July 25, 2025