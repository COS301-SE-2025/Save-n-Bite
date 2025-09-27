# Badges Service API Contract

## Overview
This document defines the API contract for the Save n Bite badges system, which manages achievement badges for food providers.

## Base URL
```
https://your-domain.com/api/badges/
```

## Authentication
All provider-specific endpoints require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

## Data Models

### BadgeType
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "category": "performance|milestone|recognition|monthly|special",
  "category_display": "string",
  "rarity": "common|uncommon|rare|epic|legendary",
  "rarity_display": "string",
  "svg_filename": "string",
  "criteria_description": "string",
  "display_order": "integer"
}
```

### ProviderBadge
```json
{
  "id": "uuid",
  "badge_type": "BadgeType",
  "earned_date": "datetime",
  "earned_date_formatted": "string",
  "earned_reason": "string",
  "badge_data": "object",
  "is_pinned": "boolean",
  "pin_order": "integer",
  "month": "integer|null",
  "year": "integer|null",
  "month_year_display": "string|null"
}
```

### BadgeStats
```json
{
  "total_badges": "integer",
  "performance_badges": "integer",
  "milestone_badges": "integer",
  "recognition_badges": "integer",
  "monthly_badges": "integer",
  "special_badges": "integer",
  "common_badges": "integer",
  "uncommon_badges": "integer",
  "rare_badges": "integer",
  "epic_badges": "integer",
  "legendary_badges": "integer",
  "pinned_badges_count": "integer",
  "first_badge_earned": "datetime|null",
  "latest_badge_earned": "datetime|null",
  "rarity_score": "integer"
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### GET /types/
Get all available badge types.

**Query Parameters:**
- `category` (optional): Filter by category
- `rarity` (optional): Filter by rarity

**Response:**
```json
[BadgeType, ...]
```

#### GET /categories/
Get all badge categories with counts.

**Response:**
```json
{
  "categories": [
    {
      "category": "string",
      "display_name": "string", 
      "badge_count": "integer"
    }
  ]
}
```

#### GET /rarities/
Get all badge rarities with counts.

**Response:**
```json
{
  "rarities": [
    {
      "rarity": "string",
      "display_name": "string",
      "badge_count": "integer"
    }
  ]
}
```

#### GET /provider/{provider_id}/
Get public badges for a specific provider.

**Parameters:**
- `provider_id`: UUID of the provider

**Response:**
```json
{
  "provider_info": {
    "provider_id": "uuid",
    "business_name": "string"
  },
  "badges": [ProviderBadge, ...],
  "stats": BadgeStats|null,
  "is_own_profile": "boolean"
}
```

#### GET /leaderboard/
Get public badge leaderboard.

**Query Parameters:**
- `limit` (optional): Number of results (1-50, default: 10)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": "integer",
      "provider_name": "string",
      "provider_id": "uuid", 
      "total_badges": "integer",
      "rarity_score": "integer",
      "latest_badge_date": "datetime",
      "badge_breakdown": {
        "legendary": "integer",
        "epic": "integer",
        "rare": "integer",
        "uncommon": "integer",
        "common": "integer"
      }
    }
  ],
  "total_providers": "integer",
  "generated_at": "datetime"
}
```

#### GET /leaderboard/monthly/
Get monthly leaderboards.

**Query Parameters:**
- `year` (optional): Year filter
- `month` (optional): Month filter (1-12)

**Response:**
```json
{
  "leaderboards": [
    {
      "id": "uuid",
      "leaderboard_type": "string",
      "leaderboard_type_display": "string",
      "month": "integer",
      "year": "integer",
      "month_year_display": "string",
      "first_place_name": "string|null",
      "first_place_value": "decimal|null",
      "second_place_name": "string|null", 
      "second_place_value": "decimal|null",
      "third_place_name": "string|null",
      "third_place_value": "decimal|null",
      "calculated_at": "datetime",
      "is_finalized": "boolean"
    }
  ],
  "month": "integer",
  "year": "integer"
}
```


























### Provider Endpoints (Requires Provider Authentication)

#### GET /my-badges/
Get all badges for authenticated provider.

**Response:**
```json
{
  "provider_info": {
    "provider_id": "uuid",
    "business_name": "string"
  },
  "badges": {
    "all_badges": [ProviderBadge, ...],
    "pinned_badges": [ProviderBadge, ...],
    "total_count": "integer",
    "categories": {
      "performance": "integer",
      "milestone": "integer",
      "recognition": "integer",
      "monthly": "integer",
      "special": "integer"
    }
  },
  "stats": BadgeStats
}
```

#### GET /progress/
Get progress toward earning badges.

**Response:**
```json
{
  "provider_stats": {
    "total_orders": "integer",
    "total_reviews": "integer",
    "average_rating": "decimal",
    "total_revenue": "decimal",
    "days_active": "integer"
  },
  "milestone_progress": [
    {
      "badge_name": "string",
      "current_value": "number",
      "target_value": "number", 
      "progress_percentage": "number",
      "is_earned": "boolean",
      "additional_requirement": "string|null"
    }
  ],
  "next_achievable_badges": [...]
}
```

#### POST /pin/
Pin or unpin a badge to profile.

**Request Body:**
```json
{
  "badge_id": "uuid",
  "pin_action": "pin|unpin"
}
```

**Response:**
```json
{
  "message": "string",
  "pinned_badges": [ProviderBadge, ...],
  "pinned_count": "integer"
}
```

#### GET /download/{badge_id}/
Get badge download information.

**Parameters:**
- `badge_id`: UUID of the badge

**Response:**
```json
{
  "badge_info": {
    "id": "uuid",
    "name": "string",
    "svg_filename": "string",
    "description": "string",
    "earned_date": "datetime",
    "provider_name": "string"
  },
  "download_url": "string",
  "message": "string"
}
```

#### POST /recalculate/
Manually trigger badge recalculation.

**Response:**
```json
{
  "message": "string",
  "badges_awarded": "integer",
  "new_badges": [ProviderBadge, ...]
}
```

### Admin Endpoints (Requires Admin Authentication)

#### POST /admin/calculate-all/
Calculate badges for all providers.

**Response:**
```json
{
  "message": "string",
  "results": {
    "providers_processed": "integer",
    "badges_awarded": "integer",
    "errors": ["string", ...]
  }
}
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object|null"
  }
}
```

### Common Error Codes:
- `PERMISSION_DENIED` (403): User lacks required permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Request data validation failed
- `AUTHENTICATION_REQUIRED` (401): Valid authentication required
- `SERVER_ERROR` (500): Internal server error

## Badge System Rules

### Badge Categories:
- **Performance**: Competition-based badges (Top Provider rankings)
- **Milestone**: Achievement-based badges (First Order, Review Magnet, etc.)
- **Recognition**: Quality-based badges (Excellence, Perfect Rating)
- **Monthly**: Time-limited recurring badges (Provider of the Month)
- **Special**: Unique recognition badges (Early Adopter, Community Builder)

### Badge Rarities:
- **Common**: Easy to achieve milestones
- **Uncommon**: Moderate achievements 
- **Rare**: Difficult accomplishments
- **Epic**: Outstanding performance
- **Legendary**: Exceptional achievements

### Pinning Rules:
- Maximum 5 pinned badges per provider
- Pinned badges appear on public profile
- Providers can reorder pinned badges

### Automatic Award Triggers:
- Order completion
- Review creation/updates
- Monthly calculations (scheduled)
- Manual recalculation requests

## Rate Limits
- Public endpoints: 100 requests/hour per IP
- Authenticated endpoints: 1000 requests/hour per user
- Admin endpoints: No rate limit

## Service Level Agreement

### Availability:
- 99.9% uptime guarantee
- Scheduled maintenance windows: Sundays 2-4 AM UTC

### Performance:
- Badge calculation: < 2 seconds for individual providers
- API response time: < 500ms for standard requests
- Leaderboard generation: < 5 seconds

### Data Consistency:
- Badge awards are atomic and consistent
- Statistics are eventually consistent (updated within 1 hour)
- Manual recalculation available for immediate consistency

## Integration Guidelines

### Frontend Integration:
1. Use public endpoints for displaying provider badges
2. Implement proper error handling for all API calls
3. Cache badge types and categories (update daily)
4. Handle authentication expiration gracefully

### Badge Display:
- SVG assets stored at `/public/assets/images/badges/{svg_filename}`
- Implement fallback images for missing badge assets
- Use rarity colors for consistent UI theming

### Notification Integration:
- Listen for badge earned notifications
- Display achievement celebrations to providers
- Send congratulatory messages for rare/legendary badges

## Webhook Events (Optional)

If webhook integration is enabled:

### badge.earned
```json
{
  "event": "badge.earned",
  "provider_id": "uuid",
  "badge": ProviderBadge,
  "timestamp": "datetime"
}
```

### leaderboard.updated
```json
{
  "event": "leaderboard.updated", 
  "leaderboard_type": "string",
  "month": "integer",
  "year": "integer",
  "rankings": [...],
  "timestamp": "datetime"
}
```