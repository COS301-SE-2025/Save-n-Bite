# Save n Bite - Notifications App Service Contract

**Project:** Save n Bite  
**App:** Notifications  
**Version:** 2.0  
**Date:** August 12, 2025  
**Team:** Secure Web & Mobile Guild  

---

## 1. Overview

The Notifications app serves as the communication backbone of the Save n Bite platform, managing real-time alerts, email notifications, and user engagement features. It ensures users stay informed about new listings, system updates, and business activities while providing granular control over notification preferences.

### 1.1 Purpose
- Deliver real-time in-app notifications
- Send email notifications with HTML templates
- Manage user notification preferences
- Handle business following/follower relationships
- Support notification delivery tracking and analytics

### 1.2 Key Features
- **Multi-Channel Notifications**: In-app and email notifications
- **User Preferences**: Granular notification control
- **Business Following**: Customer-business relationship management
- **Template System**: Rich HTML email templates
- **Analytics**: Notification delivery tracking and engagement metrics

---

## 2. Authentication & Base URL

### 2.1 Authentication Requirements
All endpoints require authentication via JWT Bearer token:
```http
Authorization: Bearer <jwt_token>
```

### 2.2 Base URL
```
https://api.savenbiteguild.com/api/
```

### 2.3 Request/Response Format
- **Content-Type**: `application/json`
- **Response Format**: JSON
- **Character Encoding**: UTF-8

---

## 3. API Endpoints Specification

### 3.1 Notification Management Endpoints

#### 3.1.1 Get User Notifications
**Endpoint:** `GET /notifications/`

**Description:** Retrieve paginated notifications for the authenticated user with optional filtering.

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Items per page (default: 20, max: 100)
- `read_status` (string, optional): Filter by read status (`read`, `unread`)
- `type` (string, optional): Filter by notification type

