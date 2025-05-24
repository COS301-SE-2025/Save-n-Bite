import React, { useState } from 'react';
import { authAPI } from '@/services/authAPI';
import { validateEmail, validatePassword, validateRequired, validatePhone } from '@/utils/validators';
import { USER_TYPES } from '@/utils/constants';
import './RegisterForm.css';


// src/pages/auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { USER_TYPES } from '@/utils/constants';
import './Register.css';

const Register = () => {
  const [selectedUserType, setSelectedUserType] = useState(USER_TYPES.CUSTOMER);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const navigate = useNavigate();

  const handleRegistrationSuccess = (response) => {
    setMessage('Account created successfully! Please check your email for verification.');
    setMessageType('success');
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  const handleRegistrationError = (errorMessage) => {
    setMessage(errorMessage);
    setMessageType('error');
    
    // Clear error message after 5 seconds
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
    <div className="register-page">
      <div className="register-container">
        {/* Left Side - Branding */}
        <div className="register-brand">
          <div className="brand-content">
            <div className="logo-container">
              <div className="logo">
                <div className="logo-icon">🍽️</div>
              </div>
            </div>
            <h1>Welcome To<br />Save n Bite</h1>
            <p>Create an account to start your journey with us.</p>
            <div className="brand-footer">
              © 2025 Save n Bite. All rights reserved.
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="register-form-section">
          <div className="form-container">
            {/* User Type Selection */}
            <div className="user-type-selector">
              <h3>I want to register as:</h3>
              <div className="user-type-options">
                {Object.values(USER_TYPES).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`user-type-option ${selectedUserType === type ? 'active' : ''}`}
                    onClick={() => setSelectedUserType(type)}
                  >
                    {getUserTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}

            {/* Registration Form */}
            <RegisterForm
              userType={selectedUserType}
              onSuccess={handleRegistrationSuccess}
              onError={handleRegistrationError}
            />

            {/* Login Link */}
            <div className="auth-link">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

// src/pages/auth/Register.css
/* Add this to src/pages/auth/Register.css */