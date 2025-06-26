// services/BusinessAPI.js
import { apiClient } from './FoodAPI';

class BusinessAPI {
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
        message: response.data.message
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
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to unfollow business:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get list of businesses user is following
  async getFollowingList() {
    try {
      const response = await apiClient.get('/api/following/');

      return {
        success: true,
        data: response.data.following,
        count: response.data.count,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to fetch following list:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get followers for a business (Provider only)
  async getBusinessFollowers() {
    try {
      const response = await apiClient.get('/api/followers/');

      return {
        success: true,
        data: response.data.followers,
        summary: response.data.summary,
        count: response.data.count,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to fetch business followers:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Check if user is following a specific business
  async checkFollowStatus(businessId) {
    try {
      const response = await apiClient.get(`/api/follow-status/${businessId}/`);
      return {
        success: true,
        isFollowing: response.data.is_following
      };
    } catch (error) {
      console.error('Failed to check follow status:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Error message helper (matches FoodAPI pattern)
  getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    return error.message || 'An unexpected error occurred';
  }
}

export default new BusinessAPI();