import { apiClient } from './FoodAPI';

export const analyticsAPI = {

  getBusinessAnalytics: async () => {
    try {
      const response = await apiClient.get('/api/business/');
      return response.data;
    } catch (error) {
      console.error('Error fetching business analytics:', error);
      throw error;
    }
  }
};


export const transformAnalyticsData = {

  formatMonthlyOrders: (ordersPerMonth) => {
    return ordersPerMonth.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      orders: item.count
    }));
  },

  formatSalesDonations: (salesVsDonations) => {
    return [
      {
        name: 'Sales',
        value: salesVsDonations.sales
      },
      {
        name: 'Donations', 
        value: salesVsDonations.donations
      }
    ];
  },

  formatFollowerGrowth: (followerGrowth) => {
    return followerGrowth.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      followers: item.count
    }));
  },


  formatSustainabilityData: (sustainabilityImpact) => {
    const mealsSaved = sustainabilityImpact.meals_saved || 0;
    const waterSaved = sustainabilityImpact.estimated_water_saved_litres || 0;
    
    // Calculate CO2 reduction (example: 2.5kg CO2 per meal saved)
    const co2Reduced = Math.round(mealsSaved * 2.5);
    
    return {
      mealsSaved,
      waterSavedLitres: waterSaved,
      co2Reduced
    };
  },


  formatPercentChange: (changePercent) => {
    const isPositive = changePercent >= 0;
    return {
      value: Math.abs(changePercent),
      isPositive,
      sign: isPositive ? '+' : '-',
      color: isPositive ? 'text-green-500' : 'text-red-500'
    };
  },

  formatTopSaverBadge: (topPercent) => {
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

  // Simple logic to rotate suggestions or base on data
  const suggestionIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % suggestions.length;
  return suggestions[suggestionIndex];
};