# Authentication Service Contract

## Overview
API for user authentication and registration supporting three user types: customers, NGOs, and business providers.

**Base URL:** `https://127.0.0.1:8000`

## Endpoints

### 1. Dashboard Overview
**GET** `/api/admin/dashboard/`

Get basic dashboard data.

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response:**
```
{
    "dashboard": {
        "users": {
            "total": 3,
            "active": 2,
            "recent_signups": 3,
            "growth_percentage": 12.5
        },
        "verifications": {
            "pending_total": 1,
            "pending_ngos": 1,
            "pending_providers": 0
        },
        "listings": {
            "total": 0,
            "active": 0,
            "new_this_week": 0,
            "growth_percentage": 23.1
        },
        "transactions": {
            "total": 0,
            "completed": 0,
            "recent": 0,
            "growth_percentage": -4.5
        },
        "system_health": {
            "open_issues": 0,
            "critical_issues": 0
        }
    },
    "recent_activity": [
        {
            "type": "user_registration",
            "description": "Karen joined as ngo",
            "timestamp": "2025-07-10T10:15:26.540257Z",
            "icon": "user"
        },
        {
            "type": "verification_request",
            "description": "Helpful Org requested verification",
            "timestamp": "2025-07-10T10:15:26.540257Z",
            "icon": "shield"
        },
        {
            "type": "user_registration",
            "description": "saber joined as customer",
            "timestamp": "2025-07-10T09:49:08.517112Z",
            "icon": "user"
        }
    ],
    "admin_info": {
        "name": "saber",
        "email": "sabfa24@gmail.com",
        "permissions": {
            "can_moderate": true,
            "can_manage_users": true,
            "is_super_admin": true
        }
    }
}
```

### 2. Get all users
**GET** `/api/admin/users/`

Get all user data

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response:**

```
{
    "users": [
        {
            "UserID": "73bad0b9-da78-423a-a81c-2428fb8f70fa",
            "username": "organization@example.com",
            "email": "organization@example.com",
            "user_type": "ngo",
            "is_active": true,
            "created_at": "2025-07-10T10:15:26.540257Z",
            "profile_info": {
                "name": "Helpful Org",
                "contact": "0123456789",
                "verification_status": "pending_verification"
            },
            "status": "active"
        },
        {
            "UserID": "080ded4a-99d8-452b-83fc-d5c138325ad3",
            "username": "saber",
            "email": "sabfa24@gmail.com",
            "user_type": "customer",
            "is_active": true,
            "created_at": "2025-07-10T09:49:08.517112Z",
            "profile_info": {},
            "status": "active"
        },
        {
            "UserID": "e2891017-5cc6-4462-8999-613dcc35acda",
            "username": "u23590051@tuks.co.za",
            "email": "tommy@example.com",
            "user_type": "customer",
            "is_active": false,
            "created_at": "2025-07-03T15:22:46.542278Z",
            "profile_info": {
                "name": "Thomas Shelby",
                "contact": null,
                "verification_status": "verified"
            },
            "status": "inactive"
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 1,
        "total_count": 3,
        "has_next": false,
        "has_previous": false,
        "per_page": 20
    }
}
```

### 3. Toggle user status
**POST** `/api/admin/users/toggle-status/`

Activate or deactivate a user.

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```
**Request Body:**
```
{
  "user_id": "USER_UUID_HERE",
  "reason": "Testing user deactivation"
}
```

**Expected Response:**
```
{
  "message": "User saber deactivated successfully",
  "user": {
    "id": "uuid-here",
    "username": "saber",
    "is_active": false
  }
}
```

### 4. Reset User Password NOT WORKING !!!!
**POST** `/api/admin/users/reset-password/`

Send a temporary password to a user to reset their password.

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```
**Request Body:**
```
{
  "user_id": "YOUR_USER_UUID_HERE",
  "reason": "User forgot password"
}
```

**Expected Response:**
```
{
  "message": "Password reset for saber. Temporary password sent to sabfa24@gmail.com",
  "reset_info": {
    "user_email": "sabfa24@gmail.com",
    "expires_at": "2025-01-16T10:30:00Z"
  }
}
```

### 5. Retrieve Pending Verifications
**GET** `/api/admin/verifications/pending/`

Get all data on pending verifications.
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response:**
```
{
    "pending_verifications": {
        "ngos": [
            {
                "id": "1",
                "type": "ngo",
                "name": "Helpful Org",
                "email": "ngo@example.com",
                "contact": "0123456789",
                "address": "Help Street, Help City",
                "representative": "Karen",
                "created_at": "2025-07-10T10:15:26.540257+00:00",
                "documents": {
                    "npo_document": null,
                    "logo": null
                }
            }
        ],
        "providers": [],
        "total_count": 1
    }
}
```

### 6. Update Verification Status 
**POST** `/api/admin/verifications/update/`

