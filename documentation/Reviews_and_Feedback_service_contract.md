# Reviews and Feedback Service Contract 

## Overview

The Reviews and Feedback subsystem allows customers and NGOs to leave reviews on completed interactions (orders/donations). Food providers can view their reviews and statistics, while system administrators can moderate reviews.

**Base URL:** `https://127.0.0.1:8000`

## API Endpoints

### User Review Endpoints

#### 1. Create Review 
**POST** `/api/reviews/create/`

Create a new review for a completed interaction. 

**Authentication:** Required (Customer/NGO only)

**Request Body:**
```json
{
  "interaction_id": "uuid-string",
  "general_rating": 4,
  "general_comment": "Great food and service!",
  "food_review": "The pizza was delicious and fresh",
  "business_review": "Friendly staff and clean restaurant",
  "review_source": "popup"
}
```

**Response:**
```json
{
  "message": "Review created successfully",
  "review": {
    "id": "review-uuid",
    "general_rating": 4,
    "general_comment": "Great food and service!",
    "food_review": "The pizza was delicious and fresh",
    "business_review": "Friendly staff and clean restaurant",
    "review_source": "popup",
    "created_at": "2025-01-15T10:30:00Z",
    "time_ago": "2 hours ago",
    "reviewer": {
      "id": "user-uuid",
      "name": "John Doe",
      "user_type": "customer"
    },
    "business": {
      "id": "business-uuid",
      "business_name": "Pizza Palace",
      "business_email": "info@pizzapalace.com"
    },
    "interaction_details": {
      "id": "interaction-uuid",
      "type": "Purchase",
      "total_amount": 25.50,
      "food_items": [...]
    }
  }
}
```

#### 2. Get User's Reviews
**GET** `/api/reviews/my-reviews/`

Get all reviews written by the current user. 

**Authentication:** Required

**Response**
```json
{
    "count": 1,
    "next": null,
    "previous": null,
    "results": {
        "reviews": [
            {
                "id": "f0fc3367-55aa-4860-b87d-05ff115ede0d",
                "general_rating": 4,
                "general_comment": "mmmmm",
                "food_review": "tasty",
                "business_review": "m burgur",
                "review_source": "popup",
                "created_at": "2025-06-24T17:13:46.516236Z",
                "updated_at": "2025-06-24T17:13:46.516248Z",
                "time_ago": "Just now",
                "reviewer": {
                    "id": "a98a4941-ba1b-467e-a37b-db59ea0c2170",
                    "name": "Marky Customer",
                    "user_type": "customer"
                },
                "business": {
                    "id": 1,
                    "business_name": "Arthur's Restaurant",
                    "business_email": "example@email.com"
                },
                "interaction_details": {
                    "id": "1adcb681-16d0-4a45-8166-50967d0ff544",
                    "type": "Purchase",
                    "total_amount": 61.98,
                    "food_items": [
                        {
                            "name": "Burgar",
                            "quantity": 2,
                            "expiry_date": "2025-01-15",
                            "total_price": 61.98,
                            "price_per_item": 30.99
                        }
                    ]
                }
            }
        ],
        "total_count": 1
    }
}
```


#### 3. Check Interaction Review Status  
**GET** `/cart/interactions/{interaction_id}/review-status/`

Check if an interaction can be reviewed or already has a review. 

**Response:**
```json
{
  "interaction_id": "uuid",
  "can_review": true,
  "has_review": false,
  "review_id": null,
  "interaction_status": "completed",
  "completed_at": "2025-01-15T08:00:00Z"
}
```

### Business Review Endpoints

#### 1. Get Business Reviews
**GET** `/api/business/reviews/`
e.g. **GET** `/api/business/reviews/?rating=4&date_range=week&page=1&page_size=10`

Get all reviews for the authenticated business owner.

**Authentication:** Required (Food Provider only)

**Query Parameters:**
- `rating`: Filter by rating (1-5)
- `date_range`: Filter by date (`week`, `month`)
- `page`: Page number for pagination
- `page_size`: Number of reviews per page

**Response:**
```json
{
  "count": 25,
  "next": "http://api/business/reviews/?page=2",
  "previous": null,
  "results": {
    "reviews": [
      {
        "id": "review-uuid",
        "general_rating": 5,
        "general_comment": "Excellent service!",
        "food_review": "Best pizza in town",
        "business_review": "Very professional",
        "review_source": "history",
        "created_at": "2025-01-15T10:30:00Z",
        "time_ago": "2 hours ago",
        "reviewer": {
          "id": "user-uuid",
          "name": "Jane Smith",
          "user_type": "customer"
        },
        "interaction_details": {
          "id": "interaction-uuid",
          "type": "Purchase",
          "total_amount": 18.50,
          "completed_at": "2025-01-15T08:00:00Z",
          "food_items_count": 2
        }
      }
    ],
    "total_count": 25
  }
}
```

#### 2. Get Business Review Statistics
**GET** `/api/business/reviews/stats/`

Get review statistics for the authenticated business owner. 

**Authentication:** Required (Food Provider only)

**Response:**
```json
{
  "stats": {
    "total_reviews": 150,
    "average_rating": 4.2,
    "highest_rating": 5,
    "lowest_rating": 2,
    "reviews_this_month": 12,
    "reviews_this_week": 3,
    "rating_distribution": [2.0, 4.0, 12.0, 35.0, 47.0],
    "rating_breakdown": {
      "5_star": 71,
      "4_star": 52,
      "3_star": 18,
      "2_star": 6,
      "1_star": 3
    },
    "last_updated": "2025-01-15T12:00:00Z"
  }
}
```

