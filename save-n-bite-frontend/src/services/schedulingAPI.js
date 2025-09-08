// src/services/schedulingAPI.js
import { apiClient } from './FoodAPI.js';

const schedulingAPI = {

  createPickupLocation: async (locationData) => {
    try {
      const response = await apiClient.post('/api/scheduling/pickup-locations/', locationData);

      return {
        success: true,
        data: {
          message: response.data.message,
          location: response.data.location
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || "Failed to create a location"
      };
    }
  },

  createPickupSchedule: async (scheduleData) => {
    try {
      const response = await apiClient.post('/api/scheduling/pickup-schedules/', scheduleData);

      return {
        success: true,
        data: {
          message: response.data.message,
          pickupSchedule: response.data.pickup_schedule
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || "Failed to create Pickup Schedule"
      };
    }
  },

  getPickupSchedules: async () => {
    try {
      const response = await apiClient.get('/api/scheduling/pickup-schedules/');
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch pickup schedules'
      };
    }
  },

  getAvailableTimeSlots: async (id, date = null) => {
    try {
      let url = `/api/scheduling/available-slots/?food_listing_id=${id}`;
      if (date) {
        url += `&date=${date}`;
      }

      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || "Failed to get available timeslots"
      }
    }
  },

  // Checkout cart and create orders
  checkoutCart: async (paymentData) => {
    try {
      const response = await apiClient.post('/cart/checkout/', paymentData);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to process checkout'
      };
    }
  },

  // Schedule pickup after checkout
  schedulePickup: async (scheduleData) => {
    try {
      const response = await apiClient.post('/api/scheduling/schedule/', scheduleData);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to schedule pickup'
      };
    }
  },

  // Get specific order details
  getOrderDetails: async (orderId) => {
    try {
      const response = await apiClient.get(`/cart/orders/${orderId}/`);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch order details'
      };
    }
  },

  // NEW: Get all pickup orders for the current user
  getMyPickups: async (queryParams = {}) => {
    try {
      // Build query string from parameters
      const searchParams = new URLSearchParams();
      
      if (queryParams.status) searchParams.append('status', queryParams.status);
      if (queryParams.date_from) searchParams.append('date_from', queryParams.date_from);
      if (queryParams.date_to) searchParams.append('date_to', queryParams.date_to);
      if (queryParams.page) searchParams.append('page', queryParams.page);

      const queryString = searchParams.toString();
      const url = `/api/scheduling/my-pickups/${queryString ? `?${queryString}` : ''}`;

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
        error: error.response?.data?.message || error.message || 'Failed to fetch pickup orders'
      };
    }
  },

  // NEW: Update pickup status (when user marks as collected, cancels, etc.)
  updatePickupStatus: async (pickupId, status, additionalData = {}) => {
    try {
      const response = await apiClient.patch(`/api/scheduling/pickups/${pickupId}/`, {
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
        error: error.response?.data?.message || error.message || 'Failed to update pickup status'
      };
    }
  },

  // NEW: Get detailed pickup information by ID
  getPickupDetails: async (pickupId) => {
    try {
      const response = await apiClient.get(`/api/scheduling/pickups/${pickupId}/`);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch pickup details'
      };
    }
  },

   // NEW: Cancel a pickup using the proper endpoint
  cancelPickup: async (pickupId, reason = null, notifyBusiness = true) => {
    try {
      const response = await apiClient.delete(`/api/scheduling/pickups/${pickupId}/cancel/`, {
        data: {
          reason: reason || 'Cancelled by customer',
          notify_business: notifyBusiness
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
        error: error.response?.data?.message || error.message || 'Failed to cancel pickup'
      };
    }
  },
   // NEW: Get schedule overview for food providers
  getScheduleOverview: async (date = null) => {
    try {
      const queryParams = date ? `?date=${date}` : '';
      const response = await apiClient.get(`/api/scheduling/schedule-overview/${queryParams}`);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch schedule overview'
      };
    }
  },

  // Add this method to your schedulingAPI object

generateTimeSlots: async (foodListingId, date) => {
  try {
    const response = await apiClient.post('/api/scheduling/generate-time-slots/', {
      food_listing_id: foodListingId,
      date: date
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
      error: error.response?.data?.message || error.message || 'Failed to generate time slots'
    };
  }
},

  // NEW: Verify pickup confirmation code
  verifyPickupCode: async (confirmationCode) => {
    try {
      const response = await apiClient.post('/api/scheduling/verify-code/', {
        confirmation_code: confirmationCode
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
        error: error.response?.data?.message || error.message || 'Failed to verify pickup code'
      };
    }
  },

  // NEW: Get customer details for a pickup
  getPickupCustomerDetails: async (pickupId) => {
    try {
      const response = await apiClient.get(`/api/scheduling/pickups/${pickupId}/customer/`);
      
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || 'Failed to fetch customer details'
      };
    }
  },

  
  // NEW: Complete pickup after verification
  completePickup: async (pickupId, businessNotes = '', verificationMethod = 'confirmation_code') => {
    try {
      const response = await apiClient.post(`/api/scheduling/complete-pickup/${pickupId}/`, {
        actual_pickup_time: new Date().toISOString(),
        business_notes: businessNotes,
        verification_method: verificationMethod
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
        error: error.response?.data?.message || error.message || 'Failed to complete pickup'
      };
    }
  }
};

export default schedulingAPI;