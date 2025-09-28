// src/services/gardenAPI.js
// Fixed to properly handle API requests to Django backend
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://savenbiteservice-hzghg8gcgddtcfg7.southafricanorth-01.azurewebsites.net';
const API_BASE_URL = 'http://localhost:8000';

class GardenAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/garden`;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const fullUrl = `${this.baseURL}${endpoint}`;
      //console.o('Making request to:', fullUrl); // Debug log
      
      const response = await fetch(fullUrl, config);
      
      //console.o('Response status:', response.status); // Debug log
      //console.o('Response headers:', response.headers); // Debug log
      
      if (!response.ok) {
        // Try to get error details
        let errorData = {};
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        } else {
          // If it's not JSON (like HTML), it means we hit the wrong server
          const textResponse = await response.text();
          console.error('Non-JSON response received:', textResponse.substring(0, 200));
          
          if (textResponse.includes('<!DOCTYPE')) {
            throw new Error(`API endpoint not found. Make sure Django backend is running on ${API_BASE_URL}`);
          }
        }
        
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      //console.o('API Response:', result); // Debug log
      return result;
      
    } catch (error) {
      console.error('Garden API Error:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('fetch')) {
        throw new Error(`Cannot connect to Django backend at ${API_BASE_URL}. Make sure it's running.`);
      }
      
      throw error;
    }
  }

  // Garden Management
  async getGarden() {
    return this.request('/garden/');
  }

  async createGarden(name = 'My Garden') {
    return this.request('/garden/', {
      method: 'POST',
      body: JSON.stringify({ garden_name: name }),
    });
  }

  async getGardenSummary() {
    return this.request('/garden/summary/');
  }

  // Plant Management
  async getInventory() {
    return this.request('/inventory/');
  }

  async getPlants(filters = {}) {
    const params = new URLSearchParams(filters);
    const query = params.toString() ? `?${params}` : '';
    return this.request(`/plants/${query}`);
  }

  async getPlant(plantId) {
    return this.request(`/plants/${plantId}/`);
  }

  // Garden Actions
  async placePlant(plantId, row, col, customData = {}) {
    //console.o(`API: Placing plant ${plantId} at position [${row}, ${col}]`);
    
    // The backend view expects 'plant_id'
    const requestBody = {
      plant_id: plantId,
      row: parseInt(row),
      col: parseInt(col),
      custom_data: customData,
    };
    
    //console.o('API Request Body:', requestBody);
    //console.o('Plant ID value:', plantId, 'Type:', typeof plantId);
    //console.o('Row type:', typeof row, 'Col type:', typeof col);
    
    return this.request('/actions/place/', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async removePlant(row, col) {
    //console.o(`API: Removing plant from garden at position [${row}, ${col}]`);
    
    return this.request('/actions/remove/', {
      method: 'POST',
      body: JSON.stringify({ 
        row: parseInt(row), 
        col: parseInt(col) 
      }),
    });
  }

  // Alias for removePlant to make the intent clearer
  async harvestPlant(row, col) {
    return this.removePlant(row, col);
  }

  async movePlant(fromRow, fromCol, toRow, toCol) {
    //console.o(`API: Moving plant from [${fromRow}, ${fromCol}] to [${toRow}, ${toCol}]`);
    
    return this.request('/actions/move/', {
      method: 'POST',
      body: JSON.stringify({
        from_row: parseInt(fromRow),
        from_col: parseInt(fromCol),
        to_row: parseInt(toRow),
        to_col: parseInt(toCol),
      }),
    });
  }

  async bulkActions(actions) {
    return this.request('/actions/bulk/', {
      method: 'POST',
      body: JSON.stringify({ actions }),
    });
  }

  // Statistics
  async getStats() {
    return this.request('/stats/');
  }

  // Debug (development only)
  async simulateOrder() {
    return this.request('/debug/simulate-order/', {
      method: 'POST',
    });
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new GardenAPI();