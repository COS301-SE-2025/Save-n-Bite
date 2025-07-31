import { apiClient } from './FoodAPI.js';
import { 
  transformUserData, 
  transformVerificationData, 
  transformUserTypeToBackend 
} from '../utils/adminDataTransformers.js';

///api/admim/  POST

// ==================== AUTHENTICATION ====================



const AdminAPI = {
  getAdminInfo: async (userEmail) => {
    try {
      const response = await apiClient.post('/api/admin/', {
        email: userEmail
      });
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch admin data"
      };
    }
  },

    // ==================== DASHBOARD ====================
  getDashboard: async () => {
    try {
      const response = await apiClient.get('/api/admin/dashboard/');
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch dashboard data"
      };
    }
  },

  // ==================== USER MANAGEMENT ====================
  getAllUsers: async (page = 1, search = '', userType = '', status = '', perPage = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) params.append('search', search);
      if (userType && userType !== 'All') {
        params.append('user_type', transformUserTypeToBackend(userType));
      }
      if (status && status !== 'All') {
        params.append('status', status.toLowerCase());
      }

      const response = await apiClient.get(`/api/admin/users/?${params.toString()}`);
      
      // Transform the user data
      const transformedUsers = response.data.users.map(transformUserData);
      
      return {
        data: {
          users: transformedUsers,
          pagination: response.data.pagination
        },
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch users"
      };
    }
  },

  toggleUserStatus: async (userId, reason = '') => {
    try {
      const response = await apiClient.post('/api/admin/users/toggle-status/', {
        user_id: userId,
        reason: reason
      });
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to toggle user status"
      };
    }
  },

  resetUserPassword: async (userId, reason = '') => { // NOT DONE 
    try {
      const response = await apiClient.post('', {
        user_id: userId,
        reason: reason
      });
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to reset password"
      };
    }
  },

    // ==================== VERIFICATION MANAGEMENT ====================
  getPendingVerifications: async () => {
    try {
      const response = await apiClient.get('/api/admin/verifications/pending/');
      
      // Transform verification data
      const allVerifications = [
        ...response.data.pending_verifications.ngos.map(ngo => 
          transformVerificationData({ ...ngo, type: 'ngo' })
        ),
        ...response.data.pending_verifications.providers.map(provider => 
          transformVerificationData({ ...provider, type: 'provider' })
        )
      ];
      
      return {
        data: allVerifications,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch verification requests"
      };
    }
  },

  updateVerificationStatus: async (profileType, profileId, newStatus, reason = '') => {
    try {
      // Transform frontend types to backend format
      const backendType = profileType === 'NGO' ? 'ngo' : 'provider';
      const backendStatus = newStatus === 'Approved' ? 'verified' : 'rejected';
      
      const response = await apiClient.post('/api/admin/verifications/update/', {
        profile_type: backendType,
        profile_id: profileId,
        new_status: backendStatus,
        reason: reason
      });
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to update verification status"
      };
    }
  },

  // ==================== FOOD LISTINGS MANAGEMENT ====================
  getAllListings: async (page = 1, search = '', typeFilter = '', statusFilter = '', perPage = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) params.append('search', search);
      if (typeFilter && typeFilter !== 'All') params.append('type', typeFilter);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);

      const response = await apiClient.get(`/api/admin/listings/?${params.toString()}`);
      
      return {
        data: {
          listings: response.data.listings,
          pagination: response.data.pagination
        },
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch listings"
      };
    }
  },

  moderateListing: async (listingId, action, reason = '') => {
    try {
      const response = await apiClient.post('/api/admin/listings/moderate/', {
        listing_id: listingId,
        action: action, // 'flag', 'unflag', 'remove'
        reason: reason
      });
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to moderate listing"
      };
    }
  },

  // ==================== TRANSACTION VIEWING ====================
  getAllTransactions: async (page = 1, search = '', typeFilter = '', statusFilter = '', perPage = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) params.append('search', search);
      if (typeFilter && typeFilter !== 'All') params.append('type', typeFilter);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);

      const response = await apiClient.get(`/cart/admin/transactions/?${params.toString()}`);
      
      return {
        data: {
          transactions: response.data.transactions,
          pagination: response.data.pagination
        },
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch transactions"
      };
    }
  },

  // ==================== REVIEW MANAGEMENT (using existing endpoints) ====================
  getAllReviews: async (page = 1, search = '', statusFilter = '', perPage = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: perPage.toString()
      });
      
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);

      const response = await apiClient.get(`/api/admin/reviews/?${params.toString()}`);
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch reviews"
      };
    }
  },

  moderateReview: async (reviewId, action, reason = '') => {
    try {
      const response = await apiClient.post(`/api/admin/reviews/${reviewId}/moderate/`, {
        action: action, // 'flag', 'delete', etc.
        reason: reason
      });
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to moderate review"
      };
    }
  },

}