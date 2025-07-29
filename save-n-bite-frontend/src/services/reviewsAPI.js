// src/services/reviewsAPI.js
import { apiClient } from './FoodAPI.js';

const reviewsAPI = {
  // Check if an interaction can be reviewed
  checkReviewStatus: async (interactionId) => {
    try {
      const response = await apiClient.get(`/cart/interactions/${interactionId}/review-status/`);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to check review status'
      };
    }
  },

  // Update interaction status
  updateInteractionStatus: async (interactionId, status, notes = '') => {
    try {
      const response = await apiClient.patch(`/cart/interactions/${interactionId}/status/`, {
        status: status,
        notes: notes
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
               'Failed to update interaction status'
      };
    }
  },

  // Mark interaction as completed (convenience method)
  markAsCompleted: async (interactionId, notes = 'Order completed') => {
    return await reviewsAPI.updateInteractionStatus(interactionId, 'completed', notes);
  },

  // Mark interaction as confirmed (convenience method)
  markAsConfirmed: async (interactionId, notes = 'Order confirmed') => {
    return await reviewsAPI.updateInteractionStatus(interactionId, 'confirmed', notes);
  },

  // Cancel interaction (convenience method)
  cancelInteraction: async (interactionId, notes = 'Order cancelled') => {
    return await reviewsAPI.updateInteractionStatus(interactionId, 'cancelled', notes);
  },

  // Create a new review
  createReview: async (reviewData) => {
    try {
      const response = await apiClient.post('/api/reviews/create/', reviewData);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to create review'
      };
    }
  },

  // Get user's reviews
  getMyReviews: async () => {
    try {
      const response = await apiClient.get('/api/reviews/my-reviews/');
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch reviews'
      };
    }
  },
  
  // Get business reviews (for food providers)
  getBusinessReviews: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams();
      
      // Add query parameters if provided
      if (params.rating) searchParams.append('rating', params.rating);
      if (params.date_range) searchParams.append('date_range', params.date_range);
      if (params.page) searchParams.append('page', params.page);
      if (params.page_size) searchParams.append('page_size', params.page_size);
      
      const queryString = searchParams.toString();
      const url = `/api/business/reviews/${queryString ? `?${queryString}` : ''}`;
      
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
        error: error.response?.data?.message || error.message || 'Failed to fetch business reviews'
      };
    }
  },

  // Get business review statistics
  getBusinessReviewStats: async () => {
    try {
      const response = await apiClient.get('/api/business/reviews/stats/');
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch review statistics'
      };
    }
  },

  // Get review for specific interaction (business owners only)
  getInteractionReview: async (interactionId) => {
    try {
      const response = await apiClient.get(`/cart/interactions/${interactionId}/review/`);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch interaction review'
      };
    }
  }
};

export default reviewsAPI;