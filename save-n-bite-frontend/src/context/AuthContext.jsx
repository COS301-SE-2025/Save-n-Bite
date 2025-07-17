// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Initialize user from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('access_token');
        
        if (storedUser && authToken) {
          const parsedUser = JSON.parse(storedUser);
          
          // Check if token is expired
          const decodedToken = decodeToken(authToken);
          if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
            setUser(parsedUser);
          } else {
            // Token expired, clear storage
            clearUser();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Update user data (called after successful login)
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Login function (new - for handling login with token)
  const login = (userData, token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('authToken', token); // Keep both for compatibility
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Clear user data (called after logout)
  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_info');
  };

  // Logout function (alias for clearUser)
  const logout = () => {
    clearUser();
  };

  // Get user type helper
  const getUserType = () => {
    if (!user) return null;
    
    // First check if user_type is explicitly set
    if (user.user_type) {
      return user.user_type;
    }
    
    // Check if user has organisation_name (NGO)
    if (user.organisation_name || user.representative_name) {
      return 'ngo';
    }
    
    // Check if user has business_name (Provider)
    if (user.business_name) {
      return 'provider';
    }
    
    // Default to customer
    return 'customer';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
    return !!user && !!token;
  };

  // Check if user has specific role(s) - NEW
  const hasRole = (requiredRoles) => {
    if (!user) return false;
    
    const userType = getUserType();
    if (!userType) return false;
    
    // Convert to array if single role provided
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(userType);
  };

  // Check if user is NGO
  const isNGO = () => {
    return getUserType() === 'ngo';
  };

  // Check if user is customer
  const isCustomer = () => {
    return getUserType() === 'customer';
  };

  // Check if user is provider
  const isProvider = () => {
    return getUserType() === 'provider';
  };

  const value = {
    user,
    loading,
    updateUser,
    clearUser,
    login,        // NEW
    logout,       // NEW
    getUserType,
    isAuthenticated,
    hasRole,      // NEW
    isNGO,
    isCustomer,
    isProvider
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};