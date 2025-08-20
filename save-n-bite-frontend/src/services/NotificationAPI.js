// services/NotificationAPI.js
import { apiClient } from './FoodAPI';

class NotificationAPI {
  // Get all notifications for authenticated user
  async getNotifications(params = {}) {
    try {
      const response = await apiClient.get('/api/notifications/', { params });
      let notifications = [];
      let unreadCount = 0;
      // Handle nested structure: results.notifications
      if (response.data.results && response.data.results.notifications) {
        notifications = response.data.results.notifications;
        unreadCount = response.data.results.unread_count || 0;
      } else if (Array.isArray(response.data.results)) {
        notifications = response.data.results;
        unreadCount = response.data.unread_count || 0;
      } else if (Array.isArray(response.data)) {
        notifications = response.data;
      }
      return {
        success: true,
        data: notifications,
        unreadCount: unreadCount,
        count: notifications.length,
        next: response.data.next || null,
        previous: response.data.previous || null
      };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get recent notifications (for notification bell)
  async getRecentNotifications(limit = 5) {
    try {
      const response = await apiClient.get('/api/notifications/', { 
        params: { limit, ordering: '-created_at' } 
      });
      // Fix: extract notifications array from nested results
      let notifications = [];
      let unreadCount = 0;
      if (response.data.results && response.data.results.notifications) {
        notifications = response.data.results.notifications;
        unreadCount = response.data.results.unread_count || 0;
      } else if (Array.isArray(response.data.results)) {
        notifications = response.data.results;
        unreadCount = response.data.unread_count || 0;
      } else if (Array.isArray(response.data)) {
        notifications = response.data;
      }
      return {
        success: true,
        data: notifications,
        unreadCount: unreadCount
      };
    } catch (error) {
      console.error('Failed to fetch recent notifications:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await apiClient.get('/api/notifications/unread-count/');
      return {
        success: true,
        count: response.data.unread_count || response.data.count || 0
      };
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Mark specific notifications as read
  async markAsRead(notificationIds) {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      const validIds = ids.filter(Boolean);
      if (validIds.length === 0) {
        return { success: false, error: 'No valid notification IDs provided' };
      }
      const response = await apiClient.post('/api/notifications/mark-read/', {
        notification_ids: validIds
      });
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Notifications marked as read'
      };
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await apiClient.post('/api/notifications/mark-all-read/');
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'All notifications marked as read'
      };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Delete a specific notification
  async deleteNotification(notificationId) {
    if (!notificationId) {
      return { success: false, error: 'No notification ID provided' };
    }
    try {
      const response = await apiClient.delete(`/api/notifications/${notificationId}/delete/`);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Notification deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Clear all notifications (not supported by backend, so return error)
  async clearAllNotifications() {
    return {
      success: false,
      error: 'Bulk clear of all notifications is not supported by the backend.'
    };
  }

  // Get notification preferences
  async getNotificationPreferences() {
    try {
      const response = await apiClient.get('/api/notifications/preferences/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      const response = await apiClient.put('/api/notifications/preferences/', preferences);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Notification preferences updated successfully'
      };
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Transform notification data for UI consistency
  transformNotificationForUI(apiNotification) {
    return {
      id: apiNotification.id,
      title: apiNotification.title || apiNotification.message,
      message: apiNotification.message || apiNotification.description,
      type: apiNotification.type || apiNotification.notification_type || 'info',
      isRead: apiNotification.is_read || apiNotification.read || false,
      createdAt: apiNotification.created_at || apiNotification.timestamp,
      actionUrl: apiNotification.action_url || null,
      metadata: apiNotification.metadata || {},
      data: apiNotification.data || {},
      priority: apiNotification.priority || 'normal'
    };
  }

  // Get formatted notifications for UI
  async getFormattedNotifications(params = {}) {
    try {
      const result = await this.getNotifications(params);
      if (result.success) {
        const notificationsArray = Array.isArray(result.data)
          ? result.data
          : result.data
            ? [result.data]
            : [];
        return {
          ...result,
          data: notificationsArray.map(notification => this.transformNotificationForUI(notification))
        };
      }
      return result;
    } catch (error) {
      console.error('Failed to get formatted notifications:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get error message helper (consistent with FoodAPI)
  getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    return error.message || 'An unexpected error occurred';
  }
}

export default new NotificationAPI();