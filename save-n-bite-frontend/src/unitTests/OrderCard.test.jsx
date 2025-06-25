import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderCard from '../components/auth/OrderCard';

const mockOrder = {
  id: '1',
  orderNumber: 'ORD-001',
  date: '2024-06-01T10:00:00Z',
  status: 'pending',
  type: 'purchase',
  pickupTime: '10:30 AM',
  pickupAddress: '123 Pickup St, City',
  provider: 'Food Provider',
  total: 120.5,
  items: [
    {
      id: 'i1',
      title: 'Apple',
      provider: 'Farm Fresh',
      quantity: 2,
      price: 10,
      image: 'https://via.placeholder.com/40'
    },
    {
      id: 'i2',
      title: 'Banana',
      provider: 'Farm Fresh',
      quantity: 1,
      price: 5,
      image: 'https://via.placeholder.com/40'
    },
    {
      id: 'i3',
      title: 'Orange',
      provider: 'Farm Fresh',
      quantity: 3,
      price: 8,
      image: 'https://via.placeholder.com/40'
    },
    {
      id: 'i4',
      title: 'Pear',
      provider: 'Farm Fresh',
      quantity: 1,
      price: 7,
      image: 'https://via.placeholder.com/40'
    }
  ],
  impact: {
    mealsSaved: 5,
    co2Reduced: 12.3
  }
};

describe('OrderCard', () => {
  const onOrderAction = jest.fn();

  beforeEach(() => {
    onOrderAction.mockClear();
  });

  it('renders order number and formatted date', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText(/1 June 2024/)).toBeInTheDocument();
  });

  it('renders order status and type correctly', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Purchase')).toBeInTheDocument();
  });

  it('renders item preview and +N badge for extra items', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    expect(screen.getAllByRole('img').length).toBe(3);
    expect(screen.getByText('+1')).toBeInTheDocument(); // 4 items total, only 3 shown
  });

  it('renders pickup time, location, and total for customer', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    expect(screen.getByText(/Pickup:/)).toBeInTheDocument();
    expect(screen.getByText(/10:30 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Location:/)).toBeInTheDocument();
    expect(screen.getByText(/123 Pickup St/)).toBeInTheDocument();
    expect(screen.getByText('R120.50')).toBeInTheDocument();
  });

  it('renders impact information', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    expect(screen.getByText(/Meals Saved:/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/CO₂ Reduced:/)).toBeInTheDocument();
    expect(screen.getByText(/12.3 kg/)).toBeInTheDocument();
  });

  it('toggles order details on "View Details" click', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    const toggleButton = screen.getByText('View Details');
    fireEvent.click(toggleButton);
    expect(screen.getByText('Order Items')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Qty: 2')).toBeInTheDocument();
    expect(screen.getByText('R20.00')).toBeInTheDocument();
  });

  it('calls onOrderAction with "track" when Track Order is clicked', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    const trackButton = screen.getByText('Track Order');
    fireEvent.click(trackButton);
    expect(onOrderAction).toHaveBeenCalledWith('1', 'track');
  });

  it('calls onOrderAction with "cancel" when Cancel is clicked', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onOrderAction).toHaveBeenCalledWith('1', 'cancel');
  });

  it('does not render Reorder button for pending orders', () => {
    render(<OrderCard order={mockOrder} userType="customer" onOrderAction={onOrderAction} />);
    expect(screen.queryByText('Reorder')).not.toBeInTheDocument();
  });

  it('renders beneficiaries for provider userType', () => {
    const providerOrder = {
      ...mockOrder,
      beneficiaries: 8
    };
    render(<OrderCard order={providerOrder} userType="provider" onOrderAction={onOrderAction} />);
    expect(screen.getByText('Beneficiaries:')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});
