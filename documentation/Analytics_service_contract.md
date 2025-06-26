# Save n Bite Analytics App - Service Contract

## Overview

The Analytics App provides comprehensive data insights and predictive capabilities for the Save n Bite platform. It serves business users, organizations, administrators, and individual users with actionable metrics related to food waste reduction, sustainability impact, user engagement, and AI-driven predictions.

## Service Architecture

### Technology Stack
- **Backend**: Django + Django REST Framework
- **Database**: PostgreSQL (primary), Redis (caching)
- **AI/ML**: Scikit-learn, Pandas
- **Dependency Management**: Poetry

### Core Components
1. **Business Analytics Service** - Food provider performance metrics
2. **Impact Analytics Service** - Environmental and sustainability tracking
3. **AI Prediction Service** - Surplus forecasting and recommendations
4. **User Analytics Service** - Platform usage and engagement metrics
5. **Report Generation Service** - Exportable reports and visualizations

---

## API Endpoints

### 1. Business Analytics

#### GET `/api/analytics/business/`
**Purpose**: Retrieve comprehensive business analytics dashboard data

**Authentication**: Required (Food Provider only)

**Response Format**:
```json
{
  "currentMonth": {
    "ordersCompleted": 45,
    "totalRevenue": 1250.75,
    "mealsSaved": 52,
    "co2Reduced": 26.0,
    "waterSaved": 26000,
    "averageRating": 4.3,
    "repeatCustomers": 15,
    "newFollowers": 8
  },
  "previousMonth": {
    "ordersCompleted": 38,
    "totalRevenue": 980.50,
    "mealsSaved": 41,
    "co2Reduced": 20.5,
    "waterSaved": 20500,
    "averageRating": 4.1,
    "repeatCustomers": 12,
    "newFollowers": 5
  },
  "percentChanges": {
    "ordersCompleted": 18.4,
    "totalRevenue": 27.6,
    "mealsSaved": 26.8,
    "co2Reduced": 26.8,
    "averageRating": 4.9,
    "repeatCustomers": 25.0,
    "newFollowers": 60.0
  },
  "ordersPerMonth": [
    {"month": "2025-01-01T00:00:00Z", "count": 32},
    {"month": "2025-02-01T00:00:00Z", "count": 28},
    {"month": "2025-03-01T00:00:00Z", "count": 35},
    {"month": "2025-04-01T00:00:00Z", "count": 41},
    {"month": "2025-05-01T00:00:00Z", "count": 38},
    {"month": "2025-06-01T00:00:00Z", "count": 45}
  ],
  "salesVsDonations": {
    "sales": 78,
    "donations": 65
  },
  "followerGrowth": [
    {"month": "2025-01-01T00:00:00Z", "count": 5},
    {"month": "2025-02-01T00:00:00Z", "count": 3},
    {"month": "2025-03-01T00:00:00Z", "count": 7},
    {"month": "2025-04-01T00:00:00Z", "count": 6},
    {"month": "2025-05-01T00:00:00Z", "count": 5},
    {"month": "2025-06-01T00:00:00Z", "count": 8}
  ],
  "topPercentBadge": "Top 15%",
  "recommendations": [
    {
      "type": "peak_time",
      "message": "Your busiest day is Friday. Consider listing more items on Thursday evening."
    },
    {
      "type": "pricing",
      "message": "Items priced at 40-60% off have the highest pickup rate."
    }
  ]
}
```

**Error Responses**:
- `404`: Business profile not found
- `403`: Unauthorized (not a food provider)

#### GET `/api/analytics/business/export/`
**Purpose**: Export business analytics data

**Authentication**: Required (Food Provider only)

**Query Parameters**:
- `format`: `csv`, `pdf`, `json` (default: `csv`)
- `period`: `current_month`, `last_month`, `last_3_months`, `last_6_months`, `year_to_date` (default: `current_month`)

**Response**: File download or JSON with export URL

### 2. Impact Analytics

#### GET `/api/analytics/impact/`
**Purpose**: Retrieve platform-wide sustainability impact metrics

**Authentication**: Required

