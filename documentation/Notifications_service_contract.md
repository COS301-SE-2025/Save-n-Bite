# Save n Bite - Notifications App Service Contract

**Project:** Save n Bite  
**App:** Notifications  
**Version:** 1.0  
**Date:** June 25, 2025  
**Team:** Secure Web & Mobile Guild  

---

## 1. Overview

The Notifications app is the communication backbone of the Save n Bite platform, managing real-time alerts, email notifications, push notifications, and user engagement features. It ensures users stay informed about new listings, pickup reminders, system updates, and business activities.

### 1.1 Purpose
- Deliver real-time in-app notifications
- Send email notifications with HTML templates
- Manage user notification preferences
- Handle business following/follower relationships
- Provide push notification infrastructure
- Support bulk notification campaigns

### 1.2 Key Features
- **Multi-Channel Notifications**: In-app, email, and push notifications
- **Real-time Delivery**: WebSocket-based instant notifications
- **User Preferences**: Granular notification control
- **Business Following**: Customer-business relationship management
- **Template System**: Rich HTML email templates
- **Analytics**: Notification delivery tracking and engagement metrics

---

## 2. Architecture & Technology Stack

### 2.1 Backend Architecture
- **Framework**: Django 4.x with Django REST Framework
- **Real-time**: Django Channels with WebSocket support
- **Database**: PostgreSQL (primary), Redis (caching & pub/sub)
- **Message Queue**: Celery with Redis broker
- **Email Service**: Django Email with SMTP/AWS SES support
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### 2.2 Core Dependencies
```python
# Django & Channels
Django>=4.2.0
djangorestframework>=3.14.0
channels>=4.0.0
channels-redis>=4.0.0

# Task Processing
celery>=5.2.0
django-celery-beat>=2.4.0
redis>=4.5.0

# Email & Templates
django-extensions>=3.2.0
premailer>=3.10.0  # For inline CSS in emails

# Push Notifications
firebase-admin>=6.0.0
pyfcm>=1.5.0

# WebSocket Support
daphne>=4.0.0
asgi-redis>=1.4.0
```

### 2.3 Database Schema
```sql
-- Core Models
- Notification (in-app notifications)
- NotificationPreferences (user settings)
- BusinessFollower (following relationships)
- EmailNotificationLog (email tracking)
- PushNotificationLog (push notification tracking)
- NotificationTemplate (email templates)
- BulkNotificationCampaign (marketing campaigns)
```

---

## 3. API Endpoints Specification

### 3.1 Authentication Requirements
All endpoints require authentication via JWT Bearer token:
```http
Authorization: Bearer <jwt_token>
```

### 3.2 Core Notification Endpoints

#### 3.2.1 Get User Notifications
```http
GET /api/notifications/
Query Parameters:
- page: 1
- page_size: 20
- is_read: true|false
- notification_type: new_listing|listing_expiring|business_update|system_announcement|welcome
- date_from: 2025-06-01
- date_to: 2025-06-30
```

**Response (200 OK):**
```json
{
    "count": 45,
    "unread_count": 12,
    "next": "http://api.com/notifications/?page=2",
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "notification_type": "new_listing",
            "title": "New Pizza Available!",
            "message": "Fresh margherita pizza just posted at Mario's Restaurant",
            "data": {
                "listing_id": "uuid",
                "business_id": "uuid",
                "price": "12.50",
                "expiry_date": "2025-06-26T18:00:00Z"
            },
            "sender": {
                "id": "uuid",
                "name": "Mario's Restaurant",
                "user_type": "provider"
            },
            "business": {
                "id": "uuid",
                "name": "Mario's Restaurant",
                "logo": "https://s3.amazonaws.com/logo.jpg"
            },
            "is_read": false,
            "is_deleted": false,
            "created_at": "2025-06-25T14:30:00Z",
            "read_at": null
        }
    ]
}
```

#### 3.2.2 Get Unread Count
```http
GET /api/notifications/unread-count/
```

**Response (200 OK):**
```json
{
    "unread_count": 12
}
```

#### 3.2.3 Mark Notifications as Read
```http
POST /api/notifications/mark-read/
Content-Type: application/json

{
    "notification_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200 OK):**
```json
{
    "message": "3 notifications marked as read",
    "marked_count": 3,
    "unread_count": 9
}
```

#### 3.2.4 Mark All Notifications as Read
```http
POST /api/notifications/mark-all-read/
```

**Response (200 OK):**
```json
{
    "message": "All notifications marked as read",
    "marked_count": 12,
    "unread_count": 0
}
```

#### 3.2.5 Delete Notification
```http
DELETE /api/notifications/{notification_id}/delete/
```

**Response (200 OK):**
```json
{
    "message": "Notification deleted successfully"
}
```

### 3.3 Notification Preferences Endpoints

#### 3.3.1 Get User Preferences
```http
GET /api/notifications/preferences/
```

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

#### 3.3.2 Update User Preferences
```http
PUT /api/notifications/preferences/
Content-Type: application/json

{
    "email_notifications": true,
    "new_listing_notifications": true,
    "promotional_notifications": false,
    "weekly_digest": false
}

```

**Response (200 OK):**
```json
{
    "message": "Notification preferences updated successfully",
    "preferences": {
        "email_notifications": true,
        "new_listing_notifications": true,
        "promotional_notifications": false,
        "weekly_digest": false
    }
}
```

### 3.4 Business Following Endpoints

#### 3.4.1 Follow Business
```http
POST /api/follow/
Content-Type: application/json

{
    "business_id": "uuid"
}
```

**Response (201 Created):**
```json
{
    "message": "Successfully followed business",
    "follower_id": "uuid",
    "created": true,
    "business": {
        "id": "uuid",
        "name": "Mario's Restaurant",
        "logo": "https://s3.amazonaws.com/logo.jpg"
    }
}
```

#### 3.4.2 Unfollow Business
```http
DELETE /api/unfollow/{business_id}/
```

**Response (200 OK):**
```json
{
    "message": "Successfully unfollowed business"
}
```

#### 3.4.3 Get Following List
```http
GET /api/following/
Query Parameters:
- page: 1
- page_size: 20
```

**Response (200 OK):**
```json
{
    "count": 15,
    "results": [
        {
            "id": "uuid",
            "business": {
                "id": "uuid",
                "name": "Mario's Restaurant",
                "logo": "https://s3.amazonaws.com/logo.jpg",
                "address": "123 Main St, Pretoria",
                "rating": 4.5,
                "followers_count": 234
            },
            "followed_at": "2025-06-15T10:30:00Z",
            "notification_count": 5
        }
    ]
}
```

#### 3.4.4 Get Business Followers (Business Only)
```http
GET /api/followers/
Query Parameters:
- page: 1
- page_size: 50
- user_type: customer|ngo
```

**Response (200 OK):**
```json
{
    "count": 234,
    "results": [
        {
            "id": "uuid",
            "user": {
                "id": "uuid",
                "name": "Jane Smith",
                "user_type": "customer",
                "profile_image": "https://s3.amazonaws.com/profile.jpg"
            },
            "followed_at": "2025-06-15T10:30:00Z",
            "engagement_score": 8.5
        }
    ]
}
```

---

## 4. WebSocket Events

### 4.1 Real-time Notification Events
```javascript
// Connect to WebSocket
const socket = new WebSocket('wss://api.savenbiteguild.com/ws/notifications/');

// Incoming notification event
{
    "type": "notification.new",
    "data": {
        "notification_id": "uuid",
        "notification_type": "new_listing",
        "title": "New Pizza Available!",
        "message": "Fresh margherita pizza just posted at Mario's Restaurant",
        "sender": {
            "name": "Mario's Restaurant",
            "logo": "https://s3.amazonaws.com/logo.jpg"
        },
        "data": {
            "listing_id": "uuid",
            "business_id": "uuid"
        },
        "created_at": "2025-06-25T14:30:00Z"
    }
}

// Notification read event
{
    "type": "notification.read",
    "data": {
        "notification_id": "uuid",
        "unread_count": 11
    }
}

// Bulk read event
{
    "type": "notifications.bulk_read",
    "data": {
        "marked_count": 5,
        "unread_count": 6
    }
}
```

### 4.2 Business Activity Events
```javascript
// New follower notification (for businesses)
{
    "type": "business.new_follower",
    "data": {
        "follower": {
            "id": "uuid",
            "name": "Jane Smith",
            "user_type": "customer"
        },
        "total_followers": 235
    }
}

