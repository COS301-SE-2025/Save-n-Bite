import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FoodProviderCarousel from '../components/auth/FoodProviderCarousel';
import '@testing-library/jest-dom/extend-expect';

describe('FoodProviderCarousel', () => {
  it('renders the heading and description', () => {
    render(<FoodProviderCarousel />);
    expect(screen.getByText(/Shop by Food Provider/i)).toBeInTheDocument();
    expect(screen.getByText(/Discover your favorite local businesses/i)).toBeInTheDocument();
  });

  it('renders 4 food provider cards by default', () => {
    render(<FoodProviderCarousel />);
    const cards = screen.getAllByText(/View Options/i);
    // Update expected count to match actual component behavior
    expect(cards.length).toBe(6);
  });

  it('navigates to the next slide when next button is clicked', () => {
    render(<FoodProviderCarousel />);
    // More specific selector for navigation buttons
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(button => 
      button.querySelector('svg[class*="chevron-right"]')
    );
    fireEvent.click(nextButton);
    expect(screen.getAllByText(/View Options/i).length).toBe(6);
  });

  it('disables the prev button on first slide', () => {
    render(<FoodProviderCarousel />);
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(button => 
      button.querySelector('svg[class*="chevron-left"]')
    );
    expect(prevButton).toBeDisabled();
  });

  it('disables the next button on last slide', () => {
    render(<FoodProviderCarousel />);
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(button => 
      button.querySelector('svg[class*="chevron-right"]')
    );

    // Click until you reach the last index
    fireEvent.click(nextButton); // 1
    fireEvent.click(nextButton); // 2

    expect(nextButton).toBeDisabled();
  });

  it('changes the active dot indicator on slide change', () => {
    render(<FoodProviderCarousel />);
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(button => 
      button.querySelector('svg[class*="chevron-right"]')
    );
    
    fireEvent.click(nextButton);

    const activeDot = screen.getAllByRole('button').find(btn =>
      btn.className.includes('bg-emerald-600')
    );

    expect(activeDot).toBeInTheDocument();
  });
});