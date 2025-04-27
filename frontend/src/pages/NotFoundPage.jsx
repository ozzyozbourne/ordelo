// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Check if user is logged in

function NotFoundPage() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '3rem', textAlign: 'center', marginTop: '5rem' }}>
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you were looking for doesn't exist.</p>
      {user && user.role === 'admin' ? (
         <Link to="/admin/users" className="btn btn-primary" style={{marginTop: '1rem'}}>Go to Dashboard</Link>
      ) : (
         <Link to="/login" className="btn btn-primary" style={{marginTop: '1rem'}}>Go to Login</Link>
      )}
    </div>
  );
}

export default NotFoundPage;