Update a users verification status.

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```
{
  "profile_type": "ngo",
  "profile_id": "NGO_PROFILE_UUID_HERE",
  "new_status": "verified",
  "reason": "All documents validated successfully"
}
```

**Expected Response:**
```
{
  "message": "Verification status updated successfully",
  "profile": {
    "id": "uuid-here",
    "type": "ngo",
    "status": "verified",
    "name": "Test NGO"
  }
}
```

### 7. Admin Action Logs
**GET** `/api/admin/logs/admin-actions/`

Get logs on all recent admin actions.

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Query Parameters (Optional):
- action_type=user_verification
- admin_user=uuid-here
- start_date=2025-01-01
- end_date=2025-01-31
- search=password reset
- page=1
- per_page=20
```

**Expected Response:**
```
{
    "logs": [
        {
            "id": "afc2e684-c96e-486a-a18f-ad74397bd772",
            "admin_name": "saber",
            "admin_email": "sabfa24@gmail.com",
            "action_type": "data_export",
            "target_type": "users",
            "target_id": "N/A",
            "action_description": "Exported users data",
            "metadata": {
                "date_to": "2025-01-31",
                "date_from": "2025-01-01",
                "export_type": "users"
            },
            "timestamp": "2025-07-10T10:24:23.352610Z",
            "ip_address": "127.0.0.1"
        },
        {
            "id": "3e7b6e86-a442-41c7-a71f-0381e2540e0b",
            "admin_name": "saber",
            "admin_email": "sabfa24@gmail.com",
            "action_type": "user_management",
            "target_type": "user",
            "target_id": "e2891017-5cc6-4462-8999-613dcc35acda",
            "action_description": "User tommy@example.com deactivated",
            "metadata": {
                "action": "deactivated",
                "new_status": "inactive",
                "old_status": "active"
            },
            "timestamp": "2025-07-10T10:08:00.676635Z",
            "ip_address": "127.0.0.1"
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 1,
        "total_count": 2,
        "has_next": false,
        "has_previous": false
    }
}
```

### 8. System Logs
**GET** `/api/admin/logs/system/`

Get all recent system logs.

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Query Parameters (Optional):
- severity=error
- status=open
- category=authentication
- page=1
- per_page=20
```

**Expected Response:**
```
{
    "logs": [],
    "pagination": {
        "current_page": 1,
        "total_pages": 1,
        "total_count": 0,
        "has_next": false,
        "has_previous": false
    },
    "summary": {
        "total_open": 0,
        "total_critical": 0
    }
}
```

### 9. Resolve System Log Maybe working?
**Post** `/api/admin/logs/system/resolve/`

Resolve a system log.
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```
{
  "log_id": "SYSTEM_LOG_UUID_HERE",
  "resolution_notes": "Issue resolved by restarting service"
}
```

**Expected Response:**
```
???
```

### 10. Get Simple Analytics NEEDS WORK
**GET** `/api/admin/analytics/`

Get analytics on user activity.
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response:**
```
{
  "analytics": {
    "total_users": 1,
    "new_users_week": 1,
    "new_users_month": 1,
    "user_growth_percentage": 100.0,
    "total_listings": 0,
    "active_listings": 0,
    "new_listings_week": 0,
    "listing_growth_percentage": 0.0,
    "total_transactions": 0,
    "completed_transactions": 0,
    "transaction_success_rate": 0.0,
    "user_distribution": {
      "customer": "100.0%"
    },
    "top_providers": []
  }
}
```

### 10. Export Data
**POST** `/api/admin/export/`

Export system data as a csv.
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```
{
  "export_type": "users",
  "date_from": "2025-01-01",
  "date_to": "2025-01-31",
  "format": "csv"
}
```

**Expected Response:**
```
CSV file will be downloaded.
```

### 11. Get All Food Listings (Admin)
**GET** `/api/food-listings/admin/listings/`

Get all food listings for admin moderation with filtering and pagination.
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Query Parameters (Optional):

status=active|flagged|removed|sold_out|expired|inactive
search=pizza (searches name, description, provider email)
provider=provider@example.com
page=1
page_size=20


**Expected Response:**
```json
{
    "listings": [
        {
            "id": "uuid-here",
            "name": "Fresh Pizza Slices",
            "description": "Leftover pizza from lunch service",
            "status": "active",
            "provider_email": "restaurant@example.com",
            "provider_business_name": "Tony's Pizza",
            "admin_flagged": false,
            "admin_removal_reason": "",
            "removed_by": null,
            "removed_at": null,
            "created_at": "2025-07-16T10:00:00Z",
            "updated_at": "2025-07-16T10:00:00Z"
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 2,
        "total_count": 25,
        "has_next": true,
        "has_previous": false,
        "page_size": 20
    },
    "filters": {
        "status_counts": {
            "active": 20,
            "flagged": 3,
            "removed": 2,
            "sold_out": 15,
            "expired": 5,
            "inactive": 1
        }
    }
}