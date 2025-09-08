import React, { useState, useEffect } from 'react';
import { Toast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InputDialog } from '../../components/ui/InputDialog';
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
  Menu,
  X,
} from 'lucide-react';
import { StatusBadge } from '../../components/foodProvider/StatusBadge';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [customerDetails, setCustomerDetails] = useState({});
  const [completingPickup, setCompletingPickup] = useState(null);

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  // New state variables for pickup confirmation
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [activePickup, setActivePickup] = useState(null);
  const [confirmationInput, setConfirmationInput] = useState('');

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Load pickup data on component mount and when date changes
  useEffect(() => {
    loadScheduleData();
  }, [selectedDate]);

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
      const apiDate = selectedDate;

      console.log('Loading schedule for date:', apiDate);

      const response = await schedulingAPI.getScheduleOverview(apiDate);

      if (response.success) {
        const overview = response.data.schedule_overview;
        setScheduleOverview(overview);

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

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    // Auto hide toast after 3 seconds
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkAsPickedUp = async (pickup) => {
    setActivePickup(pickup);
    setShowPickupDialog(true);
  };

  // New function to handle confirmation
  const handleConfirmPickup = async () => {
    if (!confirmationInput || !activePickup) return;

    try {
      setCompletingPickup(activePickup.id);
      const response = await schedulingAPI.verifyPickupCode(confirmationInput.trim());

      if (!response.success) {
        showToast('Invalid confirmation code or pickup not found', 'error');
        return;
      }

      const pickupData = response.data.pickup;
      const completeResponse = await schedulingAPI.completePickup(activePickup.id);

      if (!completeResponse.success) {
        showToast('Failed to complete pickup', 'error');
        return;
      }

      // Update state and show success message
      setCustomerDetails(prev => ({
        ...prev,
        [activePickup.id]: {
          name: pickupData.customer.name,
          email: pickupData.customer.email,
          notes: pickupData.customer_notes
        }
      }));

      setPickups(pickups.map(p =>
        p.id === activePickup.id
          ? { ...p, status: 'completed', pickupStatus: 'On Time' }
          : p
      ));

      showToast(`Pickup completed `, 'success');
      await loadScheduleData();
    } catch (error) {
      console.error('Error completing pickup:', error);
      showToast('Failed to verify confirmation code', 'error');
    } finally {
      setCompletingPickup(null);
      setShowPickupDialog(false);
      setActivePickup(null);
      setConfirmationInput('');
    }
  };

  const handleMarkAsNoShow = (pickup) => {
    setActivePickup(pickup);
    setShowNoShowDialog(true);
  };

  // Add new function to handle no-show confirmation
  const handleConfirmNoShow = async () => {
    try {
      setCompletingPickup(activePickup.id);

      const response = await schedulingAPI.updatePickupStatus(activePickup.id, 'missed', {
        business_notes: 'Customer did not show up for pickup'
      });

      if (response.success) {
        setPickups(pickups.map(p =>
          p.id === activePickup.id
            ? { ...p, status: 'missed', pickupStatus: 'No Show' }
            : p
        ));

        showToast(`Pickup marked as no-show for ${activePickup.customerName}`, 'success');
        await loadScheduleData();
      } else {
        showToast(response.error || 'Failed to mark as no-show', 'error');
      }
    } catch (error) {
      console.error('Error marking as no-show:', error);
      showToast('Failed to mark pickup as no-show', 'error');
    } finally {
      setCompletingPickup(null);
      setShowNoShowDialog(false);
      setActivePickup(null);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      showToast('Please enter a confirmation code', 'error');
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await schedulingAPI.verifyPickupCode(verificationCode.trim());

      if (!response.success) {
        showToast('Invalid confirmation code or pickup not found', 'error');
        return;
      }

      const pickup = response.data.pickup;

      setCustomerDetails(prev => ({
        ...prev,
        [pickup.id]: {
          name: pickup.customer.full_name,
          email: pickup.customer.email,
          notes: pickup.customer_notes
        }
      }));

      showToast(`Verification successful for ${pickup.customer.full_name}'s pickup`, 'success');
      setShowVerifyModal(false);
      setVerificationCode('');

      await loadScheduleData();

    } catch (error) {
      console.error('Error verifying code:', error);
      showToast('Failed to verify confirmation code', 'error');
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
    const aHour = parseInt(a.hour);
    const bHour = parseInt(b.hour);

    if (aHour !== bHour) {
      return aHour - bHour;
    }

    if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
    if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;

    return 0;
  });

  const refreshPickupData = async () => {
    await loadScheduleData();
    setDateFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setCustomerDetails({});
  };

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
      <div className="w-full flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">

          <SideBar onNavigate={() => {}} currentPage="pickup-coordination" />

        </div>
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading pickup schedule...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">

          <SideBar onNavigate={() => {}} currentPage="pickup-coordination" />
  
        </div>
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
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
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex">

        <SideBar onNavigate={() => {}} currentPage="pickup-coordination" />

      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleMobileSidebar}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 z-50">
            <SideBar
              onNavigate={() => setIsMobileSidebarOpen(false)}
              currentPage="pickup-coordination"
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Orders & Pickups</h1>
          <button
            onClick={refreshPickupData}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            {/* Desktop Header - Hidden on mobile */}
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Orders & Pickups</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Track orders, coordinate pickups, and stay on top of customers’ requests
              </p>
            </div>

            {/* Date Selection Section */}
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Viewing pickups for:</label>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    onKeyDown={(e) => {

                      if (e.key !== 'Tab') {
                        e.preventDefault();
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                  />

                  {/* Quick date buttons */}
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={setYesterday}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={setToday}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={setTomorrow}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                {/* Display formatted date */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
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
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-2 sm:ml-3">
                      <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300">Total</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-200">{scheduleOverview.total_pickups}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-2 sm:ml-3">
                      <p className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-300">Done</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-200">{scheduleOverview.completed_pickups}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400" />
                    <div className="ml-2 sm:ml-3">
                      <p className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-300">Pending</p>
                      <p className="text-xl sm:text-2xl font-bold text-yellow-900 dark:text-yellow-200">{scheduleOverview.pending_pickups}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
                    <div className="ml-2 sm:ml-3">
                      <p className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-300">Missed</p>
                      <p className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-200">{scheduleOverview.missed_pickups}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mt-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-300" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters and Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6 transition-colors duration-300">
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 sm:flex-wrap">
              <div className="relative flex-1 min-w-0 sm:min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Search by order, customer, or code..."
                  className="pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 sm:gap-4">
                <select
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm flex-1 sm:flex-none"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="past">Past</option>
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm flex-1 sm:flex-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => setShowVerifyModal(true)}
                  className="flex-1 sm:flex-none text-sm"
                >
                  Verify Code
                </Button>
                <Button
                  variant="secondary"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={refreshPickupData}
                  className="hidden sm:flex"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Pickup List */}
          <div className="space-y-3 sm:space-y-4">
            {sortedPickups.map((pickup) => {
              const timeRemaining = getTimeRemaining(pickup.pickupWindow, pickup.pickupDate);
              const isUrgent = isPickupUrgent(timeRemaining);

              return (
                <div
                  key={pickup.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 transition-colors duration-300"
                >
                  <div className="p-3 sm:p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        {/* <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          {pickup.orderNumber}
                        </h3> */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{pickup.customerName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={pickup.status} />
                        {isUrgent && pickup.status === 'scheduled' && (
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Urgent</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {isUrgent && pickup.status === 'scheduled' && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-600 p-3 mb-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {timeRemaining === 'Active'
                            ? 'Pickup window is active now!'
                            : 'Pickup window starting soon!'}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Items:</h4>
                        <ul className="list-disc list-inside">
                          {pickup.items.map((item, idx) => (
                            <li key={idx} className="text-gray-800 dark:text-gray-200 text-sm">{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Pickup Time:</h4>
                        <div className="flex items-center">
                          <Clock4 className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                          <div>
                            <p className="text-gray-800 dark:text-gray-200">{pickup.time}:00</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(pickup.pickupDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {pickup.status === 'scheduled' && (
                          <div className="mt-1 flex items-center">
                            <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-1" />
                            <span className={`text-xs ${isUrgent ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-blue-600 dark:text-blue-400'}`}>
                              {timeRemaining === 'Active' ? 'Active now' : `${timeRemaining} remaining`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Customer & Code:</h4>

                        {/* Customer Contact Info (shown after verification) */}
                        {customerDetails[pickup.id] ? (
                          <div className="space-y-2 mb-3">
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                              <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Verified Customer:</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{customerDetails[pickup.id].name}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                <a
                                  href={`mailto:${customerDetails[pickup.id].email}`}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center text-xs"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span className="truncate">{customerDetails[pickup.id].email}</span>
                                </a>
                                {customerDetails[pickup.id].phone && customerDetails[pickup.id].phone !== 'N/A' && (
                                  <a
                                    href={`tel:${customerDetails[pickup.id].phone}`}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center text-xs"
                                  >
                                    <Phone className="h-3 w-3 mr-1" />
                                    {customerDetails[pickup.id].phone}
                                  </a>
                                )}
                              </div>
                              {customerDetails[pickup.id].notes && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                  Note: {customerDetails[pickup.id].notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Contact info available after verification</p>
                          </div>
                        )}

                        {/* Confirmation Code */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Confirmation Code:</p>
                          <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md inline-block">
                            <span className="text-sm font-mono bg-white dark:bg-gray-600 px-2 py-0.5 border border-gray-300 dark:border-gray-500 rounded text-gray-900 dark:text-white">
                              xxxxxx
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {pickup.status === 'confirmed' || pickup.status === 'scheduled' ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleMarkAsPickedUp(pickup)}
                              disabled={completingPickup === pickup.id}
                              className="text-sm"
                            >
                              {completingPickup === pickup.id ? 'Completing...' : 'Input confirmation code to mark as Completed'}
                            </Button>
                            {/* <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleMarkAsNoShow(pickup)}
                              disabled={completingPickup === pickup.id}
                              className="text-sm"
                            >
                              {completingPickup === pickup.id ? 'Processing...' : 'Mark as No Show'}
                            </Button> */}
                          </div>
                        ) : (
                          <div className={`px-3 py-2 rounded-md flex items-center ${pickup.status === 'completed'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : pickup.status === 'confirmed'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
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
                          className="text-sm"
                        >
                          {pickup.id === showQRCode ? 'Hide QR' : 'Show QR'}
                        </Button>
                      </div>

                      {pickup.id === showQRCode && (
                        <div className="mt-4 flex justify-center">
                          <div className="bg-white dark:bg-gray-700 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pickup.confirmationCode}`}
                              alt={`QR Code for ${pickup.confirmationCode}`}
                              className="w-24 h-24 sm:w-32 sm:h-32 mx-auto"
                            />
                            <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                              Scan to verify: {pickup.confirmationCode}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No pickups match your filters
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try adjusting your search criteria or date filters.
              </p>
            </div>
          )}

          {/* Verify Code Modal */}
          {showVerifyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 transition-colors duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Verify Pickup Code</h2>
                  <button
                    onClick={() => {
                      setShowVerifyModal(false);
                      setVerificationCode('');
                    }}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Confirmation Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                      placeholder="Enter confirmation code"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="primary"
                      onClick={handleVerifyCode}
                      disabled={verifyingCode}
                      className="flex-1 text-sm"
                    >
                      {verifyingCode ? 'Verifying...' : 'Verify'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowVerifyModal(false);
                        setVerificationCode('');
                      }}
                      className="flex-1 text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toast component */}
          {toast && (
            <div className="fixed top-4 right-4 z-50">
              <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${toast.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : toast.type === 'error'
                    ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                }`}>
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            </div>
          )}

          {/* Pickup Completion Dialog */}
          <InputDialog
            isOpen={showPickupDialog}
            onClose={() => {
              setShowPickupDialog(false);
              setActivePickup(null);
              setConfirmationInput('');
            }}
            onConfirm={handleConfirmPickup}
            title="Complete Pickup"
            message={`Enter confirmation code for ${activePickup?.customerName}'s pickup:`}
            inputValue={confirmationInput}
            onInputChange={(value) => setConfirmationInput(value.toUpperCase())}
            placeholder="Enter confirmation code"
            confirmText="Complete Pickup"
            cancelText="Cancel"
          />

          {/* No Show Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showNoShowDialog}
            onClose={() => {
              setShowNoShowDialog(false);
              setActivePickup(null);
            }}
            onConfirm={handleConfirmNoShow}
            title="Mark as No-Show"
            message={`Are you sure you want to mark ${activePickup?.customerName}'s pickup as no-show? This action cannot be undone.`}
            confirmText="Mark as No-Show"
            cancelText="Cancel"
          />
        </div>
      </div>
    </div>
  );
}

export default PickupCoordination;