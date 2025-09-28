# 🌱 Save n Bite Digital Garden API Service Contract

## Overview
This document provides a complete service contract for the Digital Garden API endpoints, including request/response formats, authentication requirements, error handling, and usage examples.

**Base URL:** `https://your-domain.com/api/garden/`
**Authentication:** JWT Bearer Token required for all endpoints
**Content-Type:** `application/json`

---

## 🔐 Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Customer-Only Endpoints
Most endpoints are restricted to users with `user_type: 'customer'`. Provider and NGO users will receive a 403 Forbidden response.

---

## 📊 Garden Management Endpoints

### 1. Get Customer Garden

**GET** `/api/garden/garden/`

Returns the customer's complete garden with all tiles and plants.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
```

#### Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer": "550e8400-e29b-41d4-a716-446655440001",
  "customer_username": "john_doe",
  "name": "My Garden",
  "total_plants_earned": 12,
  "total_plants_placed": 8,
  "garden_level": 2,
  "completion_percentage": 12.5,
  "rarity_distribution": [
    {
      "plant__rarity": "common",
      "count": 5
    },
    {
      "plant__rarity": "rare", 
      "count": 3
    }
  ],
  "garden_tiles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "row": 0,
      "col": 0,
      "plant": "550e8400-e29b-41d4-a716-446655440003",
      "plant_details": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "Bird of Paradise",
        "scientific_name": "Strelitzia reginae",
        "common_names": ["Crane Flower", "Orange Bird of Paradise"],
        "category": "flowering",
        "rarity": "rare",
        "native_region": "South Africa",
        "care_difficulty": "moderate",
        "sunlight_requirements": "full_sun",
        "water_requirements": "moderate",
        "description": "Iconic South African flower resembling a bird in flight.",
        "fun_facts": "South Africa's national flower! Takes 4-5 years to bloom from seed.",
        "growing_tips": "Needs warm temperatures and bright light. Water regularly in summer.",
        "rive_asset_name": "bird_of_paradise",
        "icon_color": "#FF9800"
      },
      "planted_at": "2025-01-15T10:30:00Z",
      "custom_data": {
        "growth_stage": 2,
        "last_watered": "2025-01-15"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "row": 0,
      "col": 1,
      "plant": null,
      "plant_details": null,
      "planted_at": null,
      "custom_data": {}
    }
    // ... 62 more tiles (8x8 = 64 total)
  ],
  "created_at": "2025-01-10T08:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### Error Responses
```json
// 403 Forbidden - Not a customer
{
  "error": "Only customers can have gardens"
}

// 401 Unauthorized - Invalid token
{
  "detail": "Invalid token."
}
```

---

### 2. Initialize Customer Garden

**POST** `/api/garden/garden/`

Creates a new garden for a customer. If garden already exists, returns 400 error.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Request Body
```json
{
  "garden_name": "My Amazing Garden"  // Optional, defaults to "My Garden"
}
```

#### Response (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer": "550e8400-e29b-41d4-a716-446655440001", 
  "customer_username": "john_doe",
  "name": "My Amazing Garden",
  "total_plants_earned": 0,
  "total_plants_placed": 0,
  "garden_level": 1,
  "completion_percentage": 0.0,
  "rarity_distribution": [],
  "garden_tiles": [
    // 64 empty tiles with plant: null
  ],
  "created_at": "2025-01-15T12:00:00Z",
  "updated_at": "2025-01-15T12:00:00Z"
}
```

#### Error Responses
```json
// 400 Bad Request - Garden already exists
{
  "error": "Garden already exists"
}

// 403 Forbidden - Not a customer
{
  "error": "Only customers can have gardens"
}
```

---

### 3. Get Garden Summary

**GET** `/api/garden/garden/summary/`

