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
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {StatusBadge} from '../../components/foodProvider/StatusBadge';
import { Button } from '../../components/foodProvider/Button'
import CalendarView from '../../components/foodProvider/CalendarView';
import SideBar from '../../components/foodProvider/SideBar';
import schedulingAPI from '../../services/schedulingAPI';

function PickupCoordination() {
  const [pickups, setPickups] = useState([]);
  const [scheduleOverview, setScheduleOverview] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRCode, setShowQRCode] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // NEW: Selected date for API call
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [customerDetails, setCustomerDetails] = useState({}); 
  const [completingPickup, setCompletingPickup] = useState(null);

  // Load pickup data on component mount and when date changes
  useEffect(() => {
    loadScheduleData();
  }, [selectedDate]); // Add selectedDate as dependency

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

  const loadScheduleData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use selected date instead of hardcoded date
      const apiDate = selectedDate; // Already in YYYY-MM-DD format
      
      console.log('Loading schedule for date:', apiDate);
      
      // Fetch schedule overview from API
      const response = await schedulingAPI.getScheduleOverview(apiDate);
      
      if (response.success) {
        const overview = response.data.schedule_overview;
        setScheduleOverview(overview);
        
        // Transform the hourly pickups data into a flat array for easier handling
        const allPickups = [];
        
        if (overview.pickups_by_hour) {
          Object.entries(overview.pickups_by_hour).forEach(([hour, hourPickups]) => {
            hourPickups.forEach(pickup => {
              allPickups.push({
                ...pickup,
                hour: hour,
                status: pickup.status === 'pending' ? 'scheduled' : pickup.status,
                customerName: pickup.customer_name,
                customerEmail: pickup.customer_email || 'N/A',
                customerPhone: pickup.customer_phone || 'N/A',
                orderNumber: `PU-${pickup.id.split('-')[0]}`,
                pickupDate: overview.date,
                pickupWindow: `${pickup.time}:00 - ${pickup.time}:00`,
                items: [pickup.food_listing_name],
                confirmationCode: pickup.confirmation_code,
                type: 'Sale',
                amount: 'N/A'
              });
            });
          });
        }
        
        setPickups(allPickups);
        console.log(`Loaded ${allPickups.length} pickups for ${apiDate}`);
      } else {
        setError(response.error);
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      setError('Failed to load pickup schedule');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (pickupWindow, pickupDate) => {
    const [startTime] = pickupWindow.split(' - ');
    const today = new Date().toLocaleDateString();
    const pickupDateObj = new Date(pickupDate);
    const formattedPickupDate = pickupDateObj.toLocaleDateString();

    if (formattedPickupDate < today) {
      return 'Past';
    }

    if (formattedPickupDate > today) {
      const daysRemaining = Math.ceil(
        (pickupDateObj - new Date()) / (1000 * 60 * 60 * 24)
      );
      return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
    }

    // For today, calculate time remaining until pickup
    const now = new Date();
    const [timeStr] = startTime.split(':');
    const hour = parseInt(timeStr);
    const pickupTime = new Date();
    pickupTime.setHours(hour, 0, 0, 0);

    const diffMs = pickupTime - now;
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

  const handleMarkAsPickedUp = async (pickup, status = 'completed') => {
    // Prompt for confirmation code
    const confirmationCode = prompt(`Please enter confirmation code for ${pickup.customerName}:`);
    if (!confirmationCode) return;

    try {
      setCompletingPickup(pickup.id);
     
      const response = await schedulingAPI.verifyPickupCode(confirmationCode.trim());
      
      if (!response.success) {
        alert('Invalid confirmation code or pickup not found');
        return;
      }

      const pickupData = response.data.pickup;
      const completeResponse = await schedulingAPI.completePickup(pickup.id);
      
      if (!completeResponse.success) {
        alert('Failed to complete pickup');
        return;
      }
      
      // Store customer details for display
      setCustomerDetails(prev => ({
        ...prev,
        [pickup.id]: {
          name: pickupData.customer.name,
          email: pickupData.customer.email,
          notes: pickupData.customer_notes
        }
      }));
      
      // Update local state to mark as completed
      setPickups(pickups.map(p =>
        p.id === pickup.id
          ? { ...p, status: status, pickupStatus: status === 'completed' ? 'On Time' : 'No Show' }
          : p
      ));
      
      // Show success message
      const statusText = status === 'completed' ? 'completed' : 'marked as no-show';
      setShowSuccessMessage(true);
      setSuccessMessage(`Pickup ${statusText} for ${pickupData.customer.name}`);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('orderCompleted', {
        detail: { pickup, status }
      }));
      
      await loadScheduleData();
   
    } catch (error) {
      console.error('Error completing pickup:', error);
      alert('Failed to verify confirmation code');
    } finally {
      setCompletingPickup(null);
    }
  };

  // NEW: Add missing handleMarkAsNoShow function
  const handleMarkAsNoShow = async (pickup) => {
    if (!confirm(`Mark pickup for ${pickup.customerName} as no-show?`)) {
      return;
    }

    try {
      setCompletingPickup(pickup.id);
      
      // Update pickup status to missed/no-show
      const response = await schedulingAPI.updatePickupStatus(pickup.id, 'missed', {
        business_notes: 'Customer did not show up for pickup'
      });
      
      if (response.success) {
        // Update local state
        setPickups(pickups.map(p =>
          p.id === pickup.id
            ? { ...p, status: 'missed', pickupStatus: 'No Show' }
            : p
        ));
        
        setShowSuccessMessage(true);
        setSuccessMessage(`Pickup marked as no-show for ${pickup.customerName}`);
        
        await loadScheduleData();
      } else {
        alert('Failed to mark as no-show: ' + response.error);
      }
    } catch (error) {
      console.error('Error marking as no-show:', error);
      alert('Failed to mark pickup as no-show');
    } finally {
      setCompletingPickup(null);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      alert('Please enter a confirmation code');
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await schedulingAPI.verifyPickupCode(verificationCode.trim());
      
      if (!response.success) {
        alert('Invalid confirmation code or pickup not found');
        return;
      }
      
      const pickup = response.data.pickup;
      
      // Store customer details for this pickup
      setCustomerDetails(prev => ({
        ...prev,
        [pickup.id]: {
          name: pickup.customer.full_name,
          email: pickup.customer.email,
          notes: pickup.customer_notes
        }
      }));
      
      setShowSuccessMessage(true);
      setSuccessMessage(`Verification successful for ${pickup.customer.full_name}'s pickup`);
      setShowVerifyModal(false);
      setVerificationCode('');
      
      await loadScheduleData();
  
    } catch (error) {
      console.error('Error verifying code:', error);
      alert('Failed to verify confirmation code');
    } finally {
      setVerifyingCode(false);
    }
  };

  const filteredPickups = pickups.filter((pickup) => {
    const matchesSearch =
      pickup.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickup.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickup.confirmationCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'scheduled' && pickup.status === 'scheduled') ||
      (statusFilter === 'completed' && pickup.status === 'completed') ||
      (statusFilter === 'missed' && pickup.status === 'missed');

    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' &&
        new Date(pickup.pickupDate).toLocaleDateString() ===
          new Date().toLocaleDateString()) ||
      (dateFilter === 'past' &&
        new Date(pickup.pickupDate) < new Date().setHours(0, 0, 0, 0));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedPickups = [...filteredPickups].sort((a, b) => {
    // Sort by hour (time) first
    const aHour = parseInt(a.hour);
    const bHour = parseInt(b.hour);
    
    if (aHour !== bHour) {
      return aHour - bHour;
    }
    
    // Then by status (scheduled first)
    if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
    if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
    
    return 0;
  });

  const refreshPickupData = async () => {
    await loadScheduleData();
    // Reset filters but keep selected date
    setDateFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };


  // NEW: Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    // Clear any existing customer details when changing dates
    setCustomerDetails({});
  };

  // NEW: Quick date selection functions
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
  };

  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="w-full flex min-h-screen">
        <SideBar onNavigate={() => {}} currentPage="dashboard" />
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pickup schedule...</p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex min-h-screen">
        <SideBar onNavigate={() => {}} currentPage="dashboard" />
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading pickup schedule</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={loadScheduleData}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <SideBar onNavigate={() => {}} currentPage="dashboard" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pickup Coordination</h1>
          <p className="text-gray-600 mt-1">
            Manage food pickups and coordinate with customers
          </p>
          
          {/* Date Selection Section */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Viewing pickups for:</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {/* Quick date buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={setYesterday}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={setToday}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={setTomorrow}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
              
              {/* Display formatted date */}
              <div className="text-sm text-gray-600">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
          
          {/* Schedule Overview Stats */}
          {scheduleOverview && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">Total Pickups</p>
                    <p className="text-2xl font-bold text-blue-900">{scheduleOverview.total_pickups}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Completed</p>
                    <p className="text-2xl font-bold text-green-900">{scheduleOverview.completed_pickups}</p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{scheduleOverview.pending_pickups}</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">Missed</p>
                    <p className="text-2xl font-bold text-red-900">{scheduleOverview.missed_pickups}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 transition-colors duration-300">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by order, customer, or confirmation code..."
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
              <option value="past">Past Pickups</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
            <Button
              variant="primary"
              onClick={() => setShowVerifyModal(true)}
            >
              Verify Code
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

        {/* Pickup List */}
        <div className="space-y-4">
          {sortedPickups.map((pickup) => {
            const timeRemaining = getTimeRemaining(pickup.pickupWindow, pickup.pickupDate);
            const isUrgent = isPickupUrgent(timeRemaining);

            return (
              <div
                key={pickup.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 transition-colors duration-300`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {pickup.orderNumber}
                      </h3>
                      <p className="text-gray-600">{pickup.customerName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={pickup.status} />
                      {isUrgent && pickup.status === 'scheduled' && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>

                  {isUrgent && pickup.status === 'scheduled' && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-3 flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      <p className="text-sm text-amber-700">
                        {timeRemaining === 'Active'
                          ? 'Pickup window is active now!'
                          : 'Pickup window starting soon!'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Items:</h4>
                      <ul className="list-disc list-inside">
                        {pickup.items.map((item, idx) => (
                          <li key={idx} className="text-gray-800 text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Pickup Time:</h4>
                      <div className="flex items-center">
                        <Clock4 className="h-4 w-4 text-gray-400 mr-1" />
                        <div>
                          <p className="text-gray-800">{pickup.time}:00</p>
                          <p className="text-xs text-gray-500">
                            {new Date(pickup.pickupDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {pickup.status === 'scheduled' && (
                        <div className="mt-1 flex items-center">
                          <Clock className="h-4 w-4 text-blue-500 mr-1" />
                          <span className={`text-xs ${isUrgent ? 'text-amber-600 font-medium' : 'text-blue-600'}`}>
                            {timeRemaining === 'Active' ? 'Active now' : `${timeRemaining} remaining`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Customer & Code:</h4>
                      
                      {/* Customer Contact Info (shown after verification) */}
                      {customerDetails[pickup.id] ? (
                        <div className="space-y-2 mb-3">
                          <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-xs font-medium text-green-800 mb-1">Verified Customer:</p>
                            <p className="text-sm font-medium text-gray-900">{customerDetails[pickup.id].name}</p>
                            <div className="flex flex-col gap-1 mt-1">
                              <a
                                href={`mailto:${customerDetails[pickup.id].email}`}
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                {customerDetails[pickup.id].email}
                              </a>
                              {customerDetails[pickup.id].phone && customerDetails[pickup.id].phone !== 'N/A' && (
                                <a
                                  href={`tel:${customerDetails[pickup.id].phone}`}
                                  className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  {customerDetails[pickup.id].phone}
                                </a>
                              )}
                            </div>
                            {customerDetails[pickup.id].notes && (
                              <p className="text-xs text-gray-600 mt-1 italic">
                                Note: {customerDetails[pickup.id].notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-2">Contact info available after verification</p>
                        </div>
                      )}
                      
                      {/* Confirmation Code */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Confirmation Code:</p>
                        <div className="bg-gray-100 px-2 py-1 rounded-md inline-block">
                          <span className="text-sm font-mono bg-white px-2 py-0.5 border border-gray-300 rounded">
                            {pickup.confirmationCode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {pickup.status === 'confirmed' || pickup.status === 'scheduled' ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMarkAsPickedUp(pickup)}
                            disabled={completingPickup === pickup.id}
                          >
                            {completingPickup === pickup.id ? 'Completing...' : 'Mark as Completed'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleMarkAsNoShow(pickup)}
                            disabled={completingPickup === pickup.id}
                          >
                            {completingPickup === pickup.id ? 'Processing...' : 'Mark as No Show'}
                          </Button>
                        </div>
                      ) : (
                        <div className={`px-3 py-2 rounded-md flex items-center ${
                          pickup.status === 'completed' 
                            ? 'bg-green-50 text-green-700' 
                            : pickup.status === 'confirmed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          <span className="text-sm font-medium">
                            {pickup.status === 'completed' ? 'Pickup completed' : 
                             pickup.status === 'confirmed' ? 'Code verified - ready for pickup' :
                             'Customer no-show'}
                          </span>
                        </div>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<QrCode className="h-4 w-4" />}
                        onClick={() => setShowQRCode(pickup.id === showQRCode ? null : pickup.id)}
                      >
                        {pickup.id === showQRCode ? 'Hide QR' : 'Show QR'}
                      </Button>
                    </div>

                    {pickup.id === showQRCode && (
                      <div className="mt-4 flex justify-center">
                        <div className="bg-white p-4 border border-gray-200 rounded-md">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pickup.confirmationCode}`}
                            alt={`QR Code for ${pickup.confirmationCode}`}
                            className="w-32 h-32"
                          />
                          <p className="text-xs text-center mt-2 text-gray-500">
                            Scan to verify pickup: {pickup.confirmationCode}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedPickups.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pickups match your filters
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or date filters.
            </p>
          </div>
        )}

        {/* Verify Code Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 transition-colors duration-300">
              <h2 className="text-xl font-semibold mb-4">Verify Pickup Code</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmation Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    placeholder="Enter confirmation code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={handleVerifyCode}
                    disabled={verifyingCode}
                    className="flex-1"
                  >
                    {verifyingCode ? 'Verifying...' : 'Verify'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowVerifyModal(false);
                      setVerificationCode('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PickupCoordination;