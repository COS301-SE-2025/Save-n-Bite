// src/services/donationsAPI.js
import { apiClient } from './FoodAPI.js';

const donationsAPI = {

  // Request a donation from a provider
  requestDonation: async (donationData) => {
    try {
      const response = await apiClient.post('/cart/donation/request/', donationData);

      return {
        success: true,
        data: {
          message: response.data.message,
          interaction_id: response.data.interaction_id,
          requested_quantity: response.data.requested_quantity,
          available_quantity: response.data.available_quantity
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               "Failed to submit donation request"
      };
    }
  },

  // Accept a donation request (for providers)
  acceptDonation: async (interactionId) => {
    try {
      const response = await apiClient.post(`/cart/donation/${interactionId}/accept/`);

      return {
        success: true,
        data: {
          message: response.data.message
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               "Failed to accept donation request"
      };
    }
  },

  // Reject a donation request (for providers)
  rejectDonation: async (interactionId, rejectionReason) => {
    try {
      const response = await apiClient.post(`/cart/donation/${interactionId}/reject/`, {
        rejectionReason
      });

      return {
        success: true,
        data: {
          message: response.data.message
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               "Failed to reject donation request"
      };
    }
  },

  // Get all donation requests for current user (NGO)
  getMyDonationRequests: async (queryParams = {}) => {
    try {
   
   
      const url = `/cart/ngo/history/`;

      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               'Failed to fetch donation requests'
      };
    }
  },

  

  // Get incoming donation requests for current provider
  getIncomingDonationRequests: async (queryParams = {}) => {
    try {
      // Build query string from parameters
      const searchParams = new URLSearchParams();
      
      if (queryParams.status) searchParams.append('status', queryParams.status);
      if (queryParams.date_from) searchParams.append('date_from', queryParams.date_from);
      if (queryParams.date_to) searchParams.append('date_to', queryParams.date_to);
      if (queryParams.page) searchParams.append('page', queryParams.page);

      const queryString = searchParams.toString();
      const url = `/cart/business/history/${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               'Failed to fetch incoming donation requests'
      };
    }
  },

  // Get specific donation details by interaction ID
  getDonationDetails: async (interactionId) => {
    try {
      const response = await apiClient.get(`/donation/${interactionId}/`);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               'Failed to fetch donation details'
      };
    }
  },

  // Update donation status (for general status updates)
  updateDonationStatus: async (interactionId, status, additionalData = {}) => {
    try {
      const response = await apiClient.patch(`/donation/${interactionId}/`, {
        status,
        ...additionalData
      });
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               'Failed to update donation status'
      };
    }
  },

  // Cancel a donation request (for NGOs)
  cancelDonationRequest: async (interactionId, reason = null) => {
    try {
      const response = await apiClient.delete(`/donation/${interactionId}/cancel/`, {
        data: {
          reason: reason || 'Cancelled by NGO'
        }
      });
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               'Failed to cancel donation request'
      };
    }
  },

  // Mark donation as collected (when NGO picks up)
  markDonationCollected: async (interactionId, collectionNotes = '') => {
    try {
      const response = await apiClient.post(`/donation/${interactionId}/collect/`, {
        collection_time: new Date().toISOString(),
        collection_notes: collectionNotes
      });
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               'Failed to mark donation as collected'
      };
    }
  }
};

export default donationsAPI;