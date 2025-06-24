// FoodItemDetails.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FoodItemDetails from '../components/auth/FoodItemDetails';

describe('FoodItemDetails', () => {
  const props = {
    pickupWindow: '12:00 PM - 2:00 PM',
    address: '123 Test Street, Testville',
    quantity: 5,
  };

  beforeEach(() => {
    render(<FoodItemDetails {...props} />);
  });

  test('renders pickup window information correctly', () => {
    expect(screen.getByText('Pickup Window')).toBeInTheDocument();
    expect(screen.getByText(props.pickupWindow)).toBeInTheDocument();
  });

  test('renders pickup location information correctly', () => {
    expect(screen.getByText('Pickup Location')).toBeInTheDocument();
    expect(screen.getByText(props.address)).toBeInTheDocument();
  });

  test('renders available quantity correctly', () => {
    expect(screen.getByText('Available Quantity')).toBeInTheDocument();
    expect(screen.getByText(`${props.quantity} available`)).toBeInTheDocument();
  });
});
