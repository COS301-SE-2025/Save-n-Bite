# Authentication Service Contract

## Overview
Comprehensive API service contract for user authentication, registration, and profile management supporting three user types: customers, NGOs, and business providers. Built with Django REST Framework using JWT authentication.

**Base URL:** `http://127.0.0.1:8000`  
**Protocol:** REST/HTTP  
**Authentication:** JWT Bearer Tokens  
**Data Format:** JSON  
**Content-Type:** `application/json` (except file uploads: `multipart/form-data`)

---

## 1. User Registration Endpoints

### 1.1 Register Customer
**POST** `/auth/register/customer/`

Registers a new customer account with automatic verification.

**Request Body:**
```json
{
  "full_name": "Thomas Shelby",
  "email": "tommy@example.com",
  "password": "12tommy34",
  "profile_image": "data:image/png;base64,iVBORw0KGgo..." // Optional base64 encoded image
}
```

**Success Response (201):**
```json
{
  "message": "Customer registered successfully",
  "user": {
    "UserID": "d90772eb-6fd5-4268-84b8-df6e0f60ad4d",
    "email": "tommy@example.com",
    "user_type": "customer",
    "role": "normal",
    "profile_details": {
      "full_name": "Thomas Shelby",
      "profile_image": "/media/customer_profiles/profile_d90772eb.png"
    },
    "verification_status": "verified",
    "member_since": "January 2025"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 Register NGO/Organization
**POST** `/auth/register/ngo/`

Registers a new NGO/organization account requiring verification.

**Content-Type:** `multipart/form-data`

**Request Body:**
```json
{
  "email": "organization@example.com",
  "password": "12organization34",
  "representative_email": "karen@org.com",
  "organisation_name": "Helpful Org",
  "organisation_contact": "0123456789",
  "representative_name": "Karen Smith",
  "organisation_street": "Help Street",
  "organisation_city": "Help City",
  "organisation_province": "Gauteng",
  "organisation_postal_code": "1541",
  "npo_document": "data:application/pdf;base64,JVBERi0xLjQK..." // Base64 encoded PDF
}
```

**Success Response (201):**
```json
{
  "message": "NGO registered successfully - pending verification",
  "organisation": {
    "id": "a12345bc-6789-4def-g012-3456789abcde",
    "organisationName": "Helpful Org",
    "representativeEmail": "karen@org.com",
    "status": "pending_verification",
    "userType": "ngo"
  }
}
```

### 1.3 Register Business Provider
**POST** `/auth/register/provider/`

Registers a new business provider account requiring verification.

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
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE...",
  "banner": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE...", // Optional
  "business_description": "Family-owned restaurant serving authentic cuisine", // Optional
  "business_tags": ["Restaurant", "Family-Owned", "Italian Cuisine"] // Optional, max 10 tags
}
```

