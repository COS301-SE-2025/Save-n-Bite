

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import OrderCard from '../../components/auth/OrderCard';
import ImpactSummary from '../../components/auth/ImpactSummary';
import schedulingAPI from '../../services/schedulingAPI';
import donationsAPI from '../../services/DonationsAPI';
import reviewsAPI from '../../services/reviewsAPI';
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
  ShoppingBagIcon,
  CalendarIcon,
  PackageIcon,
  StarIcon,
  Loader2Icon,
  ShoppingCartIcon
} from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// Enhanced Pickup Details Modal (keeping original functionality)
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

  // const getStatusBadge = (status) => {
  //   const statusMap = {
  //     ready: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200' },
  //     confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
  //     scheduled: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200' },
  //     cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
  //     rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
  //     missed: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200' },
  //     default: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' }
  //   };
    
  //   const { bg, text } = statusMap[status.toLowerCase()] || statusMap.default;
  //   return (
  //     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} capitalize`}>
  //       {status}
  //     </span>
  //   );
  // };

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
            {/* {getStatusBadge(order.status)} */}
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
          {/* {order.status !== 'completed' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-400">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {order.status === 'ready' && (isDonation ? 'Your donation order is ready for collection' : 'Your order is ready for pickup')}
                {order.status === 'confirmed' && (isDonation ? 'Your donation order is ready for collection' : 'Your order is ready for pickup')}
                {order.status === 'cancelled' &&  (isDonation ? 'This donation has been cancelled' : 'This pickup has been cancelled')}
                {order.status === 'rejected' && 'This request has been rejected'}
                {order.status === 'scheduled' && 'Your pickup is confirmed and ready to collect'}
                {order.status === 'missed' && (isDonation ? 'This donation was missed' : 'This pickup was missed')}
              </p>
            </div>
          )} */}
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

