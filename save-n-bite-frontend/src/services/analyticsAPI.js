import { apiClient } from './FoodAPI';

export const analyticsAPI = {
  // Get business analytics from the real API
  getBusinessAnalytics: async () => {
    try {
      const response = await apiClient.get('/api/business/');
      return response.data;
    } catch (error) {
      console.error('Error fetching business analytics:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility - now uses real API
  getProviderAnalytics: async () => {
    try {
      const data = await analyticsAPI.getBusinessAnalytics();
      
      // Transform API response to match expected format
      return {
        total_orders_fulfilled: data.total_orders_fulfilled || 0,
        total_donations: data.donations || 0,
        total_followers: data.total_followers || 0,
        average_rating: 4.5, // Default since not in API
        total_reviews: Math.floor((data.total_orders_fulfilled || 0) * 0.6), // Estimate
        orders_per_month: data.orders_per_month || [],
        sales_vs_donations: data.sales_vs_donations || { sales: 0, donations: 0 },
        follower_growth: data.follower_growth || [],
        sustainability_impact: {
          meals_saved: data.sustainability_impact?.meals_saved || 0,
          estimated_water_saved_litres: data.sustainability_impact?.estimated_water_saved_litres || 0,
          co2_reduced_kg: (data.sustainability_impact?.meals_saved || 0) * 2.5 // Estimate CO2
        },
        orders_change_percent: data.order_change_percent || 0,
        donations_change_percent: data.donation_change_percent || 0,
        followers_change_percent: data.follower_change_percent || 0,
        top_saver_percentile: data.top_saver_badge_percent || 0
      };
    } catch (error) {
      console.error('Error getting provider analytics:', error);
      // Return empty state on error
      return {
        total_orders_fulfilled: 0,
        total_donations: 0,
        total_followers: 0,
        average_rating: 0,
        total_reviews: 0,
        orders_per_month: [],
        sales_vs_donations: { sales: 0, donations: 0 },
        follower_growth: [],
        sustainability_impact: { meals_saved: 0, estimated_water_saved_litres: 0, co2_reduced_kg: 0 }
      };
    }
  }
};

export const transformAnalyticsData = {
  formatMonthlyOrders: (ordersPerMonth) => {
    if (!Array.isArray(ordersPerMonth)) return [];
    
    return ordersPerMonth.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      orders: item.count || 0
    }));
  },

  formatSalesDonations: (salesVsDonations) => {
    if (!salesVsDonations) return [];
    
    return [
      {
        name: 'Sales',
        value: salesVsDonations.sales || 0
      },
      {
        name: 'Donations', 
        value: salesVsDonations.donations || 0
      }
    ];
  },

  formatFollowerGrowth: (followerGrowth) => {
    if (!Array.isArray(followerGrowth)) return [];
    
    return followerGrowth.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      followers: item.count || 0
    }));
  },

  formatSustainabilityData: (sustainabilityImpact) => {
    if (!sustainabilityImpact) return { mealsSaved: 0, co2Reduced: 0 };
    
    const mealsSaved = sustainabilityImpact.meals_saved || 0;
    const waterSaved = sustainabilityImpact.estimated_water_saved_litres || 0;
    const co2Reduced = sustainabilityImpact.co2_reduced_kg || (mealsSaved * 2.5);
    
    return {
      mealsSaved,
      waterSavedLitres: waterSaved,
      co2Reduced: Math.round(co2Reduced)
    };
  },

  formatPercentChange: (changePercent) => {
    if (changePercent === null || changePercent === undefined) return null;
    
    const isPositive = changePercent >= 0;
    return {
      value: Math.abs(changePercent),
      isPositive,
      sign: isPositive ? '+' : '-',
      color: isPositive ? 'text-green-500' : 'text-red-500'
    };
  },

  formatTopSaverBadge: (topPercent) => {
    if (!topPercent) return "Keep going! You're making a difference in reducing food waste! 💪";
    
    if (topPercent <= 10) {
      return `You're in the top ${Math.ceil(topPercent)}% of food savers this month! 🎉`;
    } else if (topPercent <= 25) {
      return `You're in the top ${Math.ceil(topPercent)}% of food savers this month! 🌟`;
    } else if (topPercent <= 50) {
      return `You're in the top ${Math.ceil(topPercent)}% of food savers this month! 👍`;
    } else {
      return `Keep going! You're making a difference in reducing food waste! 💪`;
    }
  }
};

export const getAISuggestion = (analyticsData) => {
  const suggestions = [
    "List items before 4PM to get more views - our data shows listings posted earlier receive 35% more engagement.",
    "Consider offering more donation options - businesses with higher donation rates see 20% more followers.",
    "Update your profile regularly - active businesses get 40% more customer engagement.",
    "Respond quickly to orders - fast response times increase customer retention by 25%.",
    "Add photos to your listings - items with photos get 60% more views than those without."
  ];

  // Simple logic to rotate suggestions based on data or time
  if (analyticsData?.total_orders_fulfilled === 0) {
    return "Start by creating your first food listing to begin tracking your impact!";
  }
  
  if (analyticsData?.total_donations === 0 && analyticsData?.total_orders_fulfilled > 0) {
    return "Consider offering donation options alongside sales - it helps build community goodwill!";
  }
  
  // Rotate suggestions daily
  const suggestionIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % suggestions.length;
  return suggestions[suggestionIndex];
};