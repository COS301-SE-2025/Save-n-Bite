#### 3.2.2 Create Pickup Location
```http
POST /api/scheduling/pickup-locations/
Content-Type: application/json

{
    "name": "Back Entrance",
    "address": "123 Main Street, Back Door, Pretoria, 0001",
    "instructions": "Use sibacke entrance for after-hours pickup",
    "contact_person": "Capleton Smith",
    "contact_phone": "+27123456790",
    "latitude": "-25.7480",
    "longitude": "28.2295"
}
```

**Response (201 Created):**
```json
{
    "message": "Pickup location created successfully",
    "location": {
        "id": "0e6bf4ce-e344-415a-a032-852e14420bdd",
        "name": "Back Entrance",
        "address": "123 Main Street, Back Door, Pretoria, 0001",
        "instructions": "Use back entrance for after-hours pickup",
        "contact_person": "Capleton Smith",
        "contact_phone": "+27123456790",
        "latitude": "-25.74800000",
        "longitude": "28.22950000",
        "is_active": true,
        "created_at": "2025-07-04T15:10:05.188161Z",
        "updated_at": "2025-07-04T15:10:05.188161Z"
    }
}
```



#### 3.2.1 Manage Pickup Locations
```http
POST | GET /api/scheduling/pickup-schedules/
```
```json
{
  "food_listing_id": "f681aa25-ef1f-4d78-beff-b75765172af3",
  "location_id": "f6fa273b-0359-45bd-8559-9e2842f0c0c3", 
  "pickup_window": "17:00-20:00",
  "total_slots": 4,
  "max_orders_per_slot": 5,
  "slot_buffer_minutes": 5
}
```

**Response (200 OK):**
```json
{
    "message": "Pickup schedule created successfully",
    "pickup_schedule": {
        "id": "cb521766-c330-4245-8e61-5183674e9e1a",
        "food_listing": "f681aa25-ef1f-4d78-beff-b75765172af3",
        "food_listing_name": "Yummy Sushi",
        "location": "f6fa273b-0359-45bd-8559-9e2842f0c0c3",
        "location_name": "Sushi Pickup Location",
        "business_name": "Saber's Snacks",
        "pickup_window": "17:00-20:00",
        "total_slots": 4,
        "max_orders_per_slot": 5,
        "slot_buffer_minutes": 5,
        "is_active": true,
        "start_time": "17:00:00",
        "end_time": "20:00:00",
        "window_duration_minutes": 180,
        "slot_duration_minutes": 41,
        "generated_slots": [
            {
                "slot_number": 1,
                "start_time": "17:00:00",
                "end_time": "17:41:00",
                "max_orders": 5
            },
            {
                "slot_number": 2,
                "start_time": "17:46:00",
                "end_time": "18:27:00",
                "max_orders": 5
            },
            {
                "slot_number": 3,
                "start_time": "18:32:00",
                "end_time": "19:13:00",
                "max_orders": 5
            },
            {
                "slot_number": 4,
                "start_time": "19:18:00",
                "end_time": "19:59:00",
                "max_orders": 5
            }
        ],
        "created_at": "2025-07-04T15:38:43.503651Z",
        "updated_at": "2025-07-04T15:38:43.503651Z"
    }
}
```


#### 3.3.1 Get Available Slots
```http
GET /api/scheduling/available-slots/?food_listing_id="uuid"
Query Parameters:
- food_listing_id: uuid
- date: 2025-06-26 (optional, defaults to today)
- location_id: uuid (optional)
```

