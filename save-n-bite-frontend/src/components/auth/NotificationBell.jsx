// components/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../../services/contexts/NotificationContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification 
  } = useNotifications();
  
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    // Listen for custom event to show popup
    const handleShowUnreadPopup = (e) => {
      if (unreadCount > 0) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);
      }
    };
    window.addEventListener('show-unread-popup', handleShowUnreadPopup);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('show-unread-popup', handleShowUnreadPopup);
    };
  }, [unreadCount]);

  // Fetch notifications when opening dropdown
  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
      if (unreadCount > 0) {
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 4000); // Hide popup after 4 seconds
      }
    }
  }, [isOpen, fetchRecentNotifications]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'discount':
        return '🎉';
      case 'reminder':
        return '⏰';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown - Mobile Responsive Positioning */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden
                     /* Mobile: Center dropdown and make it wider */
                     right-0 w-80
                     sm:right-0 sm:w-80
                     /* On very small screens, position it better */
                     max-[480px]:right-[-50px] max-[480px]:w-[300px]
                     max-[360px]:right-[-80px] max-[360px]:w-[280px]
                     /* Ensure it doesn't go off screen */
                     max-[320px]:right-[-100px] max-[320px]:w-[260px]"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                  <span className="hidden sm:inline">Mark all read</span>
                  <span className="sm:hidden">Read all</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 2).map((notification) => (
                  <div
                    key={notification.id || notification.createdAt || Math.random()}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors duration-150 border-b last:border-b-0 ${
                      !notification.isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    } flex items-start gap-2`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold truncate ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-1">
                          {!notification.isRead && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            className="text-gray-300 hover:text-red-500 opacity-80 hover:opacity-100 transition-opacity"
                            title="Delete notification"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                        {notification.priority === 'high' && (
                          <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;