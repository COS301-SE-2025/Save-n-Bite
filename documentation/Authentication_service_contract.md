# Authentication Service Contract

## Overview
API for user authentication and registration supporting three user types: customers, NGOs, and business providers.

**Base URL:** `https://127.0.0.1:8000`

## Endpoints

### 1. Register Customer
**POST** `/auth/register/customer/`

Registers a new customer account.

**Request Body:**
```json
{
  "full_name": "Thomas Shelby",
  "email": "tommy@example.com",
  "password": "12tommy34"
}
```

**Response (201 - Success):**
```json
{
  "message": "Customer registered successfully",
  "user": {
    "id": "d90772eb-6fd5-4268-84b8-df6e0f60ad4d",
    "email": "tommy@example.com",
    "user_type": "customer",
    "role": "normal",
    "profile": {
      "full_name": "Thomas Shelby",
      "profile_image": null
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Register NGO/Organization
**POST** `/auth/register/ngo/`

Registers a new NGO/organization account.

**Content-Type:** `multipart/form-data`

**Request Body:**
```json
{
  "email": "organization@example.com",
  "password": "12organization34",
  "representative_email": "karen@org.com",
  "organisation_name": "Helpful Org",
  "organisation_contact": "0123456789",
  "representative_name": "Karen",
  "organisation_street": "Help Street",
  "organisation_city": "Help City",
  "organisation_province": "Gauteng",
  "organisation_postal_code": "1541",
  "npo_document": "npo.pdf"
}
```

**Response (201 - Success):**
```json
{
  "message": "Organization registered successfully - pending verification",
  "organization": {
    "id": "a12345bc-6789-4def-g012-3456789abcde",
    "email": "organization@example.com",
    "organisation_name": "Helpful Org",
    "status": "pending_verification",
    "user_type": "ngo"
  }
}
```

---

### 3. Register Business Provider
**POST** `/auth/register/provider/`

Registers a new business provider account.

**Request Body:**
```json
{
  "email": "arthur@restaurant.com",
  "business_name": "Arthur's Restaurant",
  "password": "12arthur34",
  "business_contact": "+1234567890",
  "business_street": "456 Food St",
  "business_city": "Downtown",
  "business_province": "Gauteng",
  "business_postal_code": "2000",
  "cipc_document": "data:application/pdf;base64,JVBERi0xLjQK...",
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE..."
}
```

**Response (201 - Success):**
```json
{
  "message": "Food provider registered successfully - pending verification",
  "provider": {
    "id": "6a5bac41-3f92-4e62-bc80-9bb47fcf7ed1",
    "businessName": "Arthur's Restaurant",
    "email": "arthur@restaurant.com",
    "status": "pending_verification",
    "userType": "provider"
  }
}
```

---

### 4. User Login
**POST** `/auth/login/`

Login for any user type (customer, provider, NGO).

**Request Body:**
```json
{
  "email": "arthur@restaurant.com",
  "password": "12arthur34"
}
```

**Response (200 - Success):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "6a5bac41-3f92-4e62-bc80-9bb47fcf7ed1",
    "email": "arthur@restaurant.com",
    "user_type": "provider",
    "role": "normal",
    "profile": {
      "business_name": "Arthur's Restaurant",
      "business_email": "arthur@restaurant.com",
      "status": "pending_verification",
      "logo": "/media/provider_logos/provider_logo_6a5bac41-3f92-4e62-bc80-9bb47fcf7ed1.png"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 5. Search Businesses
**GET** `/auth/businesses/search/`


**Response (200 - Success):**
```json
{
    "businesses": [
        {
            "id": "48dff97b-8602-49fb-8da1-bb9a9864c4bc",
            "business_name": "Saber's Snacks",
            "business_address": "123 Food Street, Test City, Test Province, 12345",
            "logo": null,
            "follower_count": 1
        },
        {
            "id": "a7a4b210-16f3-4fae-95a9-07fbf21fc4b1",
            "business_name": "Elven Foods",
            "business_address": "1, Mirkwood, Eastern Cape, 1111",
            "logo": null,
            "follower_count": 0
        }
    ],
    "count": 2
}
```

## Error Responses

All endpoints may return the following error responses:

| Status Code | Description | Example Response |
|-------------|-------------|------------------|
| 400 | Bad Request | `{"error": "Invalid email format"}` |
| 401 | Unauthorized | `{"error": "Invalid email or password"}` |
| 403 | Forbidden | `{"error": "Account pending verification"}` |
| 409 | Conflict | `{"error": "Email already registered"}` |

## Authentication

After successful login, include the JWT token in the Authorization header for protected endpoints:

```
Authorization: Bearer <your-jwt-token>
```

## User Types

- **customer**: Individual users
- **provider**: Business/service providers
- **ngo**: Non-profit organizations

## File Upload Notes

- NGO registration requires NPO document upload (PDF format)
- Provider registration accepts base64 encoded documents and logos
- Maximum file sizes and supported formats should be validated on the client side

---
