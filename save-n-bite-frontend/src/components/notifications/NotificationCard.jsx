import React, { useState } from 'react';
import { Check, Trash2, ExternalLink, Store, Bell, Package, User, Gift, AlertCircle } from 'lucide-react';

const NotificationCard = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
  isLast = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

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
    let bgColor = 'bg-blue-100';
    let iconColor = 'text-blue-600';
    let IconComponent = Bell;

    switch (type) {
      case 'new_listing':
        bgColor = 'bg-emerald-100';
        iconColor = 'text-emerald-600';
        IconComponent = Store;
        break;
      case 'order_update':
      case 'order':
        bgColor = 'bg-orange-100';
        iconColor = 'text-orange-600';
        IconComponent = Package;
        break;
      case 'welcome':
        bgColor = 'bg-purple-100';
        iconColor = 'text-purple-600';
        IconComponent = User;
        break;
      case 'promotion':
      case 'discount':
        bgColor = 'bg-pink-100';
        iconColor = 'text-pink-600';
        IconComponent = Gift;
        break;
      case 'alert':
      case 'warning':
        bgColor = 'bg-red-100';
        iconColor = 'text-red-600';
        IconComponent = AlertCircle;
        break;
      case 'system':
      default:
        bgColor = 'bg-blue-100';
        iconColor = 'text-blue-600';
        IconComponent = Bell;
        break;
    }

    // Adjust colors based on priority
    if (priority === 'high') {
      bgColor = 'bg-red-100';
      iconColor = 'text-red-600';
    } else if (priority === 'low') {
      bgColor = 'bg-gray-100';
      iconColor = 'text-gray-600';
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
    onNavigate(notification);
  };

  // Extract metadata for additional display info
  const metadata = notification.metadata || {};
  const hasActionableContent = notification.actionUrl || metadata.listing_id || ['new_listing', 'order_update'].includes(notification.type);

  // Debug: Log the notification object to see what fields are present
  console.log('NotificationCard notification:', notification);

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors ${
        !notification.isRead ? 'bg-emerald-50' : ''
      } ${!isLast ? 'border-b border-gray-100' : ''}`}
    >
      <div className="flex items-start space-x-3">
        {getNotificationIcon(notification.type, notification.priority)}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {notification.title}
                </p>
                {!notification.isRead && (
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></span>
                )}
                {notification.priority === 'high' && (
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    High Priority
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                {notification.message || notification.data?.message || notification.title || JSON.stringify(notification)}
              </p>

              {/* Additional metadata display */}
              {metadata.listing_name && (
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">Item:</span> {metadata.listing_name}
                  {metadata.listing_price && (
                    <span className="ml-2">
                      <span className="font-medium">Price:</span> R{metadata.listing_price}
                    </span>
                  )}
                </div>
              )}

              {metadata.expiry_date && (
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">Expires:</span> {new Date(metadata.expiry_date).toLocaleDateString()}
                </div>
              )}

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="font-medium">{getNotificationTypeText(notification.type)}</span>
                <span>{getTimeAgo(notification.createdAt)}</span>
                {notification.sender_name && notification.sender_name !== 'System' && (
                  <span>
                    <span className="font-medium">From:</span> {notification.sender_name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-1 ml-4 flex-shrink-0">
              {!notification.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  title="Mark as read"
                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded transition-colors"
                >
                  <Check size={16} />
                </button>
              )}
              {hasActionableContent && (
                <button
                  onClick={handleNavigate}
                  title="View details"
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                >
                  <ExternalLink size={16} />
                </button>
              )}
              <button
                onClick={handleDelete}
                title="Delete notification"
                disabled={isDeleting}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;