import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../components/auth/NavBar';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Navigation Component', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
  });

  test('renders logo and base links (unauthenticated)', () => {
    renderWithRouter(<Navigation />);
    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
    expect(screen.getByText(/Save n Bite/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Food/i)).toBeInTheDocument();
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });

  test('renders provider options when user is authenticated as provider', () => {
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('userData', JSON.stringify({ user_type: 'provider' }));
    renderWithRouter(<Navigation />);
    expect(screen.getByText(/Create Listing/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  test('renders customer options when user is authenticated as customer', () => {
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('userData', JSON.stringify({ user_type: 'customer' }));
    renderWithRouter(<Navigation />);
    expect(screen.queryByText(/Create Listing/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  test('logout clears auth and navigates to login', () => {
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('userData', JSON.stringify({ user_type: 'provider' }));
    renderWithRouter(<Navigation />);
    fireEvent.click(screen.getByText(/Logout/i));
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('mobile menu toggles visibility', () => {
    renderWithRouter(<Navigation />);
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton); // Open menu
    expect(screen.getAllByText(/About/i).length).toBeGreaterThan(1);
    fireEvent.click(menuButton); // Close menu
    // Still rendered but hidden by CSS — optionally test with more complex mock if needed
  });
});
