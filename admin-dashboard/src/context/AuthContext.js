// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking auth status and finding an admin user
    // In a real app, you'd verify a token or session here
    const checkAuth = () => {
      setLoading(true);
      // --- Simulate finding an admin user ---
      // Replace this with your actual auth check later
      const mockAdminUser = {
        _id: 'admin007',
        name: 'Admin User',
        email: 'admin@ordelo.com',
        role: 'admin',
      };
      setUser(mockAdminUser);
      // --- End Simulation ---
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Simulate Login (replace later)
  const login = (credentials) => {
    console.log("Login attempt with:", credentials);
    // In real app, call API, set token, setUser
    alert("Login simulation - setting admin user.");
    setUser({ _id: 'admin007', name: 'Admin User', email: 'admin@ordelo.com', role: 'admin' });
    return true; // Simulate success
  };

  // Simulate Logout (replace later)
  const logout = () => {
    console.log("Logout action triggered");
    // In real app, clear token, call API if needed
    setUser(null);
    alert("Logout simulation - user set to null.");
    // Consider redirecting here using useNavigate if needed outside component context
  };

  const value = { user, loading, login, logout };

  // Only render children when loading is finished to prevent flicker
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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