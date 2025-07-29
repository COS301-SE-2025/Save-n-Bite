# Postman Testing Guide - Save n Bite Admin Notification System

## Base URL Setup

First, set up your Postman environment variables:
- `BASE_URL`: `http://localhost:8000` (or your server URL)
- `ADMIN_TOKEN`: Your admin authentication token

## Authentication

All requests require admin authentication. Add this header to all requests:
```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

---

## 1. Send Custom Notification to All Users

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/admin/notifications/send/`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "subject": "Some Subject",
    "body": "Some Body",
    "target_audience": "all"
}
```

**Expected Response:**
```json
{
    "message": "Notification sent successfully",
    "stats": {
        "total_users": 150,
        "notifications_sent": 150,
        "emails_sent": 120,
        "emails_failed": 30,
        "target_audience": "all"
    }
}
```

---

## 2. Send Notification to Customers Only

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api//admin/notifications/send/`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "subject": "New Discounted Food Available!",
    "body": "Great news! We have fresh produce and baked goods available at up to 50% off. Check out the latest listings from your favorite local businesses. Don't miss these amazing deals!",
    "target_audience": "customers"
}
```

---

## 3. Send Notification to Businesses Only

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/admin/notifications/send/`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "subject": "New Business Features Available",
    "body": "We've added new analytics tools to help you track your food waste reduction impact. You can now see detailed reports on donations made and environmental benefits. Login to explore these new features!",
    "target_audience": "businesses"
}
```

---

## 4. Send Notification to Organisations Only

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/admin/notifications/send/`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "subject": "Donation Opportunities This Week",
    "body": "Several local restaurants and grocery stores have indicated surplus food available for donation this week. Please check your dashboard for new donation requests and coordinate pickup times with our partner businesses.",
    "target_audience": "organisations"
}
```

---

## 5. Get Audience Counts

**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/admin/notifications/audience-counts/`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Body:** None (GET request)

**Expected Response:**
```json
{
    "audience_counts": {
        "all": 150,
        "customers": 80,
        "businesses": 45,
        "organisations": 25
    }
}
```

---

## 6. Get Notification Analytics (All Users)

**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/admin/notifications/analytics/`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Body:** None (GET request)

**Expected Response:**
```json
{
    "analytics": {
        "total_notifications": 45,
        "read_notifications": 38,
        "total_emails": 45,
        "successful_emails": 42,
        "failed_emails": 3,
        "read_rate": 84.44,
        "email_success_rate": 93.33
    },
    "filters": {
        "target_audience": "all"
    }
}
```

---

## 7. Get Notification Analytics (Customers Only)

**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/admin/notifications/analytics/?target_audience=customers`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Body:** None (GET request)

---

## 8. Get Notification Analytics (Businesses Only)

**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/admin/notifications/analytics/?target_audience=businesses`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Body:** None (GET request)

---

## 9. Get Notification Analytics (Organisations Only)

**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/admin/notifications/analytics/?target_audience=organisations`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Body:** None (GET request)

---

## 10. Reset User Password

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/admin/users/reset-password/`

**Headers:**
```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "user_id": "57fb6b13-f991-4aa1-a316-9914e4c64ce0"
}
```

**Note:** Replace the `user_id` with an actual UserID from your database. Also customer has a function equivalent to this (see 10.5)

**Expected Response:**
```json
{
    "message": "Password reset for john_doe. Formatted email sent to john@example.com",
    "reset_info": {
        "user_email": "john@example.com",
        "expires_at": "2025-07-12T10:30:00Z",
        "reset_id": "456e7890-e89b-12d3-a456-426614174001"
    }
}
```
---

## Then from the Customer side

## 10.5 Forgot Password

**Method:** `POST`  
**URL:** `{{BASE_URL}}/auth/forgot-password/`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "email": "user_email"
}
```

**Expected Response:**
```json
{
    "message": "If an account with that email exists, you will receive password reset instructions shortly.",
    "reset_info": {
        "expires_in_hours": 24
    }
}
```
---
## 11. login with temporary password from email

