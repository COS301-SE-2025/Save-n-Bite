import React, { useState, useEffect } from 'react'
import { Search as SearchIcon, Calendar as CalendarIcon, MessageCircle, Star } from 'lucide-react'
import OrdersTable  from '../../components/foodProvider/OrdersTable'
import { ReviewPanel } from '../../components/foodProvider/ReviewPanel'
import { Button } from '../../components/foodProvider/Button'
import SideBar from '../../components/foodProvider/SideBar'
import reviewsAPI from '../../services/reviewsAPI' // Import real reviews API

function OrdersAndFeedback() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProvider, setCurrentProvider] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showReviews, setShowReviews] = useState(false)
  const [showQuickReview, setShowQuickReview] = useState(false) // New state for quick review modal
  const [quickReviewData, setQuickReviewData] = useState(null) // New state for quick review data
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    total_reviews: 0,
    average_rating: "0.00",
    rating_breakdown: {
      "5_star": 0, "4_star": 0, "3_star": 0, "2_star": 0, "1_star": 0
    },
    reviews_this_month: 0,
    reviews_this_week: 0
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
      
      // First load reviews to get interaction details
      const reviewsResponse = await reviewsAPI.getBusinessReviews();
      if (reviewsResponse.success) {
        const businessReviews = reviewsResponse.data.results?.reviews || [];
        
        // Helper function to determine review type and get relevant comment
        const getReviewTypeAndComment = (review) => {
          if (review.food_review && review.food_review.trim() !== '') {
            return {
              type: 'Food Review',
              comment: review.food_review,
              icon: '🍽️'
            };
          } else if (review.business_review && review.business_review.trim() !== '') {
            return {
              type: 'Business Review',
              comment: review.business_review,
              icon: '🏪'
            };
          } else {
            return {
              type: 'General Review',
              comment: review.general_comment || 'No comment provided',
              icon: '💭'
            };
          }
        };
        
        // Extract orders from reviews data
        const ordersFromReviews = businessReviews.map((review, index) => {
          const interaction = review.interaction_details;
          const reviewInfo = getReviewTypeAndComment(review);
          
          return {
            id: interaction.id,
            orderId: `#${interaction.id.split('-')[0]}`,
            itemName: `Order Items (${interaction.food_items_count} items)`,
            customerName: review.reviewer.name,
            customerEmail: review.reviewer.email || 'N/A',
            customerPhone: 'N/A',
            type: interaction.type === 'Purchase' ? 'Sale' : 'Donation',
            date: new Date(interaction.completed_at).toLocaleDateString(),
            timeAgo: review.time_ago, // Use time_ago from API instead of pickup window
            pickupDate: new Date(interaction.completed_at).toLocaleDateString(),
            status: 'Completed',
            hasReview: true,
            amount: interaction.type === 'Purchase' ? `R${interaction.total_amount}` : 'N/A',
            imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            confirmationCode: `CONF${index + 1}`,
            completedAt: interaction.completed_at,
            reviewData: review, // Store the full review data
            reviewType: reviewInfo.type,
            reviewComment: reviewInfo.comment,
            reviewIcon: reviewInfo.icon,
            rating: review.general_rating
          };
        });
        
        console.log('Orders extracted from reviews:', ordersFromReviews);
        setOrders(ordersFromReviews);
      } else {
        console.error('Failed to load reviews for orders:', reviewsResponse.error);
        setOrders([]);
      }
      
    } catch (error) {
      console.error('Error loading orders data:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewsData = async () => {
    try {
      console.log('Loading reviews data...');
      
      // Load business reviews
      const reviewsResponse = await reviewsAPI.getBusinessReviews();
      if (reviewsResponse.success) {
        const businessReviews = reviewsResponse.data.results?.reviews || [];
        setReviews(businessReviews);
        console.log('Loaded business reviews:', businessReviews);
      } else {
        console.error('Failed to load reviews:', reviewsResponse.error);
        setReviews([]);
      }
      
      // Load review statistics
      const statsResponse = await reviewsAPI.getBusinessReviewStats();
      if (statsResponse.success) {
        const stats = statsResponse.data.stats;
        setReviewStats(stats);
        console.log('Loaded review stats:', stats);
      } else {
        console.error('Failed to load review stats:', statsResponse.error);
        // Set empty stats instead of mock data
        setReviewStats({
          total_reviews: 0,
          average_rating: "0.00",
          rating_breakdown: {
            "5_star": 0, "4_star": 0, "3_star": 0, "2_star": 0, "1_star": 0
          },
          reviews_this_month: 0,
          reviews_this_week: 0
        });
      }
    } catch (error) {
      console.error('Error in loadReviewsData:', error);
      setReviews([]);
      setReviewStats({
        total_reviews: 0,
        average_rating: "0.00",
        rating_breakdown: {
          "5_star": 0, "4_star": 0, "3_star": 0, "2_star": 0, "1_star": 0
        },
        reviews_this_month: 0,
        reviews_this_week: 0
      });
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
  
  // New function to handle quick review viewing
  const handleQuickReviewView = (order) => {
    setQuickReviewData({
      customerName: order.customerName,
      timeAgo: order.timeAgo,
      rating: order.rating,
      reviewType: order.reviewType,
      reviewComment: order.reviewComment,
      reviewIcon: order.reviewIcon,
      orderAmount: order.amount,
      orderType: order.type
    });
    setShowQuickReview(true);
  };

  const handleViewReviews = (order) => {
    // Since we already have the review data stored in the order, use it directly
    if (order.reviewData) {
      const orderWithReviews = {
        ...order,
        reviews: [order.reviewData] // Wrap the single review in an array
      };
      
      setSelectedOrder(orderWithReviews);
      setShowReviews(true);
    } else {
      // Fallback: find reviews by interaction ID
      const orderReviews = reviews.filter(review => 
        review.interaction_details?.id === order.id
      );
      
      if (orderReviews.length === 0) {
        alert("This order has no reviews yet");
        return;
      }
      
      const orderWithReviews = {
        ...order,
        reviews: orderReviews
      };
      
      setSelectedOrder(orderWithReviews);
      setShowReviews(true);
    }
    
    console.log('Viewing reviews for order:', order);
  };

  // Calculate real feedback data
  const completedOrders = orders.filter(o => o.status === 'Completed');
  const ordersWithReviews = orders.filter(o => o.hasReview);
  
  const realFeedbackData = {
    averageRating: parseFloat(reviewStats.average_rating).toFixed(1),
    totalReviews: reviewStats.total_reviews,
    followers: Math.max(0, Math.floor(completedOrders.length * 0.9)), // 90% of completed orders become followers
    reviewsThisMonth: reviewStats.reviews_this_month,
    recentHighlight: reviews.length > 0 
      ? {
          comment: reviews[0]?.general_comment || reviews[0]?.business_review || "Great quality food and excellent service!",
          author: reviews[0]?.reviewer?.name || "Satisfied Customer",
          date: reviews[0]?.created_at ? new Date(reviews[0].created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          rating: reviews[0]?.general_rating || 5
        }
      : {
          comment: "No reviews yet. Complete your first order to get started!",
          author: "System",
          date: new Date().toLocaleDateString(),
          rating: 0
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
            onClick={() => {
              loadOrdersData();
              loadReviewsData();
            }}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Enhanced Business Feedback Summary Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {realFeedbackData.averageRating}
                </span>
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Average Rating</p>
              <p className="text-xs text-gray-400">
                Based on {realFeedbackData.totalReviews} reviews
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <MessageCircle className="h-6 w-6 text-blue-500" />
                <span className="text-3xl font-bold text-gray-900">
                  {realFeedbackData.totalReviews}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Reviews</p>
              <p className="text-xs text-gray-400">
                {realFeedbackData.reviewsThisMonth} this month
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
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
                <span className="text-3xl font-bold text-gray-900">
                  {realFeedbackData.followers}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Satisfied Customers</p>
              <p className="text-xs text-gray-400">
                {ordersWithReviews.length} left reviews
              </p>
            </div>
            
            {/* Rating Breakdown */}
            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium mb-2">Rating Breakdown</p>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center justify-between text-xs">
                    <span className="flex items-center">
                      <Star size={12} className="text-yellow-400 fill-current mr-1" />
                      {star}
                    </span>
                    <span className="text-gray-600">
                      {reviewStats.rating_breakdown[`${star}_star`] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recent Highlight */}
            <div className="col-span-1 md:col-span-1">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 h-full flex flex-col justify-center border border-blue-100">
                {realFeedbackData.recentHighlight.rating > 0 && (
                  <div className="flex items-center mb-2">
                    {[...Array(realFeedbackData.recentHighlight.rating)].map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                )}
                <p className="text-sm text-blue-800 mb-2 italic line-clamp-2">
                  "{realFeedbackData.recentHighlight.comment}"
                </p>
                <p className="text-xs text-blue-600">
                  - {realFeedbackData.recentHighlight.author} •{' '}
                  {realFeedbackData.recentHighlight.date}
                </p>
              </div>
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="sale">Sales</option>
              <option value="donation">Donations</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img className="h-10 w-10 rounded-full object-cover" src={order.imageUrl} alt="" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{order.orderId}</div>
                            <div className="text-sm text-gray-500">{order.itemName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.timeAgo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.type === 'Sale' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {order.hasReview && (
                            <>
                              <button
                                onClick={() => handleQuickReviewView(order)}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                                title="Click to view review quickly"
                              >
                                <MessageCircle size={14} className="mr-1" />
                                <span className="text-xs">{order.reviewIcon}</span>
                              </button>
                              <div className="flex items-center">
                                {[...Array(order.rating)].map((_, i) => (
                                  <Star key={i} size={12} className="text-yellow-400 fill-current" />
                                ))}
                                {[...Array(5 - order.rating)].map((_, i) => (
                                  <Star key={i} size={12} className="text-gray-300" />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewReviews(order)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Review Modal */}
        {showQuickReview && quickReviewData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Review</h3>
                  <button
                    onClick={() => setShowQuickReview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{quickReviewData.customerName}</p>
                      <p className="text-sm text-gray-500">{quickReviewData.timeAgo}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(quickReviewData.rating)].map((_, i) => (
                        <Star key={i} size={16} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{quickReviewData.reviewIcon}</span>
                      <span className="text-sm font-medium text-gray-700">{quickReviewData.reviewType}</span>
                    </div>
                    <p className="text-gray-800 italic">"{quickReviewData.reviewComment}"</p>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Order Type: <span className="font-medium">{quickReviewData.orderType}</span></span>
                    <span>Amount: <span className="font-medium">{quickReviewData.orderAmount}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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