**Response (200 OK):**
```json
{
    "available_slots": [
        {
            "id": "36f9123a-0aa7-490d-ae76-bdf32a2395bb",
            "slot_number": 1,
            "start_time": "17:00:00",
            "end_time": "17:22:00",
            "date": "2025-07-04",
            "available_spots": 5,
            "food_listing": {
                "id": "2cae9cf3-e4e6-4164-82ab-5dcafb65d58f",
                "name": "Delicious Cake",
                "description": "Delicious cake with chocolate",
                "pickup_window": "17:00-19:00"
            },
            "location": {
                "id": "53346cb7-c483-468b-838f-170a79e3860a",
                "name": "Updated Main Counter",
                "address": "123 Main Street, City Center",
                "instructions": "Enter through the main entrance and go to the counter",
                "contact_person": "Chisom Emekpo",
                "contact_phone": "+1234567899"
            }
        },
        {
            "id": "cd3c1ddd-d2cc-40e2-bfe6-7487ebdd4ccf",
            "slot_number": 2,
            "start_time": "17:32:00",
            "end_time": "17:54:00",
            "date": "2025-07-04",
            "available_spots": 5,
            "food_listing": {
                "id": "2cae9cf3-e4e6-4164-82ab-5dcafb65d58f",
                "name": "Delicious Cake",
                "description": "Delicious cake with chocolate",
                "pickup_window": "17:00-19:00"
            },
            "location": {
                "id": "53346cb7-c483-468b-838f-170a79e3860a",
                "name": "Updated Main Counter",
                "address": "123 Main Street, City Center",
                "instructions": "Enter through the main entrance and go to the counter",
                "contact_person": "Chisom Emekpo",
                "contact_phone": "+1234567899"
            }
        },
        {
            "id": "9cafa950-be18-45ec-95b0-80edb044b429",
            "slot_number": 3,
            "start_time": "18:04:00",
            "end_time": "18:26:00",
            "date": "2025-07-04",
            "available_spots": 5,
            "food_listing": {
                "id": "2cae9cf3-e4e6-4164-82ab-5dcafb65d58f",
                "name": "Delicious Cake",
                "description": "Delicious cake with chocolate",
                "pickup_window": "17:00-19:00"
            },
            "location": {
                "id": "53346cb7-c483-468b-838f-170a79e3860a",
                "name": "Updated Main Counter",
                "address": "123 Main Street, City Center",
                "instructions": "Enter through the main entrance and go to the counter",
                "contact_person": "Chisom Emekpo",
                "contact_phone": "+1234567899"
            }
        },
        {
            "id": "cfbd5343-68d8-4329-a63c-a0e22ee7b503",
            "slot_number": 4,
            "start_time": "18:36:00",
            "end_time": "18:58:00",
            "date": "2025-07-04",
            "available_spots": 5,
            "food_listing": {
                "id": "2cae9cf3-e4e6-4164-82ab-5dcafb65d58f",
                "name": "Delicious Cake",
                "description": "Delicious cake with chocolate",
                "pickup_window": "17:00-19:00"
            },
            "location": {
                "id": "53346cb7-c483-468b-838f-170a79e3860a",
                "name": "Updated Main Counter",
                "address": "123 Main Street, City Center",
                "instructions": "Enter through the main entrance and go to the counter",
                "contact_person": "Chisom Emekpo",
                "contact_phone": "+1234567899"
            }
        }
    ],
    "count": 4,
    "date": "2025-07-04",
    "food_listing": {
        "id": "2cae9cf3-e4e6-4164-82ab-5dcafb65d58f",
        "name": "Delicious Cake",
        "pickup_window": "17:00-19:00"
    }
}
```

#### 3.3.2 Schedule Pickup
```http
POST /api/scheduling/schedule/
Content-Type: application/json

{
    "order_id": "uuid",
    "food_listing_id": "uuid",
    "time_slot_id": "uuid",
    "date": "2025-06-26",
    "customer_notes": "Please keep food warm, will arrive 5 minutes early"
}
```

**Response (201 Created):**
```json
{
    "pickup": {
        "id": "uuid",
        "confirmation_code": "ABC123",
        "scheduled_date": "2025-06-26",
        "scheduled_time": "17:00-17:25",
        "location": {
            "name": "Main Counter",
            "address": "123 Main Street, Pretoria",
            "contact_person": "John Doe",
            "contact_phone": "+27123456789",
            "instructions": "Enter through main entrance"
        },
        "food_listing": {
            "name": "Margherita Pizza",
            "quantity": 2,
            "business": "Mario's Restaurant"
        },
        "status": "scheduled",
        "customer_notes": "Please keep food warm, will arrive 5 minutes early"
    },
    "qr_code": {
        "data": {
            "pickup_id": "uuid",
            "confirmation_code": "ABC123",
            "business_id": "uuid",
            "scheduled_time": "2025-06-26 17:00",
            "location": "Main Counter"
        },
        "image_url": "https://s3.amazonaws.com/qr-codes/pickup-ABC123.png"
    },
    "reminders": {
        "email_sent": true,
        "sms_scheduled": "2025-06-26T16:00:00Z",
        "push_notification_scheduled": "2025-06-26T16:30:00Z"
    }
}
```



#### 3.3.3 Get Customer Pickups
```http
GET /api/scheduling/my-pickups/
Query Parameters:
- status: scheduled|confirmed|completed|cancelled|missed
- date_from: 2025-06-01
- date_to: 2025-06-30
- page: 1
```

**Response (200 OK):**
```json
{
    "count": 12,
    "next": "http://api.com/scheduling/my-pickups/?page=2",
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "confirmation_code": "ABC123",
            "food_listing": {
                "id": "uuid",
                "name": "Margherita Pizza",
                "image": "https://s3.amazonaws.com/food-images/pizza.jpg"
            },
            "business": {
                "name": "Mario's Restaurant",
                "logo": "https://s3.amazonaws.com/logos/mario.jpg"
            },
            "scheduled_date": "2025-06-26",
            "scheduled_time": "17:00-17:25",
            "location": {
                "name": "Main Counter",
                "address": "123 Main Street, Pretoria"
            },
            "status": "scheduled",
            "is_upcoming": true,
            "is_today": false,
            "can_cancel": true,
            "time_until_pickup": "2 hours 15 minutes",
            "created_at": "2025-06-25T14:30:00Z"
        }
    ]
}
```
