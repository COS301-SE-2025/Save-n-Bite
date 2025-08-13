// src/hooks/useNavigationGuard.js
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { USER_TYPES } from '../config/routes';

export const useNavigationGuard = () => {
  const { hasRole, getUserType, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const navigateWithGuard = (path, requiredRoles = []) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/login');
      return false;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
      // Show alert for better user experience
      alert(`Access denied! This page is only available for: ${requiredRoles.join(', ')}`);
      
      // Redirect to appropriate page based on user type
      const userType = getUserType();
      
      let fallbackPath = '/';
      switch (userType) {
        case USER_TYPES.PROVIDER:
          fallbackPath = '/dashboard';
          break;
        case USER_TYPES.CUSTOMER:
        case USER_TYPES.NGO:
          fallbackPath = '/food-listing';
          break;
        default:
          fallbackPath = '/';
      }
      
      navigate(fallbackPath);
      return false;
    }
    
    navigate(path);
    return true;
  };

  const canAccess = (requiredRoles = []) => {
    if (!isAuthenticated()) return false;
    if (requiredRoles.length === 0) return true;
    return hasRole(requiredRoles);
  };

  const getAccessibleRoutes = () => {
    const userType = getUserType();
    
    const routes = {
      public: ['/', '/login', '/register', '/forgot-password'],
      authenticated: ['/notifications']
    };

    if (!isAuthenticated()) {
      return routes.public;
    }

    const accessibleRoutes = [...routes.public, ...routes.authenticated];

    switch (userType) {
      case USER_TYPES.CUSTOMER:
        accessibleRoutes.push(
          '/food-listing', '/item/:id', '/cart', '/orders', 
          '/pickup', '/reviews/:orderId', '/reviews'
        );
        break;
      case USER_TYPES.NGO:
        accessibleRoutes.push(
          '/food-listing', '/item/:id', '/cart', '/orders',
          '/donation-request/:id', '/donation-confirmation/:id',
          '/pickup', '/reviews/:orderId', '/reviews'
        );
        break;
      case USER_TYPES.PROVIDER:
        accessibleRoutes.push(
          '/dashboard', '/create-listing', '/listings-overview',
          '/orders-and-feedback', '/pickup-coordination', '/donations'
        );
        break;
    }

    return accessibleRoutes;
  };

  return {
    navigateWithGuard,
    canAccess,
    hasRole,
    getUserType,
    isAuthenticated,
    getAccessibleRoutes
  };
};