**Response Format**:
```json
{
  "platformTotals": {
    "totalMealsSaved": 15420,
    "totalCo2Reduced": 7710.0,
    "totalWaterSaved": 7710000,
    "activeBbusinesses": 145,
    "activeUsers": 2340,
    "totalDonations": 8950,
    "totalSales": 6470
  },
  "userImpact": {
    "personalMealsSaved": 23,
    "personalCo2Reduced": 11.5,
    "personalWaterSaved": 11500,
    "streak": 7,
    "rank": "Eco Warrior",
    "badgesEarned": ["First Purchase", "Week Saver", "Eco Warrior"]
  },
  "weeklyTrends": [
    {"week": "2025-06-01", "mealsSaved": 145, "co2Reduced": 72.5},
    {"week": "2025-06-08", "mealsSaved": 162, "co2Reduced": 81.0},
    {"week": "2025-06-15", "mealsSaved": 178, "co2Reduced": 89.0},
    {"week": "2025-06-22", "mealsSaved": 203, "co2Reduced": 101.5}
  ],
  "achievements": [
    {
      "title": "Carbon Crusher",
      "description": "Reduced 50kg CO₂ this month",
      "progress": 85,
      "target": 50,
      "unlockedAt": "2025-06-20T14:30:00Z"
    }
  ]
}
```

#### GET `/api/analytics/leaderboard/`
**Purpose**: Retrieve sustainability leaderboard

**Authentication**: Required

**Query Parameters**:
- `type`: `individual`, `business`, `organization` (default: `individual`)
- `period`: `weekly`, `monthly`, `all_time` (default: `monthly`)
- `limit`: Number of results (default: 10, max: 50)

**Response Format**:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user123",
      "displayName": "EcoWarrior2025",
      "mealsSaved": 67,
      "co2Reduced": 33.5,
      "badge": "Champion"
    }
  ],
  "userRank": {
    "position": 23,
    "mealsSaved": 23,
    "co2Reduced": 11.5
  }
}
```

### 3. AI Prediction & Recommendations

#### GET `/api/analytics/predictions/surplus/`
**Purpose**: Get AI-powered surplus food predictions

**Authentication**: Required (Food Provider only)

**Response Format**:
```json
{
  "predictions": {
    "today": {
      "expectedSurplus": 8,
      "confidence": 0.87,
      "suggestedListingTime": "15:30",
      "optimalPricing": {
        "discountRange": "40-60%",
        "expectedPickupRate": 0.92
      }
    },
    "nextWeek": [
      {
        "date": "2025-06-26",
        "dayOfWeek": "Thursday",
        "expectedSurplus": 12,
        "confidence": 0.82,
        "historicalPattern": "Typically 20% above average on Thursdays"
      }
    ]
  },
  "recommendations": [
    {
      "type": "timing",
      "priority": "high",
      "message": "List items by 3:30 PM for optimal pickup rate",
      "impact": "Increases pickup probability by 35%"
    },
    {
      "type": "pricing",
      "priority": "medium", 
      "message": "50% discount recommended for items expiring today",
      "impact": "Expected to reduce waste by 75%"
    }
  ],
  "trendAnalysis": {
    "bestPerformingDays": ["Thursday", "Friday"],
    "peakDemandHours": ["12:00-14:00", "17:00-19:00"],
    "seasonalTrends": "Summer months show 15% higher demand"
  }
}
```

#### POST `/api/analytics/predictions/retrain/`
**Purpose**: Trigger AI model retraining with new data

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "modelType": "surplus_prediction",
  "trainingPeriod": "last_6_months",
  "includeWeatherData": true
}
```

**Response Format**:
```json
{
  "status": "training_started",
  "jobId": "train_job_123456",
  "estimatedCompletionTime": "2025-06-25T16:45:00Z",
  "previousModelAccuracy": 0.847,
  "targetAccuracy": 0.850
}
```

### 4. User Analytics

#### GET `/api/analytics/user/engagement/`
**Purpose**: Retrieve user engagement analytics

**Authentication**: Required (Admin only)

**Query Parameters**:
- `period`: `daily`, `weekly`, `monthly` (default: `weekly`)
- `user_type`: `customer`, `provider`, `ngo`, `all` (default: `all`)

**Response Format**:
```json
{
  "activeUsers": {
    "daily": 456,
    "weekly": 1234,
    "monthly": 2890
  },
  "engagement": {
    "averageSessionDuration": 8.5,
    "averageListingsViewed": 12,
    "conversionRate": 0.23,
    "retentionRate": {
      "day7": 0.68,
      "day30": 0.42,
      "day90": 0.31
    }
  },
  "userGrowth": [
    {"date": "2025-06-18", "newUsers": 23, "churnedUsers": 5},
    {"date": "2025-06-19", "newUsers": 31, "churnedUsers": 7},
    {"date": "2025-06-20", "newUsers": 28, "churnedUsers": 4}
  ],
  "popularFeatures": [
    {"feature": "food_search", "usage": 87.3},
    {"feature": "impact_dashboard", "usage": 72.1},
    {"feature": "notifications", "usage": 65.8}
  ]
}
```