#### 3. Get Interaction Review
**GET** `/cart/interactions/{interaction_id}/review/`

Get the review for a specific interaction (business owner only).

**Authentication:** Required (Food Provider only)

**Response**
```json
{
    "has_review": true,
    "interaction_id": "1adcb681-16d0-4a45-8166-50967d0ff544",
    "review": {
        "id": "f0fc3367-55aa-4860-b87d-05ff115ede0d",
        "general_rating": 4,
        "general_comment": "mmmmm",
        "food_review": "tasty",
        "business_review": "m burgur",
        "review_source": "popup",
        "created_at": "2025-06-24T17:13:46.516236+00:00",
        "reviewer": {
            "name": "Marky Customer",
            "user_type": "customer"
        },
        "interaction_details": {
            "type": "Purchase",
            "total_amount": 61.98,
            "food_items": [
                {
                    "name": "Burgar",
                    "quantity": 2,
                    "expiry_date": "2025-01-15",
                    "total_price": 61.98,
                    "price_per_item": 30.99
                }
            ]
        }
    }
}
```


### Admin Moderation Endpoints

#### 1. Get All Reviews (Admin)
**GET** `/api/admin/reviews/`

e.g. **GET** `/api/admin/reviews/?status=flagged&business=Fresh Market&page=1&page_size=15`

Get all reviews for moderation. 

**Authentication:** Required (Admin only)

**Query Parameters:**
- `status`: Filter by status (`active`, `flagged`, `censored`, `deleted`)
- `rating`: Filter by rating (1-5)
- `business`: Filter by business name
- `page`: Page number for pagination

**Response**
```json
{
    "count": 1,
    "next": null,
    "previous": null,
    "results": {
        "reviews": [
            {
                "id": "1d84653a-f611-4816-bc01-458dc319a5d3",
                "general_rating": 4,
                "general_comment": "Great food and service!",
                "food_review": "The pizza was delicious and fresh",
                "business_review": "Friendly staff and clean restaurant",
                "status": "flagged",
                "moderation_notes": "Contains offensive language",
                "moderated_by_name": "sabfa24@gmail.com",
                "moderated_at": "2025-06-23T19:07:49.146606Z",
                "created_at": "2025-06-23T16:23:04.004755Z",
                "updated_at": "2025-06-23T19:07:49.153739Z",
                "reviewer": {
                    "id": "d45c2e3c-ffaf-4380-ad8e-13b81868fe88",
                    "name": "Thomas Shelby",
                    "user_type": "customer"
                },
                "business": {
                    "id": 1,
                    "business_name": "Arthur's Restaurant",
                    "business_email": "example@email.com"
                }
            }
        ],
        "total_count": 1
    }
}
```


#### 2. Moderate Review
**POST** `/api/admin/reviews/{review_id}/moderate/`

Moderate a review. 

**Authentication:** Required (Admin only)

**Actions:** `flag`, `censor`, `delete`, `restore`

**Request Body:**
```json
{
  "action": "flag",
  "reason": "Inappropriate content",
  "moderation_notes": "Contains offensive language"
}
```
**Response**
```json
{
    "message": "Review flagged successfully",
    "review_id": "123e4567-e89b-12d3-a456-426614174000",
    "new_status": "flagged"
};
```

#### 3. Get Moderation Logs
**GET** `/api/admin/reviews/{review_id}/logs/`

Get moderation history for a review. SHAP

**Authentication:** Required (Admin only)

**Response**
```json
{
    "review_id": "f0fc3367-55aa-4860-b87d-05ff115ede0d",
    "moderation_logs": [
        {
            "id": "981bc87f-af93-46dd-988e-a23458ef0667",
            "action": "flag",
            "reason": "Too funny",
            "previous_status": "active",
            "new_status": "flagged",
            "moderator": "sabfa24@gmail.com",
            "created_at": "2025-06-24T17:42:48.485764+00:00"
        }
    ],
    "total_logs": 1
}
```

#### 4. Get Review Analytics (Admin)
**GET** `/api/admin/reviews/analytics/`

Get system-wide review analytics.

**Authentication:** Required (Admin only)

**Response**
```json
{
    "analytics": {
        "total_reviews": 2,
        "active_reviews": 0,
        "flagged_reviews": 2,
        "deleted_reviews": 0,
        "reviews_today": 1,
        "reviews_this_week": 2,
        "reviews_this_month": 2,
        "average_platform_rating": 0,
        "top_businesses_by_reviews": []
    }
}
```


## Error Handling

Error codes:
- `PERMISSION_DENIED`: User doesn't have permission
- `VALIDATION_ERROR`: Invalid data provided
- `NOT_FOUND`: Resource not found
- `CREATION_ERROR`: Failed to create review
- `UPDATE_ERROR`: Failed to update review

## Notes

1. **Review Visibility**: Reviews are only visible to the specific food provider they are about, not to other users.

2. **Review Sources**: Reviews can come from either the post-completion popup (`popup`) or from the interaction history page (`history`).

3. **Moderation**: Only users with `admin_rights = True` can moderate reviews.

4. **Statistics Caching**: Business review statistics are cached and updated automatically when reviews are created, updated, or deleted.

5. **Data Retention**: Reviews store a snapshot of interaction data for historical accuracy even if the original interaction is modified.

6. **Validation**: At least one review field (rating, general comment, food review, or business review) must be provided for a review to be valid.