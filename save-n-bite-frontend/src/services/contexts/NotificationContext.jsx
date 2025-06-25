// contexts/NotificationContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import NotificationAPI from '../NotificationAPI';

const NotificationContext = createContext();

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        loading: false,
        error: null
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload
      };

    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          action.payload.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - action.payload.length)
      };

    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      };

    case 'DELETE_NOTIFICATION':
      const updatedNotifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      const deletedNotification = state.notifications.find(
        notification => notification.id === action.payload
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: deletedNotification && !deletedNotification.isRead 
          ? state.unreadCount - 1 
          : state.unreadCount
      };

    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.isRead ? state.unreadCount : state.unreadCount + 1
      };

    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: action.payload
      };

    default:
      return state;
  }
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  preferences: {
    email: true,
    push: true,
    orderUpdates: true,
    newListings: true,
    promotions: false
  }
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Fetch notifications
  const fetchNotifications = async (params = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await NotificationAPI.getFormattedNotifications(params);
      if (result.success) {
        dispatch({
          type: 'SET_NOTIFICATIONS',
          payload: {
            notifications: result.data,
            unreadCount: result.data.filter(n => !n.isRead).length
          }
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch notifications' });
    }
  };

  // Fetch recent notifications for bell
  const fetchRecentNotifications = async (limit = 5) => {
    try {
      const result = await NotificationAPI.getRecentNotifications(limit);
      if (result.success) {
        const notificationsArray = Array.isArray(result.data)
          ? result.data
          : result.data
            ? [result.data]
            : [];
        dispatch({
          type: 'SET_NOTIFICATIONS',
          payload: {
            notifications: notificationsArray.map(n => NotificationAPI.transformNotificationForUI(n)),
            unreadCount: result.unreadCount
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch recent notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const result = await NotificationAPI.getUnreadCount();
      if (result.success) {
        dispatch({ type: 'SET_UNREAD_COUNT', payload: result.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds) => {
    try {
      const result = await NotificationAPI.markAsRead(notificationIds);
      if (result.success) {
        dispatch({ type: 'MARK_AS_READ', payload: Array.isArray(notificationIds) ? notificationIds : [notificationIds] });
      }
      return result;
    } catch (error) {
      console.error('Failed to mark as read:', error);
      return { success: false, error: 'Failed to mark as read' };
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const result = await NotificationAPI.markAllAsRead();
      if (result.success) {
        dispatch({ type: 'MARK_ALL_AS_READ' });
      }
      return result;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return { success: false, error: 'Failed to mark all as read' };
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const result = await NotificationAPI.deleteNotification(notificationId);
      if (result.success) {
        dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
      }
      return result;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const result = await NotificationAPI.clearAllNotifications();
      if (result.success) {
        dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
      }
      return result;
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      return { success: false, error: 'Failed to clear all notifications' };
    }
  };

  // Add notification (for real-time updates)
  const addNotification = (notification) => {
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      payload: NotificationAPI.transformNotificationForUI(notification) 
    });
  };

  // Fetch preferences
  const fetchPreferences = async () => {
    try {
      const result = await NotificationAPI.getNotificationPreferences();
      if (result.success) {
        dispatch({ type: 'SET_PREFERENCES', payload: result.data });
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  // Update preferences
  const updatePreferences = async (preferences) => {
    try {
      const result = await NotificationAPI.updateNotificationPreferences(preferences);
      if (result.success) {
        dispatch({ type: 'SET_PREFERENCES', payload: result.data });
      }
      return result;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Initial load
  useEffect(() => {
    fetchUnreadCount();
    fetchPreferences();
  }, []);

  const value = {
    ...state,
    fetchNotifications,
    fetchRecentNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
    fetchPreferences,
    updatePreferences
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;