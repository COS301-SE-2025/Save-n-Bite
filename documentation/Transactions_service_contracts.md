# Transactions Service Contract

## Overview
API for managing customer shopping cart operations, checkout process, and order management. All endpoints require customer authentication.

**Base URL:** `https://127.0.0.1:8000`

---

## Cart Management

### 1. Get Cart Contents
**GET** `/cart/`

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

### 2. Add Item to Cart
**POST** `/cart/add/`

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

**Response (201 - Success):**
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

### 3. Remove Item from Cart
**POST** `/cart/remove/`

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

### 4. Checkout Cart
**POST** `/cart/checkout/`

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

**Response (201 - Success):**
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

### 5. Get Specific Order
**GET** `/cart/orders/{ORDER_ID}/`

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

### 6. Get All Customer Orders
**GET** `/cart/orders/`

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
GET /cart/orders/?page=1&limit=10&status=completed&date_from=2025-01-01
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

---

## Notes

- All timestamps are in ISO 8601 format with UTC timezone
- Pickup codes are case-insensitive
- Cart contents are preserved for 7 days of inactivity
- Orders are automatically marked as expired 1 hour after pickup window ends
- Refunds are processed automatically for expired orders
- Special instructions have a 500-character limit
