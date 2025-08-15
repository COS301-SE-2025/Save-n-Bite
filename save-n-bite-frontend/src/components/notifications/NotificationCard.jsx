import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Trash2, ExternalLink, Store, Bell, Package, User, Gift, AlertCircle } from 'lucide-react';

const NotificationCard = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
  isLast = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  const getNotificationIcon = (type, priority = 'normal') => {
    const iconSize = 16;
    let bgColor = 'bg-blue-100 dark:bg-blue-900';
    let iconColor = 'text-blue-600 dark:text-blue-300';
    let IconComponent = Bell;

    switch (type) {
      case 'new_listing':
        bgColor = 'bg-emerald-100 dark:bg-emerald-900';
        iconColor = 'text-emerald-600 dark:text-emerald-400';
        IconComponent = Store;
        break;
      case 'order_update':
      case 'order':
        bgColor = 'bg-orange-100 dark:bg-orange-900';
        iconColor = 'text-orange-600 dark:text-orange-400';
        IconComponent = Package;
        break;
      case 'welcome':
        bgColor = 'bg-purple-100 dark:bg-purple-900';
        iconColor = 'text-purple-600 dark:text-purple-400';
        IconComponent = User;
        break;
      case 'promotion':
      case 'discount':
        bgColor = 'bg-pink-100 dark:bg-pink-900';
        iconColor = 'text-pink-600 dark:text-pink-400';
        IconComponent = Gift;
        break;
      case 'alert':
      case 'warning':
        bgColor = 'bg-red-100 dark:bg-red-900';
        iconColor = 'text-red-600 dark:text-red-400';
        IconComponent = AlertCircle;
        break;
      case 'system':
      default:
        bgColor = 'bg-blue-100 dark:bg-blue-900';
        iconColor = 'text-blue-600 dark:text-blue-300';
        IconComponent = Bell;
        break;
    }

    // Adjust colors based on priority
    if (priority === 'high') {
      bgColor = 'bg-red-100 dark:bg-red-900';
      iconColor = 'text-red-600 dark:text-red-400';
    } else if (priority === 'low') {
      bgColor = 'bg-gray-100 dark:bg-gray-800';
      iconColor = 'text-gray-600 dark:text-gray-300';
    }

    return (
      <div className={`flex-shrink-0 w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
        <IconComponent size={iconSize} className={iconColor} />
      </div>
    );
  };

  const getNotificationTypeText = (type) => {
    switch (type) {
      case 'new_listing':
        return 'New Listing';
      case 'order_update':
      case 'order':
        return 'Order Update';
      case 'welcome':
        return 'Welcome';
      case 'system':
        return 'System';
      case 'promotion':
      case 'discount':
        return 'Promotion';
      case 'alert':
      case 'warning':
        return 'Alert';
      default:
        return 'Notification';
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNavigate = () => {
    console.log('🔍 Debug - Full notification object:', notification);
    console.log('🔍 Debug - notification.metadata:', notification.metadata);
    console.log('🔍 Debug - notification.data:', notification.data);
    console.log('🔍 Debug - notification itself for listing_id:', notification.listing_id);
    
    // Mark as read when navigating
    if (!notification.isRead) {
      handleMarkAsRead();
    }

    // Extract listing ID from various possible sources
    const metadata = notification.metadata || {};
    let listingId = null;

    // Try to get listing ID from ALL possible locations
    if (metadata.listing_id) {
      listingId = metadata.listing_id;
      console.log('🔍 Found listing ID in metadata.listing_id:', listingId);
    } else if (notification.data?.listing_id) {
      listingId = notification.data.listing_id;
      console.log('🔍 Found listing ID in data.listing_id:', listingId);
    } else if (notification.listing_id) {
      listingId = notification.listing_id;
      console.log('🔍 Found listing ID directly on notification:', listingId);
    } else if (metadata.data?.listing_id) {
      listingId = metadata.data.listing_id;
      console.log('🔍 Found listing ID in metadata.data.listing_id:', listingId);
    } else if (notification.actionUrl && notification.actionUrl.includes('/food-listings/')) {
      // Extract from actionUrl if it follows the pattern /food-listings/{id}
      const urlParts = notification.actionUrl.split('/');
      const idIndex = urlParts.indexOf('food-listings') + 1;
      if (idIndex > 0 && idIndex < urlParts.length) {
        listingId = urlParts[idIndex];
        console.log('🔍 Found listing ID in actionUrl:', listingId);
      }
    }

    // For new_listing notifications, try to navigate to /item/:id
    if (notification.type === 'new_listing' || notification.notification_type === 'new_listing') {
      if (listingId) {
        console.log('✅ Navigating to:', `/item/${listingId}`);
        navigate(`/item/${listingId}`);
        return;
      } else {
        console.log('❌ No listing ID found for new_listing notification');
        console.log('🔍 Available fields:', Object.keys(notification));
        console.log('🔍 Available metadata fields:', Object.keys(metadata));
        // Don't navigate anywhere if we can't find the listing ID
        return;
      }
    }

    // Navigate to the specific listing page if we have a listing ID
    if (listingId) {
      console.log('✅ Navigating to:', `/item/${listingId}`);
      navigate(`/item/${listingId}`);
      return;
    }

    // Fallback: Default navigation based on notification type
    console.log('🔄 Using fallback navigation for type:', notification.type);
    switch (notification.type) {
      case 'order_update':
      case 'order':
        navigate('/orders');
        break;
      case 'welcome':
      case 'system':
        navigate('/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Extract metadata for additional display info
  const metadata = notification.metadata || {};
  const hasActionableContent = notification.actionUrl || 
                              metadata.listing_id || 
                              notification.data?.listing_id ||
                              ['new_listing', 'order_update'].includes(notification.type);

  // Debug: Log the notification object to see what fields are present
  console.log('NotificationCard notification:', notification);

  return (
 <div
      className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        !notification.isRead ? 'bg-emerald-50 dark:bg-emerald-900' : 'bg-white dark:bg-gray-800'
      } ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
    >
      <div className="flex items-start space-x-2 sm:space-x-3">
        {getNotificationIcon(notification.type, notification.priority)}

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {notification.title}
                </p>
                {!notification.isRead && (
                  <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full flex-shrink-0"></span>
                )}
                {notification.priority === 'high' && (
<span className="inline-block px-1.5 sm:px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400 rounded-full">
                    High Priority
                  </span>
                )}
              </div>

 <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
                {notification.message || notification.data?.message || notification.title || JSON.stringify(notification)}
              </p>

              {/* Additional metadata display */}
              {metadata.listing_name && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-medium">Item:</span> {metadata.listing_name}
                  {metadata.listing_price && (
                    <span className="ml-2">
                      <span className="font-medium">Price:</span> R{metadata.listing_price}
                    </span>
                  )}
                </div>
              )}

              {metadata.expiry_date && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-medium">Expires:</span> {new Date(metadata.expiry_date).toLocaleDateString()}
                </div>
              )}

<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0">
                <span className="font-medium">{getNotificationTypeText(notification.type)}</span>
                <span>{getTimeAgo(notification.createdAt)}</span>
                {notification.sender_name && notification.sender_name !== 'System' && (
                  <span>
                    <span className="font-medium">From:</span> {notification.sender_name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-1 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 justify-end sm:justify-start">
              {!notification.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  title="Mark as read"
 className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded transition-colors touch-target"
                >
                  <Check size={14} className="sm:w-4 sm:h-4" />
                </button>
              )}
              {hasActionableContent && (
                <button
                  onClick={handleNavigate}
                  title="View details"
className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors touch-target"
                >
                  <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                </button>
              )}
              <button
                onClick={handleDelete}
                title="Delete notification"
                disabled={isDeleting}
className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors disabled:opacity-50 touch-target"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;