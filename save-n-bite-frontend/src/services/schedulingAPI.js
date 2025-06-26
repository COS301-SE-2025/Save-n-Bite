// src/services/schedulingAPI.js
import { apiClient } from './FoodAPI.js';

const schedulingAPI = {
  // Get available pickup slots for a food listing
  getAvailableSlots: async (foodListingId, date = null, locationId = null) => {
    try {
      const params = new URLSearchParams();
      params.append('food_listing_id', '9e1f9d7e-6d83-48f0-9bdf-534a5ae2984a');
      if (date) params.append('date', date);
      if (locationId) params.append('location_id', locationId);

      console.log('Making request to:', `/api/scheduling/available-slots/?${params}`);
      const response = await apiClient.get(`/api/scheduling/available-slots/?${params}`);
      console.log('Available slots API response:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Scheduling API Error:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('Full error:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 
               error.response?.data?.message || 
               error.message || 
               'Failed to fetch available slots'
      };
    }
  },

  // Get pickup locations for a business (public endpoint)
  getPickupLocations: async (businessId) => {
    try {
      const response = await apiClient.get(`/api/scheduling/public/locations/${businessId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch pickup locations'
      };
    }
  },

  // Schedule a pickup
  schedulePickup: async (pickupData) => {
    try {
      const response = await apiClient.post('/api/scheduling/schedule/', pickupData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to schedule pickup'
      };
    }
  },

  // Create a pickup location for a business
  createPickupLocation: async (locationData) => {
    try {
      const response = await apiClient.post('/api/scheduling/pickup-locations/', locationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create pickup location'
      };
    }
  }
};

export default schedulingAPI;