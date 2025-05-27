import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import { authAPI } from '../../../services/authAPI';
import * as validators from '../../../utils/validators';

// Mock the dependencies
vi.mock('../../../services/authAPI');
vi.mock('../../../utils/validators');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Setup default validator mocks
    validators.validateEmail.mockImplementation((email) => email.includes('@'));
    validators.validateRequired.mockImplementation((value) => !!value);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderLoginForm = (props = {}) => {
    return render(
      <TestWrapper>
        <LoginForm 
          onSuccess={mockOnSuccess} 
          onError={mockOnError} 
          {...props} 
        />
      </TestWrapper>
    );
  };

  describe('Component Rendering', () => {
    it('renders login form with all required fields', () => {
      renderLoginForm();
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('renders form fields with correct attributes', () => {
      renderLoginForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    });
  });

  describe('Form Input Handling', () => {
    it('updates form data when user types in email field', () => {
      renderLoginForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('updates form data when user types in password field', () => {
      renderLoginForm();
      
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput.value).toBe('password123');
    });

    it('clears field error when user starts typing', () => {
      validators.validateEmail.mockReturnValue(false);
      renderLoginForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      // Trigger validation error
      fireEvent.click(submitButton);
      expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
      
      // Start typing to clear error
      fireEvent.change(emailInput, { target: { value: 'test' } });
      expect(screen.queryByText(/valid email is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows email validation error when email is invalid', () => {
      validators.validateEmail.mockReturnValue(false);
      validators.validateRequired.mockReturnValue(true);
      
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
    });

    it('shows password validation error when password is empty', () => {
      validators.validateEmail.mockReturnValue(true);
      validators.validateRequired.mockReturnValue(false);
      
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows both validation errors when both fields are invalid', () => {
      validators.validateEmail.mockReturnValue(false);
      validators.validateRequired.mockReturnValue(false);
      
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('does not submit form when validation fails', () => {
      validators.validateEmail.mockReturnValue(false);
      validators.validateRequired.mockReturnValue(false);
      
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      expect(authAPI.login).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      validators.validateEmail.mockReturnValue(true);
      validators.validateRequired.mockReturnValue(true);
    });

    it('calls authAPI.login with correct form data', async () => {
      authAPI.login.mockResolvedValue({
        token: 'mock-token',
        user: { id: 1, user_type: 'customer', profile: { full_name: 'John Doe' } }
      });

      renderLoginForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('shows loading state during submission', async () => {
      authAPI.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderLoginForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      expect(screen.getByText(/logging in.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('stores auth token and user data in localStorage on success', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'customer', profile: { full_name: 'John Doe' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-token');
        expect(localStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockResponse.user));
      });
    });

    it('calls onSuccess with response and welcome message', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'customer', profile: { full_name: 'John Doe' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockResponse,
            welcomeMessage: expect.stringContaining('Welcome back! John Doe!')
          })
        );
      });
    });
  });

  describe('Navigation Logic', () => {
    beforeEach(() => {
      validators.validateEmail.mockReturnValue(true);
      validators.validateRequired.mockReturnValue(true);
    });

    it('navigates to /create-listing for provider users', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'provider', profile: { business_name: 'Test Business' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/create-listing');
      });
    });

    it('navigates to /food-listing for customer users', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'customer', profile: { full_name: 'John Doe' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/food-listing');
      });
    });

    it('navigates to /food-listing for NGO users', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'ngo', profile: { organisation_name: 'Test NGO' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/food-listing');
      });
    });
  });

  describe('Welcome Message Generation', () => {
    beforeEach(() => {
      validators.validateEmail.mockReturnValue(true);
      validators.validateRequired.mockReturnValue(true);
    });

    it('creates welcome message for customer with full name', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'customer', profile: { full_name: 'John Doe' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            welcomeMessage: expect.stringContaining('Welcome back! John Doe!')
          })
        );
      });
    });

    it('creates welcome message for provider with business name', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'provider', profile: { business_name: 'Test Restaurant' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            welcomeMessage: expect.stringContaining('Welcome back! Test Restaurant!')
          })
        );
      });
    });

    it('creates welcome message for NGO with organisation name', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'ngo', profile: { organisation_name: 'Food Bank NGO' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            welcomeMessage: expect.stringContaining('Welcome back! Food Bank NGO!')
          })
        );
      });
    });

    it('creates generic welcome message when profile data is missing', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'customer', profile: {} }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            welcomeMessage: expect.stringContaining('Welcome back! Great to see you again!')
          })
        );
      });
    });

    it('includes environmental fact in welcome message', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, user_type: 'customer', profile: { full_name: 'John Doe' } }
      };
      
      authAPI.login.mockResolvedValue(mockResponse);
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const welcomeMessage = mockOnSuccess.mock.calls[0][0].welcomeMessage;
        expect(welcomeMessage).toMatch(/🌱|🌍|💧|🗑️|🌟|🌳|♻️|🦋/);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      validators.validateEmail.mockReturnValue(true);
      validators.validateRequired.mockReturnValue(true);
    });

    it('calls onError when login API fails', async () => {
      const errorMessage = 'Invalid credentials';
      authAPI.login.mockRejectedValue(new Error(errorMessage));
      
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('calls onError with default message when error has no message', async () => {
      authAPI.login.mockRejectedValue(new Error());
      
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Login failed. Please check your credentials.');
      });
    });

    it('resets loading state after error', async () => {
      authAPI.login.mockRejectedValue(new Error('Login failed'));
      
      renderLoginForm();
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderLoginForm();
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('maintains focus management during interactions', () => {
      renderLoginForm();
      
      const emailInput = screen.getByLabelText(/email/i);
      emailInput.focus();
      expect(emailInput).toHaveFocus();
    });
  });
});