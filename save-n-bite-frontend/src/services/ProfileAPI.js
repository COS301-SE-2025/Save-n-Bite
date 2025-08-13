// services/ProfileAPI.js
import { apiClient } from './FoodAPI.js';

class ProfileAPI {
  // Helper method to extract error messages
  getErrorMessage(error) {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    } else if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.response?.data) {
      // Handle validation errors
      const errorData = error.response.data;
      if (typeof errorData === 'object') {
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError)) {
          return firstError[0];
        } else if (typeof firstError === 'string') {
          return firstError;
        }
      }
    }
    return error.message || 'An unexpected error occurred';
  }

  // Get current user's profile
  async getMyProfile() {
    try {
      const response = await apiClient.get('/auth/profile/me/');

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return {
        success: false,
        data: null,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      // If profileData is FormData (for file uploads), don't set content-type
      const config = profileData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};

      const response = await apiClient.put('/auth/profile/me/', profileData, config);

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to update profile:', error);
      return {
        success: false,
        data: null,
        error: this.getErrorMessage(error)
      };
    }
  }

}

export default ProfileAPI;