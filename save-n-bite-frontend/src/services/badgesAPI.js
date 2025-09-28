// src/services/badgesAPI.js

//const API_BASE_URL = 'http://localhost:8000';
 const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://savenbiteservice-hzghg8gcgddtcfg7.southafricanorth-01.azurewebsites.net';

class BadgesAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/badges`;
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
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Badges API Error:', error);
      throw error;
    }
  }

  // Get all badge types (public)
  async getBadgeTypes(filters = {}) {
    const params = new URLSearchParams(filters);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/types/${query}`);
  }

  // Get badges for authenticated provider
  async getMyBadges() {
    return this.request('/my-badges/');
  }

  // Get public badges for a specific provider
  async getProviderBadges(providerId) {
    return this.request(`/provider/${providerId}/`);
  }

  // Get badge progress for authenticated provider
  async getBadgeProgress() {
    return this.request('/progress/');
  }

  // Pin or unpin a badge
  async toggleBadgePin(badgeId, action) {
    return this.request('/pin/', {
      method: 'POST',
      body: JSON.stringify({
        badge_id: badgeId,
        pin_action: action
      })
    });
  }

  // Get badge download information
  async getBadgeDownload(badgeId) {
    return this.request(`/download/${badgeId}/`);
  }

  // Recalculate badges for authenticated provider
  async recalculateBadges() {
    return this.request('/recalculate/', {
      method: 'POST'
    });
  }

  // Get badge leaderboard (public)
  async getBadgeLeaderboard(limit = 10) {
    return this.request(`/leaderboard/?limit=${limit}`);
  }

  // Get badge categories (public)
  async getBadgeCategories() {
    return this.request('/categories/');
  }

  // Get badge rarities (public)
  async getBadgeRarities() {
    return this.request('/rarities/');
  }
}

export default new BadgesAPI();