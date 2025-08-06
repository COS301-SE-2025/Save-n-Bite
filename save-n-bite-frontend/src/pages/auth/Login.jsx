// src/pages/auth/Login.js - Updated to work with AuthContext
import React, { useState } from 'react';
import { authAPI } from '../../services/authAPI';
import ForgotPassword from '../../services/ForgotPasswordAPI';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import logo from '../../assets/images/SnB_leaf_icon.png';
import { useNotifications } from '../../services/contexts/NotificationContext';
import { useAuth } from '../../context/AuthContext'; 

const Login = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showPopup, setShowPopup] = useState(false);
  const [unreadCountSnapshot, setUnreadCountSnapshot] = useState(0);
  const [currentEmail, setCurrentEmail] = useState(''); // Track email from LoginForm
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUnreadCount, unreadCount } = useNotifications();
  const { updateUser } = useAuth(); // Add this to sync with AuthContext

  // Get the path user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || '/';

  const handleLoginSuccess = async (response) => {
    // Display welcome message with environmental fact
    setMessage(response.welcomeMessage || 'Welcome back! Great to see you again!');
    setMessageType('success');
    
    // Store authentication data in localStorage (existing behavior)
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    if (response.user) {
      localStorage.setItem('userData', JSON.stringify(response.user));
      localStorage.setItem('user', JSON.stringify(response.user)); // Add this for AuthContext
      
      // Update AuthContext state
      updateUser(response.user);
    }

    // Fetch unread notifications after login
    await fetchUnreadCount();
    // Use a short delay to ensure state updates
    setTimeout(() => {
      if (unreadCount > 0) {
        // Trigger NotificationBell popup via custom event
        window.dispatchEvent(new Event('show-unread-popup'));
      }
    }, 500);
    
    setTimeout(() => {
      // Check if user was trying to access a specific page
      if (from !== '/') {
        navigate(from, { replace: true });
      } else {
        // Navigate based on user type
        const user = response.user || response.data?.user;
        if (user?.user_type === 'provider') {
          navigate('/dashboard'); 
        } else if (user?.user_type === 'ngo') {
          navigate('/food-listing');
        } else {
          navigate('/food-listing');
        }
      }
    }, 3000);
  };

  const handleLoginError = (errorMessage) => {
    setMessage(errorMessage);
    setMessageType('error');
    
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleForgotPasswordClick = async () => {
    // Check if email is provided
    if (!currentEmail || currentEmail.trim() === '') {
      setMessage('Please enter your email address first before requesting a password reset.');
      setMessageType('error');
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      setMessage('Please enter a valid email address.');
      setMessageType('error');
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
      return;
    }

    try {
      setMessage('Sending reset email...');
      setMessageType('info');

      const response = await ForgotPassword.ResetPassword(currentEmail);
      
      if (response.success) {
        setMessage(`Reset email sent to ${currentEmail}. Check your email for the temporary password.`);
        setMessageType('success');
        
        // Navigate to forgot password page after 2 seconds
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
      } else {
        setMessage(response.error || 'Failed to send reset email. Please try again.');
        setMessageType('error');
        
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 5000);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Notification Popup (top right) */}
      {showPopup && unreadCountSnapshot > 0 && (
        <div className="fixed top-5 right-5 bg-emerald-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out">
          You have {unreadCountSnapshot} unread notification{unreadCountSnapshot > 1 ? 's' : ''}!
        </div>
      )}
      <div className="max-w-6xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors duration-300">
        <div className="md:flex">
          {/* Left Side - Branding */}
          <div 
            className="md:w-1/2 text-white p-8 md:p-12 flex flex-col justify-between relative"
            style={{
              background: 'linear-gradient(135deg, #62BD38 0%, #1E64D5 100%)'
            }}
          >
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-8">
                <img 
                  src={logo} 
                  alt="Save n Bite Logo" 
                  className="w-100 h-100 object-contain"
                  style={{ filter: 'drop-shadow(0 0 2px #0003)' }}
                />
              </div>
              
              {/* Welcome Text */}
              <h1 
                className="text-white mb-4"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '40.8px',
                  lineHeight: '1.2'
                }}
              >
                Welcome Back To<br />
                Save n Bite
              </h1>
              
              {/* Subtitle */}
              <p className="text-white text-lg opacity-90 max-w-sm">
                Login to continue your journey with us.
              </p>
            </div>
            
            {/* Copyright */}
            <div className="text-white text-sm opacity-75 text-center">
              © 2025 Save n Bite. All rights reserved.
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="md:w-1/2 p-8 md:p-12 bg-white dark:bg-gray-800 transition-colors duration-300">
            <div className="max-w-md mx-auto">
              {/* Page Title */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Sign In
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`mb-6 p-3 rounded-md border transition-colors duration-300 ${
                  messageType === 'success' 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800' 
                    : messageType === 'info'
                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800'
                    : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
                }`}>
                  {message}
                </div>
              )}

              {/* Login Form */}
              <LoginForm
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                onEmailChange={setCurrentEmail} // Pass callback to track email
              />

              {/* Forgot Password Link */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline transition-colors duration-200"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Register Link */}
              <div className="mt-6 text-center text-gray-600 dark:text-gray-300">
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;