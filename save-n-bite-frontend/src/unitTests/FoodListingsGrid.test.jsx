// FoodListingsGrid.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FoodListingsGrid from '../components/auth/FoodListingsGrid';

// Mock FoodCard
jest.mock('../components/auth/FoodCard', () => ({ item }) => (
  <div data-testid="food-card">{item.title}</div>
));

describe('FoodListingsGrid', () => {
  const sampleListings = [
    {
      id: '1',
      title: 'Veggie Wrap',
      provider: { id: 'p1', name: 'Green Cafe' },
    },
    {
      id: '2',
      title: 'Chicken Pie',
      provider: { id: 'p2', name: 'Homestyle Foods' },
    },
  ];

  test('renders heading and sorting text', () => {
    render(<FoodListingsGrid listings={sampleListings} />);

    expect(screen.getByText(/Available Food \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Sorted by expiration time/i)).toBeInTheDocument();
  });

  test('renders a FoodCard for each listing', () => {
    render(<FoodListingsGrid listings={sampleListings} />);

    const cards = screen.getAllByTestId('food-card');
    expect(cards.length).toBe(2);
    expect(cards[0]).toHaveTextContent('Veggie Wrap');
    expect(cards[1]).toHaveTextContent('Chicken Pie');
  });

  test('renders empty state when listings is empty', () => {
    render(<FoodListingsGrid listings={[]} />);

    expect(screen.getByText(/No food listings found/i)).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your filters/i)).toBeInTheDocument();
  });
});
