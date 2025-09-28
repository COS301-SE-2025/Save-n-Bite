import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FoodCard from '../components/auth/FoodCard';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom - check if it exists first
jest.mock('react-router-dom', () => {
  try {
    return {
      Link: ({ children, to, className, ...props }) => (
        <a href={to} className={className} {...props}>
          {children}
        </a>
      ),
      useNavigate: () => jest.fn(),
    };
  } catch (e) {
    // Fallback if react-router-dom is not installed
    return {
      Link: ({ children, to, className, ...props }) => (
        <a href={to} className={className} {...props}>
          {children}
        </a>
      ),
      useNavigate: () => jest.fn(),
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

const renderWithRouter = (component) => render(component);

describe('FoodCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
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
  });

  describe('Link Navigation', () => {
    test('generates correct link for donation item (non-NGO user)', () => {
      renderWithRouter(<FoodCard item={mockDonationItem} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/item/1');
    });

    test('generates correct link for non-donation item', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/item/2');
    });
  });

  describe('Button Text and Styling', () => {
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
  });

  describe('Tooltip on Save badge', () => {
    test('shows expiry tooltip on hover for discount items', () => {
      renderWithRouter(<FoodCard item={mockDiscountItem} />);
      const saveText = screen.getByText('Save R7');
      const saveContainer = saveText.parentElement;
      fireEvent.mouseEnter(saveContainer);
      expect(screen.getByText('Expires: 4 hours')).toBeInTheDocument();
    });
  });
});