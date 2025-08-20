# Save n Bite - Postman Test Collection for New Features

## Summary of Changes Added

### 🆕 New Database Fields Added to FoodProviderProfile:
1. **`banner`** - ImageField for large banner images (1200x400px recommended)
2. **`business_description`** - TextField (max 1000 chars) for detailed business info
3. **`business_tags`** - JSONField storing array of custom tags (max 10 tags, 50 chars each)
4. **`banner_updated_at`** - DateTime tracking when banner was last updated
5. **`description_updated_at`** - DateTime tracking when description was last updated  
6. **`tags_updated_at`** - DateTime tracking when tags were last updated

### 🔧 Enhanced Existing Endpoints:
- All provider-related endpoints now return the new fields
- Search functionality now includes description and tags
- Profile completeness scoring includes new fields

### 🚀 New Endpoints Added:
4 brand new API endpoints for enhanced business management

---

## 🧪 POSTMAN TEST COLLECTION

### 1. **Update Business Profile**
**PUT** `{{base_url}}/auth/business/profile/update/`

**Headers:**
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "business_name": "Green Garden Café Updated",
  "business_description": "We're a family-owned café specializing in fresh, organic meals made from locally-sourced ingredients. Our mission is to provide healthy, sustainable food options while minimizing waste through innovative practices. We offer vegan, vegetarian, and gluten-free options daily.",
  "business_tags": ["Organic", "Vegan Options", "Family-Friendly", "Sustainable", "Local"],
  "banner": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "logo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "business_hours": "Mon-Fri: 8AM-6PM, Sat: 9AM-4PM",
  "website": "https://greengardencafe.co.za",
  "phone_number": "+27123456789"
}
```

**Expected Response:**
```json
{
  "message": "Business profile updated successfully",
  "profile": {
    "business_id": "uuid-here",
    "business_name": "Green Garden Café Updated",
    "business_description": "We're a family-owned café...",
    "business_tags": ["Organic", "Vegan Options", "Family-Friendly", "Sustainable", "Local"],
    "banner": "https://media.savenbite.com/provider_banners/banner_uuid.jpg",
    "logo": "https://media.savenbite.com/provider_logos/logo_uuid.jpg",
    "profile_completeness": true
  }
}
```

---

### 2. **Manage Business Tags**
**POST** `{{base_url}}/auth/business/tags/manage/`

**Headers:**
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

#### 2a. Add a Single Tag:
**Body:**
```json
{
  "action": "add",
  "tag": "Gluten-Free"
}
```

#### 2b. Remove a Tag:
**Body:**
```json
{
  "action": "remove",
  "tag": "Organic"
}
```

#### 2c. Set All Tags (Replace existing):
**Body:**
```json
{
  "action": "set",
  "tags": ["Bakery", "Artisan", "Local", "Fresh Daily"]
}
```

**Expected Response:**
```json
{
  "message": "Tag 'Gluten-Free' added successfully",
  "tags": ["Organic", "Vegan Options", "Gluten-Free", "Family-Friendly", "Local"]
}
```

---

### 3. **Get Popular Business Tags**
**GET** `{{base_url}}/auth/business/tags/popular/`

**Query Parameters:**
- `limit`: Number of tags (max 50, default 20)
- `include_providers`: Include example providers (true/false)

**Examples:**
- `{{base_url}}/auth/business/tags/popular/`
- `{{base_url}}/auth/business/tags/popular/?limit=10&include_providers=true`

**Expected Response:**
```json
{
  "popular_tags": [
    {
      "tag": "Vegan Options",
      "count": 45,
      "example_providers": ["Green Café", "Healthy Bites", "Plant Kitchen"]
    },
    {
      "tag": "Organic", 
      "count": 32,
      "example_providers": ["Farm Fresh", "Pure Foods"]
    },
    {
      "tag": "Bakery",
      "count": 28
    }
  ],
  "total_unique_tags": 127
}
```

---

### 4. **Search Providers by Tags**
**GET** `{{base_url}}/auth/providers/search/tags/`

**Query Parameters:**
- `tags`: Comma-separated tags (required)
- `limit`: Number of results (max 100, default 50)

**Examples:**
- `{{base_url}}/auth/providers/search/tags/?tags=Vegan Options`
- `{{base_url}}/auth/providers/search/tags/?tags=Vegan Options,Organic&limit=20`
- `{{base_url}}/auth/providers/search/tags/?tags=Bakery,Artisan,Local`

**Expected Response:**
```json
{
  "providers": [
    {
      "id": "provider-uuid-123",
      "business_name": "Green Garden Café",
      "business_address": "123 Main Street, Pretoria, Gauteng, 0002",
      "business_description": "We specialize in organic, locally-sourced meals...",
      "business_tags": ["Organic", "Vegan Options", "Local", "Sustainable"],
      "banner": "https://media.savenbite.com/provider_banners/banner_uuid.jpg",
      "logo": "https://media.savenbite.com/provider_logos/logo_uuid.jpg",
      "coordinates": {"lat": -25.7461, "lng": 28.1881},
      "active_listings_count": 5,
      "matching_tags": ["Vegan Options", "Organic"]
    }
  ],
  "search_tags": ["Vegan Options", "Organic"],
  "total_count": 12
}
```

---

## 🔄 Enhanced Existing Endpoints

### 5. **Get All Food Providers (Enhanced)**
**GET** `{{base_url}}/auth/providers/`

**NEW Query Parameters:**
- `tags`: Filter by tags (comma-separated)
- `complete_profiles_only`: Show only complete profiles (true/false)
- `search`: Now searches description and tags too

**Examples:**
- `{{base_url}}/auth/providers/?tags=Bakery,Vegan`
- `{{base_url}}/auth/providers/?complete_profiles_only=true`
- `{{base_url}}/auth/providers/?search=organic&tags=Local`

**Enhanced Response (NEW fields highlighted):**
```json
{
  "providers": [
    {
      "id": "provider-uuid",
      "business_name": "Green Garden Café",
      "business_email": "contact@greengarden.co.za",
      "business_address": "123 Main Street, Pretoria",
      "logo": "https://media.savenbite.com/logos/logo.jpg",
      
      // 🆕 NEW FIELDS:
      "banner": "https://media.savenbite.com/banners/banner.jpg",
      "business_description": "Family-owned café specializing in organic meals...",
      "business_tags": ["Organic", "Vegan Options", "Family-Friendly"],
      "profile_completeness": true,
      
      // Existing fields...
      "coordinates": {"lat": -25.7461, "lng": 28.1881},
      "active_listings_count": 5,
      "follower_count": 23
    }
  ],
  "summary": {
    "total_verified_providers": 45,
    "providers_with_tags": 32,        // 🆕 NEW
    "providers_with_descriptions": 28  // 🆕 NEW
  }
}
```

---

### 6. **Get Food Provider by ID (Enhanced)**
**GET** `{{base_url}}/auth/providers/{provider_id}/`

**Enhanced Response (NEW fields highlighted):**
```json
{
  "provider": {
    "id": "provider-uuid",
    "business_name": "Green Garden Café",
    
    // 🆕 NEW FIELDS:
    "banner": "https://media.savenbite.com/provider_banners/banner_uuid.jpg",
    "business_description": "We're a family-owned café specializing in...",
    "business_tags": ["Organic", "Vegan Options", "Local", "Sustainable"],
    "profile_completeness": true,
    "banner_updated_at": "2025-01-15T10:30:00Z",
    "description_updated_at": "2025-01-10T14:20:00Z", 
    "tags_updated_at": "2025-01-12T09:15:00Z",
    
    // Existing fields...
    "business_email": "contact@greengarden.co.za",
    "coordinates": {"lat": -25.7461, "lng": 28.1881},
    "follower_count": 23,
    "active_listings_count": 5
  }
}
```

---

### 7. **Register Food Provider (Enhanced)**
**POST** `{{base_url}}/auth/register/provider/`

**Enhanced Body (NEW fields highlighted):**
```json
{
  "email": "newcafe@example.com",
  "password": "securepass123",
  "business_name": "Fresh Daily Bakery",
  "business_email": "contact@freshdaily.co.za", 
  "business_contact": "+27987654321",
  "business_street": "456 Baker Street",
  "business_city": "Johannesburg",
  "business_province": "Gauteng",
  "business_postal_code": "2000",
  "cipc_document": "data:application/pdf;base64,...",
  "logo": "data:image/jpeg;base64,...",
  
  // 🆕 NEW OPTIONAL FIELDS:
  "banner": "data:image/jpeg;base64,...",
  "business_description": "Fresh daily baked goods using traditional methods and local ingredients. Specializing in artisan breads, pastries, and custom cakes.",
  "business_tags": ["Bakery", "Artisan", "Local", "Fresh Daily", "Custom Orders"]
}
```

---

## 🧪 Postman Test Scenarios

### Test Case 1: Complete Business Profile Setup
1. Register a new food provider with all new fields
2. Verify the profile shows as "complete" 
3. Check that tags are searchable
4. Verify banner and description display correctly

### Test Case 2: Tag Management Workflow
1. Add individual tags one by one
2. Try to add duplicate tags (should be ignored)
3. Remove specific tags
4. Set entire tag list at once
5. Try to add more than 10 tags (should fail)

### Test Case 3: Enhanced Search & Discovery
1. Search providers by single tag
2. Search providers by multiple tags
3. Search text that matches descriptions
4. Get popular tags for autocomplete
5. Filter by complete profiles only

### Test Case 4: Image Upload Testing
1. Upload banner image (test different formats: JPG, PNG)
2. Upload logo image
3. Test large file sizes
4. Test invalid base64 data

---

## 🔍 Quick Test Commands

### Get Popular Tags:
```bash
curl -X GET "http://localhost:8000/auth/business/tags/popular/?limit=10"
```

### Search by Tags:
```bash
curl -X GET "http://localhost:8000/auth/providers/search/tags/?tags=Vegan Options,Organic"
```

### Add a Tag (requires auth):
```bash
curl -X POST "http://localhost:8000/auth/business/tags/manage/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "add", "tag": "Gluten-Free"}'
```

---

## 📊 Database Changes Summary

### New Fields in `authentication_foodproviderprofile` table:
- `banner` (VARCHAR 100, nullable) - Path to banner image
- `business_description` (TEXT, max 1000 chars) - Business description
- `business_tags` (JSON, default []) - Array of tag strings
- `banner_updated_at` (DATETIME, nullable) - Banner update timestamp
- `description_updated_at` (DATETIME, nullable) - Description update timestamp  
- `tags_updated_at` (DATETIME, nullable) - Tags update timestamp

### Migration Commands:
```bash
# After adding fields to model:
python manage.py makemigrations authentication
python manage.py migrate authentication

