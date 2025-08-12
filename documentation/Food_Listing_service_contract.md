# Food Listings Service Contract

## Overview
RESTful API service for managing food listings in the Save n Bite platform. Enables food providers to create and manage surplus food listings, and allows customers to discover and browse available food items.

**Protocol:** REST API  
**Data Format:** JSON  
**Base URL:** `https://127.0.0.1:8000/api`  
**Authentication:** JWT Bearer Token  

---

## Service Architecture

### Communication Protocol
- **Type:** Synchronous HTTP REST API
- **Transport:** HTTPS
- **Content-Type:** `application/json`
- **Authentication:** JWT tokens via `Authorization: Bearer <token>` header
- **Timeout:** 30 seconds for standard operations

### Error Handling
All error responses follow a consistent format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      {
        "field": "field_name",
        "message": "Field-specific error message"
      }
    ]
  }
}
```

---

## Provider Endpoints
*Requires provider authentication and verification*

### 1. Get Provider's Listings
**GET** `/api/provider/listings/`

Retrieves all food listings for the authenticated provider with business insights.

**Headers:**
```
Authorization: Bearer <provider_jwt_token>
```

**Response (200 - Success):**
```json
{
  "listings": [
    {
      "id": "06426c4f-4adc-4fea-9000-585457559ca1",
      "name": "Fresh Sandwiches",
      "description": "Assorted sandwiches from lunch service",
      "food_type": "ready_to_eat",
      "original_price": 8.99,
      "discounted_price": 3.99,
      "savings": 5.00,
      "discount_percentage": 56,
      "quantity": 15,
      "quantity_available": 15,
      "expiry_date": "2025-01-15",
      "pickup_window": "17:00-19:00",
      "imageUrl": "base64_or_url_string",
      "allergens": ["gluten", "dairy"],
      "dietary_info": ["vegetarian_options"],
      "status": "active",
      "is_available": true,
      "provider": {
        "id": "provider-uuid",
        "business_name": "Arthur's Restaurant",
        "business_address": "123 Test St, Test City",
        "logo": "/media/provider_logos/logo.png"
      },
      "created_at": "2025-01-15T17:36:58.842134+00:00",
      "updated_at": "2025-01-15T17:36:58.842134+00:00"
    }
  ],
  "totalCount": 1,
  "followerCount": 25,
  "insights": {
    "total_followers": 25,
    "active_listings": 3,
    "sold_out_listings": 1
  }
}
```

---

### 2. Create Food Listing
**POST** `/api/provider/listings/create/`

Creates a new food listing for verified providers.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <provider_jwt_token>
```

**Request Body:**
```json
{
  "name": "Fresh Sandwiches",
  "description": "Assorted sandwiches from lunch service",
  "food_type": "ready_to_eat",
  "original_price": 8.99,
  "discounted_price": 3.99,
  "quantity": 15,
  "expiry_date": "2025-01-15",
  "pickup_window": "17:00-19:00",
  "imageUrl": "base64_encoded_image_or_url",
  "allergens": ["gluten", "dairy"],
  "dietary_info": ["vegetarian_options"]
}
```

**Request Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | Max 255 characters |
| description | string | Yes | Non-empty text |
| food_type | string | Yes | One of: `ready_to_eat`, `ingredients`, `baked_goods` |
| original_price | decimal | Yes | Positive number, max 10 digits |
| discounted_price | decimal | Yes | Positive number ≤ original_price |
| quantity | integer | Yes | Positive integer |
| expiry_date | string | Yes | YYYY-MM-DD format, future date |
| pickup_window | string | Yes | HH:MM-HH:MM format |
| imageUrl | string | No | Base64 encoded image or URL |
| allergens | array | No | List of allergen strings |
| dietary_info | array | No | List of dietary info strings |

**Response (201 - Success):**
```json
{
  "message": "Listing created successfully",
  "listing": {
    "id": "06426c4f-4adc-4fea-9000-585457559ca1",
    "name": "Fresh Sandwiches",
    "quantity": 15,
    "price": 3.99,
    "status": "active",
    "createdAt": "2025-01-15T17:36:58.842134+00:00"
  }
}
```

---

### 3. Update Food Listing
**PUT** `/api/provider/listings/{listing_id}/`

Updates an existing food listing owned by the authenticated provider.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <provider_jwt_token>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| listing_id | UUID | Unique identifier of the listing |

**Request Body:** *(All fields optional - partial updates supported)*
```json
{
  "name": "Updated Sandwich Pack",
  "description": "Updated description",
  "quantity": 10,
  "discounted_price": 2.99,
  "status": "active"
}
```

**Response (200 - Success):**
```json
{
  "message": "Listing updated successfully",
  "listing": {
    "id": "06426c4f-4adc-4fea-9000-585457559ca1",
    "name": "Updated Sandwich Pack",
    "updatedAt": "2025-01-15T18:45:12.123456+00:00"
  }
}
```

---

## Customer Endpoints
*Public access - no authentication required*

### 4. Browse Food Listings
**GET** `/api/food-listings/`

Browse available food listings with filtering, searching, and pagination.

**Query Parameters:** *(All optional)*
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 10, max: 50) |
| search | string | Search in name, description, business name |
| store | string | Filter by business name |
| priceMin | decimal | Minimum price filter |
| priceMax | decimal | Maximum price filter |
| type | string | `ready_to_eat`, `baked_goods`, `ingredients`, `discount`, `donation` |
| area | string | Filter by pickup area |
| sort | string | Sort order (default: `-created_at`) |

**Example Request:**
```
GET /api/food-listings/?page=1&limit=10&type=ready_to_eat&priceMax=5.00&search=pizza
```

