import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requireAuth = true 
}) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (requireAuth && !isAuthenticated()) {
    return React.createElement(Navigate, { 
      to: "/login", 
      state: { from: location }, 
      replace: true 
    });
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    const userType = user?.user_type || user?.role;
    
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