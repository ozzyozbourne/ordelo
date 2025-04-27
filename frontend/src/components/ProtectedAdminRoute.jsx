// src/components/ProtectedAdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // If still loading authentication state, show loading indicator
  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  // Check if user exists and has admin role
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  // If user is admin, render the children components
  return children;
};

export default ProtectedAdminRoute;