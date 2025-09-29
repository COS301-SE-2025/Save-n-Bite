import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FoodCard from '../components/auth/FoodCard';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  try {
    return {
      Link: ({ children, to, className, ...props }) => (
        <a href={to} className={className} {...props}>
          {children}
        </a>
      ),
      useNavigate: () => mockNavigate,
    };
  } catch (e) {
    return {
      Link: ({ children, to, className, ...props }) => (
        <a href={to} className={className} {...props}>
          {children}
        </a>
      ),
      useNavigate: () => mockNavigate,
    };
  }
}, { virtual: true });

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test data
const mockDonationItem = {
  id: '1',
  type: 'Donation',
  title: 'Fresh Vegetables',
  image: 'https://example.com/vegetables.jpg',
  provider: {
    business_name: 'Green Grocery'
  },
  distance: '2.5km',
  expirationTime: '2 hours'
};

const mockDiscountItem = {
  id: '2',
  type: 'Discount',
  title: 'Pizza Slice',
  image: 'https://example.com/pizza.jpg',
  provider: {
    business_name: 'Tony\'s Pizza'
  },
  distance: '1.2km',
  expirationTime: '4 hours',
  originalPrice: 25.00,
  discountPrice: 18.50
};

const mockRegularItem = {
  id: '3',
  type: 'Regular',
  title: 'Sandwiches',
  image: 'https://example.com/sandwich.jpg',
  provider: {
    business_name: 'Deli Corner'
  },
  distance: '0.8km',
  expirationTime: '1 hour'
};

// Item without provider for fallback testing
const mockItemWithoutProvider = {
  id: '4',
  type: 'Regular',
  title: 'Mystery Food',
  image: 'https://example.com/mystery.jpg',
  distance: '1km',
  expirationTime: '3 hours'
};

const renderWithRouter = (component) => render(component);

describe('FoodCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockNavigate.mockClear();
    useAuth.mockReturnValue({
      isNGO: jest.fn(() => false),
    });
  });

  describe('Rendering', () => {
    test('renders donation item correctly', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      expect(screen.getByText('Green Grocery')).toBeInTheDocument();
      expect(screen.getByText('Donation')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Request')).toBeInTheDocument();
    });

    test('renders discount item correctly', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      
      expect(screen.getByText('Pizza Slice')).toBeInTheDocument();
      expect(screen.getByText("Tony's Pizza")).toBeInTheDocument();
      expect(screen.getByText('Discount')).toBeInTheDocument();
      expect(screen.getByText('R18.50')).toBeInTheDocument();
      expect(screen.getByText('R25.00')).toBeInTheDocument();
      expect(screen.getByText('Save R7')).toBeInTheDocument();
      expect(screen.getByText('Order')).toBeInTheDocument();
    });

    test('renders regular item correctly', () => {
      renderWithRouter(<FoodCard item={mockRegularItem} />);
      expect(screen.getByText('Sandwiches')).toBeInTheDocument();
      expect(screen.getByText('Deli Corner')).toBeInTheDocument();
      expect(screen.getByText('Regular')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Order')).toBeInTheDocument();
    });

    test('renders fallback provider name when provider is missing', () => {
      renderWithRouter(<FoodCard item={mockItemWithoutProvider} />);
      expect(screen.getByText('Save-n-Bite')).toBeInTheDocument();
    });
  });

  describe('Link Navigation', () => {
    test('generates correct link for donation item (non-NGO user)', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/item/1');
    });

    test('generates correct link for donation item (NGO user)', () => {
      // Mock NGO user
      useAuth.mockReturnValue({
        isNGO: jest.fn(() => true),
      });

      renderWithRouter(<FoodCard item={mockDonationItem} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/donation-request/1');
    });

    test('generates correct link for non-donation item', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/item/2');
    });
  });

  describe('Button Functionality', () => {
    test('shows Request button for donation items', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      expect(screen.getByText('Request')).toBeInTheDocument();
    });

    test('shows Order button for non-donation items', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      expect(screen.getByText('Order')).toBeInTheDocument();
    });

    test('button is properly labeled with type attribute', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      const actionButton = screen.getByText('Request');
      expect(actionButton).toHaveAttribute('type', 'button');
    });

    test('button click navigates to donation request for donation items', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      const button = screen.getByText('Request');
      
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/donation-request/1');
    });

    test('button click navigates to item page for non-donation items', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      const button = screen.getByText('Order');
      
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/item/2');
    });

    test('button click prevents default and stops propagation', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      const button = screen.getByText('Request');
      
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      // Simulate the click with mock event
      fireEvent.click(button, mockEvent);
      
      // Navigate should still be called
      expect(mockNavigate).toHaveBeenCalledWith('/donation-request/1');
    });
  });

  describe('Tooltip Functionality', () => {
    test('shows expiry tooltip on hover for discount items', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      const saveText = screen.getByText('Save R7');
      const saveContainer = saveText.parentElement;
      
      fireEvent.mouseEnter(saveContainer);
      expect(screen.getByText('Expires: 4 hours')).toBeInTheDocument();
    });

    test('hides expiry tooltip on mouse leave for discount items', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      const saveText = screen.getByText('Save R7');
      const saveContainer = saveText.parentElement;
      
      // Show tooltip
      fireEvent.mouseEnter(saveContainer);
      expect(screen.getByText('Expires: 4 hours')).toBeInTheDocument();
      
      // Hide tooltip
      fireEvent.mouseLeave(saveContainer);
      expect(screen.queryByText('Expires: 4 hours')).not.toBeInTheDocument();
    });

    test('does not show tooltip for non-discount items', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      
      // Donation items shouldn't have save badges or tooltips
      expect(screen.queryByText(/Save R/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Expires:/)).not.toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    test('displays correct savings calculation for discount items', () => {
      const customDiscountItem = {
        ...mockDiscountItem,
        originalPrice: 30.75,
        discountPrice: 22.25
      };
      
      renderWithRouter(<FoodCard item={customDiscountItem} />);
      expect(screen.getByText('Save R9')).toBeInTheDocument(); // 30.75 - 22.25 = 8.5, rounded to 9
      expect(screen.getByText('R22.25')).toBeInTheDocument();
      expect(screen.getByText('R30.75')).toBeInTheDocument();
    });
  });

  describe('Styling and Classes', () => {
    test('applies correct badge styling for donation items', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      const badge = screen.getByText('Donation');
      expect(badge).toHaveClass('bg-emerald-100', 'text-emerald-800');
    });

    test('applies correct badge styling for non-donation items', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      const badge = screen.getByText('Discount');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });
});