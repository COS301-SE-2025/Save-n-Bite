import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditListingModal from '../EditListing';

describe('EditListingModal', () => {
  const defaultProps = {
    listing: {
      id: 1,
      foodName: 'Fresh Apples',
      description: 'Organic red apples',
      quantity: '5 kg',
      price: '25.00',
      type: 'For Sale',
      expirationDate: '2024-12-31',
      status: 'active'
    },
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      render(<EditListingModal {...defaultProps} />);
      
      expect(screen.getByText('Edit Listing')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Fresh Apples')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Organic red apples')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5 kg')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25.00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<EditListingModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Edit Listing')).not.toBeInTheDocument();
    });

    it('should render all form fields with correct initial values', () => {
      render(<EditListingModal {...defaultProps} />);

      // Text inputs by display value
      expect(screen.getByDisplayValue('Fresh Apples')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Organic red apples')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5 kg')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25.00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
      
      // Select dropdown
      expect(screen.getByRole('combobox')).toHaveValue('active');
      
      // Checkbox
      expect(screen.getByRole('checkbox')).not.toBeChecked();
      
      // Buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should show donation checkbox and price input correctly', () => {
      render(<EditListingModal {...defaultProps} />);
      
      const donationCheckbox = screen.getByRole('checkbox');
      expect(donationCheckbox).not.toBeChecked();
      
      // Price input should be visible when not donation
      expect(screen.getByPlaceholderText(/price \(r\)/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle food name input change', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const foodNameInput = screen.getByDisplayValue('Fresh Apples');
      await user.clear(foodNameInput);
      await user.type(foodNameInput, 'Updated Apples');
      
      expect(foodNameInput).toHaveValue('Updated Apples');
    });

    it('should handle description input change', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const descriptionInput = screen.getByDisplayValue('Organic red apples');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');
      
      expect(descriptionInput).toHaveValue('Updated description');
    });

    it('should handle quantity input change', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const quantityInput = screen.getByDisplayValue('5 kg');
      await user.clear(quantityInput);
      await user.type(quantityInput, '10 kg');
      
      expect(quantityInput).toHaveValue('10 kg');
    });

    it('should handle status dropdown change', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const statusSelect = screen.getByRole('combobox');
      await user.selectOptions(statusSelect, 'expiring-soon');
      
      expect(statusSelect).toHaveValue('expiring-soon');
    });

    it('should handle price input change', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const priceInput = screen.getByPlaceholderText(/price \(r\)/i);
      await user.clear(priceInput);
      await user.type(priceInput, '30.50');
      
      expect(priceInput).toHaveValue(30.5);
    });

    it('should handle donation checkbox toggle', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const donationCheckbox = screen.getByRole('checkbox');
      expect(donationCheckbox).not.toBeChecked();
      
      await user.click(donationCheckbox);
      expect(donationCheckbox).toBeChecked();
    });

    it('should handle expiration date change', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const dateInput = screen.getByDisplayValue('2024-12-31');
      await user.clear(dateInput);
      await user.type(dateInput, '2025-01-15');
      
      expect(dateInput).toHaveValue('2025-01-15');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with updated data when form is submitted', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      // Update food name
      const foodNameInput = screen.getByDisplayValue('Fresh Apples');
      await user.clear(foodNameInput);
      await user.type(foodNameInput, 'Updated Apples');

      // Update price
      const priceInput = screen.getByPlaceholderText(/price \(r\)/i);
      await user.clear(priceInput);
      await user.type(priceInput, '30');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(defaultProps.onSave).toHaveBeenCalledWith({
        ...defaultProps.listing,
        foodName: 'Updated Apples',
        description: 'Organic red apples',
        quantity: '5 kg',
        price: '30',
        isDonation: false,
        expirationDate: '2024-12-31',
        status: 'active',
        type: 'For Sale'
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should handle donation type submission', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      // Toggle donation checkbox
      const donationCheckbox = screen.getByRole('checkbox');
      await user.click(donationCheckbox);

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(defaultProps.onSave).toHaveBeenCalledWith({
        ...defaultProps.listing,
        foodName: 'Fresh Apples',
        description: 'Organic red apples',
        quantity: '5 kg',
        price: '25.00',
        isDonation: true,
        expirationDate: '2024-12-31',
        status: 'active',
        type: 'Donation'
      });
    });

    it('should prevent form submission and call onSave', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const form = document.querySelector('form');
      const submitSpy = vi.fn();
      form.addEventListener('submit', submitSpy);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(submitSpy).toHaveBeenCalled();
      expect(defaultProps.onSave).toHaveBeenCalled();
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditListingModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<EditListingModal {...defaultProps} />);

      // Check form exists
      expect(document.querySelector('form')).toBeInTheDocument();
      
      // Check buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<EditListingModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /edit listing/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null listing prop', () => {
      const propsWithNullListing = { ...defaultProps, listing: null };
      render(<EditListingModal {...propsWithNullListing} />);
      
      // Should render with empty form - check by finding inputs with empty values
      const textInputs = screen.getAllByRole('textbox');
      textInputs.forEach(input => {
        expect(input).toHaveValue('');
      });
      
      const numberInput = screen.getByRole('spinbutton');
      expect(numberInput).toHaveValue(null);
    });

    it('should handle undefined listing prop', () => {
      const propsWithUndefinedListing = { ...defaultProps, listing: undefined };
      render(<EditListingModal {...propsWithUndefinedListing} />);
      
      // Should render with empty form
      const textInputs = screen.getAllByRole('textbox');
      textInputs.forEach(input => {
        expect(input).toHaveValue('');
      });
    });

    it('should maintain form state during re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<EditListingModal {...defaultProps} />);
      
      // Update a field
      const foodNameInput = screen.getByDisplayValue('Fresh Apples');
      await user.clear(foodNameInput);
      await user.type(foodNameInput, 'Modified Apples');
      
      // Re-render with same props
      rerender(<EditListingModal {...defaultProps} />);
      
      // Should maintain the changed value (this tests internal state management)
      expect(screen.getByDisplayValue('Modified Apples')).toBeInTheDocument();
    });

    it('should update form when listing prop changes', () => {
      const { rerender } = render(<EditListingModal {...defaultProps} />);
      
      // Update with new listing
      const newListing = {
        ...defaultProps.listing,
        foodName: 'Different Food',
        price: '50.00'
      };
      
      rerender(<EditListingModal {...defaultProps} listing={newListing} />);
      
      expect(screen.getByDisplayValue('Different Food')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50.00')).toBeInTheDocument();
    });

    it('should handle donation type listing', () => {
      const donationListing = {
        ...defaultProps.listing,
        type: 'Donation'
      };
      
      render(<EditListingModal {...defaultProps} listing={donationListing} />);
      
      const donationCheckbox = screen.getByRole('checkbox');
      expect(donationCheckbox).toBeChecked();
    });
  });
});