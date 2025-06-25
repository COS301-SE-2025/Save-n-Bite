import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterSidebar from '../components/auth/FilterSidebar'; // adjust path if needed

describe('FilterSidebar', () => {
  const mockSetFilters = jest.fn();
  const mockResetFilters = jest.fn();
  const initialFilters = {
    priceRange: [0, 5000],
    expiration: 'all',
    type: 'all',
    provider: 'all'
  };

  const providerOptions = ['Provider A', 'Provider B'];

  beforeEach(() => {
    mockSetFilters.mockClear();
    mockResetFilters.mockClear();
  });

  test('does not render when showFilters is false', () => {
    const { container } = render(
      <FilterSidebar
        showFilters={false}
        filters={initialFilters}
        setFilters={mockSetFilters}
        providerOptions={providerOptions}
        onResetFilters={mockResetFilters}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders all filter sections when showFilters is true', () => {
    render(
      <FilterSidebar
        showFilters={true}
        filters={initialFilters}
        setFilters={mockSetFilters}
        providerOptions={providerOptions}
        onResetFilters={mockResetFilters}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Expiration Time')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Filters' })).toBeInTheDocument();
  });

  test('updates price range when slider is moved', () => {
    render(
      <FilterSidebar
        showFilters={true}
        filters={initialFilters}
        setFilters={mockSetFilters}
        providerOptions={providerOptions}
      />
    );

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '7000' } });

    expect(mockSetFilters).toHaveBeenCalledWith({
      ...initialFilters,
      priceRange: [0, 7000]
    });
  });

  test('changes expiration filter', () => {
    render(
      <FilterSidebar
        showFilters={true}
        filters={initialFilters}
        setFilters={mockSetFilters}
        providerOptions={providerOptions}
      />
    );

    fireEvent.change(screen.getByDisplayValue('All Times'), {
      target: { value: 'today' }
    });

    expect(mockSetFilters).toHaveBeenCalledWith({
      ...initialFilters,
      expiration: 'today'
    });
  });

  test('selects type radio buttons', () => {
    render(
      <FilterSidebar
        showFilters={true}
        filters={initialFilters}
        setFilters={mockSetFilters}
        providerOptions={providerOptions}
      />
    );

    fireEvent.click(screen.getByLabelText('Discounted Items'));

    expect(mockSetFilters).toHaveBeenCalledWith({
      ...initialFilters,
      type: 'discount'
    });
  });

  test('selects a provider', () => {
    render(
      <FilterSidebar
        showFilters={true}
        filters={initialFilters}
        setFilters={mockSetFilters}
        providerOptions={providerOptions}
      />
    );

    fireEvent.change(screen.getByDisplayValue('All Providers'), {
      target: { value: 'Provider A' }
    });

    expect(mockSetFilters).toHaveBeenCalledWith({
      ...initialFilters,
      provider: 'Provider A'
    });
  });

  test('calls reset function when Reset Filters button is clicked', () => {
    render(
      <FilterSidebar
        showFilters={true}
        filters={initialFilters}
        setFilters={mockSetFilters}
        providerOptions={providerOptions}
        onResetFilters={mockResetFilters}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));
    expect(mockResetFilters).toHaveBeenCalled();
  });

  test('uses default reset if no onResetFilters is provided', () => {
    render(
      <FilterSidebar
        showFilters={true}
        filters={initialFilters}
        setFilters={mockSetFilters}
        providerOptions={providerOptions}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));
    expect(mockSetFilters).toHaveBeenCalledWith({
      priceRange: [0, 10000],
      expiration: 'all',
      type: 'all',
      provider: 'all'
    });
  });
});
