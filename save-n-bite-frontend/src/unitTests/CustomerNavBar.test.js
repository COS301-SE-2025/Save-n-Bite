// CustomerNavBar.test.jsximport React from 'react';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';
import CustomerNavBar from '../components/auth/CustomerNavBar';

// Mock the NotificationBell component
jest.mock('../components/auth/NotificationBell', () => {
  return function MockNotificationBell() {
    return <div data-testid="notification-bell">Notification Bell</div>;
  };
});


// Mock react-router-dom - check if it exists first
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  try {
    return {
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    };
  } catch (e) {
    // Fallback if react-router-dom is not installed
    return {
      Link: ({ children, to, className, ...props }) => (
        <a href={to} className={className} {...props}>
          {children}
        </a>
      ),
      useNavigate: () => mockNavigate,
      BrowserRouter: ({ children }) => <div>{children}</div>,
    };
  }
}, { virtual: true });

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Try to import BrowserRouter, fallback to div wrapper
let BrowserRouter;
try {
  BrowserRouter = require('react-router-dom').BrowserRouter;
} catch (e) {
  BrowserRouter = ({ children }) => <div>{children}</div>;
}

// Wrapper component for Router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CustomerNavBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the logo and brand name', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Save n Bite')).toBeInTheDocument();
  });

  test('renders desktop navigation links', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    // Check for desktop navigation links
    expect(screen.getByRole('link', { name: 'Browse Food' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Cart' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Order History' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
  });

  test('renders notification bell component', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    expect(screen.getAllByTestId('notification-bell')).toHaveLength(2); // Desktop and mobile
  });

  test('renders logout button', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    const logoutButtons = screen.getAllByText('Logout');
    expect(logoutButtons.length).toBeGreaterThan(0);
  });

  test('toggles mobile menu when hamburger icon is clicked', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    // Mobile menu should not be visible initially
    expect(screen.queryByText('Browse Food')).toBeInTheDocument(); // Desktop version
    
    // Find and click the mobile menu button
    const menuButtons = screen.getAllByRole('button');
    const mobileMenuButton = menuButtons.find(button => 
      button.querySelector('svg') // Button with icon
    );
    
    fireEvent.click(mobileMenuButton);

    // Mobile menu should now be visible (additional mobile links)
    const browseFoodLinks = screen.getAllByText('Browse Food');
    expect(browseFoodLinks.length).toBeGreaterThan(1); // Desktop + mobile versions
  });

  test('closes mobile menu when X icon is clicked', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    // Open mobile menu first
    const menuButtons = screen.getAllByRole('button');
    const mobileMenuButton = menuButtons.find(button => 
      button.querySelector('svg')
    );
    
    fireEvent.click(mobileMenuButton);

    // Verify menu is open
    const browseFoodLinks = screen.getAllByText('Browse Food');
    expect(browseFoodLinks.length).toBeGreaterThan(1);

    // Close menu
    fireEvent.click(mobileMenuButton);

    // Wait for menu to close and verify
    waitFor(() => {
      const browseFoodLinksAfterClose = screen.getAllByText('Browse Food');
      expect(browseFoodLinksAfterClose.length).toBe(1); // Only desktop version
    });
  });

  test('handles logout functionality', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    const logoutButton = screen.getAllByText('Logout')[0]; // Get first logout button
    fireEvent.click(logoutButton);

    // Verify localStorage items are removed
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userData');

    // Verify navigation to login page
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('logo link navigates to dashboard', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    const logoLink = screen.getByRole('link', { name: /logo save n bite/i });
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  test('navigation links have correct href attributes', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    expect(screen.getByRole('link', { name: 'Browse Food' })).toHaveAttribute('href', '/food-listing');
    expect(screen.getByRole('link', { name: 'My Cart' })).toHaveAttribute('href', '/cart');
    expect(screen.getByRole('link', { name: 'Order History' })).toHaveAttribute('href', '/orders');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  });

  test('mobile menu contains all navigation links', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    // Open mobile menu
    const menuButtons = screen.getAllByRole('button');
    const mobileMenuButton = menuButtons.find(button => 
      button.querySelector('svg')
    );
    
    fireEvent.click(mobileMenuButton);

    // Check that mobile menu contains all links
    const browseFoodLinks = screen.getAllByText('Browse Food');
    const myCartLinks = screen.getAllByText('My Cart');
    const orderHistoryLinks = screen.getAllByText('Order History');
    const profileLinks = screen.getAllByText('Profile');

    expect(browseFoodLinks.length).toBe(2); // Desktop + mobile
    expect(myCartLinks.length).toBe(2);
    expect(orderHistoryLinks.length).toBe(2);
    expect(profileLinks.length).toBe(2);
  });

  test('mobile logout button works correctly', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    // Open mobile menu
    const menuButtons = screen.getAllByRole('button');
    const mobileMenuButton = menuButtons.find(button => 
      button.querySelector('svg')
    );
    
    fireEvent.click(mobileMenuButton);

    // Find and click mobile logout button
    const logoutButtons = screen.getAllByText('Logout');
    const mobileLogoutButton = logoutButtons[logoutButtons.length - 1]; // Last one should be mobile
    
    fireEvent.click(mobileLogoutButton);

    // Verify logout functionality
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userData');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('component renders without crashing', () => {
    const { container } = render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  test('menu state initializes as closed', () => {
    render(
      <RouterWrapper>
        <CustomerNavBar />
      </RouterWrapper>
    );

    // Mobile menu content should not be visible initially
    const browseFoodLinks = screen.getAllByText('Browse Food');
    expect(browseFoodLinks.length).toBe(1); // Only desktop version visible
  });
});