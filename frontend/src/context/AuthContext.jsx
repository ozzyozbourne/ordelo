// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing user session
    const checkAuth = () => {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Check if token is expired
          const tokenData = parseJwt(parsedUser.token);
          const isExpired = tokenData?.exp && tokenData.exp * 1000 < Date.now();
          
          if (isExpired) {
            // Token expired, clear auth
            localStorage.removeItem('user');
            setUser(null);
          } else {
            // Valid token, restore user
            setUser(parsedUser);
          }
        } catch (error) {
          // Invalid stored data
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Helper to parse JWT token
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  // Login function
  const login = (userData) => {
    // For admin login
    if (userData.email === "admin@ordelo.com" && userData.password === "password") {
      const adminUser = {
        id: 'admin007',
        name: 'Admin User',
        email: userData.email,
        role: 'admin',
        token: 'mock-admin-token',
      };
      
      setUser(adminUser);
      localStorage.setItem('user', JSON.stringify(adminUser));
      return true;
    }
    
    // For regular login (with token from API)
    if (userData.token) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    
    return false;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Navigation will be handled in components, not here
  };

  const value = { 
    user, 
    loading, 
    login, 
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isVendor: user?.role === 'vendor',
    isUser: user?.role === 'user',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};