**Method:** `POST`  
**URL:** `{{BASE_URL}}/auth/login-enhanced/`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "email": "user_email",
    "password": "Temporary_password_from_email"
}
```

**Note:** this will create a new token for subsequent requests

**Expected Response:**
```json
{
    "message": "Login successful but password change required",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUyMjQzOTY4LCJpYXQiOjE3NTIyNDAzNjgsImp0aSI6IjM3ZTA1ZjA2NWUzZTQ5ODA4MWUzOWIxNTNlNjg1NDg4IiwidXNlcl9pZCI6IjU3ZmI2YjEzLWY5OTEtNGFhMS1hMzE2LTk5MTRlNGM2NGNlMCIsInVzZXJfdHlwZSI6ImN1c3RvbWVyIiwiZW1haWwiOiJtYXJjb2dlcmFsMUBnbWFpbC5jb20ifQ._OG_Qx-MheVXcyOVAQcpUp_wHxRW4tHj5VkKSCuZsPU",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1Mjg0NTE2OCwiaWF0IjoxNzUyMjQwMzY4LCJqdGkiOiI3YmQzOTE0N2MyNDI0MDJmOWZlYWY1MTYyYzliNmU2NSIsInVzZXJfaWQiOiI1N2ZiNmIxMy1mOTkxLTRhYTEtYTMxNi05OTE0ZTRjNjRjZTAiLCJ1c2VyX3R5cGUiOiJjdXN0b21lciIsImVtYWlsIjoibWFyY29nZXJhbDFAZ21haWwuY29tIn0.tK3ZVhbJzOYBph1b-pLqiA2QJiT5eA5jNooRMzJDyzU",
    "user": {
        "id": "57fb6b13-f991-4aa1-a316-9914e4c64ce0",
        "email": "marcogeral1@gmail.com",
        "user_type": "customer",
        "admin_rights": false
    },
    "password_change_required": true,
    "hours_remaining": 24.0
}
```
---

## 12. Check password Status
**Method:** `GET`  
**URL:** `{{BASE_URL}}/auth/password-status/`

**Headers:**
```
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```

**Expected Response:**
```json
{
    "must_change": true,
    "has_temporary": true,
    "created_at": "some_time/date",
    "expired": false,
    "hours_remaining": "some_number"
}
```
---

## 13. Change Password

**Method:** `POST`  
**URL:** `{{BASE_URL}}/auth/change-temporary-password/`

**Headers:**
```
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "current_password": "UZ#0@yAxoW9H",
    "new_password": "12Marco34",
    "confirm_password": "12Marco34"
}
```

**Expected Response:**
```json
{
    "message": "Password changed successfully"
}
```

**Note**
From here on, a customer can use their new password

---



## Error Response Examples

### Validation Error (400)
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid data provided",
        "details": {
            "subject": ["This field is required."],
            "target_audience": ["Invalid choice: 'invalid_audience'"]
        }
    }
}
```

### User Not Found (404)
```json
{
    "error": {
        "code": "USER_NOT_FOUND",
        "message": "User not found"
    }
}
```

### Unauthorized (401)
```json
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication credentials were not provided."
    }
}
```

### Permission Denied (403)
```json
{
    "error": {
        "code": "PERMISSION_DENIED",
        "message": "You do not have permission to perform this action."
    }
}
```

---

## Test Data Validation

### Test Invalid Subject (Empty)
**Body:**
```json
{
    "subject": "",
    "body": "This should fail validation",
    "target_audience": "all"
}
```

### Test Invalid Body (Too Short)
**Body:**
```json
{
    "subject": "Valid Subject",
    "body": "Short",
    "target_audience": "all"
}
```

### Test Invalid Audience
**Body:**
```json
{
    "subject": "Valid Subject",
    "body": "This is a valid body with enough characters to pass validation.",
    "target_audience": "invalid_audience"
}
```

---

## Postman Collection Setup

To create a complete Postman collection:

1. **Create Environment Variables:**
   - `BASE_URL`: `http://localhost:8000`
   - `ADMIN_TOKEN`: Your actual admin token

2. **Pre-request Script** (add to collection level):
   ```javascript
   // You can add any setup scripts here
   console.log("Testing Save n Bite Admin Notifications");
   ```

3. **Tests Script** (add to each request):
   ```javascript
   pm.test("Status code is successful", function () {
       pm.expect(pm.response.code).to.be.oneOf([200, 201]);
   });

   pm.test("Response has required fields", function () {
       const responseJson = pm.response.json();
       if (pm.response.code === 200) {
           pm.expect(responseJson).to.have.property('message');
       }
   });
   ```

---

## Testing Flow Recommendation

1. **Start with audience counts** to see how many users you have
2. **Send a test notification to customers** first (smaller group)
3. **Check analytics** to verify it was sent
4. **Test password reset** with a test user
5. **Send notification to all users** once you're confident
6. **Monitor analytics** for delivery rates

This comprehensive testing guide will help you verify that both the custom notification system and enhanced password reset functionality are working correctly in your Save n Bite application.