// services/BusinessAPI.js
import { apiClient } from './FoodAPI';

class BusinessAPI {
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

  // Search for businesses
  async searchBusinesses(searchTerm = '') {
    try {
      const response = await apiClient.get('/auth/businesses/search/', { 
        params: { search: searchTerm } 
      });

      return {
        success: true,
        data: response.data.businesses,
        count: response.data.count
      };
    } catch (error) {
      console.error('Failed to search businesses:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get business profile by ID
  async getBusinessProfile(businessId) {
    try {
      const response = await apiClient.get(`/auth/business/${businessId}/`);

      return {
        success: true,
        data: response.data.business
      };
    } catch (error) {
      console.error('Failed to fetch business profile:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Follow a business
  async followBusiness(businessId) {
    try {
      const response = await apiClient.post('/api/follow/', { 
        business_id: businessId 
      });

      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Successfully followed business'
      };
    } catch (error) {
      console.error('Failed to follow business:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Unfollow a business
  async unfollowBusiness(businessId) {
    try {
      const response = await apiClient.delete(`/api/unfollow/${businessId}/`);

      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Successfully unfollowed business'
      };
    } catch (error) {
      console.error('Failed to unfollow business:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get user's followed businesses
  async getFollowedBusinesses() {
    try {
      const response = await apiClient.get('/api/followed-businesses/');

      return {
        success: true,
        data: response.data.businesses || response.data,
        count: response.data.count
      };
    } catch (error) {
      console.error('Failed to fetch followed businesses:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Check if user is following a specific business
  async isFollowingBusiness(businessId) {
    try {
      const response = await apiClient.get(`/api/is-following/${businessId}/`);

      return {
        success: true,
        isFollowing: response.data.is_following
      };
    } catch (error) {
      console.error('Failed to check follow status:', error);
      return {
        success: false,
        isFollowing: false,
        error: this.getErrorMessage(error)
      };
    }
  }
}

export default BusinessAPI;