// Interaction status update
{
    "type": "interaction.status_changed",
    "data": {
        "interaction_id": "uuid",
        "old_status": "pending",
        "new_status": "confirmed",
        "customer": {
            "name": "Jane Smith"
        }
    }
}
```

---

## 5. Email Template System

### 5.1 Template Structure
```html
<!-- base_email.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ subject }}</title>
    <style>
        /* Inline CSS for email compatibility */
        .header { background-color: #2E7D32; color: white; padding: 20px; }
        .content { padding: 20px; font-family: Arial, sans-serif; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Save n Bite</h1>
    </div>
    <div class="content">
        {% block content %}{% endblock %}
    </div>
    <div class="footer">
        <p>&copy; 2025 Save n Bite. All rights reserved.</p>
        <p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p>
    </div>
</body>
</html>
```

### 5.2 Notification Templates

#### New Listing Template
```html
<!-- new_listing.html -->
{% extends 'notifications/emails/base_email.html' %}
{% block content %}
<h2>🍕 New Food Available at {{ business_name }}!</h2>
<p>Hi {{ user_name }},</p>
<p>{{ business_name }} just posted a new food item that might interest you:</p>

<div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px;">
    <h3>{{ listing_name }}</h3>
    <p><strong>Price:</strong> R{{ price }}</p>
    <p><strong>Available until:</strong> {{ expiry_date|date:"F j, Y g:i A" }}</p>
    <p><strong>Pickup location:</strong> {{ pickup_location }}</p>
</div>

<a href="{{ listing_url }}" style="background-color: #2E7D32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
    View Details
</a>

<p style="margin-top: 20px;">
    Best regards,<br>
    The Save n Bite Team
</p>
{% endblock %}
```

#### Pickup Reminder Template
```html
<!-- pickup_reminder.html -->
{% extends 'notifications/emails/base_email.html' %}
{% block content %}
<h2>📋 Pickup Reminder</h2>
<p>Hi {{ user_name }},</p>
<p>This is a friendly reminder about your upcoming food pickup:</p>

<div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px;">
    <h3>Order #{{ order_number }}</h3>
    <p><strong>Pickup Time:</strong> {{ pickup_time|date:"F j, Y g:i A" }}</p>
    <p><strong>Location:</strong> {{ pickup_location }}</p>
    <p><strong>Contact:</strong> {{ contact_person }} - {{ contact_phone }}</p>
    <p><strong>Confirmation Code:</strong> <code>{{ confirmation_code }}</code></p>
</div>

<p><strong>Items to collect:</strong></p>
<ul>
    {% for item in items %}
    <li>{{ item.quantity }}x {{ item.name }}</li>
    {% endfor %}
</ul>

<p style="color: #ff6600;">
    <strong>Note:</strong> Please arrive on time to ensure food quality and availability.
</p>
{% endblock %}
```

---

## 6. Notification Types & Triggers

### 6.1 System Notification Types

| Type | Trigger | Recipients | Channels |
|------|---------|------------|----------|
| `new_listing` | Business creates food listing | Followers | In-app, Email, Push |
| `listing_expiring` | 2 hours before expiry | Interested users | In-app, Push |
| `pickup_reminder` | 1 hour before pickup | Customer/NGO | In-app, Email, SMS |
| `interaction_confirmed` | Business confirms order | Customer/NGO | In-app, Push |
| `interaction_completed` | Pickup completed | Customer/NGO | In-app |
| `review_received` | Customer leaves review | Business | In-app, Email |
| `business_update` | Business profile changes | Followers | In-app |
| `system_announcement` | Admin broadcasts | All users | In-app, Email |
| `welcome` | User registration complete | New user | Email |
| `verification_status` | Account verification update | User | In-app, Email |

### 6.2 Automated Notification Flows

#### New Listing Flow
```python
# When business creates listing
1. Check followers of business
2. Filter by notification preferences
3. Create in-app notifications
4. Queue email notifications
5. Send push notifications
6. Log delivery status
```

#### Pickup Reminder Flow
```python
# 24 hours before pickup
1. Send initial reminder (email)

# 1 hour before pickup
2. Send urgent reminder (push + SMS)

# 30 minutes after scheduled time
3. Send missed pickup notification
```

---

## 7. Error Handling

### 7.1 Standard Error Format
```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": {
            "field": ["Specific validation error"]
        }
    }
}
```

### 7.2 Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request data validation failed |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | PERMISSION_DENIED | Insufficient permissions |
| 404 | NOT_FOUND | Notification/Business not found |
| 409 | ALREADY_FOLLOWING | User already follows business |
| 422 | NOTIFICATION_LIMIT_EXCEEDED | Daily notification limit reached |
| 429 | RATE_LIMITED | Too many requests |
| 500 | DELIVERY_FAILED | Notification delivery failed |

### 7.3 Specific Error Examples

#### Follow Business Errors
```json
{
    "error": {
        "code": "BUSINESS_NOT_FOUND",
        "message": "Business profile not found",
        "details": {
            "business_id": "uuid"
        }
    }
}
```

#### Notification Delivery Errors
```json
{
    "error": {
        "code": "EMAIL_DELIVERY_FAILED",
        "message": "Failed to send email notification",
        "details": {
            "recipient": "user@example.com",
            "smtp_error": "550 Mailbox unavailable"
        }
    }
}
```

---

## 8. Business Rules & Validation

### 8.1 Notification Creation Rules
- Users cannot send notifications to themselves
- Notification content must not exceed character limits
- Bulk notifications require admin permissions
- Notification scheduling cannot be more than 30 days in advance

### 8.2 Following Rules
- Only customers and NGOs can follow businesses
- Businesses cannot follow other businesses
- Users can follow maximum 100 businesses
- Following relationships are soft-deleted (can be restored)

### 8.3 Delivery Rules
- Respect user notification preferences
- Honor quiet hours (22:00 - 07:00)
- Limit push notifications to 5 per day per user
- Email notifications limited to 20 per day per user

### 8.4 Privacy Rules
- Users can opt out of all notifications
- Email unsubscribe must be one-click
- Notification data cannot be shared with third parties
- Personal data in notifications expires after 90 days

---

## 9. Performance Requirements

### 9.1 Response Time Targets
- Get notifications: < 300ms
- Mark as read: < 200ms
- WebSocket connection: < 100ms
- Email delivery: < 30 seconds
- Push notification: < 5 seconds

### 9.2 Throughput Requirements
- Handle 10,000+ concurrent WebSocket connections
- Process 1,000+ notifications per minute
- Support 100+ simultaneous email sends
- Handle 500+ push notifications per second

### 9.3 Scalability Targets
- Support 100,000+ registered users
- Handle 1M+ notifications per day
- Store 6 months of notification history
- Support 10,000+ business accounts

---

## 10. Security Requirements

### 10.1 Authentication & Authorization
- JWT token validation for all endpoints
- Role-based access control
- Rate limiting per user/IP
- CORS protection

### 10.2 Data Protection
- Encrypt sensitive notification data
- Sanitize all user input
- Secure WebSocket connections (WSS)
- Audit logging for admin actions

### 10.3 Privacy Compliance
- GDPR compliance for EU users
- POPIA compliance for South African users
- Data retention policies
- Right to be forgotten implementation

---

## 11. Integration Points

### 11.1 Internal Service Dependencies
- **Authentication Service**: User profiles and permissions
- **Interactions Service**: Transaction status updates
- **Food Listings Service**: New listing notifications
- **Scheduling Service**: Pickup reminders
- **Analytics Service**: Engagement tracking

### 11.2 External Service Dependencies
- **AWS SES**: Email delivery service
- **Firebase FCM**: Push notification service
- **Twilio**: SMS notification service
- **AWS S3**: Image storage for rich notifications
- **Redis**: WebSocket session management

### 11.3 Event-Driven Architecture
```python
# Django Signals Integration
from django.dispatch import receiver
from food_listings.signals import listing_created
from interactions.signals import interaction_status_changed