**Response (200 OK):**
```json
{
    "count": 4,
    "next": "http://api.savenbiteguild.com/notifications/?page=2",
    "previous": null,
    "results": {
        "notifications": [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "notification_type": "new_listing",
                "title": "New Pizza Available!",
                "message": "Fresh margherita pizza just posted at Mario's Restaurant",
                "data": {
                    "listing_id": "uuid",
                    "business_id": "uuid",
                    "price": "12.50",
                    "expiry_date": "2025-08-26T18:00:00Z"
                },
                "sender_name": "Mario's Restaurant",
                "business_name": "Mario's Restaurant",
                "is_read": false,
                "created_at": "2025-08-12T14:30:00Z",
                "read_at": null,
                "time_ago": "2 hours ago"
            }
        ],
        "unread_count": 3
    }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during notification retrieval

---

#### 3.1.2 Get Unread Count
**Endpoint:** `GET /notifications/unread-count/`

**Description:** Get the count of unread notifications for the authenticated user.

**Response (200 OK):**
```json
{
    "unread_count": 12
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during count retrieval

---

#### 3.1.3 Mark Notifications as Read
**Endpoint:** `POST /notifications/mark-read/`

**Description:** Mark specific notifications as read.

**Request Body:**
```json
{
    "notification_ids": [
        "550e8400-e29b-41d4-a716-446655440000",
        "660f9500-f39c-52e5-b827-557766551111"
    ]
}
```

**Response (200 OK):**
```json
{
    "message": "2 notifications marked as read",
    "marked_count": 2,
    "unread_count": 10
}
```

**Error Responses:**
- `400 Bad Request`: Invalid notification IDs or request format
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during update

---

#### 3.1.4 Mark All Notifications as Read
**Endpoint:** `POST /notifications/mark-all-read/`

**Description:** Mark all unread notifications as read for the authenticated user.

**Response (200 OK):**
```json
{
    "message": "All notifications marked as read",
    "marked_count": 12,
    "unread_count": 0
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during update

---

#### 3.1.5 Delete Notification
**Endpoint:** `DELETE /notifications/{notification_id}/delete/`

**Description:** Soft delete a specific notification (marks as deleted, doesn't remove from database).

**Path Parameters:**
- `notification_id` (UUID): ID of the notification to delete

**Response (200 OK):**
```json
{
    "message": "Notification deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Notification not found or doesn't belong to user
- `500 Internal Server Error`: Server error during deletion

---

### 3.2 Notification Preferences Endpoints

#### 3.2.1 Get Notification Preferences
**Endpoint:** `GET /notifications/preferences/`

**Description:** Retrieve notification preferences for the authenticated user.

**Response (200 OK):**
```json
{
    "preferences": {
        "email_notifications": true,
        "new_listing_notifications": true,
        "promotional_notifications": false,
        "weekly_digest": true
    }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during retrieval

---

#### 3.2.2 Update Notification Preferences
**Endpoint:** `PUT /notifications/preferences/`

**Description:** Update notification preferences for the authenticated user.

**Request Body:**
```json
{
    "email_notifications": false,
    "new_listing_notifications": true,
    "promotional_notifications": true,
    "weekly_digest": false
}
```

**Response (200 OK):**
```json
{
    "message": "Notification preferences updated successfully",
    "preferences": {
        "email_notifications": false,
        "new_listing_notifications": true,
        "promotional_notifications": true,
        "weekly_digest": false
    }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid preference values
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during update

---

### 3.3 Business Following Endpoints

#### 3.3.1 Follow Business
**Endpoint:** `POST /follow/`

**Description:** Follow a business to receive notifications about their new listings.

**User Permissions:** Only customers and NGOs can follow businesses.

**Request Body:**
```json
{
    "business_id": "660f9500-f39c-52e5-b827-557766551111"
}
```

**Response (201 Created - New Follow):**
```json
{
    "message": "Successfully followed business",
    "follower_id": "770g0600-g40d-63f6-c938-668877662222",
    "created": true
}
```

**Response (200 OK - Already Following):**
```json
{
    "message": "Already following this business",
    "follower_id": "770g0600-g40d-63f6-c938-668877662222",
    "created": false
}
```

**Error Responses:**
- `400 Bad Request`: Invalid business ID or business not found
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User type not allowed to follow businesses
- `500 Internal Server Error`: Server error during follow operation

---

#### 3.3.2 Unfollow Business
**Endpoint:** `DELETE /unfollow/{business_id}/`

**Description:** Unfollow a business to stop receiving notifications.

**User Permissions:** Only customers and NGOs can unfollow businesses.

**Path Parameters:**
- `business_id` (UUID): ID of the business to unfollow

**Response (200 OK):**
```json
{
    "message": "Successfully unfollowed business",
    "business_id": "660f9500-f39c-52e5-b827-557766551111",
    "action": "unfollowed"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid business ID or business not found
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User type not allowed to unfollow businesses
- `404 Not Found`: User is not following this business
- `500 Internal Server Error`: Server error during unfollow operation

---

#### 3.3.3 Get Following List
**Endpoint:** `GET /following/`

**Description:** Get list of businesses that the authenticated user is following.

**Response (200 OK):**
```json
{
    "following": [
        {
            "follow_id": 1,
            "business_id": "660f9500-f39c-52e5-b827-557766551111",
            "business_name": "Mario's Restaurant",
            "business_email": "contact@marios.com",
            "business_address": "123 Main St, Pretoria",
            "business_contact": "+27123456789",
            "logo": "https://s3.amazonaws.com/logo.jpg",
            "status": "verified",
            "followed_at": "2025-08-01T10:30:00Z",
            "follower_count": 234,
            "active_listings_count": 5
        }
    ],
    "count": 1,
    "message": "Retrieved 1 businesses you are following"
}
```

**Error Responses:**
- `400 Bad Request`: Service error during retrieval
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during retrieval

---

#### 3.3.4 Get Business Followers (Business Owners Only)
**Endpoint:** `GET /followers/`

**Description:** Get list of followers for the authenticated business user.

**User Permissions:** Only business providers can access this endpoint.

**Response (200 OK):**
```json
{
    "followers": [
        {
            "follow_id": 1,
            "user_id": "880h1700-h51e-74g7-d049-779988773333",
            "user_type": "customer",
            "email": "jane@example.com",
            "followed_at": "2025-08-01T10:30:00Z",
            "name": "Jane Smith",
            "profile_image": "https://s3.amazonaws.com/profile.jpg",
            "additional_info": {
                "user_type_display": "Customer"
            }
        }
    ],
    "summary": {
        "total_followers": 234,
        "customer_followers": 200,
        "ngo_followers": 34,
        "recent_followers_30_days": 45
    },
    "count": 234,
    "message": "Retrieved 234 followers for your business"
}
```

**Error Responses:**
- `400 Bad Request`: Service error during retrieval
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Only business owners can view followers
- `500 Internal Server Error`: Server error during retrieval

---

#### 3.3.5 Get Follow Status
**Endpoint:** `GET /follow-status/{business_id}/`

**Description:** Check if the authenticated user is following a specific business.

**Path Parameters:**
- `business_id` (UUID): ID of the business to check

**Response (200 OK):**
```json
{
    "follow_status": {
        "is_following": true,
        "follower_count": 234,
        "business_name": "Mario's Restaurant",
        "business_status": "verified"
    }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid business ID or business not found
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during status check

---

#### 3.3.6 Get Follow Recommendations
**Endpoint:** `GET /recommendations/`

**Description:** Get recommended businesses to follow based on user preferences and business activity.

**User Permissions:** Only customers and NGOs receive recommendations.

**Query Parameters:**
- `limit` (integer, optional): Maximum number of recommendations (default: 5, max: 20)

**Response (200 OK):**
```json
{
    "recommendations": [
        {
            "business_id": "660f9500-f39c-52e5-b827-557766551111",
            "business_name": "Mario's Restaurant",
            "business_address": "123 Main St, Pretoria",
            "logo": "https://s3.amazonaws.com/logo.jpg",
            "follower_count": 234,
            "active_listings_count": 5,
            "recent_listings_count": 3,
            "recommendation_score": 240
        }
    ],
    "count": 1,
    "message": "Found 1 recommended businesses"
}
```

**Error Responses:**
- `400 Bad Request`: Service error during recommendation generation
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during recommendation retrieval

---

## 4. Data Models

### 4.1 Notification Model
```json
{
    "id": "UUID (Primary Key)",
    "recipient": "User (Foreign Key)",
    "sender": "User (Foreign Key, nullable)",
    "business": "FoodProviderProfile (Foreign Key, nullable)",
    "notification_type": "String (choices: new_listing, listing_expiring, business_update, system_announcement, welcome, pickup_reminder, order_preparation, order_completion)",
    "title": "String (max 255 chars)",
    "message": "Text",
    "data": "JSON (additional payload)",
    "is_read": "Boolean (default: false)",
    "is_deleted": "Boolean (default: false)",
    "created_at": "DateTime",
    "read_at": "DateTime (nullable)"
}
```

### 4.2 NotificationPreferences Model
```json
{
    "user": "User (OneToOne Foreign Key)",
    "email_notifications": "Boolean (default: true)",
    "new_listing_notifications": "Boolean (default: true)",
    "promotional_notifications": "Boolean (default: false)",
    "weekly_digest": "Boolean (default: true)",
    "created_at": "DateTime",
    "updated_at": "DateTime"
}
```

### 4.3 BusinessFollower Model
```json
{
    "id": "Integer (Primary Key)",
    "user": "User (Foreign Key)",
    "business": "FoodProviderProfile (Foreign Key)",
    "created_at": "DateTime"
}
```

### 4.4 EmailNotificationLog Model
```json
{
    "id": "UUID (Primary Key)",
    "recipient_email": "Email",
    "recipient_user": "User (Foreign Key)",
    "notification": "Notification (Foreign Key, nullable)",
    "subject": "String (max 255 chars)",
    "template_name": "String (max 100 chars)",
    "status": "String (choices: pending, sent, failed, bounced)",
    "error_message": "Text (nullable)",
    "sent_at": "DateTime (nullable)",
    "created_at": "DateTime"
}
```

---

## 5. Business Rules & Validation

### 5.1 Notification Creation Rules
- Users cannot send notifications to themselves
- Notification content must not exceed character limits (title: 255 chars)
- Notification data must be valid JSON format

### 5.2 Following Rules
- Only customers and NGOs can follow businesses
- Businesses cannot follow other businesses
- Users cannot follow the same business multiple times
- Following relationships are unique per user-business pair

### 5.3 Notification Delivery Rules
- Respect user notification preferences
- Email notifications only sent if user has email notifications enabled
- System notifications (welcome, verification) bypass some preference settings

### 5.4 Permission Rules
- Users can only view their own notifications
- Users can only modify their own notification preferences
- Only business owners can view their followers list
- Business followers information is limited to basic profile data

---

## 6. Error Handling

### 6.1 Standard Error Format
```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": "Additional error information (optional)"
    }
}
```

### 6.2 Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request data validation failed |
| 400 | BUSINESS_ERROR | Business-related error (not found, etc.) |
| 400 | SERVICE_ERROR | Service layer error |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | PERMISSION_DENIED | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 404 | NOT_FOLLOWING | User is not following the business |
| 500 | FETCH_ERROR | Error retrieving data |
| 500 | UPDATE_ERROR | Error updating data |
| 500 | DELETE_ERROR | Error deleting data |
| 500 | FOLLOW_ERROR | Error in follow operation |
| 500 | UNFOLLOW_ERROR | Error in unfollow operation |

---

## 7. Email Templates

### 7.1 Available Templates
- `welcome.html` - Welcome email for new users
- `new_listing.html` - New food listing notification
- `verification_approved.html` - Account verification success
- `verification_rejected.html` - Account verification failure
- `password_reset.html` - Password reset notification
- `order_preparation.html` - Order preparation notification
- `order_completion.html` - Order completion notification

### 7.2 Template Context Variables
Each template receives specific context variables based on the notification type. Common variables include:
- `user_name` - Display name of the recipient
- `business_name` - Name of the associated business
- `company_name` - "Save n Bite"
- `support_email` - "savenbite@gmail.com"

---

## 8. Integration Points

### 8.1 Internal Service Dependencies
- **Authentication Service**: User profiles and JWT token validation
- **Food Listings Service**: New listing notifications via signals
- **User Management**: User profile information for display names

### 8.2 Django Signals Integration
The app responds to various Django signals to automatically create notifications:
- User creation → Welcome notification
- Profile verification status change → Verification notification
- New food listing creation → Follower notifications

---

## 9. Performance Considerations

### 9.1 Response Time Targets
- Get notifications: < 300ms
- Mark as read: < 200ms
- Follow/unfollow operations: < 500ms
- Email delivery: < 30 seconds (asynchronous)

### 9.2 Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Notifications are ordered by creation date (newest first)

### 9.3 Database Optimization
- Database indexes on frequently queried fields
- Soft deletion for notifications (performance and audit trail)
- Efficient queries with select_related for foreign key relationships

---

## 10. Security Considerations

### 10.1 Authentication & Authorization
- JWT token validation for all endpoints
- User-specific data access (users can only see their own notifications)
- Role-based permissions for business-specific endpoints

### 10.2 Data Protection
- Input validation and sanitization
- UUID primary keys to prevent enumeration attacks
- Soft deletion preserves data integrity while hiding content

### 10.3 Privacy Compliance
- Users control their notification preferences
- Email notifications respect user opt-out preferences
- Follower information is limited to essential business data

---

## 11. Testing Strategy

### 11.1 API Testing
- Comprehensive test suite with pytest
- Unit tests for all service methods
- Integration tests for API endpoints
- Permission testing for user role restrictions

### 11.2 Test Coverage
- 90%+ code coverage target
- Critical notification delivery paths have 100% coverage
- Mock external dependencies (email services)

---

## 12. Deployment Configuration

### 12.1 Environment Variables
```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
SMTP_HOST = 'smtp.gmail.com'
SMTP_PORT = 587
SMTP_USE_TLS = True
DEFAULT_FROM_EMAIL = 'noreply@savenbiteguild.com'

# Notification Settings
NOTIFICATION_BATCH_SIZE = 100
EMAIL_DELIVERY_TIMEOUT = 30
```

### 12.2 Database Migrations
- All models are properly migrated
- Default notification preferences created for existing users
- Foreign key relationships properly configured

---

## 13. Future Enhancements

### 13.1 API Versioning
Current implementation supports v1. Future versions will be implemented with proper API versioning strategies while maintaining backward compatibility.

---

**Document Version**: 2.0  
**Last Updated**: August 12, 2025  
**Next Review**: September 12, 2025  
**Document Status**: Updated Based on Implementation  
**Approved By**: Technical Architecture Team