# Verify migration:
python manage.py showmigrations authentication
```

---

## 🎯 Implementation Priority

### **High Priority (Implement First):**
1. **Model fields** - Core database changes
2. **Enhanced registration** - Allow setting fields during signup
3. **Popular tags endpoint** - For autocomplete features

### **Medium Priority:**
4. **Profile update endpoint** - Let businesses update their info
5. **Enhanced provider listings** - Show new fields in search results

### **Low Priority (Polish):**
6. **Tag management endpoint** - Advanced tag operations
7. **Tag-based search** - Specialized search by tags only
8. **Admin interface** - Enhanced admin management

---

## 🚨 Important Notes

### **Error Handling:**
- All new endpoints include comprehensive error responses
- File uploads are optional and won't break registration if they fail
- Tag validation prevents duplicate/invalid tags

### **Security:**
- Only authenticated food providers can update their profiles
- Tag management requires food provider authentication
- Popular tags endpoint is public (no auth needed)

### **Performance:**
- Tag search uses database indexes on JSON fields
- Popular tags are cached for performance
- Pagination is included for large result sets

### **Frontend Integration:**
- All endpoints return data in consistent format
- Base64 image upload support included
- Comprehensive error codes for frontend handling

This collection gives you everything you need to test the new features once you've implemented them step by step!