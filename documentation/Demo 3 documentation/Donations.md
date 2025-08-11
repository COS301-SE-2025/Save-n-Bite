
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