### 5. Report Generation

#### POST `/api/analytics/reports/generate/`
**Purpose**: Generate custom analytics reports

**Authentication**: Required

**Request Body**:
```json
{
  "reportType": "sustainability_impact",
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-06-25"
  },
  "metrics": ["meals_saved", "co2_reduced", "user_growth"],
  "groupBy": "month",
  "format": "pdf",
  "includeCharts": true,
  "recipients": ["user@business.com"]
}
```

**Response Format**:
```json
{
  "reportId": "report_123456",
  "status": "generating",
  "estimatedCompletion": "2025-06-25T15:30:00Z",
  "downloadUrl": null,
  "expiresAt": "2025-06-30T15:30:00Z"
}
```

#### GET `/api/analytics/reports/{reportId}/`
**Purpose**: Retrieve generated report status and download link

**Authentication**: Required

**Response Format**:
```json
{
  "reportId": "report_123456",
  "status": "completed",
  "downloadUrl": "https://saveandrite.s3.amazonaws.com/reports/report_123456.pdf",
  "generatedAt": "2025-06-25T15:28:00Z",
  "expiresAt": "2025-06-30T15:30:00Z",
  "fileSize": 2048576
}
```

---

## Data Models

### AnalyticsEvent
```python
class AnalyticsEvent(models.Model):
    event_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    business = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE, null=True, blank=True)
    event_type = models.CharField(max_length=50)  # 'listing_viewed', 'purchase_completed', etc.
    event_data = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
```

### SurplusPrediction
```python
class SurplusPrediction(models.Model):
    prediction_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    business = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE)
    prediction_date = models.DateField()
    predicted_surplus_count = models.IntegerField()
    confidence_score = models.FloatField()
    suggested_listing_time = models.TimeField()
    optimal_discount_percentage = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    actual_surplus_count = models.IntegerField(null=True, blank=True)  # For model accuracy tracking
```

### ImpactMetrics
```python
class ImpactMetrics(models.Model):
    metric_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    business = models.ForeignKey(FoodProviderProfile, on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateField()
    meals_saved = models.IntegerField(default=0)
    co2_reduced_kg = models.FloatField(default=0.0)
    water_saved_liters = models.FloatField(default=0.0)
    revenue_generated = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    donations_made = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### UserEngagementMetrics
```python
class UserEngagementMetrics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    session_count = models.IntegerField(default=0)
    session_duration_seconds = models.IntegerField(default=0)
    listings_viewed = models.IntegerField(default=0)
    purchases_made = models.IntegerField(default=0)
    searches_performed = models.IntegerField(default=0)
    notifications_opened = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
