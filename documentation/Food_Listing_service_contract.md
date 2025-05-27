# Food Listings Service Contract

## Overview
API for managing food listings, allowing providers to create, update, and manage their food offerings, and customers to browse available listings.

**Base URL:** `https://127.0.0.1:8000`

---

## Provider Endpoints
*Requires provider authentication*

### 1. Create Food Listing
**POST** `/api/provider/listings/create/`

Creates a new food listing for a registered and logged-in business provider.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_PROVIDER_TOKEN_HERE
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
  "allergens": ["gluten", "dairy"],
  "dietary_info": ["vegetarian_options"]
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Name of the food item |
| description | string | Yes | Detailed description of the food |
| food_type | string | Yes | Type of food (e.g., "ready_to_eat", "baked_goods") |
| original_price | number | Yes | Original price of the item |
| discounted_price | number | Yes | Discounted selling price |
| quantity | integer | Yes | Number of items available |
| expiry_date | string | Yes | Expiry date (YYYY-MM-DD format) |
| pickup_window | string | Yes | Time window for pickup (HH:MM-HH:MM format) |
| allergens | array | No | List of allergens present |
| dietary_info | array | No | Dietary information (e.g., vegetarian, vegan options) |

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
    "createdAt": "2025-05-26T17:36:58.842134+00:00"
  }
}
```

---

### 2. Get Provider's Listings
**GET** `/api/provider/listings/`

Retrieves all existing food listings for the authenticated business provider.

**Headers:**
```
Authorization: Bearer YOUR_PROVIDER_TOKEN_HERE
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
      "quantity": 15,
      "expiry_date": "2025-01-15",
      "pickup_window": "17:00-19:00",
      "allergens": ["gluten", "dairy"],
      "dietary_info": ["vegetarian_options"],
      "status": "active",
      "createdAt": "2025-05-26T17:36:58.842134+00:00",
      "updatedAt": "2025-05-26T17:36:58.842134+00:00"
    }
  ],
  "count": 1
}
```

---

### 3. Update Food Listing
**PUT** `/api/provider/listings/{LISTING_ID}/`

Updates an existing food listing for the authenticated provider.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_PROVIDER_TOKEN_HERE
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| LISTING_ID | UUID | The unique identifier of the listing to update |

**Request Body:** *(All fields are optional - only include fields you want to update)*
```json
{
  "name": "Updated Sandwich Pack",
  "description": "Updated description with more variety",
  "quantity": 10,
  "discounted_price": 2.99
}
```

**Response (200 - Success):**
```json
{
  "message": "Listing updated successfully",
  "listing": {
    "id": "06426c4f-4adc-4fea-9000-585457559ca1",
    "name": "Updated Sandwich Pack",
    "updatedAt": "2025-05-26T17:38:59.544705+00:00"
  }
}
```

---

## Customer Endpoints
*Public access - no authentication required*

### 4. Get All Food Listings
**GET** `/api/food-listings/`

Returns all available food listings from all food providers with pagination and filtering information.

**Query Parameters:** *(Optional)*
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number for pagination (default: 1) |
| limit | integer | Number of items per page (default: 20) |
| food_type | string | Filter by food type |
| min_price | number | Minimum price filter |
| max_price | number | Maximum price filter |
| area | string | Filter by pickup area |

**Example Request:**
```
GET /api/food-listings/?page=1&limit=10&food_type=ready_to_eat&max_price=5.00
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
      "quantity": 15,
      "expiry_date": "2025-01-15",
      "pickup_window": "17:00-19:00",
      "allergens": ["gluten", "dairy"],
      "dietary_info": ["vegetarian_options"],
      "provider": {
        "id": "provider-uuid",
        "business_name": "Arthur's Restaurant",
        "area": "downtown"
      },
      "status": "active",
      "createdAt": "2025-05-26T17:36:58.842134+00:00"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 12,
    "hasNext": false,
    "hasPrev": false
  },
  "filters": {
    "availableTypes": [
      "baked_goods",
      "ready_to_eat",
      "prepared_meals",
      "beverages"
    ],
    "priceRange": {
      "min": 2.99,
      "max": 7.50
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

### 5. Get Specific Food Listing
**GET** `/api/food-listings/{listing_id}/`

Retrieves detailed information about a specific food listing.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| listing_id | UUID | The unique identifier of the listing |

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
    "quantity": 15,
    "expiry_date": "2025-01-15",
    "pickup_window": "17:00-19:00",
    "allergens": ["gluten", "dairy"],
    "dietary_info": ["vegetarian_options"],
    "provider": {
      "id": "provider-uuid",
      "business_name": "Arthur's Restaurant",
      "business_contact": "+1234567890",
      "business_address": {
        "street": "456 Food St",
        "city": "Downtown",
        "province": "Gauteng",
        "postal_code": "2000"
      },
      "area": "downtown",
      "logo": "/media/provider_logos/provider_logo.png"
    },
    "images": [
      "/media/listings/listing_image_1.jpg",
      "/media/listings/listing_image_2.jpg"
    ],
    "status": "active",
    "createdAt": "2025-05-26T17:36:58.842134+00:00",
    "updatedAt": "2025-05-26T17:36:58.842134+00:00"
  }
}
```

---

## Data Types & Enums

### Food Types
- `ready_to_eat` - Prepared meals ready for consumption
- `baked_goods` - Bread, pastries, cakes, etc.
- `prepared_meals` - Cooked meals requiring minimal preparation
- `beverages` - Drinks and liquid refreshments

### Listing Status
- `active` - Available for purchase
- `inactive` - Temporarily unavailable
- `sold_out` - All quantities sold
- `expired` - Past expiry date

### Common Allergens
- `gluten`
- `dairy`
- `nuts`
- `shellfish`
- `eggs`
- `soy`
- `fish`

### Dietary Information
- `vegetarian_options`
- `vegan_options`
- `gluten_free`
- `dairy_free`
- `low_sodium`
- `organic`

---

## Error Responses

| Status Code | Description | Example Response |
|-------------|-------------|------------------|
| 400 | Bad Request | `{"error": "Invalid price value"}` |
| 401 | Unauthorized | `{"error": "Authentication required"}` |
| 403 | Forbidden | `{"error": "Provider verification required"}` |
| 404 | Not Found | `{"error": "Listing not found"}` |
| 422 | Validation Error | `{"error": "Expiry date must be in the future", "field": "expiry_date"}` |

---

## Authentication

Provider endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-provider-jwt-token>
```

Customer endpoints (browsing listings) are publicly accessible and do not require authentication.

---

## Notes

- All timestamps are in ISO 8601 format with UTC timezone
- Prices are in the local currency (assume your local currency)
- Images are stored as relative URLs from the media server
- Pickup windows use 24-hour format (HH:MM-HH:MM)
- Expiry dates are in YYYY-MM-DD format
- UUIDs are used for all entity identifiers
