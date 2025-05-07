import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);

          const tokenData = parseJwt(parsedUser.token);
          const isExpired = tokenData?.exp && tokenData.exp * 1000 < Date.now();

          if (isExpired) {
            localStorage.removeItem('user');
            setUser(null);
          } else {
            setUser(parsedUser);
          }
        } catch (error) {
          localStorage.removeItem('user');
          setUser(null);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  // Unified Login function (for user, vendor, admin)
  const login = (userData) => {

    const normalizedUser = {
      id: userData.id || userData._id || (userData.user && userData.user.id) || null,
      name: userData.name || (userData.user && userData.user.name) || '',
      email: userData.email || (userData.user && userData.user.email) || '',
      role: userData.role || (userData.user && userData.user.role) || '',
      token: userData.token || userData.access_token || '',
      tokenType: userData.token_type || '',
      expiresIn: userData.expires_in || '',
    };

    if (normalizedUser.token) {
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.clear();
    window.location.href = '/login';
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
