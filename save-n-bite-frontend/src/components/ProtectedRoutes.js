import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requireAuth = true 
}) => {
  const { user, loading, isAuthenticated, hasRole, getUserType } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return React.createElement('div', {
      style: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }
    }, 'Loading...');
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated()) {
    return React.createElement(Navigate, { 
      to: "/login", 
      state: { from: location }, 
      replace: true 
    });
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    const userType = getUserType();
    
    let redirectPath = '/';
    switch (userType) {
      case 'provider':
        redirectPath = '/dashboard';
        break;
      case 'customer':
        redirectPath = '/food-listing';
        break;
      case 'ngo':
        redirectPath = '/food-listing';
        break;
      default:
        redirectPath = '/';
    }
    
    return React.createElement(Navigate, { to: redirectPath, replace: true });
  }

  return children;
};

export default ProtectedRoute;