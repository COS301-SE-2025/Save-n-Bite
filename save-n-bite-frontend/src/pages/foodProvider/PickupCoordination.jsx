import React, { useState, useEffect } from 'react';
import {
  Clock4,
  QrCode,
  Calendar,
  Search,
  Phone,
  Mail,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {StatusBadge} from '../../components/foodProvider/StatusBadge';
import { Button } from '../../components/foodProvider/Button'
import CalendarView from '../../components/foodProvider/CalendarView';
import SideBar from '../../components/foodProvider/SideBar';
import { analyticsAPI } from '../../services/analyticsAPI';

// Mock data for demonstration
const mockPickupsData = [
  {
    id: 1,
    orderNumber: 'ORD-2025-001',
    customerName: 'Sarah Johnson',
    status: 'Active',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupWindow: '12:00 PM - 1:00 PM',
    items: ['Vegetable Curry', 'Rice', 'Naan Bread'],
    contactPhone: '072 345 6789',
    contactEmail: 'sarah.j@email.com',
    confirmationCode: 'ABC123',
  },
  {
    id: 2,
    orderNumber: 'ORD-2025-002',
    customerName: 'Michael Chen',
    status: 'Upcoming',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupWindow: '2:00 PM - 3:00 PM',
    items: ['Chicken Stir Fry', 'Steamed Rice'],
    contactPhone: '071 987 6543',
    contactEmail: 'michael.chen@email.com',
    confirmationCode: 'DEF456',
  },
  {
    id: 3,
    orderNumber: 'ORD-2025-003',
    customerName: 'Emma Davis',
    status: 'Completed',
    pickupStatus: 'On Time',
    pickupDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    pickupWindow: '11:00 AM - 12:00 PM',
    items: ['Beef Stew', 'Mashed Potatoes'],
    contactPhone: '072 111 2222',
    contactEmail: 'emma.davis@email.com',
    confirmationCode: 'GHI789',
  },
  {
    id: 4,
    orderNumber: 'ORD-2025-004',
    customerName: 'James Wilson',
    status: 'Upcoming',
    pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickupWindow: '1:00 PM - 2:00 PM',
    items: ['Fish & Chips', 'Coleslaw'],
    contactPhone: '071 333 4444',
    contactEmail: 'james.wilson@email.com',
    confirmationCode: 'JKL012',
  },
];

function PickupCoordination() {
  const [pickups, setPickups] = useState([]);
  const [currentProvider, setCurrentProvider] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRCode, setShowQRCode] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load pickup data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await loadPickupData();
      loadProviderInfo();
    };
    
    initializeData();
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const loadPickupData = async () => {
    try {
      // Get real orders from localStorage (added by YourCart)
      const realOrders = JSON.parse(localStorage.getItem('pickupOrders') || '[]');
      
      // Get current provider's business name
      const currentProviderBusinessName = localStorage.getItem('providerBusinessName');
      
      // Fetch listings data directly from API to determine donation vs sale
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
      
      // Helper function to find listing and determine type
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
          return {
            type: discountedPrice > 0 ? "Sale" : "Donation",
            amount: discountedPrice > 0 ? `R${discountedPrice}` : "N/A"
          };
        }
        
        // Fallback: check if order has price information
        const price = order.price || order.amount || 0;
        const isDonation = price === 0 || price === "0" || price === "N/A" || price === "Free";
        
        return {
          type: isDonation ? "Donation" : "Sale",
          amount: isDonation ? "N/A" : `R${price}`
        };
      };
      
      // Filter real orders to only show orders for this provider
      const filteredRealOrders = currentProviderBusinessName 
        ? realOrders.filter(order => {
            // More flexible matching - check if provider name contains or matches
            const orderProviderName = order.providerName || '';
            const currentProviderName = currentProviderBusinessName || '';
            
            return orderProviderName.toLowerCase().includes(currentProviderName.toLowerCase()) ||
                   currentProviderName.toLowerCase().includes(orderProviderName.toLowerCase()) ||
                   orderProviderName.toLowerCase() === currentProviderName.toLowerCase();
          })
        : realOrders; // Show all orders if no provider business name is stored
      
      // Add type information to real orders
      const enhancedRealOrders = filteredRealOrders.map(order => {
        const orderTypeInfo = getOrderType(order);
        return {
          ...order,
          type: orderTypeInfo.type,
          amount: orderTypeInfo.amount
        };
      });
      
      // Combine enhanced real orders with mock data
      const allPickups = [...mockPickupsData, ...enhancedRealOrders];
      
      setPickups(allPickups);
    } catch (error) {
      console.error('Error loading pickup data:', error);
      setPickups(mockPickupsData);
    }
  };

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

  const getTimeRemaining = (pickupWindow, pickupDate, expiryDate) => {
    const [startTime, endTime] = pickupWindow.split(' - ');
    const today = new Date().toLocaleDateString();
    
    // Use expiry date if available, otherwise fall back to pickup date
    const actualDate = expiryDate || pickupDate;
    const pickupDateObj = new Date(actualDate);
    const formattedPickupDate = pickupDateObj.toLocaleDateString();

    if (formattedPickupDate < today) {
      return 'Past';
    }

    if (formattedPickupDate > today) {
      const daysRemaining = Math.ceil(
        (pickupDateObj - new Date()) / (1000 * 60 * 60 * 24),
      );
      return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
    }

    const now = new Date();
    const [startHour, startMinutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(
      parseInt(startHour),
      parseInt(startMinutes.split(' ')[0]),
      0,
    );

    if (startTime.includes('PM') && !startTime.includes('12:')) {
      startDate.setHours(startDate.getHours() + 12);
    }

    const diffMs = startDate - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 0) {
      return 'Active';
    }

    if (diffMins < 60) {
      return `${diffMins} min`;
    }

    return `${Math.floor(diffMins / 60)} hr ${diffMins % 60} min`;
  };

  const isPickupUrgent = (timeRemaining) => {
    if (timeRemaining === 'Active') return true;
    if (timeRemaining.includes('min')) {
      const minutes = parseInt(timeRemaining);
      return minutes <= 30;
    }
    return false;
  };

  const handleMarkAsPickedUp = async (id, status = 'On Time') => {
    try {
      // Use the analytics API to mark order as completed
      const success = analyticsAPI.markOrderAsCompleted(id, status);
      
      if (success) {
        // Update local state to reflect the change
        setPickups(
          pickups.map((pickup) =>
            pickup.id === id
              ? {
                  ...pickup,
                  status: 'Completed',
                  pickupStatus: status,
                }
              : pickup,
          ),
        );
        
        // Update customer's order history to mark order as completed
        const customerOrderHistory = JSON.parse(localStorage.getItem('customerOrderHistory') || '[]');
        const updatedOrderHistory = customerOrderHistory.map(order => {
          if (order.id === id) {
            return {
              ...order,
              status: 'confirmed'
            };
          }
          return order;
        });
        localStorage.setItem('customerOrderHistory', JSON.stringify(updatedOrderHistory));
        
        // Dispatch event to notify OrderHistory component
        window.dispatchEvent(new CustomEvent('orderCompleted'));
        
        // Show success message
        setShowSuccessMessage(true);
        setSuccessMessage(`Order ${id} marked as completed with status: ${status}`);
        
        // Notify Dashboard that data has been updated
        // This will trigger a refresh when the user navigates to Dashboard
        localStorage.setItem('dashboardNeedsRefresh', 'true');
        
        console.log(`Order ${id} marked as completed with status: ${status}`);
      } else {
        console.error('Failed to mark order as completed');
      }
    } catch (error) {
      console.error('Error marking pickup as completed:', error);
    }
  };

  const filteredPickups = pickups.filter((pickup) => {
    const matchesSearch =
      pickup.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickup.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && pickup.status === 'Active') ||
      (statusFilter === 'upcoming' && pickup.status === 'Upcoming') ||
      (statusFilter === 'completed' && pickup.status === 'Completed') ||
      (statusFilter === 'late' && pickup.pickupStatus === 'Late Pickup') ||
      (statusFilter === 'noshow' && pickup.pickupStatus === 'No Show');

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'sale' && pickup.type === 'Sale') ||
      (typeFilter === 'donation' && pickup.type === 'Donation');

    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' &&
        new Date(pickup.expiryDate || pickup.pickupDate).toLocaleDateString() ===
          new Date().toLocaleDateString()) ||
      (dateFilter === 'tomorrow' &&
        new Date(pickup.expiryDate || pickup.pickupDate).toLocaleDateString() ===
          new Date(
            new Date().setDate(new Date().getDate() + 1),
          ).toLocaleDateString()) ||
      (dateFilter === 'past' &&
        new Date(pickup.expiryDate || pickup.pickupDate) < new Date().setHours(0, 0, 0, 0));

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const sortedPickups = [...filteredPickups].sort((a, b) => {
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (a.status !== 'Active' && b.status === 'Active') return 1;

    if (a.status === 'Upcoming' && b.status !== 'Upcoming') return -1;
    if (a.status !== 'Upcoming' && b.status === 'Upcoming') return 1;

    const aDate = a.expiryDate || a.pickupDate;
    const bDate = b.expiryDate || b.pickupDate;
    
    if (aDate !== bDate) {
      return new Date(aDate) - new Date(bDate);
    }

    return a.pickupWindow.localeCompare(b.pickupWindow);
  });

  const handleMonthChange = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const refreshPickupData = async () => {
    await loadPickupData();
    loadProviderInfo();
    // Reset filters
    setDateFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
  };

  return (
        <div className="w-full flex min-h-screen">
                 <SideBar onNavigate={() => {}} currentPage="dashboard" />
                     <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pickup Coordination</h1>
        <p className="text-gray-600 mt-1">
          Manage food pickups and coordinate with customers
        </p>
        {currentProvider && (
          <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-800">
              <strong>Current Provider:</strong> {currentProvider}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Showing orders for your business only
            </p>
          </div>
        )}
        
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  {successMessage}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Dashboard statistics have been updated
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by order or customer..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="past">Past Pickups</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="late">Late Pickup</option>
            <option value="noshow">No Show</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="sale">Sale</option>
            <option value="donation">Donation</option>
          </select>
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
          >
            {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
          </Button>
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={refreshPickupData}
          >
            Refresh
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView 
          currentDate={currentDate} 
          pickups={pickups} 
          onMonthChange={handleMonthChange} 
        />
      ) : (
        <div className="space-y-4">
          {sortedPickups.map((pickup) => {
            const timeRemaining = getTimeRemaining(
              pickup.pickupWindow,
              pickup.pickupDate,
              pickup.expiryDate
            );
            const isUrgent = isPickupUrgent(timeRemaining);

            return (
              <div
                key={pickup.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                  pickup.status === 'Active' ? 'border-blue-500' :
                  pickup.status === 'Completed' ? 'border-green-500' :
                  isUrgent ? 'border-amber-500' : 'border-purple-500'
                }`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {pickup.orderNumber}
                      </h3>
                      <p className="text-gray-600">{pickup.customerName}</p>
                      {pickup.type && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          pickup.type === 'Sale' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {pickup.type}
                          {pickup.amount && pickup.type === 'Sale' && (
                            <span className="ml-1 text-xs">• {pickup.amount}</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={pickup.status} />
                      {isUrgent && pickup.status !== 'Completed' && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>

                  {isUrgent && pickup.status !== 'Completed' && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-3 flex items-center">
                      <div className="h-5 w-5 text-amber-500 mr-2" />
                      <p className="text-sm text-amber-700">
                        {timeRemaining === 'Active'
                          ? 'Pickup window is active now!'
                          : 'Pickup window starting soon!'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Items:
                      </h4>
                      <ul className="list-disc list-inside">
                        {pickup.items.map((item, idx) => (
                          <li key={idx} className="text-gray-800 text-sm">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Pickup Window:
                      </h4>
                      <div className="flex items-center">
                        <Clock4 className="h-4 w-4 text-gray-400 mr-1" />
                        <div>
                          <p className="text-gray-800">{pickup.pickupWindow}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(pickup.expiryDate || pickup.pickupDate).toLocaleDateString()}
                            {pickup.expiryDate && (
                              <span className="ml-1 text-orange-600">(Expiry)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {pickup.status !== 'Completed' && (
                        <div className="mt-1 flex items-center">
                          <Clock className="h-4 w-4 text-blue-500 mr-1" />
                          <span
                            className={`text-xs ${
                              isUrgent ? 'text-amber-600 font-medium' : 'text-blue-600'
                            }`}
                          >
                            {timeRemaining === 'Active'
                              ? 'Active now'
                              : `${timeRemaining} remaining`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Customer Contact:
                      </h4>
                      <div className="flex space-x-2 mb-1">
                        <a
                          href={`tel:${pickup.contactPhone}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          {pickup.contactPhone}
                        </a>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`mailto:${pickup.contactEmail}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          {pickup.contactEmail}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {pickup.status !== 'Completed' ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMarkAsPickedUp(pickup.id, 'On Time')}
                          >
                            Mark as Picked Up
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleMarkAsPickedUp(pickup.id, 'No Show')}
                          >
                            Mark as No Show
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={`px-3 py-2 rounded-md flex items-center ${
                            pickup.pickupStatus === 'On Time'
                              ? 'bg-green-50 text-green-700'
                              : pickup.pickupStatus === 'Late Pickup'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {pickup.pickupStatus === 'On Time'
                              ? 'Picked up on time'
                              : pickup.pickupStatus === 'Late Pickup'
                                ? 'Picked up late'
                                : 'Customer did not show'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="bg-gray-100 px-3 py-1 rounded-md flex items-center">
                          <span className="text-sm font-medium text-gray-700 mr-2">
                            Confirmation Code:
                          </span>
                          <span className="text-sm font-mono bg-white px-2 py-0.5 border border-gray-300 rounded">
                            {pickup.confirmationCode}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<QrCode className="h-4 w-4" />}
                          onClick={() =>
                            setShowQRCode(
                              pickup.id === showQRCode ? null : pickup.id,
                            )
                          }
                        >
                          {pickup.id === showQRCode ? 'Hide QR' : 'Show QR'}
                        </Button>
                      </div>
                    </div>

                    {pickup.id === showQRCode && (
                      <div className="mt-4 flex justify-center">
                        <div className="bg-white p-4 border border-gray-200 rounded-md">
                          <div className="w-32 h-32 bg-gray-800 flex items-center justify-center text-white text-xs">
                            QR Code for
                            <br />
                            {pickup.confirmationCode}
                          </div>
                          <p className="text-xs text-center mt-2 text-gray-500">
                            Scan to verify pickup
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sortedPickups.length === 0 && viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No pickups match your filters
          </h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or date filters.
          </p>
        </div>
      )}
    </div>
    </div>
  );
}

export default  PickupCoordination;