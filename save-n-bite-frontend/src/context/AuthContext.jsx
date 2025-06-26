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

  // Initialize user from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const authToken = localStorage.getItem('authToken');
        
        if (storedUser && authToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
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

  // Clear user data (called after logout)
  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  };

  // Get user type helper
  const getUserType = () => {
    if (!user) return null;
    
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
    return !!user && !!localStorage.getItem('authToken');
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
    getUserType,
    isAuthenticated,
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