@receiver(listing_created)
def handle_new_listing(sender, listing, **kwargs):
    NotificationService.notify_followers_new_listing(
        business_profile=listing.provider.provider_profile,
        listing_data=listing
    )

@receiver(interaction_status_changed)
def handle_interaction_update(sender, interaction, old_status, **kwargs):
    NotificationService.notify_interaction_status_change(
        interaction=interaction,
        old_status=old_status
    )
```

---

## 12. Monitoring & Analytics

### 12.1 Key Metrics
- **Delivery Rates**: In-app, email, push success rates
- **Engagement Rates**: Read rates, click-through rates
- **User Behavior**: Notification preferences, opt-out rates
- **Performance**: Response times, error rates

### 12.2 Monitoring Tools
- **Application Performance**: New Relic/DataDog
- **Email Analytics**: AWS SES metrics
- **Push Analytics**: Firebase Analytics
- **Custom Dashboards**: Grafana with Prometheus

### 12.3 Alerting
- High error rates (>5%)
- Low delivery rates (<90%)
- WebSocket connection failures
- Queue backup (>1000 pending)

---

## 13. Testing Strategy

### 13.1 Unit Tests
- Notification service methods
- Serializer validation
- Permission classes
- Template rendering

### 13.2 Integration Tests
- API endpoint functionality
- WebSocket communication
- Email delivery flow
- Push notification delivery

### 13.3 Performance Tests
- WebSocket connection load
- Bulk notification processing
- Database query optimization
- Cache effectiveness

### 13.4 Test Coverage Requirements
- Minimum 90% code coverage
- 100% coverage for critical notification paths
- End-to-end notification delivery tests

---

## 14. Deployment & Operations

### 14.1 Environment Configuration
```python
# Production Settings
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('elasticache.amazonaws.com', 6379)],
            'capacity': 1500,
            'expiry': 10,
        },
    },
}