// Enhanced Order Card Component
const EnhancedOrderCard = ({ order, onOrderClick, onCancelClick, onReviewClick }) => {
  const isDonation = order.interaction_type === 'Donation';
  const itemName = isDonation ? order.items?.[0]?.name : order.food_listing?.name;
  const providerName = isDonation ? (order.order?.providerName || 'Provider') : order.business?.business_name;
  const price = !isDonation ? order.food_listing?.price : null;

const getActionButton = () => {
  switch (order.status) {
    case 'completed':
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (order.interaction_id) {
              onReviewClick(order.interaction_id);
            }
          }}
          className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-all transform hover:scale-105"
        >
          <StarIcon className="w-4 h-4 inline mr-1" />
          Leave Review
        </button>
      );
    case 'confirmed':
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrderClick(order);
          }}
          className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-all transform hover:scale-105"
        >
          <QrCodeIcon className="w-4 h-4 inline mr-1" />
          View Pickup Details
        </button>
      );
    case 'scheduled':
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancelClick(order, e);
          }}
          className="w-full px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-all"
        >
          Cancel
        </button>
      );
    case 'pending':
      return (
        <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium text-center">
          Awaiting Response
        </div>
      );
    default:
      return null;
  }
};

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-100 dark:border-gray-700 overflow-hidden"
      onClick={() => onOrderClick(order)}
    >
      {/* Card Header with Type Icon */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${isDonation ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
              {isDonation ? (
                <HeartIcon className={`w-4 h-4 ${isDonation ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              ) : (
                <ShoppingBagIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {isDonation ? 'Donation' : 'Purchase'}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            #{order.id?.slice(-4) || 'N/A'}
          </span>
        </div>

        {/* Item Info */}
        <div className="space-y-1 mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
            {itemName}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
            <StoreIcon className="w-3 h-3 mr-1" />
            {providerName}
          </p>
          {price && (
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              R{parseFloat(price).toFixed(2)}
            </p>
          )}
        </div>

        {/* Timing Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            {new Date(isDonation ? order.created_at : order.scheduled_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Action Button */}
        {getActionButton()}
      </div>
    </div>
  );
};

// Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab, orderCounts, userType }) => {
  const tabs = [
   { 
    id: 'confirmed', 
    label: 'Ready', 
    icon: CheckCircleIcon, 
    tooltip: 'Your pickup is confirmed and your order is ready to collect.',
    color: 'text-emerald-600 dark:text-emerald-400'
  },
  { 
    id: 'scheduled', 
    label: 'Scheduled', 
    icon: CalendarIcon, 
    tooltip: 'Your pickup is scheduled. Waiting for the provider to mark it ready. You can cancel if needed.',
    color: 'text-purple-600 dark:text-purple-400'
  },
    ...(userType === 'ngo' ? [{ 
      id: 'pending', 
      label: 'Pending', 
      icon: ClockIcon, 
      tooltip: 'Waiting for provider to accept or reject this request.',
      color: 'text-amber-600 dark:text-amber-400'
    }] : []),
    { 
      id: 'completed', 
      label: 'Completed', 
      icon: PackageIcon, 
      tooltip: 'You\'ve successfully picked up this order. You can leave a review.',
      color: 'text-blue-600 dark:text-blue-400'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1 mb-6 transition-colors duration-300">
      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = orderCounts[tab.id] || 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.tooltip}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 transform ${
                isActive
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white scale-105 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive 
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ activeTab, userType }) => {
  const navigate = useNavigate();
  
  const emptyStates = {
    confirmed: {
      icon: CheckCircleIcon,
      title: 'No pickups ready right now',
      subtitle: 'Check back soon for confirmed orders!',
      color: 'text-emerald-500'
    },
    scheduled: {
      icon: CalendarIcon,
      title: 'No upcoming pickups scheduled',
      subtitle: 'Browse available food to schedule your next pickup.',
      action: { text: 'Browse Food', onClick: () => navigate('/food-listing') },
      color: 'text-purple-500'
    },
    pending: {
      icon: ClockIcon,
      title: 'No pending requests',
      subtitle: 'Your donation requests will appear here while waiting for provider approval.',
      color: 'text-amber-500'
    },
    completed: {
      icon: PackageIcon,
      title: 'No past orders yet',
      subtitle: 'Your history will appear here once you complete pickups.',
      action: { text: 'Start Browsing', onClick: () => navigate('/food-listing') },
      color: 'text-blue-500'
    }
  };

  const state = emptyStates[activeTab];
  const Icon = state.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center transition-colors duration-300">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4`}>
        <Icon className={`w-8 h-8 ${state.color}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {state.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {state.subtitle}
      </p>
      {state.action && (
        <button
          onClick={state.action.onClick}
          className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all transform hover:scale-105"
        >
          <ShoppingCartIcon className="w-4 h-4 mr-2" />
          {state.action.text}
        </button>
      )}
    </div>
  );
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('confirmed');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [userType, setUserType] = useState('customer'); // Default to customer

  // Load orders from API - both pickups and donations (keeping original logic)
  useEffect(() => {
    loadOrders();
    // Detect user type from localStorage or user context
    const storedUserType = localStorage.getItem('userType') || 'customer';
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if user is NGO based on profile or stored type
    if (storedUserType === 'ngo' || userProfile.user_type === 'ngo' || userProfile.account_type === 'ngo') {
      setUserType('ngo');
    }
  }, []);

  // const loadOrders = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const [pickupsResponse, donationsResponse] = await Promise.all([
  //       schedulingAPI.getMyPickups(),
  //       donationsAPI.getMyDonationRequests()
  //     ]);

  //     const allOrders = [];

  //     if (pickupsResponse.success) {
  //       const pickups = pickupsResponse.data.results?.pickups || pickupsResponse.data.results || [];
  //       const normalizedPickups = pickups.map(pickup => ({
  //         ...pickup,
  //         interaction_type: 'Pickup',
  //         order_type: 'pickup'
  //       }));
  //       allOrders.push(...normalizedPickups);
  //     }

  //     if (donationsResponse.success) {
  //       const donations = donationsResponse.data.results || [];
  //       const normalizedDonations = donations.map(donation => ({
  //         ...donation,
  //         interaction_type: 'Donation',
  //         order_type: 'donation'
  //       }));
  //       allOrders.push(...normalizedDonations);
  //     }

  //     allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  //     await syncCompletedInteractions(allOrders);

  //     setOrders(allOrders);

  //     if (!pickupsResponse.success && !donationsResponse.success) {
  //       setError('Failed to load order history');
  //     }
  //   } catch (error) {
  //     console.error('Error loading orders:', error);
  //     setError('Failed to load orders');
  //     setOrders([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

const loadOrders = async () => {
  setLoading(true);
  setError(null);
  try {
    const [pickupsResponse, donationsResponse] = await Promise.all([
      schedulingAPI.getMyPickups(),
      donationsAPI.getMyDonationRequests()
    ]);

    console.log('🔍 DEBUG: Loading orders...');
    const allOrders = [];

    // Process pickups from the pickups API
    if (pickupsResponse.success) {
      const pickups = pickupsResponse.data.results?.pickups || pickupsResponse.data.results || [];
      console.log('🛒 Purchases from Pickups API:', pickups);
      
      const normalizedPickups = pickups.map(pickup => ({
        ...pickup,
        interaction_type: 'Purchase',
        order_type: 'pickup',
        status: normalizeStatus(pickup.status)
      }));
      allOrders.push(...normalizedPickups);
    }

    // Process donations from the donations API - FILTER to only get actual donations
    if (donationsResponse.success) {
      const allItems = donationsResponse.data.results || [];
      console.log('📦 All items from Donations API:', allItems);
      
      // Filter to only get actual donations (not purchases)
      const actualDonations = allItems.filter(item => 
        item.interaction_type === 'Donation' || 
        // If interaction_type is not set, check other donation indicators
        (!item.interaction_type && item.order_type === 'donation')
      );
      
      console.log('💝 Actual donations after filtering:', actualDonations);
      
      const normalizedDonations = actualDonations.map(donation => ({
        ...donation,
        interaction_type: 'Donation',
        order_type: 'donation',
        status: normalizeStatus(donation.status)
      }));
      allOrders.push(...normalizedDonations);
    }

    // Remove any potential duplicates by order ID
    const uniqueOrders = [];
    const orderIds = new Set();
    
    allOrders.forEach(order => {
      if (!orderIds.has(order.id)) {
        orderIds.add(order.id);
        uniqueOrders.push(order);
      } else {
        console.warn('⚠️ Duplicate order found and removed:', order.id);
      }
    });

    console.log('🎯 Final unique orders:', uniqueOrders);

    uniqueOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    await syncCompletedInteractions(uniqueOrders);

    setOrders(uniqueOrders);

  } catch (error) {
    console.error('Error loading orders:', error);
    setError('Failed to load orders');
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

// Add status normalization function
const normalizeStatus = (status) => {
  const statusMap = {
    'ready': 'confirmed',
    'confirmed': 'confirmed',
    'scheduled': 'scheduled', 
    'pending': 'pending',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'rejected': 'rejected',
    'missed': 'missed'
  };
  return statusMap[status] || status;
};

  // Sync interaction status for completed orders (keeping original logic)
  const syncCompletedInteractions = async (allOrders) => {
    const completedOrders = allOrders.filter(order => order.status === 'completed');

    for (const order of completedOrders) {
      try {
        if (order.interaction_id) {
          const reviewStatus = await reviewsAPI.checkReviewStatus(order.interaction_id);

          if (reviewStatus.success && reviewStatus.data.interaction_status !== 'completed') {
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

  // Handle order click (keeping original logic)
  const handleOrderClick = (order) => {
    if (order.status === 'scheduled' || order.status === 'confirmed' || order.status === 'ready') {
      setSelectedOrder(order);
      setShowPickupModal(true);
    }
  };

  // Handle status update (keeping original logic)
  const handleStatusUpdate = async () => {
    loadOrders();
  };

  // Show toast message (keeping original logic)
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Handle cancel click (keeping original logic)
  const handleCancelClick = (order, e) => {
    e.stopPropagation();
    setOrderToCancel(order);
    setShowConfirmCancel(true);
  };

  // Handle confirm cancel (keeping original logic)
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

  // Handle review click
  const handleReviewClick = (interactionId) => {
    navigate(`/reviews/${interactionId}`);
  };

  // Group orders by status for tabs
  // const groupedOrders = {
  //   confirmed: orders.filter(order => order.status === 'ready' || order.status === 'confirmed'),
  //   scheduled: orders.filter(order => order.status === 'scheduled'),
  //   pending: orders.filter(order => order.status === 'pending'),
  //   completed: orders.filter(order => order.status === 'completed')
  // };


  const groupedOrders = {
  confirmed: orders.filter(order => 
    (order.status === 'confirmed' || order.status === 'ready') 
  ),
  scheduled: orders.filter(order => 
    order.status === 'scheduled'
  ),
  pending: orders.filter(order => 
    order.status === 'pending' && order.interaction_type === 'Donation'
  ),
  completed: orders.filter(order => 
    order.status === 'completed'
  )
};



  // Calculate order counts for tabs
  const orderCounts = {
    confirmed: groupedOrders.confirmed.length,
    scheduled: groupedOrders.scheduled.length,
    pending: groupedOrders.pending.length,
    completed: groupedOrders.completed.length
  };

  // Calculate impact summary (keeping original logic)
  const calculateImpact = () => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return {
        mealsSaved: 0,
        co2Reduced: 0,
        ordersCount: 0,
        donationsCount: 0,
        pickupsCount: 0
      };
    }

    return orders.reduce((acc, order) => {
      const isDonation = order.interaction_type === 'Donation';
      const quantity = isDonation ? (order.quantity || 1) : 1;

      return {
        mealsSaved: acc.mealsSaved + quantity,
        co2Reduced: acc.co2Reduced + (quantity * 0.5),
        ordersCount: orders.length,
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
  const currentOrders = groupedOrders[activeTab] || [];

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2Icon className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-200">Loading your orders...</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Unable to load order history
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button 
              onClick={loadOrders} 
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
      <CustomerNavBar />
      <br></br>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">
  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">Order History</span>
</h1>
  

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your pickups and donations in one place
          </p>
        </div> */}

        {/* Impact Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8 transition-colors duration-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <LeafIcon size={20} className="mr-2" />
            Your Impact Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{impactData.mealsSaved}</div>
              <div className="text-sm opacity-90">Meals Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{impactData.co2Reduced.toFixed(1)}kg</div>
              <div className="text-sm opacity-90">CO₂ Reduced</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{impactData.pickupsCount}</div>
              <div className="text-sm opacity-90">Pickups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{impactData.donationsCount}</div>
              <div className="text-sm opacity-90">Donations</div>
            </div>
          </div>
        </div>

        {/* Loading indicator for updates */}
        {loading && orders.length > 0 && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-200 rounded-lg text-sm transition-colors duration-300">
              <Loader2Icon className="animate-spin h-4 w-4 mr-2" />
              Updating orders...
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          orderCounts={orderCounts}
          userType={userType}
        />

        {/* Orders Grid */}
        {currentOrders.length === 0 ? (
          <EmptyState activeTab={activeTab} userType={userType} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {currentOrders.map((order) => (
              <EnhancedOrderCard
                key={order.id}
                order={order}
                onOrderClick={handleOrderClick}
                onCancelClick={handleCancelClick}
                onReviewClick={handleReviewClick}
              />
            ))}
          </div>
        )}

        {/* Global Empty State - when no orders exist at all */}
        {orders.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center transition-colors duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
              <ShoppingBagIcon className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to your order history!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Start your food rescue journey by browsing available meals or requesting donations from local providers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/food-listing')}
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all transform hover:scale-105"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                Browse Available Food
              </button>
              <button
                onClick={() => navigate('/donations')}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all transform hover:scale-105"
              >
                <HeartIcon className="w-5 h-5 mr-2" />
                Request Donations
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals and Dialogs */}
      <PickupDetailsModal
        order={selectedOrder}
        isOpen={showPickupModal}
        onClose={() => {
          setShowPickupModal(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={handleStatusUpdate}
      />

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