Returns lightweight garden information without full tile data.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
```

#### Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_username": "john_doe",
  "name": "My Garden",
  "total_plants_earned": 12,
  "total_plants_placed": 8,
  "garden_level": 2,
  "completion_percentage": 12.5,
  "created_at": "2025-01-10T08:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

---

## 🎒 Inventory Management Endpoints

### 4. Get Plant Inventory

**GET** `/api/garden/inventory/`

Returns all plants in the customer's inventory (not yet placed in garden).

#### Request Headers
```http
Authorization: Bearer {jwt_token}
```

#### Response (200 OK)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "plant": "550e8400-e29b-41d4-a716-446655440003",
    "plant_details": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Lettuce",
      "scientific_name": "Lactuca sativa",
      "common_names": ["Garden Lettuce", "Leaf Lettuce"],
      "category": "vegetable",
      "rarity": "common",
      "native_region": "South Africa",
      "care_difficulty": "easy",
      "sunlight_requirements": "partial_sun",
      "water_requirements": "moderate",
      "description": "Fresh, crisp lettuce perfect for salads and sandwiches.",
      "fun_facts": "Lettuce was first cultivated by the ancient Egyptians over 4,500 years ago!",
      "growing_tips": "Plant in cool weather, keep soil moist, and harvest outer leaves first.",
      "rive_asset_name": "lettuce_plant",
      "icon_color": "#4CAF50"
    },
    "quantity": 3,
    "earned_from_order_id": "550e8400-e29b-41d4-a716-446655440006",
    "earned_reason": "order",
    "earned_at": "2025-01-15T09:15:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "plant": "550e8400-e29b-41d4-a716-446655440008",
    "plant_details": {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "name": "King Protea",
      "scientific_name": "Protea cynaroides",
      "category": "flowering",
      "rarity": "epic",
      "native_region": "South Africa",
      "care_difficulty": "difficult",
      "sunlight_requirements": "full_sun",
      "water_requirements": "low",
      "description": "Majestic South African national flower with crown-like blooms.",
      "fun_facts": "Can survive bush fires! The flower head can be 30cm across.",
      "growing_tips": "Needs acidic, well-draining soil. Never fertilize with phosphorus.",
      "rive_asset_name": "king_protea",
      "icon_color": "#E91E63"
    },
    "quantity": 1,
    "earned_from_order_id": null,
    "earned_reason": "milestone_orders",
    "earned_at": "2025-01-14T16:20:00Z"
  }
]
```

---

## 🌿 Plant Catalog Endpoints

### 5. Get Plant Catalog

**GET** `/api/garden/plants/`

Returns all available plants, with optional filtering.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
```

#### Query Parameters
- `rarity` (optional): Filter by rarity (`common`, `uncommon`, `rare`, `epic`, `legendary`)
- `category` (optional): Filter by category (`vegetable`, `herb`, `flowering`, `succulent`, `tree`, etc.)

#### Example Requests
```http
GET /api/garden/plants/
GET /api/garden/plants/?rarity=rare
GET /api/garden/plants/?category=vegetable
GET /api/garden/plants/?rarity=epic&category=flowering
```

#### Response (200 OK)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Bird of Paradise",
    "scientific_name": "Strelitzia reginae",
    "common_names": ["Crane Flower", "Orange Bird of Paradise"],
    "category": "flowering",
    "rarity": "rare",
    "native_region": "South Africa",
    "care_difficulty": "moderate",
    "sunlight_requirements": "full_sun",
    "water_requirements": "moderate",
    "description": "Iconic South African flower resembling a bird in flight.",
    "fun_facts": "South Africa's national flower! Takes 4-5 years to bloom from seed.",
    "growing_tips": "Needs warm temperatures and bright light. Water regularly in summer.",
    "rive_asset_name": "bird_of_paradise",
    "icon_color": "#FF9800"
  }
  // ... more plants
]
```

---

### 6. Get Plant Details

**GET** `/api/garden/plants/{plant_id}/`

