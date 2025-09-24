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

  // Get comprehensive user profile (matches your backend endpoint)
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

  // Get basic user profile
  async getUserProfile() {
    try {
      const response = await apiClient.get('/auth/profile/');
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return {
        success: false,
        data: null,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Update user profile (general update)
  async updateMyProfile(userData) {
    try {
      const formData = {
        email: userData.email,
        phone_number: userData.phone_number,
      };

      // Common optional fields
      if (userData.full_name !== undefined) formData.full_name = userData.full_name;

      // Add user-type specific fields
      if (userData.user_type === 'customer') {
        // Image should be provided as base64 in userData.profile_image
        if (userData.profile_image) formData.profile_image = userData.profile_image;
      } else if (userData.user_type === 'ngo') {
        if (userData.representative_name) formData.representative_name = userData.representative_name;
        if (userData.organisation_contact) formData.organisation_contact = userData.organisation_contact;
        if (userData.organisation_email) formData.organisation_email = userData.organisation_email;
        // NGO logo base64
        if (userData.organisation_logo) formData.organisation_logo = userData.organisation_logo;
      } else if (userData.user_type === 'provider') {
        if (userData.business_name) formData.business_name = userData.business_name;
        if (userData.business_contact) formData.business_contact = userData.business_contact;
        if (userData.business_email) formData.business_email = userData.business_email;
        if (userData.business_address) formData.business_address = userData.business_address;
        // Provider logo base64
        if (userData.logo) formData.logo = userData.logo;
      }

      const response = await apiClient.put('/auth/profile/me/update/', formData);

      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Failed to update profile:', error.response?.data || error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get specific profile type (customer, ngo, provider)
  async getSpecificProfile(userType) {
    try {
      const response = await apiClient.get(`/profile/${userType}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching specific profile:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Update specific profile type
  async updateSpecificProfile(userType, profileData, files = {}) {
    try {
      const formData = new FormData();

      // Add profile data
      Object.keys(profileData).forEach(key => {
        const value = profileData[key];
        if (value === undefined || value === null) return;

        // If sending arrays (e.g., business_tags), append each value to let DRF parse list
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v));
        } else {
          formData.append(key, value);
        }
      });

      // Add files if they exist
      if (files.profile_image) {
        formData.append('profile_image', files.profile_image);
      }
      if (files.banner_image) {
        // Backend expects 'banner' as the field name
        formData.append('banner', files.banner_image);
      }
      if (files.logo) {
        formData.append('logo', files.logo);
      }

      const response = await apiClient.put(
        `/profile/${userType}/update/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating specific profile:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get order history
  async getOrderHistory(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await apiClient.get(`/auth/profile/me/orders/?${params}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch order history:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Follow/Unfollow business (for customers and NGOs)
  async followBusiness(businessId) {
    try {
      const response = await apiClient.post('/api/businesses/follow/', {
        business_id: businessId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to follow business:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  async unfollowBusiness(businessId) {
    try {
      const response = await apiClient.post('/api/businesses/unfollow/', {
        business_id: businessId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to unfollow business:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Delete account
  async deleteAccount(password) {
    try {
      const response = await apiClient.delete('/auth/delete-account/', {
        data: { password }
      });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to delete account:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
}

export default ProfileAPI;