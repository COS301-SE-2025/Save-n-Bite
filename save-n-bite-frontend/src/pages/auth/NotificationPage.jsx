import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import NotificationCard from '../../components/notifications/NotificationCard';


const NotificationPage = () =>{

const navigate = useNavigate();
const [notifications, setNotifications] = useState([]);
const [loading,setLoading] = useState(true);
const [error, setError] = useState(null);
const [filter, setFilter] = useState("all");
const [isDeleting, setIsDeleting] = useState(false);


 const mockNotifications = [
    {
      id: "6cab68e5-8d5d-48d0-8f38-1cd5c341dcfb",
      notification_type: "new_listing",
      title: "New listing from Antonio's Pizzeria",
      message: "Antonio's Pizzeria has added a new food item: Tasty Pizza",
      data: {
        listing_id: "f738efc1-289a-4e11-adc8-082b03ec4081",
        expiry_date: "2025-06-21",
        listing_name: "Tasty Pizza",
        listing_price: 15.0
      },
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      read_at: null,
      sender_name: "Antonio's Pizzeria",
      business_name: "Antonio's Pizzeria",
      actionLink: "/food-listings"
    },
    {
      id: "9221d75a-1958-414d-b8e2-8a8d860ebcf0",
      notification_type: "new_listing",
      title: "New listing from Test Restaurant",
      message: "Test Restaurant has added a new food item: Fresh Pizza",
      data: {
        listing_id: "19353171-2b2b-4ead-8f5f-a1bcf0b45f1d",
        expiry_date: "2025-06-21",
        listing_name: "Fresh Pizza",
        listing_price: 15.0
      },
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
      read_at: null,
      sender_name: "Test Restaurant",
      business_name: "Test Restaurant",
      actionLink: "/food-listings"
    },
    {
      id: "4209a481-b13a-4356-b8a2-09ce3ec6bd36",
      notification_type: "welcome",
      title: "Welcome to Save n Bite!",
      message: "Welcome to Save n Bite! Start browsing discounted food from local businesses and help reduce food waste.",
      data: {
        user_type: "customer"
      },
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 21).toISOString(),
      read_at: null,
      sender_name: "System",
      actionLink: "/food-listings"
    },
    {
      id: "registration-success",
      notification_type: "system",
      title: "Registration Successful!",
      message: "Your account has been created successfully. Welcome to Save n Bite community!",
      data: {
        user_type: "customer"
      },
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read_at: null,
      sender_name: "System"
    }
  ];


  useEffect(() => {
    fetchNotifications();
  },[filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await notificationsAPI.getNotifications(filter);
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(mockNotifications);
      setError(null);
    } catch (err) {
      setError('An error occurred while fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await notificationsAPI.markAsRead(id);
      
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call
      // await notificationsAPI.markAllAsRead();
      
      setNotifications(
        notifications.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      // TODO: Replace with actual API call
      // await notificationsAPI.deleteNotification(id);
      
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
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
      // TODO: Replace with actual API call
      // await notificationsAPI.clearAllNotifications();
      
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear all notifications', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNavigate = (notification) => {
    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
  };


  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.is_read);
    if (filter === 'new_listing') return notifications.filter((n) => n.notification_type === 'new_listing');
    if (filter === 'system') return notifications.filter((n) => n.notification_type === 'welcome' || n.notification_type === 'system');
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Notifications</h1>
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
                  className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors flex items-center"
                  disabled={loading || isDeleting}
                >
                  <Check size={12} className="mr-1" />
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors flex items-center"
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
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                filter === 'unread'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('new_listing')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                filter === 'new_listing'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              New Listings
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                filter === 'system'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Save 'n Bite Notifications
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
                onClick={fetchNotifications}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
              />
            ))
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



