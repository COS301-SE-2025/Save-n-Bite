import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterForm from '../RegisterForm';
import { authAPI } from '../../../services/authAPI';
import { USER_TYPES } from '../../../utils/constants';

// Mock the authAPI
vi.mock('../../../services/authAPI', () => ({
  authAPI: {
    register: vi.fn()
  }
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock validators
vi.mock('../../../utils/validators', () => ({
  validateEmail: vi.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  validatePassword: vi.fn((password) => password && password.length >= 6),
  validateRequired: vi.fn((value) => value && value.trim() !== ''),
  validatePhone: vi.fn((phone) => /^\d{10}$/.test(phone))
}));

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Common functionality', () => {
    it('renders common fields for all user types', () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('shows loading state when submitting', async () => {
      authAPI.register.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Cape Town' } });
      fireEvent.change(screen.getByLabelText(/province/i), { target: { value: 'Western Cape' } });

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      expect(screen.getByText(/registering\.\.\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /registering\.\.\./i })).toBeDisabled();
    });

    it('validates password confirmation', async () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('clears field errors when user starts typing', async () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Submit form to trigger validation errors
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
      });

      // Start typing in email field
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@' } });

      // Error should be cleared
      expect(screen.queryByText(/valid email is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Customer Registration', () => {
    it('renders customer-specific fields', () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/province/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/profile image/i)).toBeInTheDocument();
    });

    it('validates customer required fields', async () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/city is required/i)).toBeInTheDocument();
        expect(screen.getByText(/province is required/i)).toBeInTheDocument();
        expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('submits customer form successfully', async () => {
      authAPI.register.mockResolvedValue({ success: true });

      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Fill all required fields
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'customer@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Cape Town' } });
      fireEvent.change(screen.getByLabelText(/province/i), { target: { value: 'Western Cape' } });

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'customer@example.com',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Cape Town',
            province: 'Western Cape',
            userType: USER_TYPES.CUSTOMER
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/food-listing');
      });
    });
  });

  describe('Provider Registration', () => {
    it('renders provider-specific fields', () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.PROVIDER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/business email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/business contact/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cipc document/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/business logo/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/street address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/postal code/i)).toBeInTheDocument();
    });

    it('validates provider required fields', async () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.PROVIDER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/business name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/valid contact number is required/i)).toBeInTheDocument();
        expect(screen.getByText(/valid business email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/address line 1 is required/i)).toBeInTheDocument();
        expect(screen.getByText(/postal code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/cipc document is required/i)).toBeInTheDocument();
      });
    });

    it('handles file upload for CIPC document', async () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.PROVIDER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/cipc document/i);

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onloadend: null,
        result: 'data:application/pdf;base64,test'
      };
      global.FileReader = vi.fn(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulate FileReader completion
      mockFileReader.onloadend();

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });
  });

  describe('NGO Registration', () => {
    it('renders NGO-specific fields', () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.NGO}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByLabelText(/organisation name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organisation contact/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organisation email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/representative name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/representative email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/npo document/i)).toBeInTheDocument();
    });

    it('validates NGO required fields', async () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.NGO}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/organisation name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/valid contact number is required/i)).toBeInTheDocument();
        expect(screen.getByText(/valid organisation email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/representative name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/valid representative email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/npo document is required/i)).toBeInTheDocument();
      });
    });

    it('submits NGO form successfully', async () => {
  const mockRegister = vi.fn().mockResolvedValue({ data: {} });
  authAPI.register = mockRegister;

  render(<RegisterForm />);

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@ngo.org' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
  fireEvent.change(screen.getByLabelText(/organisation name/i), { target: { value: 'Test NGO' } });
  fireEvent.change(screen.getByLabelText(/organisation contact/i), { target: { value: '0123456789' } });
  fireEvent.change(screen.getByLabelText(/organisation email/i), { target: { value: 'contact@ngo.org' } });
  fireEvent.change(screen.getByLabelText(/representative name/i), { target: { value: 'Jane Smith' } });
  fireEvent.change(screen.getByLabelText(/representative email/i), { target: { value: 'jane@ngo.org' } });
  fireEvent.change(screen.getByLabelText(/organisation address/i, { selector: 'input[name="addressLine1"]' }), { target: { value: '123 Main St' } });
  fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Johannesburg' } });
  fireEvent.change(screen.getByLabelText(/province/i), { target: { value: 'Gauteng' } });
  fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: '1234' } });

  // Simulate file input
  const file = new File(['dummy content'], 'npo.pdf', { type: 'application/pdf' });
  fireEvent.change(screen.getByLabelText(/npo document/i), {
    target: { files: [file] },
  });

  fireEvent.click(screen.getByRole('button', { name: /register/i }));

  await waitFor(() => {
    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@ngo.org',
        organisationName: 'Test NGO',
        
      })
    );
  });
});


  });

  describe('Error handling', () => {
    it('handles registration API errors', async () => {
      const errorMessage = 'Registration failed';
      authAPI.register.mockRejectedValue(new Error(errorMessage));

      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Cape Town' } });
      fireEvent.change(screen.getByLabelText(/province/i), { target: { value: 'Western Cape' } });

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('prevents form submission with validation errors', async () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(authAPI.register).not.toHaveBeenCalled();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Province dropdown', () => {
    it('renders all South African provinces', () => {
      renderWithRouter(
        <RegisterForm 
          userType={USER_TYPES.CUSTOMER}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const provinces = [
        "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
        "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
      ];

      const provinceSelect = screen.getByLabelText(/province/i);
      provinces.forEach(province => {
        expect(screen.getByRole('option', { name: province })).toBeInTheDocument();
      });
    });
  });
});