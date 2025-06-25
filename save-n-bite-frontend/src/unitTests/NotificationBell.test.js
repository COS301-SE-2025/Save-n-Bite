import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationBell from '../components/auth/NotificationBell';
import { useNotifications } from '../services/contexts/NotificationContext';

// Mock useNotifications hook
jest.mock('../services/contexts/NotificationContext', () => ({
  useNotifications: jest.fn(),
}));

describe('NotificationBell', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'Order Shipped',
      message: 'Your order #1234 has been shipped.',
      isRead: false,
      type: 'order',
      priority: 'high',
      createdAt: new Date().toISOString(),
      actionUrl: '/orders/1234',
    },
    {
      id: '2',
      title: 'New Discount',
      message: 'Get 20% off your next purchase!',
      isRead: true,
      type: 'discount',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockFetchRecentNotifications = jest.fn();
  const mockMarkAsRead = jest.fn();
  const mockMarkAllAsRead = jest.fn();
  const mockDeleteNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      loading: false,
      fetchRecentNotifications: mockFetchRecentNotifications,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
    });
  });

  it('opens dropdown and displays notifications when bell is clicked', async () => {
    render(<NotificationBell />);
    
    // Bell should show unread badge
    expect(screen.getByText('1')).toBeInTheDocument();

    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);

    // Fetch recent notifications should be called
    expect(mockFetchRecentNotifications).toHaveBeenCalled();

    // Wait for dropdown to render
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Order Shipped')).toBeInTheDocument();
      expect(screen.getByText('New Discount')).toBeInTheDocument();
    });

    // Click "Mark all read"
    fireEvent.click(screen.getByText(/mark all read/i));
    expect(mockMarkAllAsRead).toHaveBeenCalled();

    // Close the dropdown
    fireEvent.click(screen.getByRole('button', { name: '' })); // the X icon
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });
});
