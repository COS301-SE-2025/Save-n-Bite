import React from 'react';
import { Check, Trash2, ExternalLink, Store, Bell } from 'lucide-react';

const NotificationCard = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}) => {
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

  const getNotificationIcon = (type) => {
    if (type === 'new_listing') {
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
          <Store size={16} className="text-emerald-600" />
        </div>
      );
    }

    return (
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <Bell size={16} className="text-blue-600" />
      </div>
    );
  };

  const getNotificationTypeText = (type) => {
    switch (type) {
      case 'new_listing':
        return 'New Listing';
      case 'welcome':
        return 'Welcome';
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-emerald-50' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {getNotificationIcon(notification.notification_type)}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {notification.title}
                </p>
                {!notification.is_read && (
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-2">
                {notification.message}
              </p>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{getNotificationTypeText(notification.notification_type)}</span>
                <span>{getTimeAgo(notification.timestamp)}</span>
              </div>
            </div>

            <div className="flex space-x-2 ml-4">
              {!notification.is_read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  title="Mark as read"
                  className="text-emerald-600 hover:text-emerald-800"
                >
                  <Check size={16} />
                </button>
              )}
              <button
                onClick={() => onNavigate(notification)}
                title="Open"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink size={16} />
              </button>
              <button
                onClick={() => onDelete(notification.id)}
                title="Delete"
                className="text-red-600 hover:text-red-800"
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