Returns detailed information about a specific plant.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
```

#### Path Parameters
- `plant_id` (UUID): The ID of the plant

#### Example Request
```http
GET /api/garden/plants/550e8400-e29b-41d4-a716-446655440003/
```

#### Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "name": "Bird of Paradise",
  "scientific_name": "Strelitzia reginae",
  "common_names": ["Crane Flower", "Orange Bird of Paradise"],
  "category": "flowering",
  "rarity": "rare",
  "native_region": "South Africa",
  "care_difficulty": "moderate",
  "sunlight_requirements": "full_sun",
  "water_requirements": "moderate",
  "description": "Iconic South African flower resembling a bird in flight.",
  "fun_facts": "South Africa's national flower! Takes 4-5 years to bloom from seed.",
  "growing_tips": "Needs warm temperatures and bright light. Water regularly in summer.",
  "rive_asset_name": "bird_of_paradise",
  "icon_color": "#FF9800"
}
```

#### Error Responses
```json
// 404 Not Found
{
  "detail": "Not found."
}
```

---

### 7. Get Plant Rarities

**GET** `/api/garden/plants/rarities/`

Returns available plant rarity options.

#### Response (200 OK)
```json
{
  "rarities": ["common", "uncommon", "rare", "epic", "legendary"]
}
```

---

### 8. Get Plant Categories

**GET** `/api/garden/plants/categories/`

Returns available plant category options.

#### Response (200 OK)
```json
{
  "categories": ["vegetable", "succulent", "flowering", "herb", "shrub", "tree", "grass", "fern"]
}
```

---

## 🎮 Garden Action Endpoints

### 9. Place Plant in Garden

**POST** `/api/garden/actions/place/`

Places a plant from inventory into a specific garden tile.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Request Body
```json
{
  "plant_id": "550e8400-e29b-41d4-a716-446655440003",
  "row": 2,
  "col": 3,
  "custom_data": {  // Optional
    "growth_stage": 1,
    "color_variant": "orange"
  }
}
```

#### Response (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440009",
  "row": 2,
  "col": 3,
  "plant": "550e8400-e29b-41d4-a716-446655440003",
  "plant_details": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Bird of Paradise",
    "scientific_name": "Strelitzia reginae",
    "category": "flowering",
    "rarity": "rare",
    "rive_asset_name": "bird_of_paradise",
    "icon_color": "#FF9800"
    // ... full plant details
  },
  "planted_at": "2025-01-15T14:30:00Z",
  "custom_data": {
    "growth_stage": 1,
    "color_variant": "orange"
  }
}
```

#### Error Responses
```json
// 400 Bad Request - Plant not in inventory
{
  "error": "Plant not found in inventory"
}

// 400 Bad Request - Tile occupied
{
  "error": "Tile [2, 3] is already occupied"
}

// 400 Bad Request - Invalid position
{
  "error": "Invalid tile position [8, 3]"
}

// 400 Bad Request - Validation error
{
  "plant_id": ["This field is required."],
  "row": ["Ensure this value is less than or equal to 7."]
}
```

---

### 10. Remove Plant from Garden

**POST** `/api/garden/actions/remove/`

Removes a plant from garden and returns it to inventory.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Request Body
```json
{
  "row": 2,
  "col": 3
}
```

#### Response (200 OK)
```json
{
  "message": "Bird of Paradise removed from garden and returned to inventory",
  "plant": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Bird of Paradise",
    "scientific_name": "Strelitzia reginae",
    "category": "flowering",
    "rarity": "rare",
    "rive_asset_name": "bird_of_paradise",
    "icon_color": "#FF9800"
    // ... full plant details
  }
}
```

#### Error Responses
```json
// 400 Bad Request - No plant at position
{
  "error": "No plant at position [2, 3]"
}

// 400 Bad Request - Invalid position
{
  "error": "Invalid tile position [2, 8]"
}
```

---

### 11. Move Plant in Garden

**POST** `/api/garden/actions/move/`

Moves a plant from one tile to another within the garden.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Request Body
```json
{
  "from_row": 2,
  "from_col": 3,
  "to_row": 4,
  "to_col": 5
}
```

#### Response (200 OK)
```json
{
  "message": "Plant moved successfully",
  "from_tile": {
    "id": "550e8400-e29b-41d4-a716-446655440009",
    "row": 2,
    "col": 3,
    "plant": null,
    "plant_details": null,
    "planted_at": null,
    "custom_data": {}
  },
  "to_tile": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "row": 4,
    "col": 5,
    "plant": "550e8400-e29b-41d4-a716-446655440003",
    "plant_details": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Bird of Paradise",
      "rive_asset_name": "bird_of_paradise"
      // ... full plant details
    },
    "planted_at": "2025-01-15T14:30:00Z",
    "custom_data": {
      "growth_stage": 1,
      "color_variant": "orange"
    }
  }
}
```

#### Error Responses
```json
// 400 Bad Request - No plant at source
{
  "error": "No plant at position [2, 3]"
}

// 400 Bad Request - Destination occupied
{
  "error": "Tile [4, 5] is already occupied"
}

// 400 Bad Request - Same position
{
  "error": "Cannot move plant to the same position"
}
```

---

### 12. Bulk Garden Actions

**POST** `/api/garden/actions/bulk/`

Performs multiple garden actions in a single atomic transaction.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Request Body
```json
{
  "actions": [
    {
      "type": "place",
      "plant_id": "550e8400-e29b-41d4-a716-446655440003",
      "row": 0,
      "col": 0,
      "custom_data": {
        "growth_stage": 1
      }
    },
    {
      "type": "move",
      "from_row": 1,
      "from_col": 1,
      "to_row": 2,
      "to_col": 2
    },
    {
      "type": "remove",
      "row": 3,
      "col": 3
    }
  ]
}
```

#### Response (200 OK)
```json
{
  "successful_actions": 3,
  "failed_actions": 0,
  "results": [
    {
      "action_index": 0,
      "type": "place",
      "success": true,
      "tile_id": "550e8400-e29b-41d4-a716-446655440011"
    },
    {
      "action_index": 1,
      "type": "move",
      "success": true,
      "from_tile_id": "550e8400-e29b-41d4-a716-446655440012",
      "to_tile_id": "550e8400-e29b-41d4-a716-446655440013"
    },
    {
      "action_index": 2,
      "type": "remove",
      "success": true,
      "plant_name": "Lettuce"
    }
  ],
  "errors": []
}
```

#### Error Response (Partial Success)
```json
{
  "successful_actions": 2,
  "failed_actions": 1,
  "results": [
    {
      "action_index": 0,
      "type": "place",
      "success": true,
      "tile_id": "550e8400-e29b-41d4-a716-446655440011"
    },
    {
      "action_index": 1,
      "type": "move",
      "success": true,
      "from_tile_id": "550e8400-e29b-41d4-a716-446655440012",
      "to_tile_id": "550e8400-e29b-41d4-a716-446655440013"
    }
  ],
  "errors": [
    {
      "action_index": 2,
      "error": "No plant at position [3, 3]"
    }
  ]
}
```

---

## 📈 Statistics Endpoints

### 13. Get Customer Statistics

**GET** `/api/garden/stats/`

Returns customer's garden statistics and next achievable milestones.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
```

#### Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440014",
  "customer_username": "john_doe",
  "total_orders": 8,
  "total_order_amount": "1250.50",
  "unique_businesses_ordered_from": 4,
  "achieved_milestones": {
    "order_count": [1, 3, 5],
    "order_amount": [150, 200, 300, 500, 1000],
    "business_count": []
  },
  "next_milestones": [
    {
      "type": "order_count",
      "target": 10,
      "current": 8,
      "remaining": 2,
      "description": "Complete 2 more orders to reach 10 total orders"
    },
    {
      "type": "business_count",
      "target": 5,
      "current": 4,
      "remaining": 1,
      "description": "Order from 1 more unique business to reach 5 total"
    }
  ],
  "last_calculated_at": "2025-01-15T14:45:00Z"
}
```

---

### 14. Recalculate Customer Statistics

**POST** `/api/garden/stats/`

Manually recalculates customer statistics (for debugging).

#### Request Headers
```http
Authorization: Bearer {jwt_token}
```

#### Response (200 OK)
```json
{
  "message": "Statistics recalculated",
  "stats": {
    "id": "550e8400-e29b-41d4-a716-446655440014",
    "customer_username": "john_doe",
    "total_orders": 8,
    "total_order_amount": "1250.50",
    "unique_businesses_ordered_from": 4,
    "achieved_milestones": {
      "order_count": [1, 3, 5],
      "order_amount": [150, 200, 300, 500, 1000],
      "business_count": []
    },
    "next_milestones": [
      {
        "type": "order_count",
        "target": 10,
        "current": 8,
        "remaining": 2,
        "description": "Complete 2 more orders to reach 10 total orders"
      }
    ],
    "last_calculated_at": "2025-01-15T15:00:00Z"
  }
}
```

---







































## 🐛 Debug Endpoints (Development Only)

### 15. Simulate Order Completion

**POST** `/api/garden/debug/simulate-order/`

Simulates order completion for testing plant rewards. Only available when `DEBUG=True`.

#### Request Headers
```http
Authorization: Bearer {jwt_token}
```

#### Response (200 OK)
```json
{
  "message": "Order completion simulated",
  "order_id": "550e8400-e29b-41d4-a716-446655440015",
  "result": {
    "plants_earned": [
      {
        "plant": {
          "id": "550e8400-e29b-41d4-a716-446655440003",
          "name": "Lettuce",
          "rarity": "common"
        },
        "quantity": 1,
        "reason": "Regular order completion"
      },
      {
        "plant": {
          "id": "550e8400-e29b-41d4-a716-446655440008",
          "name": "King Protea",
          "rarity": "epic"
        },
        "quantity": 1,
        "reason": "Order milestone: 10 orders completed"
      }
    ],
    "stats": {
      "total_orders": 10,
      "total_amount": 1500.50,
      "unique_businesses": 4
    }
  }
}
```

#### Error Response (Production)
```json
{
  "error": "This endpoint is only available in DEBUG mode"
}
```

---

## 🚨 Global Error Responses

### Authentication Errors
```json
// 401 Unauthorized - No token provided
{
  "detail": "Authentication credentials were not provided."
}

// 401 Unauthorized - Invalid token
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

### Permission Errors
```json
// 403 Forbidden - Not a customer
{
  "error": "Only customers can have gardens"
}

// 403 Forbidden - General permission denied
{
  "detail": "You do not have permission to perform this action."
}
```

### Validation Errors
```json
// 400 Bad Request - Field validation errors
{
  "plant_id": ["This field is required."],
  "row": ["Ensure this value is less than or equal to 7."],
  "col": ["This field is required."]
}

// 400 Bad Request - Business logic errors
{
  "error": "Plant not found in inventory"
}
```

### Server Errors
```json
// 500 Internal Server Error
{
  "error": "Failed to perform bulk actions"
}
```

---

## 💡 Usage Examples

### Frontend Integration Examples

#### React Hook for Garden Management
```javascript
import { useState, useEffect } from 'react';

const useDigitalGarden = (token) => {
  const [garden, setGarden] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchGarden = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/garden/garden/', { headers });
      if (response.ok) {
        const data = await response.json();
        setGarden(data);
      } else {
        throw new Error('Failed to fetch garden');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/garden/inventory/', { headers });
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const placePlant = async (plantId, row, col) => {
    try {
      const response = await fetch('/api/garden/actions/place/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ plant_id: plantId, row, col }),
      });

      if (response.ok) {
        await fetchGarden();
        await fetchInventory();
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place plant');
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    if (token) {
      fetchGarden();
      fetchInventory();
    }
  }, [token]);

  return {
    garden,
    inventory,
    loading,
    error,
    placePlant,
    fetchGarden,
    fetchInventory,
  };
};
```

#### Plant Placement Component
```javascript
const PlantPlacement = ({ onPlantPlaced }) => {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  
  const handlePlacement = async () => {
    if (selectedPlant && selectedTile) {
      const success = await placePlant(
        selectedPlant.plant_details.id,
        selectedTile.row,
        selectedTile.col
      );
      
      if (success) {
        onPlantPlaced();
        setSelectedPlant(null);
        setSelectedTile(null);
      }
    }
  };

  return (
    <div className="plant-placement">
      <InventorySelector onPlantSelect={setSelectedPlant} />
      <GardenGrid onTileSelect={setSelectedTile} />
      <button 
        onClick={handlePlacement}
        disabled={!selectedPlant || !selectedTile}
      >
        Place Plant
      </button>
    </div>
  );
};
```