**Response (200 - Success):**
```json
{
  "listings": [
    {
      "id": "06426c4f-4adc-4fea-9000-585457559ca1",
      "name": "Fresh Sandwiches",
      "description": "Assorted sandwiches from lunch service",
      "food_type": "ready_to_eat",
      "original_price": 8.99,
      "discounted_price": 3.99,
      "savings": 5.00,
      "discount_percentage": 56,
      "quantity": 15,
      "quantity_available": 15,
      "expiry_date": "2025-01-15",
      "pickup_window": "17:00-19:00",
      "imageUrl": "base64_or_url_string",
      "allergens": ["gluten", "dairy"],
      "dietary_info": ["vegetarian_options"],
      "status": "active",
      "is_available": true,
      "provider": {
        "id": "provider-uuid",
        "business_name": "Arthur's Restaurant",
        "business_address": "123 Test St, Test City",
        "logo": "/media/provider_logos/logo.png",
        "is_following": false,
        "follower_count": 25
      },
      "created_at": "2025-01-15T17:36:58.842134+00:00",
      "updated_at": "2025-01-15T17:36:58.842134+00:00"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 28,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "availableTypes": [
      "ready_to_eat",
      "baked_goods", 
      "ingredients"
    ],
    "priceRange": {
      "min": 0.99,
      "max": 25.00
    },
    "availableAreas": [
      "downtown",
      "suburbs",
      "north_end"
    ]
  }
}
```

---

### 5. Get Food Listing Details
**GET** `/api/food-listings/{listing_id}/`

Retrieve detailed information about a specific food listing.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| listing_id | UUID | Unique identifier of the listing |

**Response (200 - Success):**
```json
{
  "listing": {
    "id": "06426c4f-4adc-4fea-9000-585457559ca1",
    "name": "Fresh Sandwiches",
    "description": "Assorted sandwiches from lunch service",
    "food_type": "ready_to_eat",
    "original_price": 8.99,
    "discounted_price": 3.99,
    "savings": 5.00,
    "discount_percentage": 56,
    "quantity": 15,
    "quantity_available": 15,
    "expiry_date": "2025-01-15",
    "pickup_window": "17:00-19:00",
    "imageUrl": "base64_or_url_string",
    "images": [
      "base64_image_1",
      "base64_image_2"
    ],
    "allergens": ["gluten", "dairy"],
    "dietary_info": ["vegetarian_options"],
    "status": "active",
    "is_available": true,
    "provider": {
      "id": "provider-uuid",
      "business_name": "Arthur's Restaurant",
      "business_address": "123 Test St, Test City",
      "logo": "/media/provider_logos/logo.png",
      "is_following": false,
      "follower_count": 25
    },
    "created_at": "2025-01-15T17:36:58.842134+00:00",
    "updated_at": "2025-01-15T17:36:58.842134+00:00"
  }
}
```

---

## Data Models & Enums

### Food Types
- `ready_to_eat` - Prepared meals ready for consumption
- `ingredients` - Raw ingredients for cooking
- `baked_goods` - Bread, pastries, cakes, etc.

### Listing Status
- `active` - Available for purchase/pickup
- `sold_out` - All quantities sold
- `expired` - Past expiry date
- `inactive` - Temporarily unavailable
- `removed` - Removed by admin
- `flagged` - Flagged for admin review

### Filter Types (Special)
- `discount` - Items with original_price > discounted_price
- `donation` - Items with discounted_price = 0

### Common Allergens
`["gluten", "dairy", "nuts", "shellfish", "eggs", "soy", "fish"]`

### Dietary Information
`["vegetarian_options", "vegan_options", "gluten_free", "dairy_free", "low_sodium", "organic"]`

---

## Error Responses

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `CREATION_ERROR` | Failed to create listing |
| 400 | `UPDATE_ERROR` | Failed to update listing |
| 401 | `AUTHENTICATION_REQUIRED` | JWT token required |
| 403 | `FORBIDDEN` | User type not authorized |
| 403 | `VERIFICATION_REQUIRED` | Provider verification required |
| 404 | `NOT_FOUND` | Listing not found |

**Example Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "expiry_date",
        "message": "Expiry date must be in the future"
      },
      {
        "field": "quantity",
        "message": "Quantity must be a positive integer"
      }
    ]
  }
}
```

---

## Integration Dependencies

### Authentication Service
- **Dependency:** JWT tokens from authentication service
- **Required Claims:** `user_type`, `user_id`
- **Provider Verification:** Must have verified `provider_profile`

### Notifications Service
- **Trigger:** New listing creation
- **Method:** Signal-based integration
- **Payload:** Listing data for follower notifications

### Business Follow Service
- **Integration:** Follower count and follow status
- **Models:** `BusinessFollower` model dependency

---

## Rate Limiting & Performance

### Request Limits
- **Provider Endpoints:** 100 requests/hour per provider
- **Public Endpoints:** 1000 requests/hour per IP
- **Listing Creation:** 50 listings/day per provider

### Response Times (SLA)
- **Browse Listings:** < 200ms (95th percentile)
- **Listing Details:** < 100ms (95th percentile) 
- **Create/Update:** < 500ms (95th percentile)

---

## Versioning & Compatibility

**Current Version:** v1  
**Versioning Strategy:** URL-based (`/api/v1/`)  
**Backward Compatibility:** Maintained for 6 months after version deprecation  
**Breaking Changes:** Communicated 30 days in advance

---

## Testing & Validation

### Contract Testing
- **Provider Endpoints:** Requires verified provider account
- **Public Endpoints:** Accessible without authentication
- **Data Validation:** All request/response schemas validated
- **Error Scenarios:** All error codes tested and documented

### Health Checks
- **Endpoint:** `/api/food-listings/health/` (if implemented)
- **Response Time:** < 50ms
- **Dependencies:** Database connectivity, cache availability