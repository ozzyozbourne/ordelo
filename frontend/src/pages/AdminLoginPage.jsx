// src/pages/LoginPage.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get intended destination from route state or default to admin users
  const from = location.state?.from || '/admin/users';

  const handleLogin = (event) => {
    event.preventDefault();
    // Add actual form handling here later
    const simulatedCredentials = { email: 'admin@ordelo.com', password: 'password' };

    // Use the login function from context
    const success = login(simulatedCredentials);

    if (success) {
      // Navigate to the intended destination after successful login
      navigate(from, { replace: true });
    } else {
      alert("Simulated login failed (only admin role works in this demo).");
    }
  };

  return (
    <div style={{ padding: '3rem', maxWidth: '400px', margin: '5rem auto', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h1>Admin Login</h1>
      <p>Enter credentials to access the admin panel.</p>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
         {/* Basic form elements - enhance later */}
         <input type="email" placeholder="Email (e.g., admin@ordelo.com)" required style={{padding: '0.8rem'}}/>
         <input type="password" placeholder="Password" required style={{padding: '0.8rem'}} />
         <button type="submit" className="btn btn-primary">
           Login
         </button>
      </form>
      <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#666'}}>
          (Note: Authentication is mocked. Click Login to proceed as admin.)
      </p>
    </div>
  );
}

export default LoginPage;