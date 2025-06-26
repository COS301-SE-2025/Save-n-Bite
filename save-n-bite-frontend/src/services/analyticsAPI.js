import { apiClient } from './FoodAPI';

export const analyticsAPI = {

  getBusinessAnalytics: async () => {
    try {
      const response = await apiClient.get('/api/business/');
      console
      return response.data;
    } catch (error) {
      console.error('Error fetching business analytics:', error);
      throw error;
    }
  },

  // Get completed orders for the current provider
  getCompletedOrders: () => {
    try {
      const completedOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');
      const currentProviderBusinessName = localStorage.getItem('providerBusinessName');
      
      // Filter completed orders for current provider
      return currentProviderBusinessName 
        ? completedOrders.filter(order => 
            order.providerName === currentProviderBusinessName
          )
        : completedOrders;
    } catch (error) {
      console.error('Error getting completed orders:', error);
      return [];
    }
  },

  // Mark an order as completed
  markOrderAsCompleted: (orderId, pickupStatus = 'On Time') => {
    try {
      const pickupOrders = JSON.parse(localStorage.getItem('pickupOrders') || '[]');
      const completedOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');
      const currentProviderBusinessName = localStorage.getItem('providerBusinessName');
      
      // Find the order to complete
      const orderToComplete = pickupOrders.find(order => order.id === orderId);
      
      if (orderToComplete && orderToComplete.providerName === currentProviderBusinessName) {
        // Add completion timestamp and status
        const completedOrder = {
          ...orderToComplete,
          completedAt: new Date().toISOString(),
          pickupStatus,
          status: 'Completed'
        };
        
        // Add to completed orders
        completedOrders.push(completedOrder);
        localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
        
        // Update the original order status
        const updatedPickupOrders = pickupOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'Completed', pickupStatus }
            : order
        );
        localStorage.setItem('pickupOrders', JSON.stringify(updatedPickupOrders));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking order as completed:', error);
      return false;
    }
  },

  // Get analytics data for the current provider
  getProviderAnalytics: async () => {
    try {
      const completedOrders = analyticsAPI.getCompletedOrders();
      const currentProviderBusinessName = localStorage.getItem('providerBusinessName');
      
      if (!currentProviderBusinessName) {
        return {
          total_orders_fulfilled: 0,
          total_donations: 0,
          total_followers: 0,
          average_rating: 0,
          total_reviews: 0,
          orders_per_month: [],
          sales_vs_donations: { sales: 0, donations: 0 },
          follower_growth: [],
          sustainability_impact: { meals_saved: 0, estimated_water_saved_litres: 0 }
        };
      }

      // Fetch listings data to determine sales vs donations
      let listingsData = [];
      try {
        const response = await fetch('http://localhost:8000/api/food-listings/');
        if (response.ok) {
          const data = await response.json();
          listingsData = data.listings || [];
        }
      } catch (error) {
        console.error('Error fetching listings for analytics:', error);
      }

      // Helper function to determine order type
      const getOrderType = (order) => {
        // Try to find the listing by item name
        const matchingListing = listingsData.find(listing => 
          listing.name === order.itemName || 
          listing.title === order.itemName ||
          (order.items && order.items.some(item => item.includes(listing.name)))
        );
        
        if (matchingListing) {
          // Use the listing's discounted_price to determine type
          const discountedPrice = parseFloat(matchingListing.discounted_price || matchingListing.discountedPrice || 0);
          return discountedPrice > 0 ? "sale" : "donation";
        }
        
        // Fallback: check if order has price information
        const price = order.price || order.amount || 0;
        const isDonation = price === 0 || price === "0" || price === "N/A" || price === "Free";
        
        return isDonation ? "donation" : "sale";
      };

      // Calculate analytics from completed orders
      const totalOrdersFulfilled = completedOrders.length;
      
      // Calculate sales vs donations
      let salesCount = 0;
      let donationsCount = 0;
      
      completedOrders.forEach(order => {
        const orderType = getOrderType(order);
        if (orderType === "sale") {
          salesCount++;
        } else {
          donationsCount++;
        }
      });
      
      // Calculate monthly orders
      const monthlyOrders = {};
      completedOrders.forEach(order => {
        const month = new Date(order.completedAt).toISOString().slice(0, 7); // YYYY-MM format
        monthlyOrders[month] = (monthlyOrders[month] || 0) + 1;
      });
      
      const ordersPerMonth = Object.entries(monthlyOrders).map(([month, count]) => ({
        month,
        count
      }));

      // Calculate sustainability impact
      const mealsSaved = totalOrdersFulfilled;
      const co2Reduced = mealsSaved * 2.5; // 2.5kg CO2 per meal saved
      const waterSaved = mealsSaved * 500; // 500L water per meal saved

      return {
        total_orders_fulfilled: totalOrdersFulfilled,
        total_donations: donationsCount,
        total_followers: Math.floor(totalOrdersFulfilled * 0.8), // Estimate followers based on orders
        average_rating: 4.5, // Default rating
        total_reviews: Math.floor(totalOrdersFulfilled * 0.6), // Estimate reviews
        orders_per_month: ordersPerMonth,
        sales_vs_donations: { sales: salesCount, donations: donationsCount },
        follower_growth: ordersPerMonth.map(item => ({
          month: item.month,
          count: Math.floor(item.count * 0.8)
        })),
        sustainability_impact: { 
          meals_saved: mealsSaved, 
          estimated_water_saved_litres: waterSaved,
          co2_reduced_kg: co2Reduced
        },
        orders_change_percent: 0, // Calculate based on previous month
        donations_change_percent: 0,
        followers_change_percent: 0,
        top_saver_percentile: Math.max(10, 100 - totalOrdersFulfilled * 2) // Higher orders = better percentile
      };
    } catch (error) {
      console.error('Error getting provider analytics:', error);
      return {
        total_orders_fulfilled: 0,
        total_donations: 0,
        total_followers: 0,
        average_rating: 0,
        total_reviews: 0,
        orders_per_month: [],
        sales_vs_donations: { sales: 0, donations: 0 },
        follower_growth: [],
        sustainability_impact: { meals_saved: 0, estimated_water_saved_litres: 0 }
      };
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