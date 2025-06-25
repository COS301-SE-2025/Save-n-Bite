import React, { useState } from 'react';
import { authAPI } from '../../services/authAPI';
import { useNavigate, Link } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import logo from '../../assets/images/SnB_leaf_icon.png';
import { useNotifications } from '../../services/contexts/NotificationContext';

const Login = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showPopup, setShowPopup] = useState(false);
  const [unreadCountSnapshot, setUnreadCountSnapshot] = useState(0);
  const navigate = useNavigate();
  const { fetchUnreadCount, unreadCount } = useNotifications();

  const handleLoginSuccess = async (response) => {
    // Display welcome message with environmental fact
    setMessage(response.welcomeMessage || 'Welcome back! Great to see you again!');
    setMessageType('success');
    
    // Store authentication data if needed
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    if (response.user) {
      localStorage.setItem('userData', JSON.stringify(response.user));
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
      // Navigate based on user type
      const user = response.user || response.data?.user;
      if (user?.user_type === 'provider') {
        navigate('/create-listing');
      } else if (user?.user_type === 'ngo') {
        navigate('/food-listing');
      } else {
        navigate('/food-listing');
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      {/* Notification Popup (top right) */}
      {showPopup && unreadCountSnapshot > 0 && (
        <div className="fixed top-5 right-5 bg-emerald-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out">
          You have {unreadCountSnapshot} unread notification{unreadCountSnapshot > 1 ? 's' : ''}!
        </div>
      )}
      <div className="max-w-6xl w-full bg-white rounded-lg shadow-sm overflow-hidden">
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
          <div className="md:w-1/2 p-8 md:p-12">
            <div className="max-w-md mx-auto">
              {/* Page Title */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sign In
                </h2>
                <p className="text-gray-600">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`mb-6 p-3 rounded-md ${
                  messageType === 'success' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              {/* Login Form */}
              <LoginForm
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
              />

              {/* Forgot Password Link */}
              <div className="mt-4 text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Register Link */}
              <div className="mt-6 text-center text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-600 hover:text-emerald-700">
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