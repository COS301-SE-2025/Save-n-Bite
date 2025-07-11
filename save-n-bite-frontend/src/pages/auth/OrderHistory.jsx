import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import OrderCard from '../../components/auth/OrderCard';
import ImpactSummary from '../../components/auth/ImpactSummary';
import schedulingAPI from '../../services/schedulingAPI'; // Keep using schedulingAPI for pickups
import reviewsAPI from '../../services/reviewsAPI'; // Use reviewsAPI only for interaction status
import { 
  CheckCircleIcon, 
  LeafIcon, 
  ClockIcon, 
  MapPinIcon, 
  AlertCircleIcon,
  QrCodeIcon,
  PhoneIcon,
  XIcon,
  InfoIcon,
  StoreIcon,
  FilterIcon,
  RotateCcwIcon
} from 'lucide-react';

// Simple inline OrderFilters to avoid import issues
const SimpleOrderFilters = ({ filters, setFilters, orders = [], userType, onResetFilters }) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const uniqueProviders = [...new Set(safeOrders.map(order => order.business?.business_name).filter(Boolean))];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <FilterIcon size={16} className="mr-2" />
          Filters
        </h3>
        <button
          onClick={onResetFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
        >
          <RotateCcwIcon size={14} className="mr-1" />
          Reset
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Active/Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {uniqueProviders.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select
              value={filters.provider}
              onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Providers</option>
              {uniqueProviders.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

// Detailed Pickup Modal Component
const PickupDetailsModal = ({ order, isOpen, onClose, onStatusUpdate }) => {
  if (!isOpen || !order) return null;

  // Generate QR code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${order.confirmation_code}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Pickup Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Order Header */}
          <div className="text-center border-b border-gray-100 pb-4">
            <p className="text-sm text-emerald-700 mb-1">Pickup Order</p>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">{order.food_listing?.name}</h3>
            <p className="text-gray-600 text-sm flex items-center justify-center mt-1">
              <StoreIcon size={16} className="mr-1" />
              {order.business?.business_name}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="text-center bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
              <QrCodeIcon size={20} className="mr-2 text-emerald-600" />
              Show at Pickup
            </h3>
            
            <div className="flex flex-col items-center space-y-4">
              <img
                src={qrCodeUrl}
                alt="Pickup QR Code"
                className="w-40 h-40 border border-gray-200 rounded-lg"
                onError={(e) => {
                  // Fallback if QR service fails
                  e.target.style.display = 'none';
                }}
              />
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Confirmation Code</p>
                <p className="text-2xl font-bold text-emerald-600 tracking-wider">
                  {order.confirmation_code}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Show this code or QR code to the provider
                </p>
              </div>
            </div>
          </div>

          {/* Pickup Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timing Details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <ClockIcon size={18} className="mr-2 text-emerald-600" />
                Pickup Time
              </h4>
              <div className="text-sm space-y-1">
                <p className="text-gray-700">
                  {new Date(order.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-600 font-medium">
                  {order.scheduled_start_time} - {order.scheduled_end_time}
                </p>
                {order.food_listing?.pickup_window && (
                  <p className="text-gray-500 text-xs">
                    Window: {order.food_listing.pickup_window}
                  </p>
                )}
                {order.is_upcoming && (
                  <p className="text-emerald-600 text-xs">
                    {order.is_today ? 'Today' : 'Upcoming'}
                  </p>
                )}
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <MapPinIcon size={18} className="mr-2 text-emerald-600" />
                Location
              </h4>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.location?.name}</p>
                <p className="text-gray-600">{order.location?.address}</p>
                {order.location?.contact_phone && (
                  <p className="text-gray-500 text-xs">{order.location.contact_phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status Information */}
          {order.status !== 'completed' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <InfoIcon size={16} className="mr-1" />
                Pickup Status
              </h4>
              <p className="text-blue-700 text-sm">
                {order.status === 'scheduled' && 'Your pickup is confirmed and ready to collect'}
                {order.status === 'confirmed' && 'Your pickup has been confirmed by the provider'}
                {order.status === 'cancelled' && 'This pickup has been cancelled'}
                {order.status === 'missed' && 'This pickup was missed'}
              </p>
              {order.can_cancel && order.status === 'scheduled' && (
                <p className="text-blue-600 text-xs mt-1">
                  You can still cancel this pickup if needed
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            {order.can_cancel && order.status === 'scheduled' && (
              <button
                onClick={async () => {
                  const reason = prompt('Please provide a reason for cancellation (optional):') || 'Cancelled by customer';
                  if (confirm('Are you sure you want to cancel this pickup? This action cannot be undone.')) {
                    try {
                      const response = await schedulingAPI.cancelPickup(order.id, reason, true);
                      if (response.success) {
                        alert(response.data.message || 'Pickup cancelled successfully');
                        if (response.data.refund_eligible) {
                          alert('You may be eligible for a refund. Please check your account or contact support.');
                        }
                        onStatusUpdate();
                        onClose();
                      } else {
                        alert('Failed to cancel pickup: ' + response.error);
                      }
                    } catch (error) {
                      alert('Failed to cancel pickup. Please try again.');
                    }
                  }
                }}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancel Pickup
              </button>
            )}
            
            <button
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    provider: 'all'
  });

  // Load orders from API
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await schedulingAPI.getMyPickups();
      if (response.success) {
        const pickups = response.data.results?.pickups || response.data.results || [];
        
        // Check for completed pickups and sync interaction status
        await syncCompletedInteractions(pickups);
        
        setOrders(pickups);
        setFilteredOrders(pickups);
      } else {
        setError(response.error || 'Failed to load orders');
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // New function to sync interaction status for completed pickups
  const syncCompletedInteractions = async (pickups) => {
    const completedPickups = pickups.filter(pickup => pickup.status === 'completed');
    
    for (const pickup of completedPickups) {
      try {
        // Check if interaction is already marked as completed by checking review status
        const reviewStatus = await reviewsAPI.checkReviewStatus(pickup.interaction_id);
        
        if (reviewStatus.success && reviewStatus.data.interaction_status !== 'completed') {
          // Interaction not yet marked as completed, so update it
          const updateResult = await reviewsAPI.markAsCompleted(
            pickup.interaction_id,
            'Order completed by food provider'
          );
          
          if (updateResult.success) {
            console.log(`Interaction ${pickup.interaction_id} marked as completed`);
          } else {
            console.error(`Failed to mark interaction ${pickup.interaction_id} as completed:`, updateResult.error);
          }
        }
      } catch (error) {
        console.error(`Error syncing interaction for pickup ${pickup.id}:`, error);
      }
    }
  };

  // Apply filters
  useEffect(() => {
    // Ensure orders is an array before filtering
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => {
        switch (filters.status) {
          case 'completed':
            return order.status === 'completed';
          case 'confirmed':
            return order.status === 'scheduled' || order.status === 'confirmed';
          case 'pending':
            return order.status === 'pending';
          case 'cancelled':
            return order.status === 'cancelled';
          default:
            return true;
        }
      });
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(order => 
        new Date(order.scheduled_date) >= filterDate
      );
    }

    // Filter by business/provider
    if (filters.provider !== 'all') {
      filtered = filtered.filter(order => 
        order.business?.business_name === filters.provider
      );
    }

    setFilteredOrders(filtered);
  }, [filters, orders]);

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      dateRange: 'all',
      provider: 'all'
    });
  };

  // Handle order click to show pickup details
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowPickupModal(true);
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    loadOrders(); // Refresh orders after status update
  };

  // Calculate impact summary
  const calculateImpact = () => {
    // Ensure filteredOrders is an array before using reduce
    if (!Array.isArray(filteredOrders) || filteredOrders.length === 0) {
      return {
        mealsSaved: 0,
        co2Reduced: 0,
        ordersCount: 0
      };
    }

    return filteredOrders.reduce((acc, order) => ({
      mealsSaved: acc.mealsSaved + 1,
      co2Reduced: acc.co2Reduced + 0.5,
      ordersCount: filteredOrders.length
    }), {
      mealsSaved: 0,
      co2Reduced: 0,
      ordersCount: 0
    });
  };

  const impactData = calculateImpact();

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading orders</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadOrders}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get status color based on pickup status
  const getStatusColor = (order) => {
    switch (order.status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'scheduled':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'missed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text
  const getStatusText = (order) => {
    switch (order.status) {
      case 'completed':
        return 'Completed';
      case 'scheduled':
        return 'Scheduled';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      case 'missed':
        return 'Missed';
      default:
        return order.status;
    }
  };

  // Get action button based on status
  const getActionButton = (order) => {
    switch (order.status) {
      case 'completed':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reviews/${order.interaction_id}`);
            }}
            className="px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Leave a Review
          </button>
        );
      case 'scheduled':
      case 'confirmed':
        return (
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOrderClick(order);
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
            >
              View Details
            </button>
            
            {(order.can_cancel || order.status === 'scheduled') && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to cancel this pickup? This action cannot be undone.')) {
                    try {
                      const response = await schedulingAPI.cancelPickup(order.id, 'Cancelled by customer', true);
                      if (response.success) {
                        alert(response.data.message || 'Pickup cancelled successfully');
                        handleStatusUpdate();
                      } else {
                        alert('Failed to cancel pickup: ' + response.error);
                      }
                    } catch (error) {
                      alert('Failed to cancel pickup. Please try again.');
                    }
                  }
                }}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
              >
                Cancel Pickup
              </button>
            )}
          </div>
        );
      case 'cancelled':
      case 'missed':
        return (
          <div className="px-4 py-2 text-gray-500 font-medium text-sm">
            {order.status === 'cancelled' ? 'Cancelled' : 'Missed'}
          </div>
        );
      default:
        return null;
    }
  };

  // Get unique providers for filter
  const uniqueProviders = Array.isArray(orders) 
    ? [...new Set(orders.map(order => order.business?.business_name).filter(Boolean))]
    : [];

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <CustomerNavBar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
        </div>

        {/* Impact Summary */}
        <ImpactSummary 
          impact={impactData}
          userType="customer"
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <SimpleOrderFilters
              filters={filters}
              setFilters={setFilters}
              orders={orders}
              userType="customer"
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Orders List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                {Array.isArray(filteredOrders) ? filteredOrders.length : 0} orders found
              </div>
            </div>

            {!Array.isArray(filteredOrders) || filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xl text-gray-600 mb-4">No orders found</p>
                <button
                  onClick={() => navigate('/food-listing')}
                  className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Browse Food
                </button>
              </div>
            ) : (
              /* Orders List */
              <div className="bg-white rounded-lg shadow-sm">
                {filteredOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      index !== filteredOrders.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 flex items-start space-x-4">
                        {/* Food Image - Add placeholder since API has food images */}
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800">
                              {order.food_listing?.name}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order)}`}>
                              {getStatusText(order)}
                            </span>
                            {order.is_upcoming && (
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                Upcoming
                              </span>
                            )}
                            {order.is_today && (
                              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                Today
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 flex items-center">
                            <StoreIcon size={14} className="mr-1" />
                            {order.business?.business_name}
                          </p>
                          
                          <div className="flex items-center text-sm text-gray-500 gap-4 mb-2">
                            <span className="flex items-center">
                              <ClockIcon size={16} className="mr-1" />
                              {new Date(order.scheduled_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <MapPinIcon size={16} className="mr-1" />
                              {order.location?.name}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-500">
                            Pickup: {order.scheduled_start_time} - {order.scheduled_end_time}
                          </p>
                          
                          {order.is_upcoming && (
                            <p className="text-xs text-emerald-600 mt-1">
                              {order.is_today ? 'Today' : 'Upcoming pickup'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        {getActionButton(order)}
                      </div>
                    </div>
                    
                    {/* Confirmation Code Preview */}
                    {order.confirmation_code && (order.status === 'scheduled' || order.status === 'confirmed') && (
                      <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                        <p className="text-sm text-emerald-800 flex items-center">
                          <QrCodeIcon size={16} className="mr-2" />
                          Confirmation Code: <span className="font-mono font-bold ml-1">{order.confirmation_code}</span>
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                          Click to view QR code and full pickup details
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pickup Details Modal */}
      <PickupDetailsModal
        order={selectedOrder}
        isOpen={showPickupModal}
        onClose={() => {
          setShowPickupModal(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default OrderHistory;