# Celery Configuration
CELERY_BROKER_URL = 'redis://elasticache.amazonaws.com:6379/2'
CELERY_BEAT_SCHEDULE = {
    'send-pickup-reminders': {
        'task': 'notifications.tasks.send_pickup_reminders',
        'schedule': crontab(minute='*/30'),
    },
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=2, minute=0),
    },
}

# Email Configuration
EMAIL_BACKEND = 'django_ses.SESBackend'
AWS_SES_REGION_NAME = 'us-east-1'
AWS_SES_REGION_ENDPOINT = 'email.us-east-1.amazonaws.com'
```

### 14.2 Scaling Considerations
- WebSocket server clustering
- Celery worker horizontal scaling
- Redis cluster for high availability
- Database read replicas for notifications

### 14.3 Backup & Recovery
- PostgreSQL automated backups
- Redis backup for WebSocket sessions
- Email template version control
- Notification history archival

---

## 15. Future Enhancements

### 15.1 Planned Features
- **Rich Notifications**: Images, videos, interactive buttons
- **Smart Scheduling**: AI-powered optimal delivery times
- **Multi-Language**: Localized notification templates
- **Advanced Targeting**: ML-based user segmentation
- **Analytics Dashboard**: Business-facing notification insights

### 15.2 Technology Roadmap
- **Progressive Web App**: Web push notifications
- **Voice Notifications**: Integration with voice assistants
- **Chatbot Integration**: WhatsApp/Telegram notifications
- **Blockchain**: Decentralized notification verification

---

## 16. Appendix

### 16.1 Notification Frequency Limits

| User Type | In-App | Email | Push | SMS |
|-----------|--------|-------|------|-----|
| Customer | 50/day | 10/day | 5/day | 2/day |
| NGO | 100/day | 20/day | 10/day | 5/day |
| Provider | 200/day | 50/day | 20/day | 10/day |
| Admin | Unlimited | 100/day | 50/day | 20/day |

### 16.2 Quiet Hours Configuration
- **Default**: 22:00 - 07:00 SAST
- **Customizable**: Users can set personal quiet hours
- **Emergency Override**: Critical notifications bypass quiet hours
- **Timezone Aware**: Respects user's local timezone

### 16.3 Glossary
- **In-App Notification**: Notifications displayed within the application
- **Push Notification**: Device-level notifications via FCM
- **WebSocket**: Real-time bidirectional communication protocol
- **Business Follower**: User who subscribes to business notifications
- **Notification Template**: Pre-designed email/notification format
- **Bulk Campaign**: Mass notification sent to multiple users
- **Engagement Rate**: Percentage of notifications that users interact with

### 16.4 Sample Notification Payloads

#### New Listing Notification
```json
{
    "notification_type": "new_listing",
    "title": "🍕 New Pizza at Mario's Restaurant",
    "message": "Fresh margherita pizza available for pickup today!",
    "data": {
        "listing_id": "550e8400-e29b-41d4-a716-446655440000",
        "business_id": "660f9500-f39c-52e5-b827-557766551111",
        "listing_name": "Margherita Pizza",
        "price": "12.50",
        "currency": "ZAR",
        "expiry_date": "2025-06-26T18:00:00Z",
        "pickup_location": "Main Counter",
        "image_url": "https://s3.amazonaws.com/food-images/pizza.jpg",
        "deep_link": "savenbiteguild://listing/550e8400-e29b-41d4-a716-446655440000"
    },
    "action_buttons": [
        {
            "text": "View Details",
            "action": "view_listing",
            "url": "/listings/550e8400-e29b-41d4-a716-446655440000"
        },
        {
            "text": "Add to Cart",
            "action": "add_to_cart",
            "listing_id": "550e8400-e29b-41d4-a716-446655440000"
        }
    ]
}
```

#### Pickup Reminder Notification
```json
{
    "notification_type": "pickup_reminder",
    "title": "📋 Pickup Reminder - Order #12345",
    "message": "Your food pickup is scheduled in 1 hour at Mario's Restaurant",
    "data": {
        "interaction_id": "770g0600-g40d-63f6-c938-668877662222",
        "order_number": "SNB-2025-12345",
        "pickup_time": "2025-06-26T15:30:00Z",
        "pickup_location": "123 Main Street, Pretoria",
        "contact_person": "John Smith",
        "contact_phone": "+27123456789",
        "confirmation_code": "ABC123",
        "total_items": 3,
        "total_amount": "25.50",
        "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?data=ABC123"
    },
    "action_buttons": [
        {
            "text": "Get Directions",
            "action": "open_maps",
            "coordinates": "-25.7479,28.2293"
        },
        {
            "text": "Call Restaurant",
            "action": "call_phone",
            "phone": "+27123456789"
        }
    ]
}
```

### 16.5 WebSocket Connection Management

#### Connection Establishment
```javascript
// Frontend WebSocket connection
const notificationSocket = new WebSocket(
    'wss://api.savenbiteguild.com/ws/notifications/' + userId + '/'
);

notificationSocket.onopen = function(e) {
    console.log('Notification WebSocket connected');
    // Send authentication token
    notificationSocket.send(JSON.stringify({
        'type': 'authenticate',
        'token': localStorage.getItem('jwt_token')
    }));
};

notificationSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    handleNotificationEvent(data);
};

notificationSocket.onclose = function(e) {
    console.log('WebSocket connection closed');
    // Implement reconnection logic
    setTimeout(function() {
        connectWebSocket();
    }, 3000);
};
```

#### Server-Side Consumer
```python
# notifications/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .services import NotificationService

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.notification_group_name = f'notifications_{self.user_id}'
        
        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave notification group
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['type']

        if message_type == 'authenticate':
            token = text_data_json['token']
            user = await self.authenticate_user(token)
            if user:
                self.user = user
                await self.send(text_data=json.dumps({
                    'type': 'authentication_success',
                    'user_id': str(user.id)
                }))

    async def notification_message(self, event):
        # Send notification to WebSocket
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def authenticate_user(self, token):
        # Implement JWT token validation
        try:
            from rest_framework_simplejwt.tokens import UntypedToken
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            
            UntypedToken(token)
            # Extract user from token and return
            return User.objects.get(id=self.user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None
```

### 16.6 Background Task Processing

#### Celery Tasks
```python
# notifications/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .services import NotificationService
from .models import Notification
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_email_notification(self, notification_id, template_name, context):
    """Send email notification asynchronously"""
    try:
        notification = Notification.objects.get(id=notification_id)
        success = NotificationService.send_email_notification(
            user=notification.recipient,
            subject=notification.title,
            template_name=template_name,
            context=context,
            notification=notification
        )
        
        if not success:
            raise Exception("Email sending failed")
            
        logger.info(f"Email sent successfully for notification {notification_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email for notification {notification_id}: {str(e)}")
        if self.request.retries < self.max_retries:
            # Retry with exponential backoff
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        return False

@shared_task
def send_pickup_reminders():
    """Send pickup reminders for upcoming appointments"""
    from interactions.models import ScheduledPickup
    
    # Get pickups scheduled for next hour
    next_hour = timezone.now() + timedelta(hours=1)
    upcoming_pickups = ScheduledPickup.objects.filter(
        scheduled_date=next_hour.date(),
        scheduled_start_time__lte=next_hour.time(),
        scheduled_start_time__gte=(next_hour - timedelta(minutes=30)).time(),
        status='scheduled',
        reminder_sent=False
    )
    
    for pickup in upcoming_pickups:
        # Create pickup reminder notification
        NotificationService.create_pickup_reminder(pickup)
        pickup.reminder_sent = True
        pickup.save()
        
    logger.info(f"Sent {upcoming_pickups.count()} pickup reminders")

@shared_task
def cleanup_old_notifications():
    """Clean up old notifications based on retention policy"""
    cutoff_date = timezone.now() - timedelta(days=90)
    
    # Soft delete old notifications
    old_notifications = Notification.objects.filter(
        created_at__lt=cutoff_date,
        is_deleted=False
    )
    
    count = old_notifications.update(is_deleted=True)
    logger.info(f"Cleaned up {count} old notifications")

@shared_task
def send_weekly_digest():
    """Send weekly digest emails to users who have opted in"""
    from .models import NotificationPreferences
    
    users_with_digest = NotificationPreferences.objects.filter(
        weekly_digest=True,
        email_notifications=True
    ).select_related('user')
    
    for preference in users_with_digest:
        # Generate weekly digest data
        digest_data = NotificationService.generate_weekly_digest(preference.user)
        
        if digest_data['has_content']:
            send_email_notification.delay(
                notification_id=None,  # No specific notification
                template_name='weekly_digest',
                context=digest_data
            )
    
    logger.info(f"Sent weekly digest to {users_with_digest.count()} users")

@shared_task(bind=True, max_retries=3)
def send_push_notification(self, user_id, title, message, data=None):
    """Send push notification via FCM"""
    try:
        from .services import PushNotificationService
        
        success = PushNotificationService.send_to_user(
            user_id=user_id,
            title=title,
            message=message,
            data=data or {}
        )
        
        if not success:
            raise Exception("Push notification failed")
            
        return True
        
    except Exception as e:
        logger.error(f"Failed to send push notification to user {user_id}: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=30 * (2 ** self.request.retries))
        return False
```

### 16.7 Push Notification Service

#### FCM Integration
```python
# notifications/push_service.py
import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
from .models import UserDevice, PushNotificationLog
import logging

logger = logging.getLogger(__name__)

class PushNotificationService:
    """Firebase Cloud Messaging service for push notifications"""
    
    @classmethod
    def initialize_firebase(cls):
        """Initialize Firebase Admin SDK"""
        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
    
    @classmethod
    def send_to_user(cls, user_id, title, message, data=None):
        """Send push notification to all user devices"""
        cls.initialize_firebase()
        
        try:
            # Get all active devices for user
            devices = UserDevice.objects.filter(
                user_id=user_id,
                is_active=True
            )
            
            if not devices.exists():
                logger.warning(f"No active devices found for user {user_id}")
                return False
            
            tokens = [device.device_token for device in devices]
            
            # Create FCM message
            fcm_message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=message
                ),
                data=data or {},
                tokens=tokens,
                android=messaging.AndroidConfig(
                    notification=messaging.AndroidNotification(
                        sound='default',
                        priority='high'
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1
                        )
                    )
                )
            )
            
            # Send notification
            response = messaging.send_multicast(fcm_message)
            
            # Log results
            for idx, token in enumerate(tokens):
                device = devices[idx]
                if response.responses[idx].success:
                    PushNotificationLog.objects.create(
                        user=device.user,
                        device=device,
                        title=title,
                        message=message,
                        status='delivered'
                    )
                else:
                    error_code = response.responses[idx].exception.code if response.responses[idx].exception else 'unknown'
                    PushNotificationLog.objects.create(
                        user=device.user,
                        device=device,
                        title=title,
                        message=message,
                        status='failed',
                        error_message=str(response.responses[idx].exception)
                    )
                    
                    # Deactivate invalid tokens
                    if error_code in ['UNREGISTERED', 'INVALID_ARGUMENT']:
                        device.is_active = False
                        device.save()
            
            success_count = response.success_count
            logger.info(f"Sent push notification to {success_count}/{len(tokens)} devices for user {user_id}")
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Failed to send push notification to user {user_id}: {str(e)}")
            return False

    @classmethod
    def send_to_topic(cls, topic, title, message, data=None):
        """Send push notification to a topic (for bulk notifications)"""
        cls.initialize_firebase()
        
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=message
                ),
                data=data or {},
                topic=topic
            )
            
            response = messaging.send(message)
            logger.info(f"Sent push notification to topic {topic}: {response}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send push notification to topic {topic}: {str(e)}")
            return False
