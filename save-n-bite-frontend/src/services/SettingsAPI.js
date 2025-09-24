// src/services/SettingsAPI.js
// Uses apiClient from FoodAPI.js
import { apiClient } from './FoodAPI';

class SettingsAPI {
  // Provider Settings
  async getProviderSettings() {
    try {
      const response = await apiClient.get('/auth/provider/settings/');
      return {
        success: true,
        data: response.data.settings,
      };
    } catch (error) {
      console.error('Error fetching provider settings:', error.response?.data || error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        status: error.response?.status,
      };
    }
  }

  async updateProviderSettings(settings) {
    try {
      const payload = { ...settings };

      // Normalize tags: accept array or comma-separated string
      if (payload.business_tags) {
        if (Array.isArray(payload.business_tags)) {
          // send as-is (JSON body)
        } else if (typeof payload.business_tags === 'string') {
          payload.business_tags = payload.business_tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }

      const response = await apiClient.put('/auth/provider/settings/update/', payload);
      return {
        success: true,
        data: response.data.settings,
        message: response.data.message || 'Settings updated successfully',
      };
    } catch (error) {
      console.error('Error updating provider settings:', error.response?.data || error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        status: error.response?.status,
      };
    }
  }

  // Utilities
  getErrorMessage(error) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred'
    );
  }
}

export default SettingsAPI;