**Success Response (201):**
```json
{
  "message": "Food provider registered successfully - pending verification",
  "provider": {
    "id": "6a5bac41-3f92-4e62-bc80-9bb47fcf7ed1",
    "businessName": "Arthur's Restaurant",
    "businessEmail": "arthur@restaurant.com",
    "status": "pending_verification",
    "userType": "provider"
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 User Login
**POST** `/auth/login/`

Standard login for all user types.

**Request Body:**
```json
{
  "email": "arthur@restaurant.com",
  "password": "12arthur34"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "UserID": "6a5bac41-3f92-4e62-bc80-9bb47fcf7ed1",
    "email": "arthur@restaurant.com",
    "user_type": "provider",
    "role": "normal",
    "profile_details": {
      "business_name": "Arthur's Restaurant",
      "business_email": "arthur@restaurant.com",
      "logo": "/media/provider_logos/provider_logo_6a5bac41.png",
      "banner": "/media/provider_banners/provider_banner_6a5bac41.png",
      "business_description": "Family-owned restaurant serving authentic cuisine",
      "business_tags": ["Restaurant", "Family-Owned", "Italian Cuisine"],
      "profile_completeness": true
    },
    "verification_status": "pending_verification",
    "member_since": "January 2025"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.2 Enhanced Login with Password Check
**POST** `/auth/login-enhanced/`

Login with additional password status checking (temporary passwords, expiry).

**Request Body:** Same as standard login

**Success Response (200):** Same as standard login, with additional fields:
```json
{
  "message": "Login successful",
  "password_change_required": false,
  "hours_remaining": 22.5,
  // ... rest of standard login response
}
```

### 2.3 Google Sign-in (Placeholder)
**POST** `/auth/google-signin/`

Google OAuth integration endpoint.

**Request Body:**
```json
{
  "token": "google_oauth_token_here"
}
```

**Response (501):**
```json
{
  "message": "Google Sign-in not implemented yet",
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Google Sign-in feature is under development"
  }
}
```

---

## 3. Profile Management Endpoints

### 3.1 Get User Profile
**GET** `/auth/profile/`  
**Authentication:** Required

Gets current user's basic profile information.

**Success Response (200):**
```json
{
  "user": {
    "UserID": "6a5bac41-3f92-4e62-bc80-9bb47fcf7ed1",
    "email": "arthur@restaurant.com",
    "phone_number": "+1234567890",
    "user_type": "provider",
    "member_since": "January 2025",
    "profile_type": "Food Provider",
    "full_name": "Arthur's Restaurant",
    "verification_status": "verified",
    "profile_details": {
      "business_name": "Arthur's Restaurant",
      "business_email": "arthur@restaurant.com",
      "business_contact": "+1234567890",
      "business_address": "456 Food St, Downtown, Gauteng, 2000",
      "business_hours": "Mon-Fri: 9AM-6PM",
      "phone_number": "+1234567890",
      "website": "https://arthurs-restaurant.com",
      "logo": "/media/provider_logos/provider_logo_6a5bac41.png",
      "banner": "/media/provider_banners/provider_banner_6a5bac41.png",
      "business_description": "Family-owned restaurant serving authentic cuisine",
      "business_tags": ["Restaurant", "Family-Owned", "Italian Cuisine"],
      "profile_completeness": true
    }
  }
}
```

### 3.2 Update User Profile
**PUT** `/auth/profile/update/`  
**Authentication:** Required

Updates user profile information.

**Request Body (Customer):**
```json
{
  "email": "new_email@example.com",
  "full_name": "Updated Name",
  "profile_image": "data:image/png;base64,..."
}
```

**Request Body (Provider):**
```json
{
  "email": "new_email@example.com",
  "business_name": "Updated Business Name",
  "business_contact": "+0987654321",
  "business_address": "New Address"
}
```

### 3.3 Get My Profile (Comprehensive)
**GET** `/auth/profile/me/`  
**Authentication:** Required

Gets comprehensive profile data including statistics and activity.

**Success Response (200):**
```json
{
  "user_details": {
    "UserID": "6a5bac41-3f92-4e62-bc80-9bb47fcf7ed1",
    "email": "arthur@restaurant.com",
    "user_type": "provider",
    "verification_status": "verified",
    // ... profile details
  },
  "order_statistics": {
    "completed_orders": 45,
    "cancelled_orders": 2,
    "missed_pickups": 1,
    "total_orders": 48
  },
  "followed_businesses": {
    "count": 0,
    "businesses": []
  },
  "reviews": {
    "count": 12,
    "recent_reviews": [...],
    "statistics": {
      "total_reviews": 12,
      "average_rating_given": 4.2
    }
  },
  "impact_statistics": {
    "meals_rescued_this_month": 25,
    "co2_emissions_prevented_kg": 32.5,
    "total_meals_rescued": 150,
    "total_co2_prevented_kg": 195.0,
    "money_saved_this_month": 125.50
  },
  "notification_preferences": {
    "email_notifications": true,
    "new_listing_notifications": true,
    "promotional_notifications": false,
    "weekly_digest": true
  }
}
```

### 3.4 Update My Profile
**PUT** `/auth/profile/me/update/`  
**Authentication:** Required

Updates comprehensive user profile.

### 3.5 Get Order History
**GET** `/auth/profile/me/orders/`  
**Authentication:** Required

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `status` (string: all|completed|cancelled|pending)
- `type` (string: all|purchase|donation)

**Success Response (200):**
```json
{
  "orders": [
    {
      "order_id": "order-uuid-here",
      "interaction_id": "interaction-uuid-here",
      "business": {
        "id": "business-uuid-here",
        "name": "Arthur's Restaurant",
        "logo": "/media/logos/logo.png",
        "email": "arthur@restaurant.com"
      },
      "order_type": "Purchase",
      "status": "completed",
      "total_amount": 25.50,
      "quantity": 3,
      "pickup_window": "2025-01-15T10:00:00Z - 2025-01-15T12:00:00Z",
      "pickup_code": "ABC123",
      "items": [
        {
          "food_listing_id": "listing-uuid-here",
          "name": "Fresh Pasta",
          "description": "Homemade fresh pasta",
          "quantity": 2,
          "unit_price": 12.00,
          "total_price": 24.00,
          "expiry_date": "2025-01-16T18:00:00Z"
        }
      ],
      "created_at": "2025-01-15T08:30:00Z",
      "completed_at": "2025-01-15T11:15:00Z",
      "can_review": false
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 48,
    "has_next": true,
    "has_previous": false,
    "limit": 20
  },
  "filters": {
    "status": "all",
    "type": "all"
  }
}
```

---

## 4. Business Profile Endpoints

### 4.1 Get Business Profile (Public)
**GET** `/auth/business/{business_id}/`

Gets public business profile information.

**Success Response (200):**
```json
{
  "business": {
    "id": "6a5bac41-3f92-4e62-bc80-9bb47fcf7ed1",
    "business_name": "Arthur's Restaurant",
    "business_email": "arthur@restaurant.com",
    "business_address": "456 Food St, Downtown, Gauteng, 2000",
    "business_contact": "+1234567890",
    "logo": "/media/provider_logos/provider_logo_6a5bac41.png",
    "banner": "/media/provider_banners/provider_banner_6a5bac41.png",
    "business_description": "Family-owned restaurant serving authentic cuisine",
    "business_tags": ["Restaurant", "Family-Owned", "Italian Cuisine"],
    "status": "verified",
    "follower_count": 25,
    "active_listings_count": 8,
    "is_following": false,
    "joined_date": "2024-12-01T10:00:00Z",
    "coordinates": {
      "lat": -26.1833,
      "lng": 28.0167
    },
    "profile_completeness": true
  }
}
```

### 4.2 Search Businesses
**GET** `/auth/businesses/search/`

**Query Parameters:**
- `search` (string): Search term for business name/address
- `tags` (string): Comma-separated tags filter
- `city` (string): City filter
- `has_coordinates` (boolean): Filter for businesses with location data
- `complete_profiles_only` (boolean): Filter for complete profiles only
- `page_size` (int, max: 200)
- `page` (int)

**Success Response (200):**
```json
{
  "businesses": [
    {
      "id": "48dff97b-8602-49fb-8da1-bb9a9864c4bc",
      "business_name": "Saber's Snacks",
      "business_address": "123 Food Street, Test City, Test Province, 12345",
      "business_description": "Artisanal snacks and treats",
      "business_tags": ["Bakery", "Artisanal", "Vegan Options"],
      "logo": "/media/logos/saber_logo.png",
      "banner": "/media/banners/saber_banner.png",
      "follower_count": 1,
      "active_listings_count": 5,
      "coordinates": {
        "lat": -26.2041,
        "lng": 28.0473
      },
      "profile_completeness": true
    }
  ],
  "count": 2,
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 2,
    "has_next": false,
    "has_previous": false,
    "page_size": 50
  },
  "filters_applied": {
    "search": "",
    "tags": "Bakery,Vegan Options",
    "city": null,
    "has_coordinates": "true",
    "complete_profiles_only": "false"
  },
  "summary": {
    "total_verified_providers": 15,
    "providers_with_coordinates": 12,
    "providers_with_tags": 8,
    "providers_with_descriptions": 10
  }
}
```

### 4.3 Update Business Profile
**PUT** `/auth/business/profile/update/`  
**Authentication:** Required (Provider only)

Updates business profile with new fields.

**Request Body:**
```json
{
  "business_name": "Updated Restaurant Name",
  "business_email": "updated@restaurant.com",
  "business_contact": "+0987654321",
  "business_address": "New Address, City, Province, 12345",
  "business_hours": "Mon-Sun: 8AM-10PM",
  "phone_number": "+0987654321",
  "website": "https://updated-restaurant.com",
  "business_description": "Updated description of our restaurant",
  "business_tags": ["Restaurant", "Updated", "Italian"],
  "banner": "data:image/png;base64,new_banner_data...",
  "logo": "data:image/png;base64,new_logo_data..."
}
```

**Success Response (200):**
```json
{
  "message": "Business profile updated successfully",
  "profile": {
    // Updated BusinessPublicProfileSerializer data
  }
}
```

---

## 5. Business Tags Management

### 5.1 Manage Business Tags
**POST** `/auth/business/tags/manage/`  
**Authentication:** Required (Provider only)

Add, remove, or set business tags.

**Request Body (Add Tag):**
```json
{
  "action": "add",
  "tag": "New Tag"
}
```

**Request Body (Remove Tag):**
```json
{
  "action": "remove",
  "tag": "Old Tag"
}
```

**Request Body (Set All Tags):**
```json
{
  "action": "set",
  "tags": ["Tag 1", "Tag 2", "Tag 3"]
}
```

**Success Response (200):**
```json
{
  "message": "Tag 'New Tag' added successfully",
  "tags": ["Restaurant", "Family-Owned", "Italian Cuisine", "New Tag"]
}
```

### 5.2 Get Popular Business Tags
**GET** `/auth/business/tags/popular/`

**Query Parameters:**
- `limit` (int, default: 20, max: 50)
- `include_providers` (boolean): Include example provider names

**Success Response (200):**
```json
{
  "popular_tags": [
    {
      "tag": "Restaurant",
      "count": 25,
      "example_providers": ["Arthur's Restaurant", "Bella's Bistro"]
    },
    {
      "tag": "Bakery",
      "count": 15,
      "example_providers": ["Sweet Treats", "Daily Bread"]
    }
  ],
  "total_unique_tags": 35
}
```

### 5.3 Search Providers by Tags
**GET** `/auth/providers/search/tags/`

**Query Parameters:**
- `tags` (string, required): Comma-separated tags
- `limit` (int, default: 50, max: 100)

**Success Response (200):**
```json
{
  "providers": [
    {
      "id": "provider-uuid-here",
      "business_name": "Arthur's Restaurant",
      "business_address": "456 Food St, Downtown",
      "business_description": "Family-owned restaurant",
      "business_tags": ["Restaurant", "Family-Owned", "Italian"],
      "logo": "/media/logos/arthur_logo.png",
      "banner": "/media/banners/arthur_banner.png",
      "coordinates": {
        "lat": -26.1833,
        "lng": 28.0167
      },
      "active_listings_count": 8,
      "matching_tags": ["Restaurant", "Italian"]
    }
  ],
  "search_tags": ["Restaurant", "Italian"],
  "total_count": 1
}
```

---

## 6. Food Provider Directory

### 6.1 Get All Food Providers
**GET** `/auth/providers/`

Comprehensive endpoint for food provider directory.

**Query Parameters:**
- `search` (string): Search business name, address, description, tags
- `tags` (string): Comma-separated tags filter
- `status` (string): pending_verification|verified|rejected
- `city` (string): City filter
- `has_coordinates` (boolean): Filter for providers with GPS coordinates
- `complete_profiles_only` (boolean): Only providers with complete profiles
- `page_size` (int, default: 50, max: 200)
- `page` (int, default: 1)

**Success Response (200):**
```json
{
  "providers": [
    {
      "id": "provider-uuid-here",
      "business_name": "Arthur's Restaurant",
      "business_email": "arthur@restaurant.com",
      "business_address": "456 Food St, Downtown, Gauteng, 2000",
      "business_contact": "+1234567890",
      "phone_number": "+1234567890",
      "business_hours": "Mon-Fri: 9AM-6PM",
      "website": "https://arthurs-restaurant.com",
      "status": "verified",
      "logo": "/media/provider_logos/provider_logo.png",
      "banner": "/media/provider_banners/provider_banner.png",
      "business_description": "Family-owned restaurant serving authentic cuisine",
      "business_tags": ["Restaurant", "Family-Owned", "Italian Cuisine"],
      "profile_completeness": true,
      "coordinates": {
        "lat": -26.1833,
        "lng": 28.0167
      },
      "latitude": -26.1833,
      "longitude": 28.0167,
      "geocoded_at": "2025-01-15T10:00:00Z",
      "geocoding_failed": false,
      "openstreetmap_url": "https://www.openstreetmap.org/directions?to=-26.1833,28.0167",
      "follower_count": 25,
      "active_listings_count": 8,
      "total_listings_count": 45,
      "joined_date": "2024-12-01T10:00:00Z",
      "last_login": "2025-01-15T08:30:00Z",
      "is_following": false
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 125,
    "has_next": true,
    "has_previous": false,
    "page_size": 50
  },
  "filters_applied": {
    "search": "",
    "status": null,
    "city": null,
    "has_coordinates": null,
    "tags": null,
    "complete_profiles_only": null
  },
  "summary": {
    "total_verified_providers": 125,
    "providers_with_coordinates": 100,
    "providers_with_tags": 85,
    "providers_with_descriptions": 95
  }
}
```

### 6.2 Get Food Provider by ID
**GET** `/auth/providers/{provider_id}/`

**Query Parameters:**
- `include_followers` (boolean): Include follower details
- `include_recent_listings` (boolean): Include recent listings

**Success Response (200):**
```json
{
  "provider": {
    "id": "provider-uuid-here",
    "business_name": "Arthur's Restaurant",
    // ... all provider fields from directory endpoint
    "banner_updated_at": "2025-01-10T14:30:00Z",
    "description_updated_at": "2025-01-08T09:15:00Z",
    "tags_updated_at": "2025-01-05T16:45:00Z",
    "geocoding_error": "",
    "email_verified": true,
    "followers": [
      {
        "id": "follower-uuid-here",
        "name": "John Doe",
        "user_type": "customer",
        "followed_since": "2024-12-15T10:00:00Z"
      }
    ],
    "recent_listings": [
      {
        "id": "listing-uuid-here",
        "name": "Fresh Pasta",
        "type": "meal",
        "original_price": 15.00,
        "discounted_price": 12.00,
        "quantity_available": 10,
        "expiry_date": "2025-01-16T18:00:00Z",
        "created_at": "2025-01-15T08:00:00Z"
      }
    ]
  }
}
```

### 6.3 Get Food Provider Locations (Map View)
**GET** `/auth/providers/locations/`

Lightweight endpoint for map applications.

**Query Parameters:**
- `north` (float): Bounding box north latitude
- `south` (float): Bounding box south latitude
- `east` (float): Bounding box east longitude
- `west` (float): Bounding box west longitude

**Success Response (200):**
```json
{
  "providers": [
    {
      "id": "provider-uuid-here",
      "business_name": "Arthur's Restaurant",
      "business_address": "456 Food St, Downtown, Gauteng, 2000",
      "coordinates": {
        "lat": -26.1833,
        "lng": 28.0167
      },
      "business_hours": "Mon-Fri: 9AM-6PM",
      "phone_number": "+1234567890",
      "active_listings_count": 8,
      "logo": "/media/provider_logos/provider_logo.png",
      "openstreetmap_url": "https://www.openstreetmap.org/directions?to=-26.1833,28.0167"
    }
  ],
  "total_count": 15,
  "bounding_box": {
    "north": -26.0000,
    "south": -26.5000,
    "east": 28.5000,
    "west": 27.5000
  }
}
```

---

## 7. Password Management

### 7.1 Change Password
**POST** `/change-password/`  
**Authentication:** Required

Standard password change for authenticated users.

**Request Body:**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword456",
  "confirm_password": "newpassword456"
}
```

### 7.2 Change Temporary Password
**POST** `/auth/change-temporary-password/`  
**Authentication:** Required

Changes temporary password to permanent password.

**Request Body:**
```json
{
  "current_password": "temp_password_123",
  "new_password": "permanent_password_456",
  "confirm_password": "permanent_password_456"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully",
  "info": "A confirmation email has been sent for security purposes (regardless of your email preferences)."
}
```

### 7.3 Check Password Status
**GET** `/auth/password-status/`  
**Authentication:** Required

Checks if user needs to change password (temporary password status).

**Success Response (200):**
```json
{
  "must_change": true,
  "has_temporary": true,
  "created_at": "2025-01-15T10:00:00Z",
  "expired": false,
  "hours_remaining": 22.5,
  "message": "Your temporary password expires in 22.5 hours. Please change it soon."
}
```

### 7.4 Request Password Reset (Self-Service)
**POST** `/auth/forgot-password/`

Allows users to request password reset without admin intervention.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "If an account with that email exists, you will receive password reset instructions shortly.",
  "reset_info": {
    "expires_in_hours": 24,
    "note": "This email will be sent regardless of your email notification preferences for security purposes."
  }
}
```

