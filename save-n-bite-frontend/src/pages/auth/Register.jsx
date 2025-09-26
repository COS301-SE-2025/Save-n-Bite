import React, { useState } from 'react';
import { authAPI } from '../../services/authAPI';
import { USER_TYPES } from '../../utils/constants';
import { useNavigate, Link } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import logo from '../../assets/images/SnB_leaf_icon.png';
import { HelpCircleIcon } from 'lucide-react';
import RegistrationHelp from '../../components/auth/Help/RegistrationHelpMenu';
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

const Register = () => {
  const [selectedUserType, setSelectedUserType] = useState(USER_TYPES.CUSTOMER);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const navigate = useNavigate();

  const handleRegistrationSuccess = (response) => {
    setMessage(
      'Account created successfully! Please check your email for verification.',
    );
    setMessageType('success');

    // Navigate to login after a short delay
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
      {/* Animated Background Elements */}
      <Blob className="w-64 h-64 bg-emerald-400 -top-32 -left-32" />
      <Blob className="w-96 h-96 bg-blue-400 -bottom-48 -right-48" />
      <AnimatedCircle className="w-32 h-32 top-1/4 right-1/4" />
      <AnimatedCircle className="w-64 h-64 bottom-1/4 left-1/4" />

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
                Welcome To
                <span className="block mt-2 text-emerald-100">Save n Bite</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-emerald-100 text-lg md:text-xl max-w-md"
              >
                Create an account to start your journey with us and help reduce food waste.
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

          {/* Right Side - Registration Form */}
          <div className="lg:w-1/2 p-8 md:p-12 bg-white dark:bg-gray-800 transition-colors duration-300">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Create an Account
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Join our community and start making a difference
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

              {/* User Type Selection */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                  I want to sign up as a:
                </h3>
                <div className="inline-flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                  {Object.values(USER_TYPES).map((type, idx) => {
                    const isActive = selectedUserType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                        } ${
                          idx !== 0
                            ? 'border-l border-gray-200 dark:border-gray-700'
                            : ''
                        }`}
                        onClick={() => setSelectedUserType(type)}
                        aria-pressed={isActive}
                      >
                        {getUserTypeLabel(type)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Registration Form */}
              <div className="space-y-6">
                <RegisterForm
                  userType={selectedUserType}
                  onSuccess={handleRegistrationSuccess}
                  onError={handleRegistrationError}
                />

              {/* <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                    <label
                      htmlFor="terms"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      I agree to the{' '}
                      <a href="#" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                        Terms and Conditions
                      </a>
                    </label>
                  </div>
                </div> */}

                {/* <div>
                  <button
                    type="submit"
                    form="register-form"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                  >
                    Create Account
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
                      Already have an account?
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center space-y-4">
                  <Link
                    to="/login"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                  
                  <button
                    onClick={() => setIsHelpOpen(true)}
                    className="flex items-center text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200"
                  >
                    <HelpCircleIcon size={16} className="mr-1" />
                    <span>Need help with registration?</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <RegistrationHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};

export default Register;
