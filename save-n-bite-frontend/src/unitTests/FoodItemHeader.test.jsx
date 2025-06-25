// FoodItemHeader.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FoodItemHeader from '../components/auth/FoodItemHeader';

describe('FoodItemHeader', () => {
  const baseProps = {
    title: 'Tasty Sandwich',
    provider: 'FoodBank SA',
  };

  const renderWithType = (type) => {
    render(<FoodItemHeader {...baseProps} type={type} />);
  };

  test('renders correct information for ready_to_eat type', () => {
    renderWithType('ready_to_eat');

    expect(screen.getByText('Ready to Eat')).toBeInTheDocument();
    expect(screen.getByText(baseProps.title)).toBeInTheDocument();
    expect(screen.getByText(`by ${baseProps.provider}`)).toBeInTheDocument();

    const badge = screen.getByText('Ready to Eat');
    expect(badge).toHaveClass('bg-orange-100');
    expect(badge).toHaveClass('text-orange-800');
  });

  test('renders correct information for donation type', () => {
    renderWithType('donation');

    expect(screen.getByText('Donation')).toBeInTheDocument();
    const badge = screen.getByText('Donation');
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-800');
  });

  test('renders correct information for discount (default) type', () => {
    renderWithType('discount');

    expect(screen.getByText('Discount')).toBeInTheDocument();
    const badge = screen.getByText('Discount');
    expect(badge).toHaveClass('bg-emerald-100');
    expect(badge).toHaveClass('text-emerald-800');
  });

  test('renders fallback as Discount for unknown type', () => {
    renderWithType('random');

    expect(screen.getByText('Discount')).toBeInTheDocument();
  });
});
