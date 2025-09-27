import { apiClient } from './FoodAPI';

export const HomeAPI = {
  getStats: async () => {
    try {
      const res = await apiClient.get('/auth/stats/summary/');
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        error:
          error?.response?.data?.error?.message || error.message || 'Failed to load stats',
      };
    }
  },
};
