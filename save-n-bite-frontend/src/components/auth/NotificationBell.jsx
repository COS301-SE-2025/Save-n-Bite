import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);

  // Mock data - replace with actual API call later
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
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      read_at: null,
      sender_name: "Antonio's Pizzeria",
      business_name: "Antonio's Pizzeria"
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
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(), // 19 hours ago
      read_at: null,
      sender_name: "Test Restaurant",
      business_name: "Test Restaurant"
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
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 21).toISOString(), // 21 hours ago
      read_at: null,
      sender_name: "System"
    }
  ];

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await notificationsAPI.getRecentNotifications(3);
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const recentNotifications = mockNotifications.slice(0, 3);
        setNotifications(recentNotifications);
        setUnreadCount(recentNotifications.filter(n => !n.is_read).length);
        const unread = recentNotifications.filter(n => !n.is_read).length;
setUnreadCount(unread);

if (unread > 0) {
  setShowPopup(true);
  setTimeout(() => {
    setShowPopup(false);
  }, 4000); // Hide popup after 4 seconds
}
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Set up polling for new notifications (every 30 seconds)
    const intervalId = setInterval(fetchNotifications, 300000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await notificationsAPI.markAsRead(id);
      
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };



  return (
    <div className="relative" ref={dropdownRef}>
        
  {showPopup && (
  <div className="fixed top-5 right-5 bg-emerald-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out">
    You have new unread notifications!
  </div>
)}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <Link
              to="/notifications"
              className="text-xs text-emerald-600 hover:text-emerald-800"
              onClick={() => setShowDropdown(false)}
            >
              View All
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-800 mt-2"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>No new notifications</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 text-center">
            <Link
              to="/notifications"
              className="text-sm text-emerald-600 hover:text-emerald-800"
              onClick={() => setShowDropdown(false)}
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;