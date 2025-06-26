import React, { useState, useEffect } from 'react'
import { Search as SearchIcon, Calendar as CalendarIcon } from 'lucide-react'
import OrdersTable  from '../../components/foodProvider/OrdersTable'
import { ReviewPanel } from '../../components/foodProvider/ReviewPanel'
import { BusinessFeedback } from '../../components/foodProvider/FoodProviderFeedback'
import { Button } from '../../components/foodProvider/Button'
import { businessFeedbackData } from '../../utils/MockData'
import SideBar from '../../components/foodProvider/SideBar';
import { getBusinessReviews, getBusinessReviewStats, getBusinessReviewsMock, getBusinessReviewStatsMock } from '../../services/reviewsAPI';

function OrdersAndFeedback() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProvider, setCurrentProvider] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showReviews, setShowReviews] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // Load orders data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await loadOrdersData();
      await loadReviewsData();
      loadProviderInfo();
    };
    
    initializeData();
    
    // Listen for order completion events from PickupCoordination
    const handleOrderCompleted = () => {
      loadOrdersData();
      loadReviewsData(); // Also refresh reviews when orders are completed
    };
    
    window.addEventListener('orderCompleted', handleOrderCompleted);
    
    return () => {
      window.removeEventListener('orderCompleted', handleOrderCompleted);
    };
  }, []);

  const loadProviderInfo = () => {
    try {
      const providerBusinessName = localStorage.getItem('providerBusinessName');
      if (providerBusinessName) {
        setCurrentProvider(providerBusinessName);
      }
    } catch (error) {
      console.error('Error loading provider info:', error);
    }
  };

  const loadOrdersData = async () => {
    try {
      setLoading(true);
      
      // Get all orders from localStorage
      const pickupOrders = JSON.parse(localStorage.getItem('pickupOrders') || '[]');
      const completedOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');
      const currentProviderBusinessName = localStorage.getItem('providerBusinessName');
      
      // Fetch listings data directly from API
      let listingsData = [];
      try {
        const response = await fetch('http://localhost:8000/api/food-listings/');
        if (response.ok) {
          const data = await response.json();
          listingsData = data.listings || [];
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
      
      // Filter orders for current provider
      const filteredPickupOrders = currentProviderBusinessName 
        ? pickupOrders.filter(order => order.providerName === currentProviderBusinessName)
        : pickupOrders;
      
      const filteredCompletedOrders = currentProviderBusinessName 
        ? completedOrders.filter(order => order.providerName === currentProviderBusinessName)
        : completedOrders;
      
      // Helper function to find listing and determine type
      const getOrderType = (order) => {
        console.log('Processing order:', order);
        console.log('Available listings:', listingsData);
        
        // Try to find the listing by item name
        const matchingListing = listingsData.find(listing => 
          listing.name === order.itemName || 
          listing.title === order.itemName ||
          (order.items && order.items.some(item => item.includes(listing.name)))
        );
        
        console.log('Matching listing:', matchingListing);
        
        if (matchingListing) {
          // Use the listing's discounted_price to determine type
          const discountedPrice = parseFloat(matchingListing.discounted_price || matchingListing.discountedPrice || 0);
          console.log('Discounted price:', discountedPrice);
          return {
            type: discountedPrice > 0 ? "Sale" : "Donation",
            amount: discountedPrice > 0 ? `R${discountedPrice}` : "N/A"
          };
        }
        
        // Fallback: check if order has price information
        const price = order.price || order.amount || 0;
        const isDonation = price === 0 || price === "0" || price === "N/A" || price === "Free";
        
        console.log('Using fallback logic - price:', price, 'isDonation:', isDonation);
        
        return {
          type: isDonation ? "Donation" : "Sale",
          amount: isDonation ? "N/A" : `R${price}`
        };
      };
      
      // Transform orders to match expected format
      const transformedOrders = [];
      
      // Transform pickup orders
      filteredPickupOrders.forEach((order) => {
        const orderTypeInfo = getOrderType(order);
        
        transformedOrders.push({
          id: order.id,
          orderId: order.orderNumber,
          itemName: order.itemName || order.items?.join(', ') || 'Food Item',
          customerName: order.customerName,
          customerEmail: order.contactEmail,
          customerPhone: order.contactPhone,
          type: orderTypeInfo.type,
          date: order.expiryDate || order.pickupDate,
          pickupWindow: order.pickupWindow,
          pickupDate: order.expiryDate || order.pickupDate,
          status: order.status === 'Completed' ? 'Completed' : 'Confirmed',
          hasReview: false,
          amount: orderTypeInfo.amount,
          imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          confirmationCode: order.confirmationCode,
          providerName: order.providerName
        });
      });
      
      // Transform completed orders
      filteredCompletedOrders.forEach((order) => {
        const orderTypeInfo = getOrderType(order);
        
        transformedOrders.push({
          id: `completed-${order.id}`,
          orderId: order.orderNumber,
          itemName: order.itemName || order.items?.join(', ') || 'Food Item',
          customerName: order.customerName,
          customerEmail: order.contactEmail,
          customerPhone: order.contactPhone,
          type: orderTypeInfo.type,
          date: order.expiryDate || order.pickupDate,
          pickupWindow: order.pickupWindow,
          pickupDate: order.expiryDate || order.pickupDate,
          status: 'Completed',
          hasReview: false,
          amount: orderTypeInfo.amount,
          imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          confirmationCode: order.confirmationCode,
          providerName: order.providerName,
          completedAt: order.completedAt,
          pickupStatus: order.pickupStatus
        });
      });
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders data:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewsData = async () => {
    try {
      // Try to use real API first
      const businessReviews = await getBusinessReviews();
      const stats = await getBusinessReviewStats();
      
      setReviews(businessReviews);
      setReviewStats(stats);
    } catch (error) {
      console.log('API unavailable, using fallback for reviews data');
      // Fallback to mock functions if API fails
      try {
        const businessReviews = await getBusinessReviewsMock();
        const stats = await getBusinessReviewStatsMock();
        
        console.log('Loaded business reviews:', businessReviews);
        console.log('Current provider:', localStorage.getItem('providerBusinessName'));
        
        setReviews(businessReviews);
        setReviewStats(stats);
      } catch (fallbackError) {
        console.error('Both API and mock failed:', fallbackError);
        setReviews([]);
        setReviewStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesType =
      filterType === 'all' ||
      order.type.toLowerCase() === filterType.toLowerCase()
    const matchesStatus =
      filterStatus === 'all' ||
      order.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch =
      order.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })
  
  const handleViewReviews = (order) => {
    // Find reviews for this specific order
    const orderReviews = reviews.filter(review => 
      review.orderId === order.id || 
      review.orderNumber === order.orderId ||
      review.orderId === order.orderId
    );
    
    console.log('Looking for reviews for order:', order);
    console.log('Available reviews:', reviews);
    console.log('Matched reviews:', orderReviews);
    
    if (orderReviews.length === 0) {
      alert("This order has no reviews yet");
      return;
    }
    
    // Create a combined order object with reviews
    const orderWithReviews = {
      ...order,
      reviews: orderReviews
    };
    
    setSelectedOrder(orderWithReviews);
    setShowReviews(true);
  };

  // Calculate real feedback data
  const completedOrders = orders.filter(o => o.status === 'Completed');
  const totalOrders = orders.length;
  
  const realFeedbackData = {
    averageRating: reviewStats.averageRating.toFixed(1),
    totalReviews: reviewStats.totalReviews,
    followers: Math.max(0, Math.floor(completedOrders.length * 0.9)), // 90% of completed orders become followers
    recentHighlight: reviews.length > 0 
      ? {
          comment: reviews[reviews.length - 1]?.comment || "Great quality food and excellent service!",
          author: reviews[reviews.length - 1]?.customerName || "Satisfied Customer",
          date: reviews[reviews.length - 1]?.createdAt ? new Date(reviews[reviews.length - 1].createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        }
      : {
          comment: "No reviews yet. Complete your first order to get started!",
          author: "System",
          date: new Date().toLocaleDateString()
        }
  };

  if (loading) {
    return (
      <div className="w-full flex min-h-screen">
        <SideBar onNavigate={() => {}} currentPage="dashboard" />
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex min-h-screen">
             <SideBar onNavigate={() => {}} currentPage="dashboard" />
                 <div className="flex-1 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders & Feedback</h1>
          <p className="text-gray-600 mt-1">
            Manage your orders and customer reviews
            {currentProvider && (
              <span className="ml-2 text-blue-600 font-medium">
                • {currentProvider}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={loadOrdersData}
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>
      {/* Business Feedback Summary Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-5 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl font-bold text-gray-900">
                {realFeedbackData.averageRating}
              </span>
              <svg
                className="h-6 w-6 text-yellow-400 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <svg
                className="h-6 w-6 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-2xl font-bold text-gray-900">
                {realFeedbackData.totalReviews}
              </span>
            </div>
            <p className="text-sm text-gray-500">Total Reviews</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <svg
                className="h-6 w-6 text-purple-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="text-2xl font-bold text-gray-900">
                {realFeedbackData.followers}
              </span>
            </div>
            <p className="text-sm text-gray-500">Followers</p>
          </div>
          <div className="col-span-2">
            {/* <div className="bg-blue-50 rounded-lg p-3 h-full flex flex-col justify-center">
              <p className="text-sm text-blue-800 mb-1 italic">
                "{businessFeedbackData.recentHighlight.comment}"
              </p>
              <p className="text-xs text-blue-600">
                - {businessFeedbackData.recentHighlight.author} •{' '}
                {new Date(
                  businessFeedbackData.recentHighlight.date,
                ).toLocaleDateString()}
              </p>
            </div> */}
          </div>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by order ID, item or customer..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="sale">Sales</option>
            <option value="donation">Donations</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="never collected">Never Collected</option>
          </select>
          <Button
            variant="secondary"
            icon={<CalendarIcon className="h-4 w-4" />}
          >
            Date Range
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'You haven\'t received any orders yet. Orders will appear here once customers place them.'
              }
            </p>
            {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            onViewReviews={handleViewReviews}
          />
        )}
      </div>
      {/* {selectedOrder && (
        <div className="mt-6">
          <ReviewPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onResolve={() => {
              // Handle resolve
            }}
            onReply={() => {
              // Handle reply
            }}
            onReport={() => {
              // Handle report
            }}
          />
        </div>
      )} */}

      {showReviews && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ReviewPanel
                order={selectedOrder}
                onClose={() => setShowReviews(false)}
                onResolve={() => setShowReviews(false)}
                onReply={() => {}}
                onReport={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersAndFeedback;