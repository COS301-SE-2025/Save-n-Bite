import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import OrderCard from '../../components/auth/OrderCard';
import ImpactSummary from '../../components/auth/ImpactSummary';
import OrderFilters from '../../components/auth/OrderFilters';
import { CheckCircleIcon, LeafIcon, ClockIcon, MapPinIcon, AlertCircleIcon } from 'lucide-react'

// Mock order data for customers (only purchases)
const mockCustomerOrders = [
  {
    id: 1,
    orderNumber: 'ORD-2024-001',
    date: '2024-05-20',
    type: 'purchase',
    status: 'completed',
    items: [
      {
        id: 1,
        title: 'Assorted Pastries Box',
        image: 'https://images.unsplash.com/photo-1609950547346-a4f431435b2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Sweet Bakery',
        quantity: 1,
        price: 7.99
      }
    ],
    total: 7.99,
    provider: 'Sweet Bakery',
    pickupTime: '14:30',
    pickupAddress: '123 Main St, Cape Town',
    impact: {
      mealsSaved: 1,
      co2Reduced: 0.5
    }
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-002',
    date: '2024-05-18',
    type: 'purchase',
    status: 'completed',
    items: [
      {
        id: 2,
        title: 'Vegetarian Lunch Box',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Green Cafe',
        quantity: 2,
        price: 5.50
      },
      {
        id: 3,
        title: 'Fresh Bread Assortment',
        image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Green Cafe',
        quantity: 1,
        price: 3.00
      }
    ],
    total: 14.00,
    provider: 'Green Cafe',
    pickupTime: '12:00',
    pickupAddress: '456 Oak Ave, Cape Town',
    impact: {
      mealsSaved: 3,
      co2Reduced: 1.2
    }
  },
  {
    id: 3,
    orderNumber: 'ORD-2024-003',
    date: '2024-05-15',
    type: 'purchase',
    status: 'confirmed',
    items: [
      {
        id: 4,
        title: 'Surplus Produce Box',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Local Grocery',
        quantity: 1,
        price: 8.50
      }
    ],
    total: 8.50,
    provider: 'Local Grocery',
    pickupTime: '16:00',
    pickupAddress: '789 Pine St, Cape Town',
    pickupWindow: 'Today, 4 PM - 6 PM',
    impact: {
      mealsSaved: 2,
      co2Reduced: 0.8
    }
  }
];

// Mock order data for NGOs (both purchases and donations)
const mockNGOOrders = [
  // NGO Purchase Orders
  {
    id: 1,
    orderNumber: 'ORD-2024-NGO-001',
    date: '2024-05-21',
    type: 'purchase',
    status: 'completed',
    items: [
      {
        id: 1,
        title: 'Bulk Meal Kits',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Community Kitchen',
        quantity: 20,
        price: 4.50
      }
    ],
    total: 90.00,
    provider: 'Community Kitchen',
    pickupTime: '11:00',
    pickupAddress: '555 Helper Ave, Cape Town',
    beneficiaries: 20,
    impact: {
      mealsSaved: 20,
      co2Reduced: 10.0
    }
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-NGO-002',
    date: '2024-05-19',
    type: 'purchase',
    status: 'confirmed',
    items: [
      {
        id: 2,
        title: 'Fresh Produce Box',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Local Farm',
        quantity: 5,
        price: 15.00
      }
    ],
    total: 75.00,
    provider: 'Local Farm',
    pickupTime: '09:00',
    pickupAddress: '888 Farm Road, Cape Town',
    pickupWindow: 'Tomorrow, 9 AM - 11 AM',
    beneficiaries: 15,
    impact: {
      mealsSaved: 15,
      co2Reduced: 7.5
    }
  },
  // NGO Donation Requests
  {
    id: 4,
    orderNumber: 'DON-2024-001',
    date: '2024-05-22',
    type: 'donation',
    status: 'confirmed',
    items: [
      {
        id: 5,
        title: 'Donated Meal Kits',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Community Restaurant',
        quantity: 25,
        price: 0
      }
    ],
    total: 0,
    provider: 'Community Restaurant',
    pickupTime: '10:00',
    pickupAddress: '321 Community Rd, Cape Town',
    pickupWindow: 'Today, 10 AM - 12 PM',
    beneficiaries: 25,
    impact: {
      mealsSaved: 25,
      co2Reduced: 12.5
    }
  },
  {
    id: 5,
    orderNumber: 'DON-2024-002',
    date: '2024-05-19',
    type: 'donation',
    status: 'completed',
    items: [
      {
        id: 6,
        title: 'Fresh Vegetables',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Farmers Market',
        quantity: 50,
        price: 0
      },
      {
        id: 7,
        title: 'Bread Loaves',
        image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Local Bakery',
        quantity: 30,
        price: 0
      }
    ],
    total: 0,
    provider: 'Multiple Providers',
    pickupTime: '08:00',
    pickupAddress: 'Multiple Locations',
    beneficiaries: 80,
    impact: {
      mealsSaved: 80,
      co2Reduced: 40.0
    }
  },
  {
    id: 6,
    orderNumber: 'DON-2024-003',
    date: '2024-05-16',
    type: 'donation',
    status: 'pending',
    items: [
      {
        id: 8,
        title: 'Canned Goods Assortment',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Wholesale Distributor',
        quantity: 100,
        price: 0
      }
    ],
    total: 0,
    provider: 'Wholesale Distributor',
    pickupTime: 'TBD',
    pickupAddress: '654 Industrial Ave, Cape Town',
    beneficiaries: 100,
    impact: {
      mealsSaved: 100,
      co2Reduced: 30.0
    }
  },
  {
    id: 7,
    orderNumber: 'DON-2024-004',
    date: '2024-05-14',
    type: 'donation',
    status: 'pending',
    items: [
      {
        id: 9,
        title: 'Surplus Sandwiches',
        image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        provider: 'Deli Corner',
        quantity: 40,
        price: 0
      }
    ],
    total: 0,
    provider: 'Deli Corner',
    pickupTime: 'TBD',
    pickupAddress: '123 Deli Street, Cape Town',
    beneficiaries: 40,
    impact: {
      mealsSaved: 40,
      co2Reduced: 20.0
    }
  }
];

const OrderHistory = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('customer'); // 'customer' or 'ngo'
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    provider: 'all'
  });

  // Simulate getting user type from authentication or local storage
  useEffect(() => {
    const storedUserType = localStorage.getItem('userType') || 'customer';
    setUserType(storedUserType);
    
    // Load orders from localStorage for customers, or use mock data for NGOs
    if (storedUserType === 'customer') {
      const customerOrders = JSON.parse(localStorage.getItem('customerOrderHistory') || '[]');
      setOrders(customerOrders);
      setFilteredOrders(customerOrders);
    } else {
      // For NGOs, still use mock data for now
      setOrders(mockNGOOrders);
      setFilteredOrders(mockNGOOrders);
    }
  }, []);

  // Listen for order completion events
  useEffect(() => {
    const handleOrderCompleted = () => {
      if (userType === 'customer') {
        const customerOrders = JSON.parse(localStorage.getItem('customerOrderHistory') || '[]');
        setOrders(customerOrders);
        setFilteredOrders(customerOrders);
      }
    };

    window.addEventListener('orderCompleted', handleOrderCompleted);
    return () => window.removeEventListener('orderCompleted', handleOrderCompleted);
  }, [userType]);

  // Apply filters
  useEffect(() => {
    let filtered = [...orders];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(order => order.type === filters.type);
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
      
      filtered = filtered.filter(order => new Date(order.date) >= filterDate);
    }

    // Filter by provider
    if (filters.provider !== 'all') {
      filtered = filtered.filter(order => order.provider === filters.provider);
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

  // Handle order actions
  const handleOrderAction = (orderId, action) => {
    console.log(`Performing ${action} on order ${orderId}`);
    
    switch (action) {
      case 'reorder':
        navigate('/food-item');
        break;
      case 'cancel':
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ));
        break;
      case 'track':
        // Navigate to tracking page or show tracking modal
        console.log('Tracking order:', orderId);
        break;
      default:
        break;
    }
  };

  // Calculate impact summary
  const calculateImpact = () => {
    return filteredOrders.reduce((acc, order) => ({
      mealsSaved: acc.mealsSaved + (order.impact?.mealsSaved || 0),
      co2Reduced: acc.co2Reduced + (order.impact?.co2Reduced || 0),
      totalSpent: acc.totalSpent + (order.type === 'purchase' ? order.total : 0),
      totalDonationsReceived: acc.totalDonationsReceived + (order.type === 'donation' ? (order.beneficiaries || order.items.reduce((sum, item) => sum + item.quantity, 0)) : 0),
      ordersCount: filteredOrders.length
    }), {
      mealsSaved: 0,
      co2Reduced: 0,
      totalSpent: 0,
      totalDonationsReceived: 0,
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

  // Updated status color function to handle pending status
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Updated action button function to handle all statuses
  const getActionButton = (order) => {
    switch (order.status) {
      case 'completed':
        return (
          <button
            onClick={() => navigate(`/reviews/${order.id}`)}
            className="px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Leave a Review
          </button>
        );
      case 'confirmed':
        return (
          <div className="space-y-2">
            <button
              onClick={() => navigate(`/pickup`)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 w-full"
            >
              View Pickup Instructions
            </button>
            <button
              onClick={() => navigate(`/reviews/${order.id}`)}
              className="px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium w-full"
            >
              Leave a Review
            </button>
          </div>
        );
      case 'pending':
        return (
          <div className="px-4 py-2 text-yellow-600 font-medium flex items-center">
            <AlertCircleIcon size={16} className="mr-1" />
            Awaiting Pickup
          </div>
        );
      default:
        return null;
    }
  };

  // Get status description for better UX
  const getStatusDescription = (order) => {
    switch (order.status) {
      case 'pending':
        return order.type === 'donation' 
          ? 'Donation request submitted, waiting for provider approval'
          : 'Order submitted, waiting for pickup confirmation';
      case 'confirmed':
        return order.type === 'donation'
          ? 'Donation approved, ready for pickup'
          : 'Order confirmed, ready for pickup';
      case 'completed':
        return order.type === 'donation'
          ? 'Donation collected successfully'
          : 'Order completed - you can now leave a review';
      default:
        return '';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <CustomerNavBar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {userType === 'ngo' ? 'Order & Donation History' : 'Order History'}
          </h1>
          {userType === 'ngo' && (
            <div className="text-sm text-gray-600">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mr-2">
                NGO Account
              </span>
              Purchases & Donation Requests
            </div>
          )}
        </div>

        {/* Impact Summary */}
        <ImpactSummary 
          impact={impactData}
          userType={userType}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <OrderFilters
              filters={filters}
              setFilters={setFilters}
              orders={orders}
              userType={userType}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Orders List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                {filteredOrders.length} {userType === 'ngo' ? 'items' : 'orders'} found
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xl text-gray-600 mb-4">
                  No {userType === 'ngo' ? 'orders or donations' : 'orders'} found
                </p>
                <button
                  onClick={() => navigate('/browse')}
                  className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  {userType === 'ngo' ? 'Browse Food & Donations' : 'Browse Food'}
                </button>
              </div>
            ) : (
              /* Orders List */
              <div className="bg-white rounded-lg shadow-sm">
                {filteredOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className={`p-6 ${index !== filteredOrders.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {order.items.map(item => item.title).join(', ')}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          {order.type === 'donation' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                              Donation
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {order.provider}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 gap-4 mb-2">
                          <span className="flex items-center">
                            <ClockIcon size={16} className="mr-1" />
                            {new Date(order.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <MapPinIcon size={16} className="mr-1" />
                            {order.status === 'pending' ? 'Pickup TBD' : 'Local pickup'}
                          </span>
                          {userType === 'ngo' && order.beneficiaries && (
                            <span className="flex items-center">
                              <LeafIcon size={16} className="mr-1" />
                              {order.beneficiaries} beneficiaries
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          {getStatusDescription(order)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-emerald-600 mb-2">
                          {order.type === 'purchase' ? `R${order.total.toFixed(2)}` : 'Free'}
                        </p>
                        {getActionButton(order)}
                      </div>
                    </div>
                    {order.status === 'confirmed' && order.pickupWindow && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Pickup window:</strong> {order.pickupWindow}
                        </p>
                        {/* <p className="text-sm text-blue-600 mt-1">
                          {order.pickupAddress}
                        </p> */}
                      </div>
                    )}
                    {order.status === 'pending' && order.type === 'donation' && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Donation Request:</strong> Waiting for {order.provider} to approve your request
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                          You'll be notified once the provider confirms availability
                        </p>
                      </div>
                    )}
                    <div className="mt-4 text-sm text-gray-600">
                      <strong>Impact:</strong> {order.impact.mealsSaved} meals saved.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;