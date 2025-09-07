// AdminAPI.js - Complete integration with your Django backend
import { apiClient } from './FoodAPI.js';
import { 
  transformUserData, 
  transformVerificationData, 
  transformUserTypeToBackend 
} from '../utils/adminDataTransformers.js';

const AdminAPI = {
  // ==================== AUTHENTICATION ====================
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

  resetUserPassword: async (userId, reason = '') => {
    try {
      const response = await apiClient.post('/api/admin/users/reset-password/', {
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
    
    console.log('Raw verification response:', response.data);
    
    // Transform verification data without external dependency
    const transformVerificationData = (profile, type) => {
      console.log('Transforming profile data:', profile);
      
      // Handle both NGO and Provider profiles from backend
      return {
        id: profile.id,
        type: type === 'ngo' ? 'NGO' : 'Provider',
        // Fixed: Use profile.name first (what backend actually returns), then fallbacks
        name: profile.name || profile.organisation_name || profile.business_name || 'Unknown Organization',
        email: profile.user?.email || profile.email || 'No email',
        contact: profile.phone_number || profile.contact || 'No contact',
        number: profile.phone_number || profile.contact || 'No contact',
        address: profile.address || 'No address provided',
        representative: profile.representative_name || 'Not specified',
        submitted: profile.user?.created_at || profile.created_at || profile.created_at || new Date().toISOString(),
        status: profile.status || 'pending_verification',
        // Convert documents object to array format that modal expects
        documents: profile.documents ? Object.entries(profile.documents).map(([key, value]) => ({
          type: key,
          name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          url: value,
          path: value
        })) : [],
        // Keep original documents for reference
        originalDocuments: profile.documents || {},
        // Add more fields that the frontend expects
        profileId: profile.id,
        profileType: type === 'ngo' ? 'NGO' : 'Provider',
        // Add raw profile data for debugging
        rawProfile: profile
      };
    };

    // Check if the response has the expected structure
    if (!response.data.pending_verifications) {
      console.error('Unexpected response structure:', response.data);
      return {
        data: [],
        success: true,
        error: null
      };
    }

    const allVerifications = [
      ...(response.data.pending_verifications.ngos || []).map(ngo => 
        transformVerificationData(ngo, 'ngo')
      ),
      ...(response.data.pending_verifications.providers || []).map(provider => 
        transformVerificationData(provider, 'provider')
      )
    ];
    
    console.log('Transformed verifications:', allVerifications);
    
    return {
      data: allVerifications,
      success: true,
      error: null
    };
  } catch (error) {
    console.error('getPendingVerifications error:', error);
    return {
      data: [],
      success: false,
      error: error.response?.data?.error?.message || error.message || "Failed to fetch verification requests"
    };
  }
},

updateVerificationStatus: async (profileType, profileId, newStatus, reason = '') => {
  console.log('🚀 UPDATED ADMINAPI.JS IS RUNNING!');
  console.log('INPUTS:', profileType, profileId, newStatus, reason);
  
  try {
    const backendType = profileType === 'NGO' ? 'ngo' : 'provider';
    const backendStatus = newStatus === 'Approved' ? 'verified' : 'rejected';
    
    const payload = {
      profile_type: backendType,
      profile_id: profileId,
      new_status: backendStatus,
      reason: reason
    };
    
    console.log('SENDING PAYLOAD:', payload);
    
    const response = await apiClient.post('/api/admin/verifications/update/', payload);
    console.log('SUCCESS:', response.data);
    
    return { data: response.data, success: true, error: null };
  } catch (error) {
    console.log('ERROR STATUS:', error.response?.status);
    console.log('ERROR DATA:', error.response?.data);
    console.log('FULL ERROR:', error);
    
    return {
      data: null,
      success: false,
      error: JSON.stringify(error.response?.data) || error.message
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
  getAllReviews: async (page = 1, search = '', statusFilter = '', ratingsFilter = '', perPage = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: perPage.toString()
      });
      
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
      if (ratingsFilter && ratingsFilter !== 'All') params.append('rating', ratingsFilter);

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

  // ==================== ANALYTICS ====================
  getAnalytics: async () => {
    try {
      const response = await apiClient.get('/api/admin/analytics/');
      
      return {
        data: response.data.analytics,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch analytics"
      };
    }
  },

  async getSecurityAnomalies() {
  try {
    const response = await apiClient.get('/api/admin/security/anomalies/')
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Security anomalies API error:', error)
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Failed to fetch security anomalies'
    }
  }
},

async moderateListing(listingId, action, reason = '') {
  try {
    const response = await apiClient.post('/api/admin/listings/moderate/', {
      listing_id: listingId,
      action: action,
      reason: reason
    })
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Listing moderation API error:', error)
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Failed to moderate listing'
    }
  }
},

  // ==================== AUDIT LOGS ====================
  getAdminActionLogs: async (page = 1, search = '', actionType = '', startDate = '', endDate = '', perPage = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) params.append('search', search);
      if (actionType) params.append('action_type', actionType);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get(`/api/admin/logs/admin-actions/?${params.toString()}`);
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch audit logs"
      };
    }
  },

 getSystemLogs: async (page = 1, search = '', logLevel = '', startDate = '', endDate = '', perPage = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) params.append('search', search);
      // Map frontend "logLevel" to backend "severity"
      if (logLevel) params.append('severity', logLevel);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get(`/api/admin/logs/system/?${params.toString()}`);
      
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch system logs"
      };
    }
  },
  
  resolveSystemLog: async (logId, resolutionNotes = '') => {
    try {
      const response = await apiClient.post('/api/admin/logs/system/resolve/', {
        log_id: logId,
        resolution_notes: resolutionNotes
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
        error: error.response?.data?.error?.message || "Failed to resolve system log"
      };
    }
  },

  // ==================== NOTIFICATION METHODS ====================
  
  /**
   * Send custom notification to specified user groups
   * @param {Object} notificationData - { subject, body, target_audience }
   * @returns {Promise<Object>} API response with stats
   */
  sendCustomNotification: async (notificationData) => {
    try {
      const response = await apiClient.post('/api/admin/notifications/send/', {
        subject: notificationData.title,
        body: notificationData.message,
        target_audience: notificationData.audience.toLowerCase()
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
        error: error.response?.data?.error?.message || error.message || "Failed to send notification"
      };
    }
  },

  /**
   * Get notification analytics data
   * @param {string} targetAudience - Optional audience filter
   * @returns {Promise<Object>} Analytics data
   */
  getNotificationAnalytics: async (targetAudience = null) => {
    try {
      const params = targetAudience ? { target_audience: targetAudience } : {};
      const response = await apiClient.get('/api/admin/notifications/analytics/', { params });

      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to fetch analytics"
      };
    }
  },

  /**
   * Get audience counts for targeting
   * @returns {Promise<Object>} Audience count data
   */
  getAudienceCounts: async () => {
    try {
      const response = await apiClient.get('/api/admin/notifications/audience-counts/');

      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to fetch audience counts"
      };
    }
  },

  /**
   * Get sent notifications history (for admin tracking)
   * This would need to be implemented on the backend if required
   * @param {Object} filters - { page, page_size, audience, date_from, date_to }
   * @returns {Promise<Object>} Notification history
   */
  getNotificationHistory: async (filters = {}) => {
    try {
      const response = await apiClient.get('/api/admin/notifications/history/', { params: filters });

      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to fetch notification history"
      };
    }
  },

  // ==================== ADMIN PROFILE (using new endpoints) ====================
  getAdminProfile: async () => {
    try {
      const response = await apiClient.get('/auth/admin/profile/');
      return {
        data: response.data.profile,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to fetch admin profile"
      };
    }
  },

  updateAdminProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/auth/admin/profile/update/', profileData);
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || "Failed to update admin profile"
      };
    }
  },

  // ==================== DATA EXPORT ====================
/**
   * Export data
   * @param {string} exportType - Type of data to export (users, analytics, etc.)
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Export response
   */
  exportData: async (exportType, dateFrom = '', dateTo = '') => {
    try {
      const requestBody = {
        export_type: exportType,
        format: 'csv'
      };
      
      if (dateFrom) requestBody.date_from = dateFrom;
      if (dateTo) requestBody.date_to = dateTo;

      const response = await apiClient.post('/api/admin/export/', requestBody, {
        responseType: 'blob' // For file downloads
      });

      return {
        data: response.data,
        success: true,
        error: null,
        headers: response.headers
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to export data"
      };
    }
  }
}

export default AdminAPI;