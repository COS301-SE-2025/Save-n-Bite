// src/pages/auth/Login.jsx - Updated with premium design
import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/authAPI';
import ForgotPassword from '../../services/ForgotPasswordAPI';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import logo from '../../assets/images/SnB_leaf_icon.png';
import { useNotifications } from '../../services/contexts/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

// Animated background elements
const Blob = ({ className }) => (
  <motion.div
    className={`absolute rounded-full opacity-20 filter blur-3xl ${className}`}
    animate={{
      scale: [1, 1.1, 1],
      x: [0, 15, 0],
      y: [0, 10, 0],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  />
);

const AnimatedCircle = ({ className }) => (
  <motion.div
    className={`absolute rounded-full border-2 border-emerald-200/30 ${className}`}
    animate={{
      scale: [1, 1.05, 1],
      rotate: [0, 5, 0],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  />
);

const Login = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [unreadCountSnapshot, setUnreadCountSnapshot] = useState(0);
  const [currentEmail, setCurrentEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUnreadCount, unreadCount } = useNotifications();
  const { updateUser } = useAuth();

  // Get the path user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || '/';

  const handleLoginSuccess = async (response) => {
    // Display welcome message with environmental fact
    setMessage(
      response.welcomeMessage || 'Welcome back! Great to see you again!',
    );
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
        } else if (user?.user_type === 'admin') {
          navigate('/admin-dashboard');
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
      setMessage(
        'Please enter your email address first before requesting a password reset.',
      );
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
        setMessage(
          `Reset email sent to ${currentEmail}. Check your email for the temporary password.`,
        );
        setMessageType('success');

        // Navigate to forgot password page after 2 seconds
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
      } else {
        setMessage(
          response.error || 'Failed to send reset email. Please try again.',
        );
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
      {/* Animated Background Elements */}
      <Blob className="w-64 h-64 bg-emerald-400 -top-32 -left-32" />
      <Blob className="w-96 h-96 bg-blue-400 -bottom-48 -right-48" />
      <AnimatedCircle className="w-32 h-32 top-1/4 right-1/4" />
      <AnimatedCircle className="w-64 h-64 bottom-1/4 left-1/4" />

      {/* Notification Popup */}
      {showPopup && unreadCountSnapshot > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium"
        >
          You have {unreadCountSnapshot} unread notification
          {unreadCountSnapshot > 1 ? 's' : ''}!
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 z-10"
      >
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Branding */}
          <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-between relative bg-gradient-to-br from-emerald-700 to-emerald-600">
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <img
                  src={logo}
                  alt="Save n Bite Logo"
                  className="w-45 h-45 object-contain drop-shadow-lg"
                />
              </motion.div>

              {/* Welcome Text */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-white mb-4 text-4xl md:text-5xl font-bold leading-tight"
              >
                Welcome Back To
                <span className="block mt-2 text-emerald-100">Save n Bite</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-emerald-100 text-lg md:text-xl max-w-md"
              >
                Login to continue your journey with us and help reduce food waste.
              </motion.p>
            </div>

            {/* Copyright */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-emerald-100 text-sm opacity-80 text-center mt-8"
            >
              &copy; {new Date().getFullYear()} Save n Bite. All rights reserved.
            </motion.div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:w-1/2 p-8 md:p-12 bg-white dark:bg-gray-800 transition-colors duration-300">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Sign In
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Enter your credentials to access your account
              </p>

              {/* Message Display */}
              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    messageType === 'success'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Login Form */}
              <div className="space-y-6">
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  onEmailChange={setCurrentEmail}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>

                {/* <div>
                  <button
                    type="submit"
                    form="login-form"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                  >
                    Sign in
                  </button>
                </div> */}
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      New to Save n Bite?
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/register"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
