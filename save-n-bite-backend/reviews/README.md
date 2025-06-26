# Review System Documentation

## Overview

The Review System allows customers and NGOs to leave reviews for food providers after completing interactions (purchases/donations). It includes moderation capabilities for admins and analytics for businesses.

## System Architecture

### Core Models

#### 1. **Review**
- **Purpose**: Stores customer/NGO reviews for completed interactions
- **Key Fields**:
  - `general_rating` (1-5 stars)
  - `general_comment`, `food_review`, `business_review` (text content)
  - `status` (active, flagged, censored, deleted)
  - `review_source` (popup, history)
- **Relationships**:
  - OneToOne with `Interaction`
  - ForeignKey to `User` (reviewer)
  - ForeignKey to `FoodProviderProfile` (business)

#### 2. **ReviewModerationLog**
- **Purpose**: Tracks all moderation actions on reviews
- **Key Fields**: `action`, `reason`, `previous_status`, `new_status`
- **Relationships**: ForeignKey to `Review` and `User` (moderator)

#### 3. **BusinessReviewStats**
- **Purpose**: Cached statistics for business performance
- **Key Fields**: `total_reviews`, `average_rating`, rating distribution counts
- **Relationships**: OneToOne with `FoodProviderProfile`

## Permission System

| User Type | Create Reviews | View Business Reviews | Moderate Reviews |
|-----------|---------------|----------------------|------------------|
| Customer  | ✅            | ❌                   | ❌               |
| NGO       | ✅            | ❌                   | ❌               |
| Provider  | ❌            | ✅ (own only)        | ❌               |
| Admin     | ❌            | ✅ (all)             | ✅               |

## 🛠️ API Endpoints

### Customer/NGO Endpoints
```http
POST   /api/reviews/create/                    # Create a review
GET    /api/reviews/my-reviews/                # Get user's reviews
GET    /api/reviews/summary/                   # Get review summary
```

### Business Owner Endpoints
```http
GET    /api/business/reviews/                  # Get business reviews
GET    /api/business/reviews/stats/            # Get review statistics
GET    /api/interactions/{id}/review/          # Get specific interaction review
```

### Admin Endpoints
```http
GET    /api/admin/reviews/                     # Get all reviews
POST   /api/admin/reviews/{id}/moderate/       # Moderate a review
GET    /api/admin/reviews/{id}/logs/           # Get moderation logs
GET    /api/admin/reviews/analytics/           # Get system analytics
```

## Business Rules

### Review Creation
- ✅ Only customers and NGOs can create reviews
- ✅ Can only review **completed** interactions
- ✅ One review per interaction (OneToOne constraint)
- ✅ Must have at least one content field (rating, comment, or specific review)
- ✅ Rating must be between 1-5 stars

### Review Visibility
- **Active**: Visible to the business and the reviewer
- **Flagged**: Visible but marked for review
- **Censored**: Hidden from participating members, visible to admins
- **Deleted**: Hidden from everyone except admins

### Moderation Actions
- **Flag**: Mark for review (remains visible)
- **Censor**: Hide from public view
- **Delete**: Remove from public (soft delete)
- **Restore**: Restore to active status

## Testing

### Run All Tests
```bash
# Run tests
DJANGO_SETTINGS_MODULE=backend.settings poetry run pytest reviews/tests.py -v

# Run tests with coverage
DJANGO_SETTINGS_MODULE=backend.settings poetry run pytest reviews/tests.py -v --cov=reviews
```

### Test Coverage Overview
- **30 comprehensive tests** covering all functionality
- **Model validation** and relationships
- **API permissions** and authentication
- **Business logic** and edge cases
- **Serializer validation**

### Test Categories
1. **ReviewModelTests** (8 tests) - Model functionality
2. **ReviewModerationTests** (2 tests) - Moderation system
3. **BusinessReviewStatsTests** (3 tests) - Statistics
4. **ReviewAPITests** (13 tests) - API endpoints
5. **ReviewSerializerTests** (3 tests) - Data validation
6. **Original tests** (1 test) - Legacy functionality

## Common Issues & Solutions

### Issue: "Permission Denied" when creating review
**Solution**: Ensure user is customer/NGO and interaction is completed

### Issue: "Review already exists"
**Solution**: Check if interaction already has a review (OneToOne constraint)

### Issue: "Validation Error - empty content"
**Solution**: Provide at least one: rating, general_comment, food_review, or business_review

## Analytics & Monitoring

### Business Dashboard Metrics
- Total reviews received
- Average rating (0.00-5.00)
- Rating distribution (1-5 stars)
- Recent activity (weekly/monthly)
- Review trends over time

### Admin Analytics
- System-wide review counts
- Moderation queue size
- Flag/censor/delete ratios
- User engagement metrics

## Integration Points

### With Interactions System
- Reviews are created after interaction completion
- Interaction data is cached in reviews for performance
- Status changes trigger review eligibility

### With Authentication System
- User profiles provide reviewer information
- Business profiles receive reviews
- Permission system enforces access control

### With Notifications System (Future)
- New review notifications to businesses
- Moderation alerts to admins
- Review response notifications to customers

## Development Workflow

### Adding New Features
1. Update models in `reviews/models.py`
2. Create/update serializers in `reviews/serializers.py`
3. Add views in `reviews/views.py`
4. Update URLs in `reviews/urls.py`
5. **Write tests first** in `reviews/tests.py`
6. Run tests: `poetry run python manage.py test reviews`

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields (status, rating, created_at)
- Cached statistics in `BusinessReviewStats`
- Efficient query patterns with select_related/prefetch_related

### Caching Strategy
- Business review statistics updated via signals
- Consider Redis caching for frequently accessed reviews
- Pagination for large review lists