---

## 🔄 Data Synchronization

### Automatic Updates
The digital garden system automatically synchronizes with your existing order system:

1. **Order Completion**: When an order status changes to 'completed', plants are automatically awarded
2. **Statistics Update**: Customer statistics are recalculated after each completed order
3. **Milestone Checks**: The system checks for milestone achievements with every order

### Manual Refresh
For real-time updates in your frontend:

```javascript
// Poll for updates every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchGarden();
    fetchInventory();
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

### Webhook Integration (Future Enhancement)
Consider implementing webhooks for real-time notifications:

```javascript
// WebSocket connection for real-time updates
const useGardenWebSocket = (token) => {
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/garden/?token=${token}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'plant_earned') {
        // Show notification and refresh data
        showNotification(`You earned a ${data.plant.name}!`);
        fetchInventory();
      }
    };
    
    return () => ws.close();
  }, [token]);
};
```

---

## 📊 Rate Limits

### Standard Rate Limits
- **Garden Operations**: 100 requests per minute per user
- **Catalog Browsing**: 200 requests per minute per user
- **Bulk Actions**: 10 requests per minute per user (max 20 actions per request)

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

### Rate Limit Exceeded Response
```json
{
  "error": "Rate limit exceeded",
  "detail": "Request was throttled. Expected available in 45 seconds."
}
```

---

## 🔒 Security Considerations

### Input Validation
All endpoints validate input data:
- **Tile positions**: Must be 0-7 for both row and col
- **Plant IDs**: Must be valid UUIDs and exist in database
- **Custom data**: JSON objects with reasonable size limits

### User Isolation
- Customers can only access their own garden data
- Plant inventory is user-specific
- Cross-customer data access is prevented

### SQL Injection Prevention
All database queries use Django ORM parameterized queries.

---

## 🧪 Testing Examples

### Unit Test Example (Python)
```python
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from digital_garden.models import Plant, CustomerGarden

User = get_user_model()

@pytest.mark.django_db
def test_place_plant_success():
    # Setup
    client = APIClient()
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        user_type='customer'
    )
    plant = Plant.objects.create(name='Test Plant', rarity='common')
    
    # Create garden and inventory
    from digital_garden.services import DigitalGardenService
    service = DigitalGardenService()
    garden = service.initialize_customer_garden(user)
    service._add_plant_to_inventory(user, plant)
    
    # Authenticate and test
    client.force_authenticate(user=user)
    response = client.post('/api/garden/actions/place/', {
        'plant_id': str(plant.id),
        'row': 2,
        'col': 3
    })
    
    assert response.status_code == 201
    assert response.data['row'] == 2
    assert response.data['col'] == 3
    assert response.data['plant'] == str(plant.id)