```

### GeneratedReport
```python
class GeneratedReport(models.Model):
    REPORT_TYPES = [
        ('business_analytics', 'Business Analytics'),
        ('sustainability_impact', 'Sustainability Impact'),
        ('user_engagement', 'User Engagement'),
        ('ai_predictions', 'AI Predictions'),
    ]
    
    FORMATS = [
        ('pdf', 'PDF'),
        ('csv', 'CSV'),
        ('json', 'JSON'),
        ('excel', 'Excel'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]
    
    report_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    format = models.CharField(max_length=10, choices=FORMATS)
    parameters = models.JSONField()  # Store report parameters
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_path = models.CharField(max_length=500, null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    error_message = models.TextField(null=True, blank=True)
```

---

## Service Classes

### AnalyticsService
```python
class AnalyticsService:
    @staticmethod
    def track_event(user, event_type, event_data, business=None, session_id=None):
        """Track analytics events"""
        
    @staticmethod
    def get_business_analytics(business, period='current_month'):
        """Get comprehensive business analytics"""
        
    @staticmethod
    def get_platform_impact_metrics(period='all_time'):
        """Get platform-wide impact metrics"""
        
    @staticmethod
    def get_user_engagement_metrics(period='weekly', user_type='all'):
        """Get user engagement analytics"""
```

### PredictionService
```python
class PredictionService:
    @staticmethod
    def predict_surplus(business, prediction_date=None):
        """Predict surplus food for a business"""
        
    @staticmethod
    def get_listing_recommendations(business, listing_data):
        """Get AI recommendations for listing optimization"""
        
    @staticmethod
    def retrain_model(model_type, training_params):
        """Retrain AI models with new data"""
        
    @staticmethod
    def evaluate_prediction_accuracy(business, date_range):
        """Evaluate prediction accuracy for model improvement"""
```

### ReportService
```python
class ReportService:
    @staticmethod
    def generate_report(user, report_type, parameters):
        """Generate analytics reports"""
        
    @staticmethod
    def get_report_status(report_id):
        """Get report generation status"""
        
    @staticmethod
    def cleanup_expired_reports():
        """Clean up expired report files"""
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific field error"
      }
    ]
  },
  "timestamp": "2025-06-25T12:00:00Z",
  "path": "/api/analytics/business/"
}
```

### Common Error Codes
- `ANALYTICS_001`: Insufficient data for analysis
- `ANALYTICS_002`: AI model not available
- `ANALYTICS_003`: Report generation failed
- `ANALYTICS_004`: Invalid date range
- `ANALYTICS_005`: Permission denied for analytics data
- `ANALYTICS_006`: Prediction service unavailable

---

## Performance Requirements

### Response Time Targets
- **Analytics Dashboard**: < 2 seconds
- **Predictions**: < 3 seconds
- **Report Generation**: Async (1-5 minutes)
- **Real-time Metrics**: < 500ms

### Caching Strategy
- **Redis**: Cache frequently accessed metrics (TTL: 5 minutes)
- **Database**: Materialized views for complex aggregations
- **CDN**: Static report files

### Scalability Considerations
- Async report generation using Celery
- Database query optimization with proper indexing
- Data archiving for historical analytics (older than 2 years)
- Horizontal scaling support for prediction services

---

## Security & Privacy

### Data Protection
- Anonymize user data in analytics aggregations
- Encrypt sensitive report files
- GDPR compliance for data retention
- Role-based access control for all analytics endpoints

### API Security
- JWT authentication required for all endpoints
- Rate limiting: 100 requests/minute per user
- Input validation and sanitization
- SQL injection prevention through ORM

---

## Integration Points

### Internal Services
- **Authentication Service**: User and business profile data
- **Food Listings Service**: Listing performance metrics
- **Interactions Service**: Transaction and engagement data
- **Notifications Service**: User engagement tracking
- **Reviews Service**: Rating and feedback analytics

### External Services
- **AWS S3**: Report file storage
- **SendGrid**: Email report delivery
- **Weather API**: Weather data for prediction models
- **Social Media APIs**: Impact sharing functionality

---

## Testing Strategy

### Unit Tests
- Service class methods
- Data aggregation functions
- AI prediction algorithms
- Report generation logic

### Integration Tests
- API endpoint functionality
- Database query performance
- Redis caching behavior
- File generation and storage

### Performance Tests
- Load testing for analytics dashboards
- Stress testing for prediction services
- Memory usage monitoring for report generation
- Database query optimization validation

---

## Deployment Configuration

### Environment Variables
```bash
# AI/ML Configuration
ML_MODEL_PATH=/app/models/
PREDICTION_BATCH_SIZE=100
MODEL_RETRAIN_SCHEDULE=0 2 * * 0  # Weekly

# Report Configuration
REPORT_STORAGE_PATH=/app/reports/
REPORT_EXPIRY_DAYS=7
MAX_REPORT_SIZE_MB=50

# Cache Configuration
ANALYTICS_CACHE_TTL=300
REDIS_ANALYTICS_DB=2

# Performance
ANALYTICS_WORKER_PROCESSES=4
MAX_CONCURRENT_REPORTS=10
```

### Monitoring & Logging
- Application performance monitoring (APM)
- Error tracking and alerting
- Analytics query performance logging
- AI model accuracy monitoring
- Report generation success/failure rates

---

## Future Enhancements

### Planned Features
1. **Real-time Analytics**: WebSocket-based live dashboards
2. **Advanced ML Models**: Deep learning for demand forecasting
3. **Mobile Analytics**: App-specific engagement metrics
4. **Blockchain Analytics**: Token transaction tracking
5. **Comparative Analytics**: Industry benchmarking
6. **Predictive Maintenance**: System health predictions
7. **A/B Testing Framework**: Feature performance testing
8. **Custom Dashboard Builder**: User-configurable analytics views

### API Versioning
- Current version: v1
- Backward compatibility for 2 major versions
- Deprecation notices 6 months before removal
- Migration guides for version updates