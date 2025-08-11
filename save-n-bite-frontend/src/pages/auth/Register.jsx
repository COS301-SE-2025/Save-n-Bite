import React, { useState } from 'react';
import { authAPI } from '../../services/authAPI';
import { USER_TYPES } from '../../utils/constants';
import { useNavigate, Link } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import logo from '../../assets/images/SnB_leaf_icon.png';
import { UploadIcon, CheckCircleIcon, HelpCircleIcon } from 'lucide-react'
import RegistrationHelp from '../../components/auth/Help/RegistrationHelpMenu'

const Register = () => {
  const [selectedUserType, setSelectedUserType] = useState(USER_TYPES.CUSTOMER);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const navigate = useNavigate();

  const handleRegistrationSuccess = (response) => {
    setMessage('Account created successfully! Please check your email for verification.');
    setMessageType('success');
    
    // Navigate directly to login after a short delay
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  const handleRegistrationError = (errorMessage) => {
    setMessage(errorMessage);
    setMessageType('error');
    
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const getUserTypeLabel = (type) => {
    switch (type) {
      case USER_TYPES.CUSTOMER:
        return 'Customer';
      case USER_TYPES.PROVIDER:
        return 'Food Provider';
      case USER_TYPES.NGO:
        return 'NGO';
      default:
        return 'Customer';
    }
  };

  return (
<div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
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
                Welcome To<br />
                Save n Bite
              </h1>
              
              {/* Subtitle */}
              <p className="text-white text-lg opacity-90 max-w-sm">
                Create an account to start your journey with us.
              </p>
            </div>
            
            {/* Copyright */}
            <div className="text-white text-sm opacity-75 text-center">
              © 2025 Save n Bite. All rights reserved.
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="md:w-1/2 p-8 md:p-12 bg-white dark:bg-gray-800 transition-colors duration-300">
            {/* User Type Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">I want to sign up as a:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(USER_TYPES).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedUserType === type 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={selectedUserType === type ? {
                      background: 'linear-gradient(135deg, #62BD38 0%, #1E64D5 100%)'
                    } : {}}
                    onClick={() => setSelectedUserType(type)}
                  >
                    {getUserTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-3 rounded-md border transition-colors duration-300 ${
                messageType === 'success' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800' 
                  : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
              }`}>
                {message}
              </div>
            )}

            {/* Registration Form */}
            <RegisterForm
              userType={selectedUserType}
              onSuccess={handleRegistrationSuccess}
              onError={handleRegistrationError}
            />

            {/* Login Link & Help */}
            <div className="mt-6 text-center text-gray-600 dark:text-gray-300 flex flex-col items-center gap-2">
              <span>
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                  Log in
                </Link>
              </span>
              <button
                onClick={() => setIsHelpOpen(true)}
                className="flex items-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <HelpCircleIcon size={18} className="mr-1" />
                <span>Need help?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <RegistrationHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};

export default Register;