```

### 16.8 Email Service Configuration

#### Email Templates Management
```python
# notifications/email_service.py
from django.template.loader import get_template
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from premailer import transform
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Enhanced email service with template management"""
    
    @classmethod
    def render_email_template(cls, template_name, context):
        """Render email template with context"""
        try:
            # Load HTML template
            html_template = get_template(f'notifications/emails/{template_name}.html')
            html_content = html_template.render(context)
            
            # Inline CSS for email compatibility
            html_content = transform(html_content)
            
            # Load text template (fallback)
            try:
                text_template = get_template(f'notifications/emails/{template_name}.txt')
                text_content = text_template.render(context)
            except:
                # Generate text from HTML if no text template exists
                from django.utils.html import strip_tags
                text_content = strip_tags(html_content)
            
            return html_content, text_content
            
        except Exception as e:
            logger.error(f"Failed to render email template {template_name}: {str(e)}")
            return None, None
    
    @classmethod
    def send_email(cls, to_email, subject, template_name, context, from_email=None):
        """Send email with template"""
        try:
            html_content, text_content = cls.render_email_template(template_name, context)
            
            if not html_content:
                return False
            
            # Create email message
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email or settings.DEFAULT_FROM_EMAIL,
                to=[to_email]
            )
            
            msg.attach_alternative(html_content, "text/html")
            
            # Add unsubscribe header
            msg.extra_headers = {
                'List-Unsubscribe': f'<{settings.SITE_URL}/unsubscribe/{to_email}/>',
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
            
            # Send email
            return msg.send() > 0
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
```

---

## 17. API Rate Limiting

### 17.1 Rate Limit Configuration
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'notifications': '50/minute',
        'bulk_notifications': '5/hour'
    }
}

# Custom throttle classes
from rest_framework.throttling import UserRateThrottle

class NotificationThrottle(UserRateThrottle):
    scope = 'notifications'

class BulkNotificationThrottle(UserRateThrottle):
    scope = 'bulk_notifications'
```

### 17.2 Rate Limiting by User Type
```python
# notifications/throttles.py
from rest_framework.throttling import UserRateThrottle

class UserTypeBasedThrottle(UserRateThrottle):
    """Rate limiting based on user type"""
    
    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            user_type = getattr(request.user, 'user_type', 'customer')
            
            # Different rates for different user types
            rate_mapping = {
                'customer': '50/minute',
                'provider': '100/minute',
                'ngo': '75/minute',
                'admin': '500/minute'
            }
            
            self.rate = rate_mapping.get(user_type, '50/minute')
        
        return super().get_cache_key(request, view)
```

---

## 18. Data Migration & Backup

### 18.1 Database Migrations
```python
# Example migration for notification preferences
from django.db import migrations

def create_default_preferences(apps, schema_editor):
    """Create default notification preferences for existing users"""
    User = apps.get_model('authentication', 'User')
    NotificationPreferences = apps.get_model('notifications', 'NotificationPreferences')
    
    for user in User.objects.all():
        NotificationPreferences.objects.get_or_create(
            user=user,
            defaults={
                'email_notifications': True,
                'new_listing_notifications': True,
                'promotional_notifications': False,
                'weekly_digest': True
            }
        )

class Migration(migrations.Migration):
    dependencies = [
        ('notifications', '0001_initial'),
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_preferences),
    ]
```

### 18.2 Backup Strategy
```bash
#!/bin/bash
# notifications_backup.sh

# Backup notification data
pg_dump --host=$DB_HOST --username=$DB_USER --dbname=$DB_NAME \
    --table=notifications_notification \
    --table=notifications_notificationpreferences \
    --table=notifications_businessfollower \
    --table=notifications_emailnotificationlog \
    --file=notifications_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup Redis notification cache
redis-cli --rdb notifications_cache_$(date +%Y%m%d_%H%M%S).rdb

# Upload to S3
aws s3 cp notifications_backup_*.sql s3://savenbiteguild-backups/notifications/
aws s3 cp notifications_cache_*.rdb s3://savenbiteguild-backups/notifications/
```

---

**Document Version**: 1.0  
**Last Updated**: June 25, 2025  
**Next Review**: July 25, 2025  
**Document Status**: Final Draft  
**Approved By**: Technical Architecture Team
