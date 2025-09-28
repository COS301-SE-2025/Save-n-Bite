import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterSidebar from '../components/auth/FilterSidebar';
import { USER_TYPES } from '../utils/constants';

// Mock the constants
jest.mock('../utils/constants', () => ({
  USER_TYPES: {
    CUSTOMER: 'CUSTOMER',
    NGO: 'NGO',
    BUSINESS: 'BUSINESS'
  }
}));

describe('FilterSidebar Component', () => {
  const mockSetFilters = jest.fn();
  const mockOnResetFilters = jest.fn();
  
  const defaultProps = {
    showFilters: true,
    filters: {
      priceRange: [0, 500],
      type: 'all',
      provider: 'all',
      expiration: 'all'
    },
    setFilters: mockSetFilters,
    providerOptions: [
      { label: 'Provider 1', value: 'provider1' },
      { label: 'Provider 2', value: 'provider2' }
    ],
    typeOptions: [
      { label: 'Donation', value: 'donation' },
      { label: 'Discount', value: 'discount' }
    ],
    onResetFilters: mockOnResetFilters,
    userType: USER_TYPES.CUSTOMER
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility and Basic Rendering', () => {
    test('renders when showFilters is true', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Pickup Deadline')).toBeInTheDocument();
      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    test('does not render when showFilters is false', () => {
      render(<FilterSidebar {...defaultProps} showFilters={false} />);
      
      expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    });

    test('renders with default empty arrays when options not provided', () => {
      const propsWithoutOptions = {
        ...defaultProps,
        providerOptions: undefined,
        typeOptions: undefined
      };
      
      render(<FilterSidebar {...propsWithoutOptions} />);
      
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.queryByText('Provider')).not.toBeInTheDocument();
    });
  });

  describe('Price Range Filter', () => {
    test('displays correct price range values', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      // Use getAllByText since there are multiple R0 elements
      const r0Elements = screen.getAllByText('R0');
      expect(r0Elements.length).toBeGreaterThan(0);
      expect(screen.getByText('R500')).toBeInTheDocument();
      expect(screen.getByText('R1,000')).toBeInTheDocument();
    });

    test('updates price range when slider is changed', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '750' } });
      
      expect(mockSetFilters).toHaveBeenCalledWith({
        ...defaultProps.filters,
        priceRange: [0, 750]
      });
    });

    test('slider has correct attributes', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '1000');
      expect(slider).toHaveAttribute('step', '10');
      expect(slider).toHaveAttribute('value', '500');
    });
  });

  describe('Type Filter for NGO Users', () => {
    test('shows type filter for NGO users when typeOptions are provided', () => {
      render(<FilterSidebar {...defaultProps} userType={USER_TYPES.NGO} />);
      
      expect(screen.getByText('Item Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Donation')).toBeInTheDocument();
      expect(screen.getByLabelText('Discount')).toBeInTheDocument();
    });

    test('does not show type filter for non-NGO users', () => {
      render(<FilterSidebar {...defaultProps} userType={USER_TYPES.CUSTOMER} />);
      
      expect(screen.queryByText('Item Type')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Donation')).not.toBeInTheDocument();
    });

    test('does not show type filter when typeOptions is empty', () => {
      render(<FilterSidebar {...defaultProps} userType={USER_TYPES.NGO} typeOptions={[]} />);
      
      expect(screen.queryByText('Item Type')).not.toBeInTheDocument();
    });

    test('updates type filter when radio button is selected', () => {
      render(<FilterSidebar {...defaultProps} userType={USER_TYPES.NGO} />);
      
      const donationRadio = screen.getByLabelText('Donation');
      fireEvent.click(donationRadio);
      
      expect(mockSetFilters).toHaveBeenCalledWith({
        ...defaultProps.filters,
        type: 'donation'
      });
    });

    test('shows correct selected radio button', () => {
      const propsWithSelectedType = {
        ...defaultProps,
        filters: { ...defaultProps.filters, type: 'discount' },
        userType: USER_TYPES.NGO
      };
      
      render(<FilterSidebar {...propsWithSelectedType} />);
      
      const discountRadio = screen.getByLabelText('Discount');
      expect(discountRadio).toBeChecked();
      
      const donationRadio = screen.getByLabelText('Donation');
      expect(donationRadio).not.toBeChecked();
    });
  });

  describe('Provider Filter', () => {
    test('shows provider filter when providerOptions are provided', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Providers')).toBeInTheDocument();
    });

    test('does not show provider filter when providerOptions is empty', () => {
      render(<FilterSidebar {...defaultProps} providerOptions={[]} />);
      
      expect(screen.queryByText('Provider')).not.toBeInTheDocument();
    });

    test('displays all provider options', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const select = screen.getByDisplayValue('All Providers');
      expect(select).toBeInTheDocument();
      
      // Check if options exist in the select
      expect(screen.getByText('Provider 1')).toBeInTheDocument();
      expect(screen.getByText('Provider 2')).toBeInTheDocument();
    });

    test('updates provider filter when selection changes', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const select = screen.getByDisplayValue('All Providers');
      fireEvent.change(select, { target: { value: 'provider1' } });
      
      expect(mockSetFilters).toHaveBeenCalledWith({
        ...defaultProps.filters,
        provider: 'provider1'
      });
    });

    test('handles provider options without label/value structure', () => {
      const propsWithSimpleProviders = {
        ...defaultProps,
        providerOptions: ['Simple Provider 1', 'Simple Provider 2']
      };
      
      render(<FilterSidebar {...propsWithSimpleProviders} />);
      
      expect(screen.getByText('Simple Provider 1')).toBeInTheDocument();
      expect(screen.getByText('Simple Provider 2')).toBeInTheDocument();
    });
  });

  describe('Expiration Filter', () => {
    test('displays expiration filter options', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      expect(screen.getByText('Pickup Deadline')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Any Time')).toBeInTheDocument();
    });

    test('displays all expiration options', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      expect(screen.getByText('Any Time')).toBeInTheDocument();
      expect(screen.getByText('Must Pick Up Today')).toBeInTheDocument();
      expect(screen.getByText('Must Pick Up Tomorrow')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('Later')).toBeInTheDocument();
    });

    test('updates expiration filter when selection changes', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const select = screen.getByDisplayValue('Any Time');
      fireEvent.change(select, { target: { value: 'today' } });
      
      expect(mockSetFilters).toHaveBeenCalledWith({
        ...defaultProps.filters,
        expiration: 'today'
      });
    });

    test('shows correct selected expiration option', () => {
      const propsWithSelectedExpiration = {
        ...defaultProps,
        filters: { ...defaultProps.filters, expiration: 'tomorrow' }
      };
      
      render(<FilterSidebar {...propsWithSelectedExpiration} />);
      
      const select = screen.getByDisplayValue('Must Pick Up Tomorrow');
      expect(select).toBeInTheDocument();
    });
  });

  describe('Reset Filters Functionality', () => {
    test('calls onResetFilters when reset button is clicked', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const resetButton = screen.getByText('Reset Filters');
      fireEvent.click(resetButton);
      
      expect(mockOnResetFilters).toHaveBeenCalledTimes(1);
    });

    test('reset button has correct styling classes', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const resetButton = screen.getByText('Reset Filters');
      expect(resetButton).toHaveClass('w-full', 'py-2', 'border');
    });
  });

  describe('Console Logging', () => {
    test('logs debug information on render', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FilterSidebar {...defaultProps} userType={USER_TYPES.NGO} />);
      
      expect(consoleSpy).toHaveBeenCalledWith('FilterSidebar - userType:', USER_TYPES.NGO);
      expect(consoleSpy).toHaveBeenCalledWith('FilterSidebar - USER_TYPES.NGO:', USER_TYPES.NGO);
      expect(consoleSpy).toHaveBeenCalledWith('FilterSidebar - typeOptions:', defaultProps.typeOptions);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility and Form Elements', () => {
    test('price range slider is accessible', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveClass('cursor-pointer');
    });

    test('radio buttons are properly associated with labels', () => {
      render(<FilterSidebar {...defaultProps} userType={USER_TYPES.NGO} />);
      
      const donationRadio = screen.getByLabelText('Donation');
      expect(donationRadio).toHaveAttribute('type', 'radio');
      expect(donationRadio).toHaveAttribute('name', 'type');
      expect(donationRadio).toHaveAttribute('value', 'donation');
    });

    test('select elements have proper focus styles', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const providerSelect = screen.getByDisplayValue('All Providers');
      expect(providerSelect).toHaveClass('focus:ring-emerald-500', 'focus:border-emerald-500');
    });
  });

  describe('Dark Mode Support', () => {
    test('contains dark mode classes', () => {
      const { container } = render(<FilterSidebar {...defaultProps} />);
      
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700');
    });

    test('text elements have dark mode classes', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const heading = screen.getByText('Filters');
      expect(heading).toHaveClass('dark:text-gray-100');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty string userType', () => {
      render(<FilterSidebar {...defaultProps} userType="" />);
      
      expect(screen.queryByText('Item Type')).not.toBeInTheDocument();
    });

    test('handles null userType', () => {
      render(<FilterSidebar {...defaultProps} userType={null} />);
      
      expect(screen.queryByText('Item Type')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('contains responsive classes', () => {
      const { container } = render(<FilterSidebar {...defaultProps} />);
      
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass('w-full', 'lg:w-64');
    });

    test('text elements have responsive sizing', () => {
      render(<FilterSidebar {...defaultProps} />);
      
      const heading = screen.getByText('Filters');
      expect(heading).toHaveClass('text-base', 'sm:text-lg');
    });
  });
});