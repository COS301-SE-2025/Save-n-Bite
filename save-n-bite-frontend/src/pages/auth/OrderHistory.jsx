import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import OrderCard from '../../components/auth/OrderCard';
import ImpactSummary from '../../components/auth/ImpactSummary';
import schedulingAPI from '../../services/schedulingAPI'; // Keep using schedulingAPI for pickups
import donationsAPI from '../../services/DonationsAPI'; // Add donationsAPI
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
  RotateCcwIcon,
  HeartIcon,
  GiftIcon,
  ShoppingBagIcon
} from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// Simple inline OrderFilters to avoid import issues
const SimpleOrderFilters = ({ filters, setFilters, orders = [], userType, onResetFilters }) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const uniqueProviders = [...new Set(safeOrders.map(order => {
    // Handle both pickup and donation provider names
    return order.business?.business_name || order.order?.providerName || order.providerName;
  }).filter(Boolean))];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <FilterIcon size={16} className="mr-2" />
          Filters
        </h3>
        <button
          onClick={onResetFilters}
          className="text-sm text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 flex items-center"
        >
          <RotateCcwIcon size={14} className="mr-1" />
          Reset
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
          >
            <option value="all">All Types</option>
            <option value="pickup">Pickups</option>
            <option value="donation">Donations</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Active/Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {uniqueProviders.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Provider</label>
            <select
              value={filters.provider}
              onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
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

// Enhanced Pickup Modal Component
const PickupDetailsModal = ({ order, isOpen, onClose, onStatusUpdate }) => {
  if (!isOpen || !order) return null;

  const isDonation = order.interaction_type === 'Donation';
  const codeToShow = isDonation ? order.verification_code : order.confirmation_code;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${codeToShow}`;
  const itemName = isDonation ? order.items?.[0]?.name : order.food_listing?.name;
  const providerName = isDonation ? (order.order?.providerName || 'Provider') : order.business?.business_name;

  const handleCancel = async (reason) => {
    try {
      let response;
      if (isDonation) {
        response = await donationsAPI.cancelDonationRequest(order.id, reason);
      } else {
        response = await schedulingAPI.cancelPickup(order.id, reason, true);
      }

      if (response.success) {
        showToast(response.data.message || `${isDonation ? 'Donation' : 'Pickup'} cancelled successfully`, 'success');
        if (!isDonation && response.data.refund_eligible) {
          showToast('You may be eligible for a refund. Please check your account.', 'info');
        }
        onStatusUpdate();
        onClose();
      } else {
        showToast(`Failed to cancel ${isDonation ? 'donation' : 'pickup'}: ${response.error}`, 'error');
      }
    } catch (error) {
      showToast(`Failed to cancel ${isDonation ? 'donation' : 'pickup'}. Please try again.`, 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      ready: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200' },
      confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
      scheduled: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200' },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
      missed: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200' },
      default: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' }
    };
    
    const { bg, text } = statusMap[status.toLowerCase()] || statusMap.default;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} capitalize`}>
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 transform scale-100 opacity-100">
        {/* Header */}
        <div className="border-b border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isDonation ? 'Donation Details' : 'Pickup Details'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(isDonation ? order.created_at : order.scheduled_date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            {getStatusBadge(order.status)}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              #{order.id?.slice(-6) || 'N/A'}
            </span>
          </div>

          {/* Item Details */}
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                {isDonation ? (
                  <HeartIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShoppingBagIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{itemName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{providerName}</p>
                {!isDonation && order.food_listing?.price && (
                  <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    R{parseFloat(order.food_listing.price).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {codeToShow && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="inline-flex items-center space-x-2 mb-3">
                <QrCodeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {isDonation ? 'Collection Code' : 'Pickup Code'}
                </span>
              </div>
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-white p-3 rounded-lg inline-block">
                  <img
                    src={qrCodeUrl}
                    alt={isDonation ? "Collection QR Code" : "Pickup QR Code"}
                    className="w-32 h-32"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="bg-white dark:bg-gray-900 px-4 py-2 rounded-lg">
                  <p className="font-mono text-lg font-semibold tracking-wider text-gray-900 dark:text-white">
                    {codeToShow}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Show this code to the {isDonation ? 'provider' : 'staff'}
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Timing */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-medium">
                  {isDonation ? 'Collection Window' : 'Pickup Time'}
                </h4>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {isDonation
                    ? order.order?.pickupWindow || 'Flexible'
                    : `${order.scheduled_start_time} - ${order.scheduled_end_time}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(isDonation ? order.created_at : order.scheduled_date)}
                </p>
              </div>
            </div>

            {/* Location or Details */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-2">
                {isDonation ? (
                  <InfoIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <MapPinIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
                <h4 className="text-sm font-medium">
                  {isDonation ? 'Item Details' : 'Pickup Location'}
                </h4>
              </div>
              <div className="space-y-1">
                {isDonation ? (
                  <>
                    {order.items?.[0]?.expiry_date && (
                      <p className="text-sm text-gray-900 dark:text-white">
                        Expires: {new Date(order.items[0].expiry_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-900 dark:text-white">
                      Quantity: {order.quantity || order.items?.[0]?.quantity || 1}
                    </p>
                    {order.special_instructions && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Note: {order.special_instructions}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.location?.name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {order.location?.address}
                    </p>
                    {order.location?.contact_phone && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                        {order.location.contact_phone}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {order.status !== 'completed' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-400">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {order.status === 'ready' && (isDonation ? 'Your donation is ready for collection' : 'Your order is ready for pickup')}
                {order.status === 'confirmed' && (isDonation ? 'Your donation has been confirmed' : 'Your pickup has been confirmed')}
                {order.status === 'cancelled' && '❌ ' + (isDonation ? 'This donation has been cancelled' : 'This pickup has been cancelled')}
                {order.status === 'rejected' && '❌ This request has been rejected'}
                {order.status === 'scheduled' && '📅 Your pickup is confirmed and ready to collect'}
                {order.status === 'missed' && '⏰ ' + (isDonation ? 'This donation was missed' : 'This pickup was missed')}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex space-x-3">
            {((isDonation && order.status === 'ready') || (!isDonation && order.can_cancel && order.status === 'scheduled')) && (
              <button
                onClick={() => handleCancel('Cancelled by customer')}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
              >
                Cancel {isDonation ? 'Donation' : 'Pickup'}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
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
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    provider: 'all'
  });

  // Add state for confirmation dialog
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Load orders from API - both pickups and donations
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load both pickups and donations concurrently
      const [pickupsResponse, donationsResponse] = await Promise.all([
        schedulingAPI.getMyPickups(),
        donationsAPI.getMyDonationRequests()
      ]);

      const allOrders = [];

      // Add pickups if successful
      if (pickupsResponse.success) {
        const pickups = pickupsResponse.data.results?.pickups || pickupsResponse.data.results || [];
        const normalizedPickups = pickups.map(pickup => ({
          ...pickup,
          interaction_type: 'Pickup',
          order_type: 'pickup'
        }));
        allOrders.push(...normalizedPickups);
      }

      // Add donations if successful
      if (donationsResponse.success) {
        const donations = donationsResponse.data.results || [];
        const normalizedDonations = donations.map(donation => ({
          ...donation,
          interaction_type: 'Donation',
          order_type: 'donation'
        }));
        allOrders.push(...normalizedDonations);
      }

      // Sort by creation date (most recent first)
      allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Check for completed orders and sync interaction status
      await syncCompletedInteractions(allOrders);

      setOrders(allOrders);
      setFilteredOrders(allOrders);

      // Set error only if both requests failed
      if (!pickupsResponse.success && !donationsResponse.success) {
        setError('Failed to load order history');
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

  // Sync interaction status for completed orders
  const syncCompletedInteractions = async (allOrders) => {
    const completedOrders = allOrders.filter(order => order.status === 'completed');

    for (const order of completedOrders) {
      try {
        if (order.interaction_id) {
          // Check if interaction is already marked as completed by checking review status
          const reviewStatus = await reviewsAPI.checkReviewStatus(order.interaction_id);

          if (reviewStatus.success && reviewStatus.data.interaction_status !== 'completed') {
            // Interaction not yet marked as completed, so update it
            const updateResult = await reviewsAPI.markAsCompleted(
              order.interaction_id,
              'Order completed by food provider'
            );

            if (updateResult.success) {
              console.log(`Interaction ${order.interaction_id} marked as completed`);
            } else {
              console.error(`Failed to mark interaction ${order.interaction_id} as completed:`, updateResult.error);
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing interaction for order ${order.id}:`, error);
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

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(order => {
        if (filters.type === 'pickup') {
          return order.order_type === 'pickup' || order.interaction_type === 'Pickup';
        } else if (filters.type === 'donation') {
          return order.order_type === 'donation' || order.interaction_type === 'Donation';
        }
        return true;
      });
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => {
        switch (filters.status) {
          case 'completed':
            return order.status === 'completed';
          case 'confirmed':
            return order.status === 'scheduled' || order.status === 'confirmed' || order.status === 'ready';
          case 'pending':
            return order.status === 'pending';
          case 'cancelled':
            return order.status === 'cancelled';
          case 'rejected':
            return order.status === 'rejected';
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

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.scheduled_date || order.created_at);
        return orderDate >= filterDate;
      });
    }

    // Filter by business/provider
    if (filters.provider !== 'all') {
      filtered = filtered.filter(order => {
        const providerName = order.business?.business_name || order.order?.providerName;
        return providerName === filters.provider;
      });
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

  const handleOrderClick = (order) => {
 
  if (order.status === 'scheduled' || order.status === 'confirmed' || order.status === 'ready') {
    setSelectedOrder(order);
    setShowPickupModal(true);
  }

};

  // Handle status update
  const handleStatusUpdate = async () => {
    loadOrders(); // Refresh orders after status update
  };

  // Show toast message
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Calculate impact summary
  const calculateImpact = () => {
    // Ensure filteredOrders is an array before using reduce
    if (!Array.isArray(filteredOrders) || filteredOrders.length === 0) {
      return {
        mealsSaved: 0,
        co2Reduced: 0,
        ordersCount: 0,
        donationsCount: 0,
        pickupsCount: 0
      };
    }

    return filteredOrders.reduce((acc, order) => {
      const isDonation = order.interaction_type === 'Donation';
      const quantity = isDonation ? (order.quantity || 1) : 1;

      return {
        mealsSaved: acc.mealsSaved + quantity,
        co2Reduced: acc.co2Reduced + (quantity * 0.5),
        ordersCount: filteredOrders.length,
        donationsCount: isDonation ? acc.donationsCount + 1 : acc.donationsCount,
        pickupsCount: !isDonation ? acc.pickupsCount + 1 : acc.pickupsCount
      };
    }, {
      mealsSaved: 0,
      co2Reduced: 0,
      ordersCount: 0,
      donationsCount: 0,
      pickupsCount: 0
    });
  };

  const impactData = calculateImpact();

  // Loading state - matches FoodProvidersPage pattern
  if (loading && filteredOrders.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-200">Loading order history...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
        <CustomerNavBar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Order History
            </h1>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">Unable to load order history</p>
            <button 
              onClick={loadOrders} 
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get status color based on order status
  const getStatusColor = (order) => {
    switch (order.status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'ready':
      case 'scheduled':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'rejected':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'missed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Get status text
  const getStatusText = (order) => {
    switch (order.status) {
      case 'completed':
        return 'Completed';
      case 'ready':
        return 'Ready';
      case 'scheduled':
        return 'Scheduled';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      case 'missed':
        return 'Missed';
      default:
        return order.status || 'Unknown';
    }
  };

  // Get action button based on status and type
  const getActionButton = (order) => {
    const isDonation = order.interaction_type === 'Donation';

    switch (order.status) {
      case 'completed':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (order.interaction_id) {
                navigate(`/reviews/${order.interaction_id}`);
              }
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
          >
            Leave a Review
          </button>
        );
      case 'ready':
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

            {((isDonation && order.status === 'ready') || (!isDonation && (order.can_cancel || order.status === 'scheduled'))) && (
              <button
                onClick={(e) => handleCancelClick(order, e)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
              >
                Cancel {isDonation ? 'Donation' : 'Pickup'}
              </button>
            )}
          </div>
        );
      case 'cancelled':
      case 'rejected':
      case 'missed':
        return (
          <div className="px-4 py-2 text-gray-500 font-medium text-sm">
            {order.status === 'cancelled' ? 'Cancelled' :
              order.status === 'rejected' ? 'Rejected' : 'Missed'}
          </div>
        );
      default:
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOrderClick(order);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium text-sm"
          >
            View Details
          </button>
        );
    }
  };

  // Add handleCancelClick function
  const handleCancelClick = (order, e) => {
    e.stopPropagation();
    setOrderToCancel(order);
    setShowConfirmCancel(true);
  };

  // Add handleConfirmCancel function
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    const isDonation = orderToCancel.interaction_type === 'Donation';
    try {
      let response;
      if (isDonation) {
        response = await donationsAPI.cancelDonationRequest(orderToCancel.id, 'Cancelled by customer');
      } else {
        response = await schedulingAPI.cancelPickup(orderToCancel.id, 'Cancelled by customer', true);
      }

      if (response.success) {
        showToast(`${isDonation ? 'Donation' : 'Pickup'} cancelled successfully`, 'success');
        handleStatusUpdate();
      } else {
        showToast(`Failed to cancel ${isDonation ? 'donation' : 'pickup'}: ${response.error}`, 'error');
      }
    } catch (error) {
      showToast(`Failed to cancel ${isDonation ? 'donation' : 'pickup'}. Please try again.`, 'error');
    } finally {
      setShowConfirmCancel(false);
      setOrderToCancel(null);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
      <CustomerNavBar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Order History</h1>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {impactData.pickupsCount} pickups • {impactData.donationsCount} donations
          </div>
        </div>

        {/* Enhanced Impact Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <LeafIcon size={20} className="mr-2 text-emerald-600 dark:text-emerald-400" />
            Your Impact Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{impactData.mealsSaved}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Meals Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{impactData.co2Reduced.toFixed(1)}kg</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">CO₂ Reduced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{impactData.pickupsCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Pickups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{impactData.donationsCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Donations</div>
            </div>
          </div>
        </div>

        {/* Show loading indicator while orders are being updated (similar to FoodProvidersPage) */}
        {loading && filteredOrders.length > 0 && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-200 rounded-md text-sm transition-colors duration-300">
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-emerald-600 mr-2"></div>
              Updating orders...
            </div>
          </div>
        )}

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
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {Array.isArray(filteredOrders) ? filteredOrders.length : 0} orders found
              </div>
            </div>

            {!Array.isArray(filteredOrders) || filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-300">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-6a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">No orders found</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/food-listing')}
                    className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
                  >
                    Browse Food
                  </button>
                  <button
                    onClick={() => navigate('/donations')}
                    className="inline-block px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
                  >
                    Request Donations
                  </button>
                </div>
              </div>
            ) : (
              /* Orders List */
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-300">
                {filteredOrders.map((order, index) => {
                  const isDonation = order.interaction_type === 'Donation';
                  return (
                    <div
                      key={order.id}
                      className={`p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index !== filteredOrders.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                        }`}
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 flex items-start space-x-4">
                          {/* Order Type Icon */}
                          <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
                            {isDonation ? (
                              <HeartIcon size={24} className="text-red-500" />
                            ) : (
                              <GiftIcon size={24} className="text-emerald-500" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                                {isDonation ? order.items?.[0]?.name : order.food_listing?.name}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order)}`}>
                                {getStatusText(order)}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                              <StoreIcon size={14} className="mr-1" />
                              {isDonation ? (order.order?.providerName || 'Provider') : order.business?.business_name}
                            </p>

                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4 mb-2">
                              <span className="flex items-center">
                                <ClockIcon size={16} className="mr-1" />
                                {new Date(isDonation ? order.created_at : order.scheduled_date).toLocaleDateString()}
                              </span>
                              {!isDonation && order.location?.name && (
                                <span className="flex items-center">
                                  <MapPinIcon size={16} className="mr-1" />
                                  {order.location.name}
                                </span>
                              )}
                              {isDonation && (
                                <span className="flex items-center">
                                  <InfoIcon size={16} className="mr-1" />
                                  Qty: {order.quantity || order.items?.[0]?.quantity || 1}
                                </span>
                              )}
                            </div>

                            {!isDonation && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Pickup: {order.scheduled_start_time} - {order.scheduled_end_time}
                              </p>
                            )}

                            {isDonation && order.order?.pickupWindow && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Collection: {order.order.pickupWindow}
                              </p>
                            )}

                            {!isDonation && order.is_upcoming && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                {order.is_today ? 'Today' : 'Upcoming pickup'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          {getActionButton(order)}
                        </div>
                      </div>

                      {/* Code Preview */}
                      {/* {((isDonation && order.verification_code) || (!isDonation && order.confirmation_code)) &&
                        (order.status === 'scheduled' || order.status === 'confirmed' || order.status === 'ready') && (
                          <div className={`mt-4 p-3 rounded-lg ${isDonation ? 'bg-red-50 dark:bg-red-900' : 'bg-emerald-50 dark:bg-emerald-900'
                            }`}>
                            <p className={`text-sm flex items-center ${isDonation ? 'text-red-800 dark:text-red-200' : 'text-emerald-800 dark:text-emerald-200'
                              }`}>
                              <QrCodeIcon size={16} className="mr-2" />
                              {isDonation ? 'Verification Code: ' : 'Confirmation Code: '}
                              <span className="font-mono font-bold ml-1">
                                {isDonation ? order.verification_code : order.confirmation_code}
                              </span>
                            </p>
                            <p className={`text-xs mt-1 ${isDonation ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'
                              }`}>
                              Click to view QR code and full {isDonation ? 'collection' : 'pickup'} details
                            </p>
                          </div>
                        )} */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <PickupDetailsModal
        order={selectedOrder}
        isOpen={showPickupModal}
        onClose={() => {
          setShowPickupModal(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmCancel}
        onClose={() => {
          setShowConfirmCancel(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Order"
        message={`Are you sure you want to cancel this ${orderToCancel?.interaction_type === 'Donation' ? 'donation' : 'pickup'}? This action cannot be undone.`}
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default OrderHistory;