```

### Integration Test Example (Jest)
```javascript
describe('Digital Garden API', () => {
  let token;
  
  beforeAll(async () => {
    // Login and get token
    const loginResponse = await fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass'
      })
    });
    const loginData = await loginResponse.json();
    token = loginData.access;
  });

  test('should create garden successfully', async () => {
    const response = await fetch('/api/garden/garden/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ garden_name: 'Test Garden' })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe('Test Garden');
    expect(data.garden_tiles).toHaveLength(64);
  });

  test('should place plant in garden', async () => {
    // First get a plant from inventory
    const inventoryResponse = await fetch('/api/garden/inventory/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const inventory = await inventoryResponse.json();
    const plant = inventory[0];

    // Place the plant
    const response = await fetch('/api/garden/actions/place/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plant_id: plant.plant,
        row: 0,
        col: 0
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.row).toBe(0);
    expect(data.col).toBe(0);
    expect(data.plant).toBe(plant.plant);
  });
});
```

---

## 📝 SDK Examples

### JavaScript SDK
```javascript
class DigitalGardenAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: this.headers,
      ...options
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // Garden Management
  async getGarden() {
    return this.request('/api/garden/garden/');
  }

  async createGarden(name = 'My Garden') {
    return this.request('/api/garden/garden/', {
      method: 'POST',
      body: JSON.stringify({ garden_name: name })
    });
  }

  async getGardenSummary() {
    return this.request('/api/garden/garden/summary/');
  }

  // Plant Management
  async getInventory() {
    return this.request('/api/garden/inventory/');
  }

  async getPlants(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/garden/plants/?${params}`);
  }

  async getPlant(plantId) {
    return this.request(`/api/garden/plants/${plantId}/`);
  }

  // Garden Actions
  async placePlant(plantId, row, col, customData = {}) {
    return this.request('/api/garden/actions/place/', {
      method: 'POST',
      body: JSON.stringify({
        plant_id: plantId,
        row,
        col,
        custom_data: customData
      })
    });
  }

  async removePlant(row, col) {
    return this.request('/api/garden/actions/remove/', {
      method: 'POST',
      body: JSON.stringify({ row, col })
    });
  }

  async movePlant(fromRow, fromCol, toRow, toCol) {
    return this.request('/api/garden/actions/move/', {
      method: 'POST',
      body: JSON.stringify({
        from_row: fromRow,
        from_col: fromCol,
        to_row: toRow,
        to_col: toCol
      })
    });
  }

  async bulkActions(actions) {
    return this.request('/api/garden/actions/bulk/', {
      method: 'POST',
      body: JSON.stringify({ actions })
    });
  }

  // Statistics
  async getStats() {
    return this.request('/api/garden/stats/');
  }

  async recalculateStats() {
    return this.request('/api/garden/stats/', { method: 'POST' });
  }
}

// Usage
const gardenAPI = new DigitalGardenAPI('https://your-api.com', userToken);

// Initialize garden
const garden = await gardenAPI.createGarden('My Beautiful Garden');

// Get inventory and place a plant
const inventory = await gardenAPI.getInventory();
if (inventory.length > 0) {
  await gardenAPI.placePlant(inventory[0].plant, 0, 0, {
    growth_stage: 1,
    color: 'green'
  });
}
```

### Python SDK
```python
import requests
from typing import Dict, List, Optional

class DigitalGardenClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()

    # Garden Management
    def get_garden(self) -> Dict:
        return self._request('GET', '/api/garden/garden/')

    def create_garden(self, name: str = 'My Garden') -> Dict:
        return self._request('POST', '/api/garden/garden/', 
                           json={'garden_name': name})

    def get_garden_summary(self) -> Dict:
        return self._request('GET', '/api/garden/garden/summary/')

    # Plant Management
    def get_inventory(self) -> List[Dict]:
        return self._request('GET', '/api/garden/inventory/')

    def get_plants(self, rarity: Optional[str] = None, 
                   category: Optional[str] = None) -> List[Dict]:
        params = {}
        if rarity:
            params['rarity'] = rarity
        if category:
            params['category'] = category
        return self._request('GET', '/api/garden/plants/', params=params)

    def get_plant(self, plant_id: str) -> Dict:
        return self._request('GET', f'/api/garden/plants/{plant_id}/')

    # Garden Actions
    def place_plant(self, plant_id: str, row: int, col: int, 
                    custom_data: Optional[Dict] = None) -> Dict:
        data = {
            'plant_id': plant_id,
            'row': row,
            'col': col
        }
        if custom_data:
            data['custom_data'] = custom_data
        return self._request('POST', '/api/garden/actions/place/', json=data)

    def remove_plant(self, row: int, col: int) -> Dict:
        return self._request('POST', '/api/garden/actions/remove/', 
                           json={'row': row, 'col': col})

    def move_plant(self, from_row: int, from_col: int, 
                   to_row: int, to_col: int) -> Dict:
        return self._request('POST', '/api/garden/actions/move/', json={
            'from_row': from_row,
            'from_col': from_col,
            'to_row': to_row,
            'to_col': to_col
        })

    def bulk_actions(self, actions: List[Dict]) -> Dict:
        return self._request('POST', '/api/garden/actions/bulk/', 
                           json={'actions': actions})

    # Statistics
    def get_stats(self) -> Dict:
        return self._request('GET', '/api/garden/stats/')

    def recalculate_stats(self) -> Dict:
        return self._request('POST', '/api/garden/stats/')

# Usage example
client = DigitalGardenClient('https://your-api.com', user_token)

# Create garden and place plants
garden = client.create_garden('My Python Garden')
inventory = client.get_inventory()

if inventory:
    # Place first plant in inventory
    result = client.place_plant(
        inventory[0]['plant'], 
        row=0, 
        col=0,
        custom_data={'growth_stage': 1}
    )
    print(f"Placed {result['plant_details']['name']} at [{result['row']}, {result['col']}]")

# Get statistics
stats = client.get_stats()
print(f"Customer has completed {stats['total_orders']} orders")
```

---

## 🔍 Monitoring & Logging

### Key Metrics to Track
- **Garden Activity**: Plant placements, movements, removals per day
- **Plant Distribution**: Popular plants by rarity and category
- **Milestone Achievement**: Rate of milestone completion
- **API Performance**: Response times and error rates
- **User Engagement**: Time spent in garden, return visits

### Logging Examples
```python
# In your Django settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'garden_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'garden.log',
        },
    },
    'loggers': {
        'digital_garden': {
            'handlers': ['garden_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### Performance Monitoring
```python
# Example performance monitoring middleware
import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('digital_garden.performance')

class GardenPerformanceMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if '/api/garden/' in request.path:
            request.garden_start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, 'garden_start_time'):
            duration = time.time() - request.garden_start_time
            logger.info(f"Garden API {request.method} {request.path} - {duration:.3f}s - {response.status_code}")
        return response
```

---

## 🚀 Deployment Considerations

### Environment Variables
```bash
# Production settings
GARDEN_RATE_LIMIT_ENABLED=true
GARDEN_CACHE_TIMEOUT=300
GARDEN_MAX_BULK_ACTIONS=20
GARDEN_DEBUG_ENDPOINTS=false

# Database optimization
GARDEN_DB_CONNECTION_POOL=20
GARDEN_DB_QUERY_TIMEOUT=30
```

### Caching Strategy
```python
# Cache garden data for better performance
from django.core.cache import cache
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # Cache for 15 minutes
def get_garden_summary(request):
    # Implementation
    pass

# Cache plant catalog
@cache_page(60 * 60)  # Cache for 1 hour
def get_plant_catalog(request):
    # Implementation
    pass
```

### Database Indexing
```sql
-- Additional indexes for production
CREATE INDEX CONCURRENTLY idx_garden_tiles_plant_lookup 
ON digital_garden_gardentile(garden_id, plant_id) 
WHERE plant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_plant_inventory_customer_plant 
ON digital_garden_plantinventory(customer_id, plant_id, quantity) 
WHERE quantity > 0;

CREATE INDEX CONCURRENTLY idx_customer_stats_milestones 
ON digital_garden_customerstats(total_orders, total_order_amount, unique_businesses_ordered_from);
```

---

## 📋 Changelog

### Version 1.0.0 (Initial Release)
- Complete garden management system
- Plant inventory and catalog
- Milestone-based rewards
- Admin interface
- RESTful API with full documentation
- South African plant focus
- Rive integration ready

### Planned Future Enhancements
- **v1.1.0**: WebSocket support for real-time updates
- **v1.2.0**: Plant evolution system (growth stages)
- **v1.3.0**: Social features (garden sharing, competitions)
- **v1.4.0**: Advanced analytics dashboard
- **v1.5.0**: Mobile app optimizations

---

This completes the comprehensive Digital Garden API Service Contract. The API provides a complete foundation for implementing an engaging gamification system in your Save n Bite platform, with proper error handling, security measures, and extensibility for future enhancements.