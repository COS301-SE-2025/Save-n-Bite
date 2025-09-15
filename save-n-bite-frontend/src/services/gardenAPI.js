// src/services/gardenAPI.js

const API_BASE_URL = 'http://localhost:5173';

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
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Garden API Error:', error);
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
    return this.request('/actions/place/', {
      method: 'POST',
      body: JSON.stringify({
        plant_id: plantId,
        row,
        col,
        custom_data: customData,
      }),
    });
  }

  async removePlant(row, col) {
    return this.request('/actions/remove/', {
      method: 'POST',
      body: JSON.stringify({ row, col }),
    });
  }

  async movePlant(fromRow, fromCol, toRow, toCol) {
    return this.request('/actions/move/', {
      method: 'POST',
      body: JSON.stringify({
        from_row: fromRow,
        from_col: fromCol,
        to_row: toRow,
        to_col: toCol,
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
}

export default new GardenAPI();