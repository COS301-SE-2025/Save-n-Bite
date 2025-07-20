import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationAPI from '../../services/NotificationAPI';
import NotificationCard from '../../components/notifications/NotificationCard';

const NotificationPage = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  
  // Local state for notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle API auth responses
  const handleApiResponse = (response) => {
    // Only handle auth manually if there's a clear auth problem
    if (response && !response.success && response.status === 401) {
      console.log('401 error detected, user needs to log in again');
      logout();
      navigate('/login', { replace: true });
      return false;
    }
    return true;
  };

  // Fetch notifications only when page loads or refreshed
  const fetchNotifications = async (showLoading = true) => {
    // Check authentication first
    if (!isAuthenticated()) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const response = await NotificationAPI.getFormattedNotifications();
      
      // Handle auth errors gracefully
      if (!handleApiResponse(response)) {
        return;
      }
      
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount(response.unreadCount || 0);
      } else {
        setError(response.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      
      // Handle 401 errors specifically
      if (err.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      
      setError('Failed to fetch notifications');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Only fetch on page load - no polling!
  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      const wasUnread = notifications.find(n => n.id === id && !n.isRead);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      const response = await NotificationAPI.markAsRead(id);
      
      if (!handleApiResponse(response)) {
        return;
      }
      
      if (!response.success) {
        // Revert optimistic update on failure
        fetchNotifications(false);
        console.error('Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      // Revert optimistic update on error
      fetchNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);

      const response = await NotificationAPI.markAllAsRead();
      
      if (!handleApiResponse(response)) {
        return;
      }
      
      if (!response.success) {
        // Revert optimistic update on failure
        fetchNotifications(false);
        console.error('Failed to mark all notifications as read');
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      // Revert optimistic update on error
      fetchNotifications(false);
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      const notificationToDelete = notifications.find(n => n.id === id);
      
      // Optimistic update
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      const response = await NotificationAPI.deleteNotification(id);
      
      if (!handleApiResponse(response)) {
        return;
      }
      
      if (!response.success) {
        // Revert optimistic update on failure
        fetchNotifications(false);
        console.error('Failed to delete notification');
      }
    } catch (err) {
      console.error('Failed to delete notification', err);
      // Revert optimistic update on error
      fetchNotifications(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await NotificationAPI.clearAllNotifications();
      
      if (!handleApiResponse(response)) {
        return;
      }
      
      if (!response.success) {
        // Since clearAllNotifications is not supported by backend, 
        // we'll show an alert to the user
        alert(response.error || 'Bulk clear of all notifications is not supported.');
      }
    } catch (err) {
      console.error('Failed to clear all notifications', err);
      alert('Failed to clear all notifications. Please try deleting them individually.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNavigate = (notification) => {
    // Mark as read when navigating
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.metadata?.listing_id) {
      navigate(`/food-listings/${notification.metadata.listing_id}`);
    } else {
      // Default navigation based on notification type
      switch (notification.type) {
        case 'new_listing':
          navigate('/food-listing');
          break;
        case 'order_update':
          navigate('/orders');
          break;
        case 'welcome':
        case 'system':
          navigate('/dashboard');
          break;
        default:
          navigate('/food-listing'); // Default to food listing for customers/NGOs
      }
    }
  };

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    if (filter === 'new_listing') return notifications.filter((n) => n.type === 'new_listing');
    if (filter === 'system') return notifications.filter((n) => ['welcome', 'system'].includes(n.type));
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/food-listing', { replace: true })}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Notifications</h1>
          <button
            onClick={handleRefresh}
            className="ml-auto text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filter and Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100">
            <div className="flex items-center mb-3 sm:mb-0">
              <Bell size={20} className="text-emerald-600 mr-2" />
              <h2 className="font-medium text-gray-800">
                {unreadCount > 0 ? (
                  <>
                    You have{' '}
                    <span className="text-emerald-600">{unreadCount} unread</span>{' '}
                    notifications
                  </>
                ) : (
                  'All notifications'
                )}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors flex items-center disabled:opacity-50"
                  disabled={loading || isDeleting}
                >
                  <Check size={12} className="mr-1" />
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50"
                  disabled={loading || isDeleting}
                >
                  <Trash2 size={12} className="mr-1" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                filter === 'all'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                filter === 'unread'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('new_listing')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                filter === 'new_listing'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              New Listings ({notifications.filter(n => n.type === 'new_listing').length})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                filter === 'system'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Save 'n Bite Notifications ({notifications.filter(n => ['welcome', 'system'].includes(n.type)).length})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div>
              {filteredNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onNavigate={handleNavigate}
                  isLast={index === filteredNotifications.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Bell size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="font-medium">No notifications found</p>
              <p className="text-sm mt-1">
                {filter !== 'all'
                  ? 'Try changing your filter to see more notifications'
                  : "You'll see notifications here when there are updates"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;