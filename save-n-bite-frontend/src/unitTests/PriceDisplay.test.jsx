import React from 'react';
import { render, screen } from '@testing-library/react';
import PriceDisplay from '../components/auth/PriceDisplay'; // adjust path as needed

describe('PriceDisplay', () => {
  it('renders discounted and original prices correctly', () => {
    render(<PriceDisplay originalPrice={200} discountedPrice={150} />);

    expect(screen.getByText('R150.00')).toBeInTheDocument();
    expect(screen.getByText('R200.00')).toBeInTheDocument();
    expect(screen.getByText('25% off')).toBeInTheDocument();
  });

  it('renders 0% off when prices are equal', () => {
    render(<PriceDisplay originalPrice={100} discountedPrice={100} />);

    const prices = screen.getAllByText('R100.00');
    expect(prices.length).toBe(2); // discounted and original price

    expect(screen.getByText('0% off')).toBeInTheDocument();
  });

  it('rounds discount percentage correctly', () => {
    render(<PriceDisplay originalPrice={99.99} discountedPrice={89.99} />);

    expect(screen.getByText('10% off')).toBeInTheDocument();
  });

  it('renders cents properly for both prices', () => {
    render(<PriceDisplay originalPrice={59.9} discountedPrice={49.5} />);

    expect(screen.getByText('R49.50')).toBeInTheDocument();
    expect(screen.getByText('R59.90')).toBeInTheDocument();
  });

  it('handles edge case: discounted price greater than original price', () => {
    render(<PriceDisplay originalPrice={100} discountedPrice={120} />);

    expect(screen.getByText('-20% off')).toBeInTheDocument();
  });
});