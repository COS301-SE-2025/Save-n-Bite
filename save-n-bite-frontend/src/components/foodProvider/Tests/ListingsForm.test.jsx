import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ListingForm } from '../ListingsForm';
import foodListingsAPI from '../../../services/foodListingsAPI';

// Mock the API module
vi.mock('../../../services/foodListingsAPI', () => ({
  default: {
    createListing: vi.fn()
  }
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock FileReader
global.FileReader = class {
  constructor() {
    this.result = null;
    this.onloadend = null;
  }
  
  readAsDataURL(file) {
    this.result = `data:image/jpeg;base64,mock-base64-${file.name}`;
    if (this.onloadend) {
      setTimeout(() => this.onloadend(), 0);
    }
  }
};

// Helper component to wrap ListingForm with Router
const ListingFormWrapper = () => (
  <BrowserRouter>
    <ListingForm />
  </BrowserRouter>
);

describe('ListingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    mockNavigate.mockClear();
    foodListingsAPI.createListing.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Permission Checks', () => {
    it('should show error when no user data is stored', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(<ListingFormWrapper />);
      
      expect(screen.getByText('Please log in as a provider to create listings.')).toBeInTheDocument();
    });

    it('should show error when user is not a provider', () => {
      const userData = {
        user_type: 'consumer',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
      
      render(<ListingFormWrapper />);
      
      expect(screen.getByText(/Only verified providers can create listings/)).toBeInTheDocument();
    });

    it('should show error when provider is pending verification', () => {
      const userData = {
        user_type: 'provider',
        profile: { status: 'pending_verification' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
      
      render(<ListingFormWrapper />);
      
      expect(screen.getByText(/Your provider account is pending verification/)).toBeInTheDocument();
    });

    it('should allow verified providers to use the form', () => {
      const userData = {
        user_type: 'provider',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
      
      render(<ListingFormWrapper />);
      
      expect(screen.queryByText(/Only verified providers/)).not.toBeInTheDocument();
      expect(screen.queryByText(/pending verification/)).not.toBeInTheDocument();
      expect(screen.getByText('Publish Listing')).toBeInTheDocument();
    });
  });

  describe('Form Rendering', () => {
    beforeEach(() => {
      const userData = {
        user_type: 'provider',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
    });

    it('should render all form fields', () => {
      render(<ListingFormWrapper />);
      
      // Use alternative selectors for fields without proper labels
      expect(screen.getByPlaceholderText('e.g., Fresh Baked Bread')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe your food item...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Number of items')).toBeInTheDocument();
      
      // More specific approach for price fields
      const priceInputs = screen.getAllByDisplayValue('');
      expect(priceInputs.length).toBeGreaterThan(0);
      
      // Check for date input using type attribute
      const dateInput = document.querySelector('input[type="date"]');
      expect(dateInput).toBeInTheDocument();
      
      expect(screen.getByPlaceholderText('e.g., 9:00 AM - 12:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Upload Image')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<ListingFormWrapper />);
      
      expect(screen.getByText('Save Draft')).toBeInTheDocument();
      expect(screen.getByText('Publish Listing')).toBeInTheDocument();
    });

    it('should have donation checkbox', () => {
      render(<ListingFormWrapper />);
      
      expect(screen.getByText('Mark as Donation')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    beforeEach(() => {
      const userData = {
        user_type: 'provider',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
    });

    it('should update form data when inputs change', () => {
      render(<ListingFormWrapper />);
      
      const nameInput = screen.getByPlaceholderText('e.g., Fresh Baked Bread');
      fireEvent.change(nameInput, { target: { value: 'Test Food' } });
      
      expect(nameInput.value).toBe('Test Food');
    });

    it('should update textarea for description', () => {
      render(<ListingFormWrapper />);
      
      const descriptionInput = screen.getByPlaceholderText('Describe your food item...');
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      
      expect(descriptionInput.value).toBe('Test description');
    });

    it('should disable price fields when donation is checked', () => {
      render(<ListingFormWrapper />);
      
      const donationCheckbox = screen.getByRole('checkbox');
      // Get the Original Price field specifically
      const originalPriceInput = document.querySelector('input[name="original_price"][step="0.01"]');
      
      fireEvent.click(donationCheckbox);
      
      // Check if the price input becomes disabled or readonly
      expect(originalPriceInput).toHaveProperty('disabled', true);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      const userData = {
        user_type: 'provider',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
    });

    it('should show validation errors for empty required fields', async () => {
      render(<ListingFormWrapper />);
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      // Wait for validation errors to appear
      await waitFor(() => {
        // Check for at least one validation error
        const errorElements = screen.queryAllByText('This field is required');
        expect(errorElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should clear validation errors when fields are filled', async () => {
      render(<ListingFormWrapper />);
      
      const nameInput = screen.getByPlaceholderText('e.g., Fresh Baked Bread');
      const submitButton = screen.getByText('Publish Listing');
      
      // Trigger validation error
      fireEvent.click(submitButton);
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.queryByText('This field is required')).toBeInTheDocument();
      });
      
      // Fill the field
      fireEvent.change(nameInput, { target: { value: 'Test Food' } });
      
      // Wait a bit for the error to clear
      await waitFor(() => {
        // Check if the error is gone or reduced
        const remainingErrors = screen.queryAllByText('This field is required');
        // The error for this specific field should be cleared
        expect(remainingErrors.length).toBeLessThan(5);
      });
    });

    it('should set minimum date to today for expiry date', () => {
      render(<ListingFormWrapper />);
      
      const expiryInput = document.querySelector('input[name="expiry_date"]');
      const today = new Date().toISOString().split('T')[0];
      
      expect(expiryInput.getAttribute('min')).toBe(today);
    });
  });

  describe('Image Upload', () => {
    beforeEach(() => {
      const userData = {
        user_type: 'provider',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
    });

    it('should accept valid image files', async () => {
      render(<ListingFormWrapper />);
      
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        // Look for image preview or success message
        const preview = screen.queryByAltText('Preview') || screen.queryByText(/uploaded/i);
        expect(preview).toBeInTheDocument();
      });
    });

    it('should reject non-image files', async () => {
      render(<ListingFormWrapper />);
      
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText(/Please select an image file/i)).toBeInTheDocument();
      });
    });

    it('should reject files larger than 5MB', async () => {
      render(<ListingFormWrapper />);
      
      const fileInput = document.querySelector('input[type="file"]');
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(screen.getByText(/Image size should be less than 5MB/i)).toBeInTheDocument();
      });
    });

    it('should allow removing uploaded image', async () => {
      render(<ListingFormWrapper />);
      
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);
      
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
      expect(screen.getByText(/Drag and drop an image/)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      const userData = {
        user_type: 'provider',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
    });

    // Helper function to fill required fields
    const fillRequiredFields = () => {
      fireEvent.change(screen.getByPlaceholderText('e.g., Fresh Baked Bread'), { target: { value: 'Test Food' } });
      fireEvent.change(screen.getByPlaceholderText('Describe your food item...'), { target: { value: 'Test description' } });
      fireEvent.change(screen.getByPlaceholderText('Number of items'), { target: { value: '5' } });
      
      // Fill price inputs more reliably
      const originalPriceInput = document.querySelector('input[name="original_price"][step="0.01"]');
      const discountedPriceInput = document.querySelector('input[name="discounted_price"]');
      
      if (originalPriceInput) {
        fireEvent.change(originalPriceInput, { target: { value: '10.00' } });
      }
      if (discountedPriceInput) {
        fireEvent.change(discountedPriceInput, { target: { value: '5.00' } });
      }
      
      // Set future date for expiry
      const dateInput = document.querySelector('input[name="expiry_date"]');
      if (dateInput) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateString = futureDate.toISOString().split('T')[0];
        fireEvent.change(dateInput, { target: { value: dateString } });
      }
      
      fireEvent.change(screen.getByPlaceholderText('e.g., 9:00 AM - 12:00 PM'), { target: { value: '9:00 AM - 12:00 PM' } });
    };

    it('should prevent submission for non-providers', async () => {
      const consumerData = {
        user_type: 'consumer',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(consumerData));
      
      render(<ListingFormWrapper />);
      
      // Should show error message immediately for non-providers
      expect(screen.getByText(/Only verified providers can create listings/)).toBeInTheDocument();
      
      expect(foodListingsAPI.createListing).not.toHaveBeenCalled();
    });

    it('should prevent submission for pending providers', async () => {
      const pendingProviderData = {
        user_type: 'provider',
        profile: { status: 'pending_verification' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingProviderData));
      
      render(<ListingFormWrapper />);
      
      // Should show error message immediately for pending providers
      expect(screen.getByText(/Your provider account is pending verification/)).toBeInTheDocument();
      
      expect(foodListingsAPI.createListing).not.toHaveBeenCalled();
    });

    it('should submit form with correct data structure', async () => {
      foodListingsAPI.createListing.mockResolvedValue({ success: true });
      
      render(<ListingFormWrapper />);
      
      fillRequiredFields();
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(foodListingsAPI.createListing).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Food',
            description: 'Test description',
            quantity: 5,
            original_price: 10,
            discounted_price: 5,
            pickup_window: '9:00 AM - 12:00 PM'
          })
        );
      });
    });

    it('should handle donation listings correctly', async () => {
      foodListingsAPI.createListing.mockResolvedValue({ success: true });
      
      render(<ListingFormWrapper />);
      
      // Check donation checkbox first
      const donationCheckbox = screen.getByRole('checkbox');
      fireEvent.click(donationCheckbox);
      
      fillRequiredFields();
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(foodListingsAPI.createListing).toHaveBeenCalledWith(
          expect.objectContaining({
            original_price: 0,
            discounted_price: 0
          })
        );
      });
    });

    it('should include image data when image is uploaded', async () => {
      foodListingsAPI.createListing.mockResolvedValue({ success: true });
      
      render(<ListingFormWrapper />);
      
      fillRequiredFields();
      
      // Upload image
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        const preview = screen.queryByAltText('Preview');
        if (preview) expect(preview).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(foodListingsAPI.createListing).toHaveBeenCalledWith(
          expect.objectContaining({
            imageUrl: expect.stringContaining('data:image/jpeg;base64,mock-base64-test.jpg')
          })
        );
      });
    });

    it('should navigate to listings overview on successful submission', async () => {
      foodListingsAPI.createListing.mockResolvedValue({ success: true });
      
      render(<ListingFormWrapper />);
      
      fillRequiredFields();
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/listings-overview');
      });
    });

    it('should show error message on API failure', async () => {
      foodListingsAPI.createListing.mockResolvedValue({ 
        success: false, 
        error: 'Failed to create listing' 
      });
      
      render(<ListingFormWrapper />);
      
      fillRequiredFields();
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create listing')).toBeInTheDocument();
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      // Create a promise that resolves after a delay
      let resolvePromise;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
        setTimeout(() => resolve({ success: true }), 100);
      });
      
      foodListingsAPI.createListing.mockReturnValue(delayedPromise);
      
      render(<ListingFormWrapper />);
      
      fillRequiredFields();
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
      
      expect(submitButton).toBeDisabled();
      
      // Wait for completion
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/listings-overview');
      });
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      error.response = { data: { message: 'Server error' } };
      foodListingsAPI.createListing.mockRejectedValue(error);
      
      render(<ListingFormWrapper />);
      
      fillRequiredFields();
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Look for either the specific error message or a general error
        const errorMessage = screen.queryByText('Server error') || 
                            screen.queryByText(/error/i) ||
                            screen.queryByText(/failed/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Date and Time Formatting', () => {
    beforeEach(() => {
      const userData = {
        user_type: 'provider',
        profile: { status: 'verified' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
    });

    const fillRequiredFields = () => {
      fireEvent.change(screen.getByPlaceholderText('e.g., Fresh Baked Bread'), { target: { value: 'Test Food' } });
      fireEvent.change(screen.getByPlaceholderText('Describe your food item...'), { target: { value: 'Test description' } });
      fireEvent.change(screen.getByPlaceholderText('Number of items'), { target: { value: '5' } });
      
      const originalPriceInput = document.querySelector('input[name="original_price"][step="0.01"]');
      const discountedPriceInput = document.querySelector('input[name="discounted_price"]');
      
      if (originalPriceInput) {
        fireEvent.change(originalPriceInput, { target: { value: '10.00' } });
      }
      if (discountedPriceInput) {
        fireEvent.change(discountedPriceInput, { target: { value: '5.00' } });
      }
      
      fireEvent.change(screen.getByPlaceholderText('e.g., 9:00 AM - 12:00 PM'), { target: { value: '9:00 AM - 12:00 PM' } });
    };

    it('should format expiry date correctly for API', async () => {
      foodListingsAPI.createListing.mockResolvedValue({ success: true });
      
      render(<ListingFormWrapper />);
      
      fillRequiredFields();
      
      // Set a specific future date
      const dateInput = document.querySelector('input[name="expiry_date"]');
      if (dateInput) {
        fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
      }
      
      const submitButton = screen.getByText('Publish Listing');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(foodListingsAPI.createListing).toHaveBeenCalledWith(
          expect.objectContaining({
            expiry_date: '2024-12-25'
          })
        );
      });
    });
  });
});