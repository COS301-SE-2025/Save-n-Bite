// LoginForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../components/auth/LoginForm';
import { BrowserRouter } from 'react-router-dom';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock authAPI
jest.mock('../services/authAPI', () => ({
  authAPI: {
    login: jest.fn()
  }
}));

import { authAPI } from '../services/authAPI';

describe('LoginForm', () => {
  const onSuccessMock = jest.fn();
  const onErrorMock = jest.fn();

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <LoginForm onSuccess={onSuccessMock} onError={onErrorMock} />
      </BrowserRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders email and password inputs', () => {
    renderComponent();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation errors on empty submit', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/valid email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  test('calls onSuccess and navigates on successful login', async () => {
    const mockUser = {
      user_type: 'customer',
      profile: { full_name: 'John Doe' }
    };

    authAPI.login.mockResolvedValue({
      token: 'fake-jwt-token',
      user: mockUser
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'fake-jwt-token',
          user: mockUser,
          welcomeMessage: expect.stringContaining('Welcome back')
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/food-listing');
  });

  test('calls onError on login failure', async () => {
    authAPI.login.mockRejectedValue({
      message: 'Invalid credentials'
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'fail@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith('Invalid credentials');
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