### 7.5 Check Email Exists
**POST** `/auth/check-email/`

Optional endpoint to check if email exists (for frontend UX).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "exists": true,
  "message": "Email found"
}
```

---

## 8. Legacy/Admin Endpoints

### 8.1 Legacy Login
**POST** `/login/`

Enhanced login with admin functionality support.

### 8.2 Password Status Check
**GET** `/password-status/`  
**Authentication:** Required

Legacy password status endpoint.

### 8.3 Create Admin User
**GET** `/create-admin/`

Utility endpoint to create default admin user.

**Response (200):**
```
Admin user created: username=admin, password=password123
```

---

## 9. Error Responses

All endpoints use consistent error response format:

### Standard Error Codes

| Status Code | Description | Error Codes |
|-------------|-------------|-------------|
| 400 | Bad Request | `VALIDATION_ERROR`, `MISSING_CREDENTIALS`, `MISSING_FIELDS` |
| 401 | Unauthorized | `AUTHENTICATION_ERROR`, `INVALID_CREDENTIALS`, `TEMPORARY_PASSWORD_EXPIRED` |
| 403 | Forbidden | `ACCESS_DENIED`, `ACCOUNT_DISABLED`, `LOGIN_BLOCKED` |
| 404 | Not Found | `USER_NOT_FOUND`, `PROFILE_NOT_FOUND`, `BUSINESS_NOT_FOUND` |
| 409 | Conflict | `EMAIL_EXISTS` |
| 500 | Server Error | `REGISTRATION_ERROR`, `LOGIN_ERROR`, `UPDATE_ERROR` |
| 501 | Not Implemented | `NOT_IMPLEMENTED` |

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## 10. Authentication & Security

### JWT Token Usage
Include JWT token in Authorization header for protected endpoints:
```
Authorization: Bearer <your-jwt-token>
```

### Token Refresh
Use refresh token to obtain new access tokens when they expire. The system uses Django REST Framework SimpleJWT with the following configuration:

- **Access Token Lifetime:** 60 minutes
- **Refresh Token Lifetime:** 7 days
- **User ID Claim:** Custom `UserID` field (UUID)
- **Algorithm:** HS256

### Token Claims
JWT tokens include these claims:
```json
{
  "user_id": "uuid-string",
  "user_type": "customer|provider|ngo",
  "email": "user@example.com",
  "exp": 1642678800,
  "iat": 1642675200
}
```

### Rate Limiting
- **Password Reset:** 5 requests per hour per IP
- **Login Attempts:** 5 failed attempts lock account for 30 minutes
- **Registration:** 10 requests per hour per IP

---

## 11. File Upload Specifications

### Supported File Types
- **Images (Logo/Banner/Profile):** PNG, JPEG, JPG
- **Documents (NPO/CIPC):** PDF
- **Encoding:** Base64 in request body or multipart/form-data (to be stored in blob storage)

### File Size Limits
- **Profile Images:** 5MB maximum
- **Business Logos:** 5MB maximum  
- **Business Banners:** 10MB maximum
- **Documents:** 20MB maximum

### Image Specifications
- **Logo Recommended Size:** 400x400px (square)
- **Banner Recommended Size:** 1200x400px (3:1 ratio)
- **Profile Image:** 300x300px (square)

---

## 12. Data Models & Relationships

### User Types
1. **Customer** - Individual consumers
2. **Provider** - Food business providers
3. **NGO** - Non-profit organizations

### Profile Relationships
- User (1:1) → CustomerProfile
- User (1:1) → FoodProviderProfile  
- User (1:1) → NGOProfile

### Status Workflows
**Provider/NGO Registration:**
1. `pending_verification` (initial)
2. `verified` (admin approved)
3. `rejected` (admin rejected)

**Customer Registration:**
- Auto-verified upon successful registration

---

## 13. Business Logic & Validation

### Password Requirements
- Minimum 8 characters
- Must not be common passwords (password, 12345678, password123)
- Django's built-in password validation applied

### Business Tag Rules
- Maximum 10 tags per business
- 50 characters maximum per tag
- Auto-formatted to Title Case
- Duplicate tags automatically removed

### Email Validation
- Must be valid email format
- Unique across all users
- Case-insensitive uniqueness

### Address Geocoding
- Automatic geocoding using OpenStreetMap Nominatim
- Free service, no API key required
- 1 request per second rate limit respected
- South Africa country restriction applied
- Fallback graceful handling if geocoding fails

---

## 14. Integration Points

### External Services
1. **OpenStreetMap Nominatim API**
   - Purpose: Address geocoding
   - Rate Limit: 1 request/second
   - No authentication required
   - Fallback: Manual coordinates entry

2. **Email Service**
   - SMTP configuration required
   - Critical emails bypass user preferences
   - Template-based email system

### Internal Service Dependencies
1. **Notifications Service**
   - In-app notifications
   - Email notifications
   - Business follower tracking

2. **Food Listings Service**
   - Provider listing counts
   - Active/inactive listing tracking

3. **Interactions Service**
   - Order history tracking
   - Purchase/donation records

4. **Reviews Service**
   - Business review tracking
   - User review statistics

---

---

## 15. Monitoring & Logging

### Logged Events
- User registration (all types)
- Login attempts (success/failure)
- Password changes
- Profile updates
- Business verification status changes
- Failed geocoding attempts

### Metrics Tracked
- Registration success rates by type
- Login success rates
- Profile completion rates
- Geographic distribution of providers
- Popular business tags usage

### Error Monitoring
- Authentication failures
- Profile update failures
- Geocoding service failures
- Email delivery failures

---

---

## 16. Version Control & Changelog

### API Version: 1.0
- Current stable version
- All endpoints documented above

### Breaking Changes Policy
- Major version increment for breaking changes
- 90-day deprecation notice for endpoint changes
- Backward compatibility maintained where possible

### Recent Updates
- **v1.0** - Initial release with comprehensive authentication
- Enhanced business profile features (banner, description, tags)
- Self-service password reset
- Comprehensive provider directory
- Geographic search capabilities

---